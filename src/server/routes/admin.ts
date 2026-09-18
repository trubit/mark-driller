import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import { User } from '../models/User.js';
import { Question } from '../models/Question.js';
import { Exam } from '../models/Exam.js';
import { Subject } from '../models/Subject.js';
import { Topic } from '../models/Topic.js';
import { ExamAttempt } from '../models/ExamAttempt.js';
import { Subscription } from '../models/Subscription.js';
import { Payment } from '../models/Payment.js';
import { StudyMaterial } from '../models/StudyMaterial.js';
import { QuestionSyncLog } from '../models/QuestionSyncLog.js';
import { authenticateToken, requireAdmin, AuthenticatedRequest } from '../middleware/auth.js';
import { QuestionIngestionService } from '../services/questionIngestionService.js';
import { questionSyncScheduler } from '../services/questionSyncScheduler.js';
import { AuthorizedApiAdapter } from '../services/questionSourceAdapter.js';
import { metadataCache } from '../utils/cache.js';

const router = Router();

// Strict RBAC: All admin endpoints require active authentication and matching ADMIN_EMAIL authorization
router.use(authenticateToken, requireAdmin);

// ----------------------------------------------------
// 1. OVERVIEW TELEMETRY & REVENUE
// ----------------------------------------------------
router.get('/overview', async (_req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const [
      totalUsers,
      totalStudents,
      totalAdmins,
      totalQuestions,
      totalPublishedQuestions,
      totalExams,
      totalSubjects,
      totalTopics,
      totalStudyMaterials,
      totalAttempts,
      activePaidSubscriptions,
      successfulPayments,
      revenueResult,
      recentUsers,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'STUDENT' }),
      User.countDocuments({ role: 'ADMIN' }),
      Question.countDocuments(),
      Question.countDocuments({ published: true }),
      Exam.countDocuments(),
      Subject.countDocuments(),
      Topic.countDocuments(),
      StudyMaterial.countDocuments(),
      ExamAttempt.countDocuments(),
      Subscription.countDocuments({ status: 'ACTIVE', plan: { $in: ['PRO_MONTHLY', 'PRO_ANNUAL'] } }),
      Payment.countDocuments({ status: 'SUCCESS' }),
      Payment.aggregate([
        { $match: { status: 'SUCCESS' } },
        { $group: { _id: null, totalKobo: { $sum: '$amountKobo' } } },
      ]),
      User.find()
        .sort({ createdAt: -1 })
        .limit(6)
        .select('fullName email role accountStatus isVerified createdAt')
        .lean(),
    ]);

    const totalRevenueNGN = revenueResult.length > 0 ? Math.round(revenueResult[0].totalKobo / 100) : 0;

    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        totalStudents,
        totalAdmins,
        totalQuestions,
        totalPublishedQuestions,
        totalExams,
        totalSubjects,
        totalTopics,
        totalStudyMaterials,
        totalAttempts,
        activePaidSubscriptions,
        successfulPayments,
        totalRevenueNGN,
        recentUsers,
      },
    });
  } catch (error) {
    next(error);
  }
});

// ----------------------------------------------------
// 2. USER DIRECTORY & ACCESS GOVERNANCE
// ----------------------------------------------------
router.get('/users', async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { page = '1', limit = '15', search = '', role, status } = req.query;

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string, 10) || 15));
    const skip = (pageNum - 1) * limitNum;

    const filter: any = {};
    if (role && (role === 'STUDENT' || role === 'ADMIN')) filter.role = role;
    if (status && ['ACTIVE', 'SUSPENDED', 'LOCKED'].includes(status as string)) filter.accountStatus = status;

    if (search && typeof search === 'string' && search.trim()) {
      filter.$or = [
        { fullName: { $regex: search.trim(), $options: 'i' } },
        { email: { $regex: search.trim(), $options: 'i' } },
      ];
    }

    const [users, total] = await Promise.all([
      User.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .select('-passwordHash')
        .populate('targetExam', 'shortCode name')
        .lean(),
      User.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limitNum);

    res.status(200).json({
      success: true,
      data: {
        users,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages,
          hasNextPage: pageNum < totalPages,
          hasPrevPage: pageNum > 1,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/admin/users/:id/toggle-role — Toggle role with safeguard for last admin
router.post('/users/:id/toggle-role', async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const rawId = req.params.id;
    const targetUserId = Array.isArray(rawId) ? rawId[0] : rawId;

    const user = await User.findById(targetUserId);
    if (!user) {
      res.status(404).json({ success: false, error: { message: 'User not found.' } });
      return;
    }

    // Safeguard: Demoting an admin requires checking that at least one other active admin remains
    if (user.role === 'ADMIN') {
      const adminCount = await User.countDocuments({ role: 'ADMIN', accountStatus: 'ACTIVE' });
      if (adminCount <= 1) {
        res.status(400).json({
          success: false,
          error: { message: 'Security Safeguard: Cannot demote the last remaining active system administrator.' },
        });
        return;
      }
    }

    user.role = user.role === 'ADMIN' ? 'STUDENT' : 'ADMIN';
    await user.save();

    res.status(200).json({
      success: true,
      message: `User role updated to ${user.role}.`,
      data: { userId: user._id, role: user.role },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/admin/users/:id/status — Toggle account status (ACTIVE / SUSPENDED)
router.post('/users/:id/status', async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const rawId = req.params.id;
    const targetUserId = Array.isArray(rawId) ? rawId[0] : rawId;
    const { status } = req.body;

    if (!['ACTIVE', 'SUSPENDED', 'LOCKED'].includes(status)) {
      res.status(400).json({ success: false, error: { message: 'Invalid status value.' } });
      return;
    }

    const user = await User.findById(targetUserId);
    if (!user) {
      res.status(404).json({ success: false, error: { message: 'User not found.' } });
      return;
    }

    // Safeguard: Cannot suspend the current executing admin
    if (user._id.toString() === req.user!._id.toString() && status !== 'ACTIVE') {
      res.status(400).json({ success: false, error: { message: 'Cannot suspend your own account.' } });
      return;
    }

    user.accountStatus = status;
    await user.save();

    res.status(200).json({
      success: true,
      message: `User status changed to ${status}.`,
      data: { userId: user._id, accountStatus: user.accountStatus },
    });
  } catch (error) {
    next(error);
  }
});

// ----------------------------------------------------
// 3. EXAMS CRUD
// ----------------------------------------------------
const examSchema = z.object({
  name: z.string().min(2),
  shortCode: z.string().min(2).max(10).toUpperCase(),
  slug: z.string().optional(),
  description: z.string().default(''),
  category: z.enum(['NATIONAL', 'REGIONAL', 'PROFESSIONAL']).default('NATIONAL'),
  totalSubjects: z.number().default(0),
  syllabusYear: z.string().default('2025/2026'),
  isPublished: z.boolean().default(true),
});

router.post('/exams', async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = examSchema.parse(req.body);
    const slug = data.slug || data.shortCode.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const existing = await Exam.findOne({ $or: [{ shortCode: data.shortCode }, { slug }] });
    if (existing) {
      res.status(409).json({ success: false, error: { message: `Exam with shortCode ${data.shortCode} or slug ${slug} already exists.` } });
      return;
    }
    const exam = await Exam.create({ ...data, slug });
    metadataCache.clear();
    res.status(201).json({ success: true, message: 'Examination created successfully.', data: exam });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: { message: 'Validation failed', details: error.flatten().fieldErrors } });
      return;
    }
    next(error);
  }
});

router.put('/exams/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const rawId = req.params.id;
    const examId = Array.isArray(rawId) ? rawId[0] : rawId;
    const data = examSchema.partial().parse(req.body);

    const updated = await Exam.findByIdAndUpdate(examId, data, { new: true });
    if (!updated) {
      res.status(404).json({ success: false, error: { message: 'Exam not found.' } });
      return;
    }
    metadataCache.clear();
    res.status(200).json({ success: true, message: 'Examination updated successfully.', data: updated });
  } catch (error) {
    next(error);
  }
});

router.delete('/exams/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const rawId = req.params.id;
    const examId = Array.isArray(rawId) ? rawId[0] : rawId;

    const deleted = await Exam.findByIdAndDelete(examId);
    if (!deleted) {
      res.status(404).json({ success: false, error: { message: 'Exam not found.' } });
      return;
    }
    metadataCache.clear();
    res.status(200).json({ success: true, message: 'Examination deleted successfully.' });
  } catch (error) {
    next(error);
  }
});

// ----------------------------------------------------
// 4. SUBJECTS CRUD
// ----------------------------------------------------
const subjectSchema = z.object({
  examId: z.string().min(1),
  name: z.string().min(2),
  code: z.string().min(2).max(10).toUpperCase(),
  description: z.string().default(''),
});

router.post('/subjects', async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = subjectSchema.parse(req.body);
    const exam = await Exam.findById(data.examId);
    if (!exam) {
      res.status(400).json({ success: false, error: { message: 'Referenced examination board does not exist.' } });
      return;
    }
    const subject = await Subject.create(data);
    res.status(201).json({ success: true, message: 'Subject created successfully.', data: subject });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: { message: 'Validation failed', details: error.flatten().fieldErrors } });
      return;
    }
    next(error);
  }
});

router.put('/subjects/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const rawId = req.params.id;
    const subjectId = Array.isArray(rawId) ? rawId[0] : rawId;
    const data = subjectSchema.partial().parse(req.body);

    const updated = await Subject.findByIdAndUpdate(subjectId, data, { new: true });
    if (!updated) {
      res.status(404).json({ success: false, error: { message: 'Subject not found.' } });
      return;
    }
    res.status(200).json({ success: true, message: 'Subject updated successfully.', data: updated });
  } catch (error) {
    next(error);
  }
});

router.delete('/subjects/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const rawId = req.params.id;
    const subjectId = Array.isArray(rawId) ? rawId[0] : rawId;

    const deleted = await Subject.findByIdAndDelete(subjectId);
    if (!deleted) {
      res.status(404).json({ success: false, error: { message: 'Subject not found.' } });
      return;
    }
    res.status(200).json({ success: true, message: 'Subject deleted successfully.' });
  } catch (error) {
    next(error);
  }
});

// ----------------------------------------------------
// 5. TOPICS CRUD
// ----------------------------------------------------
const topicSchema = z.object({
  subjectId: z.string().min(1),
  name: z.string().min(2),
  order: z.number().default(1),
  description: z.string().default(''),
});

router.post('/topics', async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = topicSchema.parse(req.body);
    const subject = await Subject.findById(data.subjectId);
    if (!subject) {
      res.status(400).json({ success: false, error: { message: 'Referenced Subject does not exist.' } });
      return;
    }
    const topic = await Topic.create(data);
    res.status(201).json({ success: true, message: 'Syllabus topic created successfully.', data: topic });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: { message: 'Validation failed', details: error.flatten().fieldErrors } });
      return;
    }
    next(error);
  }
});

router.delete('/topics/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const rawId = req.params.id;
    const topicId = Array.isArray(rawId) ? rawId[0] : rawId;

    const deleted = await Topic.findByIdAndDelete(topicId);
    if (!deleted) {
      res.status(404).json({ success: false, error: { message: 'Topic not found.' } });
      return;
    }
    res.status(200).json({ success: true, message: 'Syllabus topic deleted successfully.' });
  } catch (error) {
    next(error);
  }
});

// ----------------------------------------------------
// 6. QUESTION BANK CRUD
// ----------------------------------------------------
const questionSchema = z.object({
  examId: z.string().min(1),
  subjectId: z.string().min(1),
  topicId: z.string().optional(),
  year: z.number().int().min(1980).max(2030),
  questionNumber: z.number().int().min(1),
  questionText: z.string().min(5),
  optionA: z.string().min(1),
  optionB: z.string().min(1),
  optionC: z.string().min(1),
  optionD: z.string().min(1),
  correctAnswer: z.enum(['A', 'B', 'C', 'D']),
  explanation: z.string().default(''),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']).default('MEDIUM'),
  published: z.boolean().default(true),
});

router.post('/questions', async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = questionSchema.parse(req.body);
    const [exam, subject] = await Promise.all([
      Exam.findById(data.examId),
      Subject.findById(data.subjectId),
    ]);

    if (!exam || !subject) {
      res.status(400).json({ success: false, error: { message: 'Referenced Exam or Subject does not exist.' } });
      return;
    }

    const question = await Question.create(data);
    res.status(201).json({ success: true, message: 'Question created successfully.', data: question });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: { message: 'Validation failed', details: error.flatten().fieldErrors } });
      return;
    }
    next(error);
  }
});

router.put('/questions/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const rawId = req.params.id;
    const questionId = Array.isArray(rawId) ? rawId[0] : rawId;
    const data = questionSchema.partial().parse(req.body);

    const updated = await Question.findByIdAndUpdate(questionId, data, { new: true });
    if (!updated) {
      res.status(404).json({ success: false, error: { message: 'Question not found.' } });
      return;
    }
    res.status(200).json({ success: true, message: 'Question updated successfully.', data: updated });
  } catch (error) {
    next(error);
  }
});

router.delete('/questions/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const rawId = req.params.id;
    const questionId = Array.isArray(rawId) ? rawId[0] : rawId;

    const deleted = await Question.findByIdAndDelete(questionId);
    if (!deleted) {
      res.status(404).json({ success: false, error: { message: 'Question not found.' } });
      return;
    }
    res.status(200).json({ success: true, message: 'Question deleted successfully.' });
  } catch (error) {
    next(error);
  }
});

// ----------------------------------------------------
// 7. DYNAMIC QUESTION SYNCHRONIZATION & INGESTION
// ----------------------------------------------------

// GET /api/admin/questions/sync-status — Get current background scheduler status and recent telemetry
router.get('/questions/sync-status', async (_req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const status = await questionSyncScheduler.getStatus();
    const recentLogs = await QuestionSyncLog.find()
      .sort({ startedAt: -1 })
      .limit(10)
      .lean();

    res.status(200).json({
      success: true,
      data: {
        ...status,
        recentLogs,
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/admin/questions/sync — Trigger on-demand manual synchronization
const manualSyncSchema = z.object({
  examShortCode: z.string().optional(),
  subjectCode: z.string().optional(),
  year: z.number().int().optional(),
  batchSize: z.number().int().min(1).max(200).optional(),
});

router.post('/questions/sync', async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const params = manualSyncSchema.parse(req.body);

    if (params.examShortCode || params.subjectCode) {
      // Sync specific exam / subject
      const adapter = new AuthorizedApiAdapter();
      const result = await QuestionIngestionService.ingestFromAdapter(
        adapter,
        {
          examShortCode: params.examShortCode,
          subjectCode: params.subjectCode,
          year: params.year,
          limit: params.batchSize || 50,
        },
        'MANUAL_ADMIN'
      );

      res.status(200).json({
        success: true,
        message: `Sync completed. ${result.totalInserted} questions added, ${result.totalUpdated} updated, ${result.totalSkipped} skipped.`,
        data: result,
      });
      return;
    }

    // Run full scheduler cycle
    const result = await questionSyncScheduler.runSyncJob('MANUAL_ADMIN');
    res.status(result.success ? 200 : 400).json({
      success: result.success,
      message: result.message,
      data: result.stats,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: { message: 'Validation failed', details: error.flatten().fieldErrors } });
      return;
    }
    next(error);
  }
});

// POST /api/admin/questions/sync-toggle — Enable or disable scheduled background synchronization
router.post('/questions/sync-toggle', async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { enabled } = z.object({ enabled: z.boolean() }).parse(req.body);
    const newState = questionSyncScheduler.setEnabled(enabled);

    res.status(200).json({
      success: true,
      message: `Automatic question synchronization is now ${newState ? 'ENABLED' : 'DISABLED'}.`,
      data: { enabled: newState },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: { message: 'Validation failed', details: error.flatten().fieldErrors } });
      return;
    }
    next(error);
  }
});

// POST /api/admin/questions/import — Secure manual file dataset import (CSV or JSON)
const importSchema = z.object({
  fileContent: z.string().min(10, 'File content is required'),
  fileType: z.enum(['csv', 'json']),
  defaultExam: z.string().optional(),
  defaultSubject: z.string().optional(),
});

router.post('/questions/import', async (req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> => {
  try {
    const data = importSchema.parse(req.body);

    const result = await QuestionIngestionService.ingestFromFile(
      data.fileContent,
      data.fileType,
      {
        defaultExam: data.defaultExam,
        defaultSubject: data.defaultSubject,
      }
    );

    res.status(200).json({
      success: true,
      message: `Dataset import processed: ${result.totalInserted} new questions added, ${result.totalUpdated} updated, ${result.totalSkipped} skipped, ${result.totalFailed} quarantined.`,
      data: result,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: { message: 'Validation failed', details: error.flatten().fieldErrors } });
      return;
    }
    res.status(400).json({ success: false, error: { message: error.message || 'Dataset import failed.' } });
  }
});

// GET /api/admin/questions/review-queue — View questions awaiting review or publication
router.get('/questions/review-queue', async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { status = 'IMPORTED', page = '1', limit = '20' } = req.query;
    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const filter: any = { reviewStatus: status };

    const [questions, total] = await Promise.all([
      Question.find(filter)
        .populate('examId', 'name shortCode')
        .populate('subjectId', 'name code')
        .populate('topicId', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Question.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: {
        questions,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/admin/questions/:id/review — Admin action on question status
const reviewActionSchema = z.object({
  action: z.enum(['APPROVE', 'REJECT', 'PUBLISH', 'UNPUBLISH', 'ARCHIVE']),
  reviewNotes: z.string().optional(),
});

router.post('/questions/:id/review', async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const rawId = req.params.id;
    const questionId = Array.isArray(rawId) ? rawId[0] : rawId;
    const { action, reviewNotes } = reviewActionSchema.parse(req.body);

    const question = await Question.findById(questionId);
    if (!question) {
      res.status(404).json({ success: false, error: { message: 'Question not found.' } });
      return;
    }

    switch (action) {
      case 'APPROVE':
        question.reviewStatus = 'APPROVED';
        break;
      case 'PUBLISH':
        question.reviewStatus = 'PUBLISHED';
        question.published = true;
        break;
      case 'UNPUBLISH':
        question.published = false;
        break;
      case 'REJECT':
        question.reviewStatus = 'REJECTED';
        question.published = false;
        break;
      case 'ARCHIVE':
        question.reviewStatus = 'ARCHIVED';
        question.published = false;
        break;
    }

    if (reviewNotes) question.reviewNotes = reviewNotes;
    await question.save();

    res.status(200).json({
      success: true,
      message: `Question updated to status '${question.reviewStatus}' (published: ${question.published}).`,
      data: question,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: { message: 'Validation failed', details: error.flatten().fieldErrors } });
      return;
    }
    next(error);
  }
});

export default router;

