import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import { Types } from 'mongoose';
import { ExamAttempt } from '../models/ExamAttempt.js';
import { Result, ITopicScore } from '../models/Result.js';
import { Question } from '../models/Question.js';
import { Exam } from '../models/Exam.js';
import { Subject } from '../models/Subject.js';
import { Bookmark } from '../models/Bookmark.js';
import { authenticateToken, requireVerified, requireCbtEntitlement, AuthenticatedRequest } from '../middleware/auth.js';
import { QuestionIngestionService } from '../services/questionIngestionService.js';

const router = Router();

// All CBT routes require student authentication and verified email
router.use(authenticateToken, requireVerified);

const startCbtSchema = z.object({
  examId: z.string().min(1, 'Exam ID is required'),
  subjectId: z.string().optional(),
  subjectIds: z.array(z.string()).optional(),
  topicId: z.string().optional(),
  year: z.number().int().min(1970).max(2030).optional(),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']).optional(),
  onlyBookmarked: z.boolean().optional(),
  mode: z.enum(['PRACTICE', 'TIMED_MOCK']).default('TIMED_MOCK'),
  drillType: z.enum(['PAST_QUESTION', 'PRACTICE_MOCK', 'BOTH']).optional(),
  durationMinutes: z.number().int().min(5).max(180).default(30),
  questionCount: z.number().int().min(1).max(100).default(10),
});

const answerCbtSchema = z.object({
  questionId: z.string().min(1, 'Question ID is required'),
  selectedOption: z.enum(['A', 'B', 'C', 'D']).nullable(),
  markedForReview: z.boolean().optional(),
});

/**
 * Helper to compute results and close attempt with snapshot immutability
 */
async function processAttemptSubmission(attempt: any, userId: Types.ObjectId) {
  let questions: any[];

  if (attempt.questionSnapshot && attempt.questionSnapshot.length > 0) {
    questions = attempt.questionSnapshot.map((s: any) => ({
      _id: s.questionId,
      year: s.year,
      questionNumber: s.questionNumber,
      questionText: s.questionText,
      correctAnswer: s.correctAnswer,
      topicId: s.topicId ? { _id: s.topicId, name: s.topicName } : undefined,
      topicName: s.topicName || 'General Curriculum',
      subjectId: s.subjectId,
      subjectName: s.subjectName || '',
      subjectCode: s.subjectCode || '',
    }));
  } else {
    questions = await Question.find({ _id: { $in: attempt.assignedQuestions } })
      .populate('topicId', 'name')
      .populate('subjectId', 'name code')
      .lean();
  }

  const questionMap = new Map(questions.map((q) => [q._id.toString(), q]));

  let correctCount = 0;
  let incorrectCount = 0;
  let unansweredCount = 0;

  const topicMap = new Map<string, { topicId?: Types.ObjectId; topicName: string; total: number; correct: number }>();
  const subjectMap = new Map<string, { subjectId: Types.ObjectId; subjectName: string; subjectCode: string; total: number; correct: number }>();

  attempt.answers.forEach((ans: any) => {
    const q = questionMap.get(ans.questionId.toString());
    if (!q) return;

    // Topic aggregation
    const topicKey = q.topicId?._id?.toString() || 'general';
    const topicName = (q.topicId as any)?.name || q.topicName || 'General Curriculum';

    if (!topicMap.has(topicKey)) {
      topicMap.set(topicKey, {
        topicId: q.topicId?._id,
        topicName,
        total: 0,
        correct: 0,
      });
    }
    const tStat = topicMap.get(topicKey)!;
    tStat.total += 1;

    // Subject aggregation (supports multi-subject mock simulations)
    const subjId = q.subjectId?._id || q.subjectId || attempt.subjectId;
    const subjKey = subjId ? subjId.toString() : 'default_sub';
    const subjName = q.subjectName || (q.subjectId as any)?.name || 'Subject';
    const subjCode = q.subjectCode || (q.subjectId as any)?.code || 'SUB';

    if (!subjectMap.has(subjKey)) {
      subjectMap.set(subjKey, {
        subjectId: subjId,
        subjectName: subjName,
        subjectCode: subjCode,
        total: 0,
        correct: 0,
      });
    }
    const sStat = subjectMap.get(subjKey)!;
    sStat.total += 1;

    if (ans.selectedOption === null || ans.selectedOption === undefined) {
      unansweredCount += 1;
      ans.isCorrect = false;
    } else if (ans.selectedOption === q.correctAnswer) {
      correctCount += 1;
      ans.isCorrect = true;
      tStat.correct += 1;
      sStat.correct += 1;
    } else {
      incorrectCount += 1;
      ans.isCorrect = false;
    }
  });

  const maxScore = questions.length;
  const score = correctCount;
  const percentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;

  const startTime = new Date(attempt.startTime).getTime();
  const now = Date.now();
  const timeSpentSeconds = Math.min(
    attempt.allocatedDurationSeconds,
    Math.max(1, Math.floor((now - startTime) / 1000))
  );

  const topicBreakdown: ITopicScore[] = Array.from(topicMap.values()).map((t) => ({
    topicId: t.topicId,
    topicName: t.topicName,
    totalQuestions: t.total,
    correctAnswers: t.correct,
    accuracyPercentage: t.total > 0 ? Math.round((t.correct / t.total) * 100) : 0,
  }));

  const subjectBreakdown = Array.from(subjectMap.values()).map((s) => ({
    subjectId: s.subjectId,
    subjectName: s.subjectName,
    subjectCode: s.subjectCode,
    totalQuestions: s.total,
    correctAnswers: s.correct,
    accuracyPercentage: s.total > 0 ? Math.round((s.correct / s.total) * 100) : 0,
  }));

  // Create or update Result document
  let result = await Result.findOne({ attemptId: attempt._id });
  if (!result) {
    result = await Result.create({
      attemptId: attempt._id,
      userId,
      examId: attempt.examId,
      subjectId: attempt.subjectId,
      score,
      maxScore,
      percentage,
      correctCount,
      incorrectCount,
      unansweredCount,
      timeSpentSeconds,
      topicBreakdown,
      subjectBreakdown,
    });
  }

  attempt.status = 'COMPLETED';
  attempt.submittedAt = new Date();
  attempt.score = score;
  attempt.maxScore = maxScore;
  attempt.percentage = percentage;
  await attempt.save();

  return result;
}

// POST /api/cbt/start — Initialize a new server-timed CBT attempt (Enforces subscription quotas)
router.post('/start', requireCbtEntitlement(), async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = startCbtSchema.parse(req.body);
    const userId = req.user!._id;

    const exam = await Exam.findById(data.examId);
    if (!exam) {
      res.status(404).json({ success: false, error: { message: 'Exam board not found.' } });
      return;
    }

    // Handle Practice Bookmarks Mode
    if (data.onlyBookmarked) {
      const bookmarks = await Bookmark.find({ userId })
        .populate({
          path: 'questionId',
          populate: [
            { path: 'subjectId', select: 'name code' },
            { path: 'topicId', select: 'name' },
          ],
        })
        .lean();

      const candidateQuestions = bookmarks
        .map((b: any) => b.questionId)
        .filter((q: any) => q && q.examId?.toString() === data.examId);

      if (candidateQuestions.length === 0) {
        res.status(400).json({
          success: false,
          error: { message: 'You have no saved bookmarked questions for this examination yet. Bookmark questions in the question bank first.' },
        });
        return;
      }

      const sliceQuestions = candidateQuestions.slice(0, data.questionCount);
      const allocatedDurationSeconds = data.durationMinutes * 60;
      const startTime = new Date();
      const endTime = new Date(startTime.getTime() + allocatedDurationSeconds * 1000);

      const answers = sliceQuestions.map((q: any) => ({
        questionId: q._id,
        selectedOption: null,
        isCorrect: false,
        markedForReview: false,
        timeSpentSeconds: 0,
      }));

      const questionSnapshot = sliceQuestions.map((q: any) => ({
        questionId: q._id,
        year: q.year,
        questionNumber: q.questionNumber,
        questionText: q.questionText,
        optionA: q.optionA,
        optionB: q.optionB,
        optionC: q.optionC,
        optionD: q.optionD,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation || '',
        difficulty: q.difficulty,
        topicId: q.topicId?._id,
        topicName: q.topicId?.name || 'General Curriculum',
        subjectId: q.subjectId?._id || q.subjectId,
        subjectName: q.subjectId?.name || 'Subject',
        subjectCode: q.subjectId?.code || 'SUB',
        imageUrl: q.imageUrl || '',
      }));

      const firstSubjId = sliceQuestions[0].subjectId?._id || sliceQuestions[0].subjectId;
      const allSubjIds = Array.from(new Set(sliceQuestions.map((q: any) => (q.subjectId?._id || q.subjectId)?.toString())));

      const attempt = await ExamAttempt.create({
        userId,
        examId: data.examId,
        subjectId: firstSubjId,
        subjectIds: allSubjIds,
        isMultiSubject: allSubjIds.length > 1,
        mode: data.mode,
        status: 'IN_PROGRESS',
        allocatedDurationSeconds,
        startTime,
        endTime,
        assignedQuestions: sliceQuestions.map((q: any) => q._id),
        questionSnapshot,
        answers,
        score: 0,
        maxScore: sliceQuestions.length,
        percentage: 0,
      });

      const cleansedQuestions = sliceQuestions.map((q: any) => ({
        _id: q._id,
        year: q.year,
        questionNumber: q.questionNumber,
        questionText: q.questionText,
        optionA: q.optionA,
        optionB: q.optionB,
        optionC: q.optionC,
        optionD: q.optionD,
        difficulty: q.difficulty,
        topicName: q.topicId?.name || 'General Curriculum',
        subjectId: q.subjectId?._id || q.subjectId,
        subjectName: q.subjectId?.name || 'Subject',
        subjectCode: q.subjectId?.code || 'SUB',
        imageUrl: q.imageUrl || '',
        ...(data.mode === 'PRACTICE'
          ? { correctAnswer: q.correctAnswer, explanation: q.explanation }
          : {}),
      }));

      res.status(201).json({
        success: true,
        data: {
          attemptId: attempt._id,
          mode: attempt.mode,
          allocatedDurationSeconds,
          remainingSeconds: allocatedDurationSeconds,
          startTime: attempt.startTime,
          endTime: attempt.endTime,
          examName: exam.name,
          examShortCode: exam.shortCode,
          subjectName: 'Bookmarked Revision Drill',
          subjectCode: 'BMK',
          isMultiSubject: allSubjIds.length > 1,
          questions: cleansedQuestions,
          answers: attempt.answers,
        },
      });
      return;
    }

    // Determine target subjects (Single or Multi-Subject Drill)
    let targetSubjectIds: string[] = [];
    if (data.subjectIds && data.subjectIds.length > 0) {
      targetSubjectIds = data.subjectIds;
    } else if (data.subjectId) {
      targetSubjectIds = [data.subjectId];
    } else {
      res.status(400).json({ success: false, error: { message: 'At least one subject must be selected.' } });
      return;
    }

    const subjects = await Subject.find({ _id: { $in: targetSubjectIds } });
    if (subjects.length === 0) {
      res.status(404).json({ success: false, error: { message: 'Selected subject(s) not found.' } });
      return;
    }

    const perSubjectCount = Math.max(1, Math.ceil(data.questionCount / subjects.length));
    let questionsPool: any[] = [];

    const targetDrillType = data.drillType || (data.mode === 'TIMED_MOCK' ? 'PRACTICE_MOCK' : 'PAST_QUESTION');

    for (const sub of subjects) {
      const queryFilter: any = {
        examId: data.examId,
        subjectId: sub._id,
        published: true,
        reviewStatus: 'PUBLISHED',
      };
      if (data.topicId && subjects.length === 1) {
        queryFilter.topicId = data.topicId;
      }
      if (data.year) {
        queryFilter.year = data.year;
      }
      if (data.difficulty) {
        queryFilter.difficulty = data.difficulty;
      }

      // Enforce question separation by drill type ('PRACTICE_MOCK' vs 'PAST_QUESTION')
      let subQuestions = await Question.find({ ...queryFilter, drillType: { $in: [targetDrillType, 'BOTH'] } })
        .limit(perSubjectCount)
        .populate('topicId', 'name')
        .populate('subjectId', 'name code')
        .lean();

      // If specific drill type count is insufficient, supplement with published questions pool
      if (subQuestions.length < perSubjectCount) {
        subQuestions = await Question.find(queryFilter)
          .limit(perSubjectCount)
          .populate('topicId', 'name')
          .populate('subjectId', 'name code')
          .lean();
      }

      if (subQuestions.length < perSubjectCount) {
        try {
          await QuestionIngestionService.acquireOnDemandForCurriculum({
            examShortCode: exam.shortCode,
            subjectCode: sub.code,
            year: data.year,
          });
          subQuestions = await Question.find(queryFilter)
            .limit(perSubjectCount)
            .populate('topicId', 'name')
            .populate('subjectId', 'name code')
            .lean();
        } catch (ingestErr) {
          console.warn(`CBT on-demand question ingestion notice for ${sub.code}:`, ingestErr);
        }
      }

      questionsPool = questionsPool.concat(subQuestions);
    }

    const questions = questionsPool.slice(0, data.questionCount);
    if (questions.length === 0) {
      res.status(400).json({
        success: false,
        error: { message: 'No questions currently match your criteria. Please adjust topic, year, or subject selection.' },
      });
      return;
    }

    const allocatedDurationSeconds = data.durationMinutes * 60;
    const startTime = new Date();
    const endTime = new Date(startTime.getTime() + allocatedDurationSeconds * 1000);

    const answers = questions.map((q) => ({
      questionId: q._id,
      selectedOption: null,
      isCorrect: false,
      markedForReview: false,
      timeSpentSeconds: 0,
    }));

    // Freeze immutable question snapshot for this attempt
    const questionSnapshot = questions.map((q) => ({
      questionId: q._id,
      year: q.year,
      questionNumber: q.questionNumber,
      questionText: q.questionText,
      optionA: q.optionA,
      optionB: q.optionB,
      optionC: q.optionC,
      optionD: q.optionD,
      correctAnswer: q.correctAnswer,
      explanation: q.explanation || '',
      difficulty: q.difficulty,
      topicId: q.topicId?._id,
      topicName: (q.topicId as any)?.name || 'General Curriculum',
      subjectId: q.subjectId?._id || q.subjectId,
      subjectName: (q.subjectId as any)?.name || 'Subject',
      subjectCode: (q.subjectId as any)?.code || 'SUB',
      imageUrl: q.imageUrl || '',
    }));

    const primarySubject = subjects[0];
    const isMultiSubject = subjects.length > 1;

    const attempt = await ExamAttempt.create({
      userId,
      examId: data.examId,
      subjectId: primarySubject._id,
      subjectIds: subjects.map((s) => s._id),
      isMultiSubject,
      mode: data.mode,
      status: 'IN_PROGRESS',
      allocatedDurationSeconds,
      startTime,
      endTime,
      assignedQuestions: questions.map((q) => q._id),
      questionSnapshot,
      answers,
      score: 0,
      maxScore: questions.length,
      percentage: 0,
    });

    // Cleanse questions for mock mode (hide answers & explanations to prevent cheating)
    const cleansedQuestions = questions.map((q) => ({
      _id: q._id,
      year: q.year,
      questionNumber: q.questionNumber,
      questionText: q.questionText,
      optionA: q.optionA,
      optionB: q.optionB,
      optionC: q.optionC,
      optionD: q.optionD,
      difficulty: q.difficulty,
      topicName: (q.topicId as any)?.name,
      subjectId: q.subjectId?._id || q.subjectId,
      subjectName: (q.subjectId as any)?.name || primarySubject.name,
      subjectCode: (q.subjectId as any)?.code || primarySubject.code,
      imageUrl: q.imageUrl || '',
      ...(data.mode === 'PRACTICE'
        ? { correctAnswer: q.correctAnswer, explanation: q.explanation }
        : {}),
    }));

    res.status(201).json({
      success: true,
      data: {
        attemptId: attempt._id,
        mode: attempt.mode,
        allocatedDurationSeconds,
        remainingSeconds: allocatedDurationSeconds,
        startTime: attempt.startTime,
        endTime: attempt.endTime,
        examName: exam.name,
        examShortCode: exam.shortCode,
        subjectName: isMultiSubject ? `Combined Multi-Subject (${subjects.length} Subjects)` : primarySubject.name,
        subjectCode: isMultiSubject ? 'MULTI' : primarySubject.code,
        isMultiSubject,
        questions: cleansedQuestions,
        answers: attempt.answers,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: { message: 'Validation failed', details: error.flatten().fieldErrors },
      });
      return;
    }
    next(error);
  }
});

// GET /api/cbt/:attemptId — Get active attempt state / Rehydrate on reload
router.get('/:attemptId', async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const rawId = req.params.attemptId;
    const attemptId = Array.isArray(rawId) ? rawId[0] : rawId;
    const userId = req.user!._id;

    const attempt = await ExamAttempt.findById(attemptId)
      .populate('examId', 'name shortCode')
      .populate('subjectId', 'name code');

    if (!attempt) {
      res.status(404).json({ success: false, error: { message: 'Exam attempt not found.' } });
      return;
    }

    if (attempt.userId.toString() !== userId.toString()) {
      res.status(403).json({ success: false, error: { message: 'Unauthorized access to this examination.' } });
      return;
    }

    const now = Date.now();
    const end = new Date(attempt.endTime || attempt.startTime.getTime() + attempt.allocatedDurationSeconds * 1000).getTime();
    let remainingSeconds = Math.max(0, Math.floor((end - now) / 1000));

    // Auto-submit if time expired while attempt was in progress
    if (remainingSeconds === 0 && attempt.status === 'IN_PROGRESS') {
      await processAttemptSubmission(attempt, userId);
      attempt.status = 'COMPLETED';
    }

    // Use immutable snapshot if available, else fallback to live collection for legacy attempts
    const sourceQuestions: any[] =
      attempt.questionSnapshot && attempt.questionSnapshot.length > 0
        ? attempt.questionSnapshot.map((s: any) => ({
            _id: s.questionId,
            year: s.year,
            questionNumber: s.questionNumber,
            questionText: s.questionText,
            optionA: s.optionA,
            optionB: s.optionB,
            optionC: s.optionC,
            optionD: s.optionD,
            correctAnswer: s.correctAnswer,
            explanation: s.explanation,
            difficulty: s.difficulty,
            topicName: s.topicName,
            subjectId: s.subjectId,
            subjectName: s.subjectName,
            subjectCode: s.subjectCode,
            imageUrl: s.imageUrl || '',
          }))
        : await Question.find({ _id: { $in: attempt.assignedQuestions } })
            .populate('topicId', 'name')
            .populate('subjectId', 'name code')
            .lean();

    const isMockRunning = attempt.mode === 'TIMED_MOCK' && attempt.status === 'IN_PROGRESS';

    const cleansedQuestions = sourceQuestions.map((q) => ({
      _id: q._id,
      year: q.year,
      questionNumber: q.questionNumber,
      questionText: q.questionText,
      optionA: q.optionA,
      optionB: q.optionB,
      optionC: q.optionC,
      optionD: q.optionD,
      difficulty: q.difficulty,
      topicName: q.topicName || (q.topicId as any)?.name,
      subjectId: q.subjectId?._id || q.subjectId,
      subjectName: q.subjectName || (q.subjectId as any)?.name,
      subjectCode: q.subjectCode || (q.subjectId as any)?.code,
      imageUrl: q.imageUrl || '',
      ...(!isMockRunning ? { correctAnswer: q.correctAnswer, explanation: q.explanation } : {}),
    }));

    res.status(200).json({
      success: true,
      data: {
        attemptId: attempt._id,
        status: attempt.status,
        mode: attempt.mode,
        allocatedDurationSeconds: attempt.allocatedDurationSeconds,
        remainingSeconds,
        startTime: attempt.startTime,
        endTime: attempt.endTime,
        examName: (attempt.examId as any)?.name,
        examShortCode: (attempt.examId as any)?.shortCode,
        subjectName: (attempt.subjectId as any)?.name,
        subjectCode: (attempt.subjectId as any)?.code,
        isMultiSubject: Boolean(attempt.isMultiSubject),
        questions: cleansedQuestions,
        answers: attempt.answers,
        score: attempt.score,
        maxScore: attempt.maxScore,
        percentage: attempt.percentage,
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/cbt/:attemptId/answer — Save individual answer with server verification
router.post('/:attemptId/answer', async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const rawId = req.params.attemptId;
    const attemptId = Array.isArray(rawId) ? rawId[0] : rawId;
    const userId = req.user!._id;

    const data = answerCbtSchema.parse(req.body);

    const attempt = await ExamAttempt.findById(attemptId);
    if (!attempt) {
      res.status(404).json({ success: false, error: { message: 'Exam attempt not found.' } });
      return;
    }

    if (attempt.userId.toString() !== userId.toString()) {
      res.status(403).json({ success: false, error: { message: 'Unauthorized access.' } });
      return;
    }

    if (attempt.status !== 'IN_PROGRESS') {
      res.status(400).json({
        success: false,
        error: { message: 'This examination has already been completed or expired.' },
      });
      return;
    }

    // Server-authoritative timer check
    const now = Date.now();
    const end = new Date(attempt.endTime || attempt.startTime.getTime() + attempt.allocatedDurationSeconds * 1000).getTime();
    const remainingSeconds = Math.max(0, Math.floor((end - now) / 1000));

    if (remainingSeconds === 0) {
      await processAttemptSubmission(attempt, userId);
      res.status(400).json({
        success: false,
        expired: true,
        error: { message: 'Allocated time has expired. Your examination has been automatically submitted.' },
      });
      return;
    }

    // Save answer
    const existing = attempt.answers.find((a) => a.questionId.toString() === data.questionId);
    if (existing) {
      if (data.selectedOption !== undefined) {
        existing.selectedOption = data.selectedOption;
      }
      if (data.markedForReview !== undefined) {
        existing.markedForReview = data.markedForReview;
      }
      existing.answeredAt = new Date();
    } else {
      attempt.answers.push({
        questionId: new Types.ObjectId(data.questionId),
        selectedOption: data.selectedOption,
        markedForReview: data.markedForReview || false,
        timeSpentSeconds: 0,
        answeredAt: new Date(),
      });
    }

    await attempt.save();

    res.status(200).json({
      success: true,
      data: {
        questionId: data.questionId,
        selectedOption: data.selectedOption,
        markedForReview: data.markedForReview,
        remainingSeconds,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: { message: 'Validation failed', details: error.flatten().fieldErrors },
      });
      return;
    }
    next(error);
  }
});

// POST /api/cbt/:attemptId/submit — Conclude exam, calculate score, generate Result
router.post('/:attemptId/submit', async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const rawId = req.params.attemptId;
    const attemptId = Array.isArray(rawId) ? rawId[0] : rawId;
    const userId = req.user!._id;

    const attempt = await ExamAttempt.findById(attemptId);
    if (!attempt) {
      res.status(404).json({ success: false, error: { message: 'Exam attempt not found.' } });
      return;
    }

    if (attempt.userId.toString() !== userId.toString()) {
      res.status(403).json({ success: false, error: { message: 'Unauthorized access.' } });
      return;
    }

    const result = await processAttemptSubmission(attempt, userId);

    res.status(200).json({
      success: true,
      message: 'Examination submitted successfully.',
      data: {
        resultId: result._id,
        score: result.score,
        maxScore: result.maxScore,
        percentage: result.percentage,
        correctCount: result.correctCount,
        incorrectCount: result.incorrectCount,
        unansweredCount: result.unansweredCount,
        timeSpentSeconds: result.timeSpentSeconds,
        topicBreakdown: result.topicBreakdown,
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/cbt/:attemptId/result — Fetch full result review with worked solutions
router.get('/:attemptId/result', async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const rawId = req.params.attemptId;
    const attemptId = Array.isArray(rawId) ? rawId[0] : rawId;
    const userId = req.user!._id;

    const [attempt, result] = await Promise.all([
      ExamAttempt.findById(attemptId)
        .populate('examId', 'name shortCode')
        .populate('subjectId', 'name code'),
      Result.findOne({ attemptId }),
    ]);

    if (!attempt || !result) {
      res.status(404).json({ success: false, error: { message: 'Result not found for this attempt.' } });
      return;
    }

    if (attempt.userId.toString() !== userId.toString()) {
      res.status(403).json({ success: false, error: { message: 'Unauthorized access.' } });
      return;
    }

    // Use snapshot questions if available to preserve immutable subject and topic info
    const sourceQuestions: any[] =
      attempt.questionSnapshot && attempt.questionSnapshot.length > 0
        ? attempt.questionSnapshot.map((s: any) => ({
            _id: s.questionId,
            year: s.year,
            questionNumber: s.questionNumber,
            questionText: s.questionText,
            optionA: s.optionA,
            optionB: s.optionB,
            optionC: s.optionC,
            optionD: s.optionD,
            correctAnswer: s.correctAnswer,
            explanation: s.explanation,
            difficulty: s.difficulty,
            topicName: s.topicName,
            subjectId: s.subjectId,
            subjectName: s.subjectName,
            subjectCode: s.subjectCode,
          }))
        : await Question.find({ _id: { $in: attempt.assignedQuestions } })
            .populate('topicId', 'name')
            .populate('subjectId', 'name code')
            .lean();

    const answersMap = new Map(attempt.answers.map((a: any) => [a.questionId.toString(), a]));

    const reviewedQuestions = sourceQuestions.map((q: any) => {
      const studentAns = answersMap.get(q._id.toString());
      return {
        _id: q._id,
        year: q.year,
        questionNumber: q.questionNumber,
        questionText: q.questionText,
        optionA: q.optionA,
        optionB: q.optionB,
        optionC: q.optionC,
        optionD: q.optionD,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        difficulty: q.difficulty,
        topicName: q.topicName || (q.topicId as any)?.name,
        subjectId: q.subjectId?._id || q.subjectId,
        subjectName: q.subjectName || (q.subjectId as any)?.name,
        subjectCode: q.subjectCode || (q.subjectId as any)?.code,
        studentChoice: studentAns?.selectedOption || null,
        isCorrect: studentAns?.isCorrect || false,
      };
    });

    res.status(200).json({
      success: true,
      data: {
        result,
        attempt: {
          _id: attempt._id,
          mode: attempt.mode,
          startTime: attempt.startTime,
          submittedAt: attempt.submittedAt,
          examName: (attempt.examId as any)?.name,
          examShortCode: (attempt.examId as any)?.shortCode,
          subjectName: (attempt.subjectId as any)?.name,
          subjectCode: (attempt.subjectId as any)?.code,
        },
        reviewedQuestions,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;

