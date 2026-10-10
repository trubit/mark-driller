import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import { Types } from 'mongoose';
import { ExamAttempt } from '../models/ExamAttempt.js';
import { Result, ITopicScore } from '../models/Result.js';
import { Question } from '../models/Question.js';
import { Exam } from '../models/Exam.js';
import { Subject } from '../models/Subject.js';
import { Bookmark } from '../models/Bookmark.js';
import { authenticateToken, requireVerified, requireCbtEntitlement, checkStudentSubscription, FREE_PERMITTED_YEAR, AuthenticatedRequest } from '../middleware/auth.js';
import { QuestionIngestionService } from '../services/questionIngestionService.js';
import { FreeTrialService } from '../services/freeTrialService.js';
import { randomizeQuestionOptions } from '../utils/optionRandomizer.js';
import { TermsAcceptance } from '../models/TermsAcceptance.js';
import { User } from '../models/User.js';
import { CURRENT_TERMS_VERSION } from './terms.js';

const router = Router();

// All CBT routes require student authentication, verified email, and CBT entitlement
router.use(authenticateToken, requireVerified, requireCbtEntitlement());

// GET /api/cbt/trial-status — Get current student Free Trial status (Strict 3-trial limit)
router.get('/trial-status', async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!._id;
    const isAdmin = req.user!.role === 'ADMIN';
    const { isPro } = isAdmin ? { isPro: true } : await checkStudentSubscription(userId);
    const status = await FreeTrialService.getTrialStatus(userId, isPro);
    res.status(200).json({ success: true, data: status });
  } catch (error) {
    next(error);
  }
});

// GET /api/cbt/active — Get current student's active IN_PROGRESS attempt if any
router.get('/active', async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!._id;
    const nowTime = new Date();

    // Auto-close expired attempts first
    await ExamAttempt.updateMany(
      { userId, status: 'IN_PROGRESS', endTime: { $lte: nowTime } },
      { $set: { status: 'COMPLETED' } }
    );

    const activeAttempt = await ExamAttempt.findOne({
      userId,
      status: 'IN_PROGRESS',
      endTime: { $gt: nowTime },
    }).sort({ createdAt: -1 });

    if (!activeAttempt) {
      res.status(200).json({ success: true, data: null });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        attemptId: activeAttempt._id.toString(),
        mode: activeAttempt.mode,
        endTime: activeAttempt.endTime,
        allocatedDurationSeconds: activeAttempt.allocatedDurationSeconds,
      },
    });
  } catch (error) {
    next(error);
  }
});

const startCbtSchema = z.object({
  examId: z.string().min(1, 'Exam ID is required'),
  subjectId: z.string().optional(),
  subjectIds: z.array(z.string()).optional(),
  topicId: z.string().optional(),
  year: z.number().int().min(1970).max(2030).optional(),
  years: z.array(z.number().int().min(1970).max(2030)).optional(),
  allYears: z.boolean().optional(),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']).optional(),
  questionOrder: z.enum(['NORMAL', 'SHUFFLE', 'RANDOM']).default('NORMAL').optional(),
  shuffleOptions: z.boolean().default(false).optional(),
  onlyBookmarked: z.boolean().optional(),
  drillType: z.enum(['PAST_QUESTION', 'PRACTICE_MOCK', 'BOTH']).default('PAST_QUESTION').optional(),
  durationMinutes: z.number().int().min(5).max(180).default(30),
  questionCount: z.number().int().min(1).max(100).default(10),
  declarationAccepted: z.boolean().optional(),
  declarationChecklist: z
    .object({
      readAndUnderstood: z.boolean().optional(),
      followInstructions: z.boolean().optional(),
      antiCheating: z.boolean().optional(),
      understandConsequences: z.boolean().optional(),
      accurateInformation: z.boolean().optional(),
      lawfulUse: z.boolean().optional(),
    })
    .optional(),
});

const answerCbtSchema = z.object({
  questionId: z.string().min(1, 'Question ID is required'),
  selectedOption: z.enum(['A', 'B', 'C', 'D']).nullable().optional(),
  isSkipped: z.boolean().optional(),
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
  let skippedCount = 0;

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

    if (ans.isSkipped) {
      skippedCount += 1;
      ans.isCorrect = false;
    } else if (ans.selectedOption === null || ans.selectedOption === undefined) {
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
      skippedCount,
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
  let trialConsumed = false;
  const userId = req.user!._id;

  try {
    const data = startCbtSchema.parse(req.body);

    // Strict Backend Enforcement: Student Terms & Conditions Acceptance
    let hasAcceptedTerms = req.user!.acceptedTermsVersion === CURRENT_TERMS_VERSION;
    if (!hasAcceptedTerms) {
      const existingAcceptance = await TermsAcceptance.findOne({
        userId,
        termsVersion: CURRENT_TERMS_VERSION,
      });
      if (existingAcceptance) {
        hasAcceptedTerms = true;
        await User.updateOne(
          { _id: userId },
          { $set: { acceptedTermsVersion: CURRENT_TERMS_VERSION, acceptedTermsAt: existingAcceptance.acceptedAt } }
        );
      }
    }

    // Process explicit inline declaration if submitted with start payload
    if (!hasAcceptedTerms && data.declarationAccepted && data.declarationChecklist) {
      const c = data.declarationChecklist;
      const isComplete =
        c.readAndUnderstood === true &&
        c.followInstructions === true &&
        c.antiCheating === true &&
        c.understandConsequences === true &&
        c.accurateInformation === true &&
        c.lawfulUse === true;

      if (isComplete) {
        const ipAddress = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.ip || '127.0.0.1';
        const userAgent = req.headers['user-agent']?.slice(0, 255) || 'Unknown';
        const newRecord = await TermsAcceptance.findOneAndUpdate(
          { userId, termsVersion: CURRENT_TERMS_VERSION },
          {
            $setOnInsert: {
              userId,
              termsVersion: CURRENT_TERMS_VERSION,
              acceptedAt: new Date(),
              ipAddress,
              userAgent,
              declarationDetails: c,
            },
          },
          { upsert: true, new: true }
        );
        await User.updateOne(
          { _id: userId },
          { $set: { acceptedTermsVersion: CURRENT_TERMS_VERSION, acceptedTermsAt: newRecord.acceptedAt } }
        );
        hasAcceptedTerms = true;
      }
    }

    if (!hasAcceptedTerms) {
      res.status(403).json({
        success: false,
        error: {
          code: 'TERMS_ACCEPTANCE_REQUIRED',
          message: 'Student Terms & Conditions acceptance is required before starting a Computer-Based Test.',
          termsVersion: CURRENT_TERMS_VERSION,
          requiresAcceptance: true,
        },
      });
      return;
    }

    const exam = await Exam.findById(data.examId);
    if (!exam) {
      res.status(404).json({ success: false, error: { message: 'Exam board not found.' } });
      return;
    }

    // Auto-close any expired IN_PROGRESS attempts for this user
    const nowTime = new Date();
    await ExamAttempt.updateMany(
      { userId, status: 'IN_PROGRESS', endTime: { $lte: nowTime } },
      { $set: { status: 'COMPLETED' } }
    );

    // Idempotent Resumption: If user already has an active, unexpired attempt, return it directly
    const existingActiveAttempt = await ExamAttempt.findOne({
      userId,
      status: 'IN_PROGRESS',
      endTime: { $gt: nowTime },
    })
      .populate('examId', 'name shortCode')
      .populate('subjectId', 'name code');

    if (existingActiveAttempt) {
      const fallbackEnd = existingActiveAttempt.endTime || new Date(existingActiveAttempt.startTime.getTime() + existingActiveAttempt.allocatedDurationSeconds * 1000);
      const endMs = new Date(fallbackEnd).getTime();
      const remainingSeconds = Math.max(0, Math.floor((endMs - Date.now()) / 1000));

      const sourceQuestions: any[] =
        existingActiveAttempt.questionSnapshot && existingActiveAttempt.questionSnapshot.length > 0
          ? existingActiveAttempt.questionSnapshot.map((s: any) => ({
              _id: s.questionId ? s.questionId.toString() : '',
              year: s.year,
              questionNumber: s.questionNumber,
              questionText: typeof s.questionText === 'string' ? s.questionText : '',
              optionA: typeof s.optionA === 'string' ? s.optionA : '',
              optionB: typeof s.optionB === 'string' ? s.optionB : '',
              optionC: typeof s.optionC === 'string' ? s.optionC : '',
              optionD: typeof s.optionD === 'string' ? s.optionD : '',
              difficulty: typeof s.difficulty === 'string' ? s.difficulty : 'MEDIUM',
              topicName: typeof s.topicName === 'string' ? s.topicName : 'General Curriculum',
              subjectId: s.subjectId ? s.subjectId.toString() : '',
              subjectName: typeof s.subjectName === 'string' ? s.subjectName : 'Subject',
              subjectCode: typeof s.subjectCode === 'string' ? s.subjectCode : 'SUB',
              imageUrl: typeof s.imageUrl === 'string' ? s.imageUrl : '',
            }))
          : await Question.find({ _id: { $in: existingActiveAttempt.assignedQuestions } })
              .populate('topicId', 'name')
              .populate('subjectId', 'name code')
              .lean();

      const cleansedQuestions = sourceQuestions.map((q: any) => ({
        _id: q._id ? q._id.toString() : '',
        year: q.year || 2024,
        questionNumber: q.questionNumber || 1,
        questionText: typeof q.questionText === 'string' ? q.questionText : '',
        optionA: typeof q.optionA === 'string' ? q.optionA : '',
        optionB: typeof q.optionB === 'string' ? q.optionB : '',
        optionC: typeof q.optionC === 'string' ? q.optionC : '',
        optionD: typeof q.optionD === 'string' ? q.optionD : '',
        difficulty: typeof q.difficulty === 'string' ? q.difficulty : 'MEDIUM',
        topicName: typeof q.topicName === 'string' ? q.topicName : ((q.topicId as any)?.name || 'General Curriculum'),
        subjectId: q.subjectId?._id ? q.subjectId._id.toString() : (q.subjectId ? q.subjectId.toString() : ''),
        subjectName: typeof q.subjectName === 'string' ? q.subjectName : ((q.subjectId as any)?.name || 'Subject'),
        subjectCode: typeof q.subjectCode === 'string' ? q.subjectCode : ((q.subjectId as any)?.code || 'SUB'),
        imageUrl: typeof q.imageUrl === 'string' ? q.imageUrl : '',
      }));

      const safeAnswers = (existingActiveAttempt.answers || []).map((ans: any) => ({
        questionId: ans.questionId ? ans.questionId.toString() : '',
        selectedOption: ans.selectedOption || null,
        isSkipped: Boolean(ans.isSkipped),
        markedForReview: Boolean(ans.markedForReview),
      }));

      res.status(200).json({
        success: true,
        data: {
          attemptId: existingActiveAttempt._id,
          status: existingActiveAttempt.status,
          mode: existingActiveAttempt.mode,
          allocatedDurationSeconds: existingActiveAttempt.allocatedDurationSeconds,
          remainingSeconds,
          startTime: existingActiveAttempt.startTime,
          endTime: existingActiveAttempt.endTime,
          examName: (existingActiveAttempt.examId as any)?.name || 'Examination',
          examShortCode: (existingActiveAttempt.examId as any)?.shortCode || 'EXAM',
          subjectName: existingActiveAttempt.isMultiSubject
            ? 'Combined Multi-Subject Mock'
            : ((existingActiveAttempt.subjectId as any)?.name || 'Subject'),
          subjectCode: existingActiveAttempt.isMultiSubject
            ? 'MULTI'
            : ((existingActiveAttempt.subjectId as any)?.code || 'SUB'),
          isMultiSubject: Boolean(existingActiveAttempt.isMultiSubject),
          questions: cleansedQuestions,
          answers: safeAnswers,
          resumed: true,
        },
      });
      return;
    }

    const { isPro, plan } = req.user!.role === 'ADMIN'
      ? { isPro: true, plan: 'ADMIN' }
      : await checkStudentSubscription(userId);

    // Enforce 3 Free Trials limit and single permitted Free Year (2024) rule
    if (!isPro && req.user!.role !== 'ADMIN') {
      // 1. Single Year enforcement: only FREE_PERMITTED_YEAR (2024) is accessible
      if (data.year && data.year !== FREE_PERMITTED_YEAR) {
        res.status(403).json({
          success: false,
          error: {
            code: 'YEAR_LOCKED',
            message: `Year ${data.year} is locked on the Free Trial. Free accounts include complete ${FREE_PERMITTED_YEAR} Past Questions across all subjects. Upgrade to MarkDriller Pro to unlock all examination years (2015–2025).`,
            currentPlan: plan,
            permittedFreeYear: FREE_PERMITTED_YEAR,
          },
        });
        return;
      }

      if (data.years && (data.years.length > 1 || !data.years.includes(FREE_PERMITTED_YEAR))) {
        res.status(403).json({
          success: false,
          error: {
            code: 'YEAR_LOCKED',
            message: `Multi-year past question pooling is locked on the Free Trial. Upgrade to MarkDriller Pro to unlock all years (2015–2025).`,
            currentPlan: plan,
            permittedFreeYear: FREE_PERMITTED_YEAR,
          },
        });
        return;
      }

      if (data.allYears) {
        res.status(403).json({
          success: false,
          error: {
            code: 'YEAR_LOCKED',
            message: 'All-years past question pooling requires MarkDriller Pro. Upgrade to unlock all examination years (2015–2025).',
            currentPlan: plan,
            permittedFreeYear: FREE_PERMITTED_YEAR,
          },
        });
        return;
      }

      // 2. Strict 3 Free Trial limit enforcement (Atomic & concurrency-safe)
      const trialResult = await FreeTrialService.consumeTrialAttempt(userId);
      if (!trialResult.success) {
        res.status(403).json({
          success: false,
          error: {
            code: 'TRIAL_EXHAUSTED',
            message: 'Your 3 free trials have been used. Upgrade to Pro to continue.',
            status: 'PRO_REQUIRED',
            allowed: trialResult.usage.allowed,
            used: trialResult.usage.used,
            remaining: 0,
          },
        });
        return;
      }
      trialConsumed = true;
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
        if (trialConsumed) {
          await FreeTrialService.rollbackTrial(userId);
        }
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

      const questionSnapshot = sliceQuestions.map((q: any) => {
        const rand = data.shuffleOptions ? randomizeQuestionOptions(q) : q;
        return {
          questionId: q._id,
          year: q.year,
          questionNumber: q.questionNumber,
          questionText: q.questionText,
          optionA: rand.optionA,
          optionB: rand.optionB,
          optionC: rand.optionC,
          optionD: rand.optionD,
          correctAnswer: rand.correctAnswer,
          explanation: q.explanation || '',
          difficulty: q.difficulty,
          topicId: q.topicId?._id,
          topicName: q.topicId?.name || 'General Curriculum',
          subjectId: q.subjectId?._id || q.subjectId,
          subjectName: q.subjectId?.name || 'Subject',
          subjectCode: q.subjectId?.code || 'SUB',
          imageUrl: q.imageUrl || '',
        };
      });

      const firstSubjId = sliceQuestions[0].subjectId?._id || sliceQuestions[0].subjectId;
      const allSubjIds = Array.from(new Set(sliceQuestions.map((q: any) => (q.subjectId?._id || q.subjectId)?.toString())));

      const attempt = await ExamAttempt.create({
        userId,
        examId: data.examId,
        subjectId: firstSubjId,
        subjectIds: allSubjIds,
        isMultiSubject: allSubjIds.length > 1,
        mode: 'CBT',
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

      if (trialConsumed) {
        await FreeTrialService.recordAttemptId(userId, attempt._id);
      }

      const cleansedQuestions = questionSnapshot.map((q: any) => ({
        _id: q.questionId,
        year: q.year,
        questionNumber: q.questionNumber,
        questionText: q.questionText,
        optionA: q.optionA,
        optionB: q.optionB,
        optionC: q.optionC,
        optionD: q.optionD,
        difficulty: q.difficulty,
        topicName: q.topicName || 'General Curriculum',
        subjectId: q.subjectId,
        subjectName: q.subjectName || 'Subject',
        subjectCode: q.subjectCode || 'SUB',
        imageUrl: q.imageUrl || '',
      }));

      res.status(201).json({
        success: true,
        data: {
          attemptId: attempt._id,
          status: attempt.status,
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
      if (trialConsumed) {
        await FreeTrialService.rollbackTrial(userId);
      }
      res.status(404).json({ success: false, error: { message: 'Selected subject(s) not found.' } });
      return;
    }

    const perSubjectCount = Math.max(1, Math.ceil(data.questionCount / subjects.length));
    let questionsPool: any[] = [];

    const targetDrillType = data.drillType || 'PAST_QUESTION';

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
      if (!isPro && req.user!.role !== 'ADMIN') {
        queryFilter.year = FREE_PERMITTED_YEAR;
      } else if (data.year) {
        queryFilter.year = data.year;
      } else if (data.years && data.years.length > 0) {
        queryFilter.year = { $in: data.years };
      }
      // If data.allYears is true, no year restriction is applied
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

    // Deterministic question shuffling / randomization against selected pool (Req 12, 14, 40)
    if (data.questionOrder === 'SHUFFLE' || data.questionOrder === 'RANDOM') {
      for (let i = questionsPool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [questionsPool[i], questionsPool[j]] = [questionsPool[j], questionsPool[i]];
      }
    }

    // Anti-duplication: enforce unique question IDs (Req 40)
    const seenIds = new Set<string>();
    const uniquePool: any[] = [];
    for (const q of questionsPool) {
      const qIdStr = q._id.toString();
      if (!seenIds.has(qIdStr)) {
        seenIds.add(qIdStr);
        uniquePool.push(q);
      }
    }

    const questions = uniquePool.slice(0, data.questionCount);
    if (questions.length === 0) {
      if (trialConsumed) {
        await FreeTrialService.rollbackTrial(userId);
      }
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
    const questionSnapshot = questions.map((q) => {
      const rand = data.shuffleOptions ? randomizeQuestionOptions(q) : q;
      return {
        questionId: q._id,
        year: q.year,
        questionNumber: q.questionNumber,
        questionText: q.questionText,
        optionA: rand.optionA,
        optionB: rand.optionB,
        optionC: rand.optionC,
        optionD: rand.optionD,
        correctAnswer: rand.correctAnswer,
        explanation: q.explanation || '',
        difficulty: q.difficulty,
        topicId: q.topicId?._id,
        topicName: (q.topicId as any)?.name || 'General Curriculum',
        subjectId: q.subjectId?._id || q.subjectId,
        subjectName: (q.subjectId as any)?.name || 'Subject',
        subjectCode: (q.subjectId as any)?.code || 'SUB',
        imageUrl: q.imageUrl || '',
      };
    });

    const primarySubject = subjects[0];
    const isMultiSubject = subjects.length > 1;

    const attempt = await ExamAttempt.create({
      userId,
      examId: data.examId,
      subjectId: primarySubject._id,
      subjectIds: subjects.map((s) => s._id),
      isMultiSubject,
      mode: 'CBT',
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

    if (trialConsumed) {
      await FreeTrialService.recordAttemptId(userId, attempt._id);
    }

    // Cleanse questions for examination room (hide answers & explanations to prevent cheating)
    const cleansedQuestions = questionSnapshot.map((q) => ({
      _id: q.questionId,
      year: q.year,
      questionNumber: q.questionNumber,
      questionText: q.questionText,
      optionA: q.optionA,
      optionB: q.optionB,
      optionC: q.optionC,
      optionD: q.optionD,
      difficulty: q.difficulty,
      topicName: q.topicName,
      subjectId: q.subjectId,
      subjectName: q.subjectName,
      subjectCode: q.subjectCode,
      imageUrl: q.imageUrl || '',
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
    if (trialConsumed) {
      await FreeTrialService.rollbackTrial(userId);
    }
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

    const isInProgress = attempt.status === 'IN_PROGRESS';

    const cleansedQuestions = sourceQuestions.map((q) => {
      const qId = q._id ? q._id.toString() : '';
      const tName = typeof q.topicName === 'string'
        ? q.topicName
        : (q.topicId && typeof (q.topicId as any).name === 'string' ? (q.topicId as any).name : 'General Curriculum');
      const sId = q.subjectId?._id ? q.subjectId._id.toString() : (q.subjectId ? q.subjectId.toString() : '');
      const sName = typeof q.subjectName === 'string'
        ? q.subjectName
        : (q.subjectId && typeof (q.subjectId as any).name === 'string' ? (q.subjectId as any).name : 'Subject');
      const sCode = typeof q.subjectCode === 'string'
        ? q.subjectCode
        : (q.subjectId && typeof (q.subjectId as any).code === 'string' ? (q.subjectId as any).code : 'SUB');

      return {
        _id: qId,
        year: q.year || 2024,
        questionNumber: q.questionNumber || 1,
        questionText: typeof q.questionText === 'string' ? q.questionText : '',
        optionA: typeof q.optionA === 'string' ? q.optionA : '',
        optionB: typeof q.optionB === 'string' ? q.optionB : '',
        optionC: typeof q.optionC === 'string' ? q.optionC : '',
        optionD: typeof q.optionD === 'string' ? q.optionD : '',
        difficulty: typeof q.difficulty === 'string' ? q.difficulty : 'MEDIUM',
        topicName: tName,
        subjectId: sId,
        subjectName: sName,
        subjectCode: sCode,
        imageUrl: typeof q.imageUrl === 'string' ? q.imageUrl : '',
        ...(!isInProgress ? { correctAnswer: q.correctAnswer, explanation: q.explanation } : {}),
      };
    });

    if (cleansedQuestions.length === 0) {
      res.status(404).json({
        success: false,
        error: {
          code: 'NO_QUESTIONS_FOUND',
          message: 'This examination session does not contain any questions. Please configure a new CBT mock test.',
        },
      });
      return;
    }

    const sanitizedAnswers = (attempt.answers || []).map((ans: any) => ({
      questionId: ans.questionId ? ans.questionId.toString() : '',
      selectedOption: ans.selectedOption || null,
      isSkipped: Boolean(ans.isSkipped),
      markedForReview: Boolean(ans.markedForReview),
      isCorrect: ans.isCorrect,
      timeSpentSeconds: ans.timeSpentSeconds || 0,
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
        examName: typeof (attempt.examId as any)?.name === 'string' ? (attempt.examId as any).name : 'Examination',
        examShortCode: typeof (attempt.examId as any)?.shortCode === 'string' ? (attempt.examId as any).shortCode : 'EXAM',
        subjectName: typeof (attempt.subjectId as any)?.name === 'string' ? (attempt.subjectId as any).name : (attempt.isMultiSubject ? 'Combined Subjects' : 'Subject'),
        subjectCode: typeof (attempt.subjectId as any)?.code === 'string' ? (attempt.subjectId as any).code : (attempt.isMultiSubject ? 'MULTI' : 'SUB'),
        isMultiSubject: Boolean(attempt.isMultiSubject),
        questions: cleansedQuestions,
        answers: sanitizedAnswers,
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
      if (data.isSkipped) {
        existing.isSkipped = true;
        existing.selectedOption = null;
      } else {
        if (data.selectedOption !== undefined) {
          existing.selectedOption = data.selectedOption;
          existing.isSkipped = false;
        }
      }
      if (data.markedForReview !== undefined) {
        existing.markedForReview = data.markedForReview;
      }
      existing.answeredAt = new Date();
    } else {
      attempt.answers.push({
        questionId: new Types.ObjectId(data.questionId),
        selectedOption: data.isSkipped ? null : (data.selectedOption ?? null),
        isSkipped: !!data.isSkipped,
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
        skippedCount: result.skippedCount || 0,
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
        isSkipped: !!studentAns?.isSkipped,
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
          examName: typeof (attempt.examId as any)?.name === 'string' ? (attempt.examId as any).name : 'National Examination',
          examShortCode: typeof (attempt.examId as any)?.shortCode === 'string' ? (attempt.examId as any).shortCode : 'EXAM',
          subjectName: attempt.isMultiSubject
            ? 'Combined Multi-Subject Simulation'
            : (typeof (attempt.subjectId as any)?.name === 'string' ? (attempt.subjectId as any).name : 'Subject'),
          subjectCode: attempt.isMultiSubject
            ? 'MULTI'
            : (typeof (attempt.subjectId as any)?.code === 'string' ? (attempt.subjectId as any).code : 'SUB'),
        },
        reviewedQuestions,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;

