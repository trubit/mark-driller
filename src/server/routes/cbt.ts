import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import { Types } from 'mongoose';
import { ExamAttempt } from '../models/ExamAttempt.js';
import { Result, ITopicScore } from '../models/Result.js';
import { Question } from '../models/Question.js';
import { Exam } from '../models/Exam.js';
import { Subject } from '../models/Subject.js';
import { authenticateToken, requireVerified, requireCbtEntitlement, AuthenticatedRequest } from '../middleware/auth.js';
import { QuestionIngestionService } from '../services/questionIngestionService.js';

const router = Router();

// All CBT routes require student authentication and verified email
router.use(authenticateToken, requireVerified);

const startCbtSchema = z.object({
  examId: z.string().min(1, 'Exam ID is required'),
  subjectId: z.string().min(1, 'Subject ID is required'),
  mode: z.enum(['PRACTICE', 'TIMED_MOCK']).default('TIMED_MOCK'),
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
    }));
  } else {
    questions = await Question.find({ _id: { $in: attempt.assignedQuestions } })
      .populate('topicId', 'name')
      .lean();
  }

  const questionMap = new Map(questions.map((q) => [q._id.toString(), q]));


  let correctCount = 0;
  let incorrectCount = 0;
  let unansweredCount = 0;

  const topicMap = new Map<string, { topicId?: Types.ObjectId; topicName: string; total: number; correct: number }>();

  attempt.answers.forEach((ans: any) => {
    const q = questionMap.get(ans.questionId.toString());
    if (!q) return;

    const topicKey = q.topicId?._id?.toString() || 'general';
    const topicName = (q.topicId as any)?.name || 'General Curriculum';

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

    if (ans.selectedOption === null || ans.selectedOption === undefined) {
      unansweredCount += 1;
      ans.isCorrect = false;
    } else if (ans.selectedOption === q.correctAnswer) {
      correctCount += 1;
      ans.isCorrect = true;
      tStat.correct += 1;
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

  // Create Result document
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

    const [exam, subject] = await Promise.all([
      Exam.findById(data.examId),
      Subject.findById(data.subjectId),
    ]);

    if (!exam || !subject) {
      res.status(404).json({ success: false, error: { message: 'Exam or Subject not found.' } });
      return;
    }

    // Check available questions count
    let availableCount = await Question.countDocuments({
      examId: data.examId,
      subjectId: data.subjectId,
      published: true,
      reviewStatus: 'PUBLISHED',
    });

    // If questions count is less than requested, trigger on-demand curriculum acquisition
    if (availableCount < data.questionCount) {
      try {
        await QuestionIngestionService.acquireOnDemandForCurriculum({
          examShortCode: exam.shortCode,
          subjectCode: subject.code,
        });
      } catch (ingestErr) {
        console.warn('CBT on-demand question ingestion notice:', ingestErr);
      }
    }

    // Retrieve questions pool
    const questions = await Question.find({
      examId: data.examId,
      subjectId: data.subjectId,
      published: true,
      reviewStatus: 'PUBLISHED',
    })
      .limit(data.questionCount)
      .populate('topicId', 'name')
      .lean();

    if (questions.length === 0) {
      res.status(400).json({
        success: false,
        error: { message: 'No questions currently available for this subject. Please try another subject.' },
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
    }));

    const attempt = await ExamAttempt.create({
      userId,
      examId: data.examId,
      subjectId: data.subjectId,
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
        subjectName: subject.name,
        subjectCode: subject.code,
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
          }))
        : await Question.find({ _id: { $in: attempt.assignedQuestions } })
            .populate('topicId', 'name')
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

    // Retrieve questions with explanations
    const questions = await Question.find({ _id: { $in: attempt.assignedQuestions } })
      .populate('topicId', 'name')
      .lean();

    const answersMap = new Map(attempt.answers.map((a) => [a.questionId.toString(), a]));

    const reviewedQuestions = questions.map((q) => {
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
        topicName: (q.topicId as any)?.name,
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
