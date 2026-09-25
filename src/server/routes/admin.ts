import { Router, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { z } from 'zod';
import fs from 'fs';
import path from 'path';
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
import { SystemSetting } from '../models/SystemSetting.js';
import { Institution } from '../models/Institution.js';
import { Course } from '../models/Course.js';
import { BlogPost } from '../models/BlogPost.js';
import { Testimonial } from '../models/Testimonial.js';
import { VideoLesson } from '../models/VideoLesson.js';
import { Flashcard } from '../models/Flashcard.js';
import { SupportTicket } from '../models/SupportTicket.js';
import { authenticateToken, requireAdmin, AuthenticatedRequest } from '../middleware/auth.js';
import { STORAGE_DIR_ABSOLUTE, RECEIPTS_DIR_ABSOLUTE } from '../middleware/upload.js';
import { QuestionIngestionService } from '../services/questionIngestionService.js';
import { questionSyncScheduler } from '../services/questionSyncScheduler.js';
import { CompositeQuestionSourceAdapter } from '../services/questionSourceAdapter.js';
import { metadataCache } from '../utils/cache.js';
import { sendSubscriptionEmail, sendSupportComplaintNotificationEmail } from '../services/emailService.js';
import { SUBSCRIPTION_PLANS, getDynamicBankDetails } from './subscriptions.js';
import { getDynamicSupportConfig } from '../services/supportConfigService.js';

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
      totalInstitutions,
      totalCourses,
      totalBlogArticles,
      totalTestimonials,
      totalVideos,
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
      Institution.countDocuments(),
      Course.countDocuments(),
      BlogPost.countDocuments(),
      Testimonial.countDocuments(),
      VideoLesson.countDocuments(),
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
        totalInstitutions,
        totalCourses,
        totalBlogArticles,
        totalTestimonials,
        totalVideos,
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
  year: z.coerce.number().int().optional(),
  count: z.coerce.number().int().optional(),
  batchSize: z.coerce.number().int().min(1).max(200).optional(),
});

router.post('/questions/sync', async (req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> => {
  try {
    const params = manualSyncSchema.parse(req.body);

    if (params.examShortCode || params.subjectCode) {
      // Sync specific exam / subject using Composite adapter (falls back to verified curriculum feed)
      const adapter = new CompositeQuestionSourceAdapter();
      const result = await QuestionIngestionService.ingestFromAdapter(
        adapter,
        {
          examShortCode: params.examShortCode,
          subjectCode: params.subjectCode,
          year: params.year,
          limit: params.batchSize || params.count || 50,
        },
        'MANUAL_ADMIN',
        {
          autoPublish: true,
          defaultReviewStatus: 'PUBLISHED',
        }
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
    res.status(200).json({
      success: result.success,
      message: result.message,
      data: result.stats,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: { message: 'Validation failed', details: error.flatten().fieldErrors } });
      return;
    }
    console.error('[Admin Question Sync Error]:', error);
    res.status(400).json({
      success: false,
      error: { message: error?.message || 'Question synchronization failed.' },
    });
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

// ----------------------------------------------------
// 7. MANUAL BANK TRANSFER PAYMENT PROOF OVERSIGHT
// ----------------------------------------------------

// GET /api/admin/payments/manual-proofs — Paginated manual transfer submissions
router.get('/payments/manual-proofs', async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { status, page = '1', limit = '20' } = req.query;
    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const filter: Record<string, any> = { provider: 'MANUAL_BANK_TRANSFER' };
    if (status && typeof status === 'string' && status !== 'ALL') {
      filter.status = status;
    }

    const [payments, total] = await Promise.all([
      Payment.find(filter)
        .populate('userId', 'fullName email isVerified role')
        .populate('reviewedBy', 'fullName email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Payment.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: {
        payments,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.max(1, Math.ceil(total / limitNum)),
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/admin/payments/:id/approve — Verify manual bank transfer and activate Pro tier
router.post('/payments/:id/approve', async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const rawId = req.params.id;
    const paymentId = Array.isArray(rawId) ? rawId[0] : rawId;
    const adminUser = req.user!;

    const payment = await Payment.findById(paymentId);
    if (!payment) {
      res.status(404).json({ success: false, error: { message: 'Payment record not found.' } });
      return;
    }

    if (payment.status === 'SUCCESS') {
      res.status(400).json({ success: false, error: { message: 'Payment has already been approved and activated.' } });
      return;
    }

    const plan = payment.metadata?.plan || 'PRO_MONTHLY';
    const durationDays = plan === 'PRO_ANNUAL' ? 365 : 30;
    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + durationDays * 24 * 60 * 60 * 1000);

    // Create or update subscription record
    let subscription = await Subscription.findOne({ userId: payment.userId });
    if (subscription) {
      subscription.plan = plan;
      subscription.status = 'ACTIVE';
      subscription.startDate = startDate;
      subscription.endDate = endDate;
      await subscription.save();
    } else {
      subscription = await Subscription.create({
        userId: payment.userId,
        plan,
        status: 'ACTIVE',
        startDate,
        endDate,
      });
    }

    // Mark payment success with reviewer audit trail
    payment.status = 'SUCCESS';
    payment.subscriptionId = subscription._id;
    payment.paidAt = new Date();
    payment.reviewedBy = adminUser._id;
    payment.reviewedAt = new Date();
    if (req.body.adminReviewNotes) {
      payment.adminReviewNotes = String(req.body.adminReviewNotes).trim();
    }
    await payment.save();

    // Fetch user for confirmation email
    const studentUser = await User.findById(payment.userId);
    if (studentUser) {
      const planConfig = SUBSCRIPTION_PLANS.find((p) => p.id === plan);
      sendSubscriptionEmail(
        studentUser.email,
        studentUser.fullName,
        planConfig?.name || plan,
        Math.round(payment.amountKobo / 100),
        payment.reference
      );
    }

    res.status(200).json({
      success: true,
      message: `Payment proof approved successfully. Student account activated on ${plan} tier.`,
      data: {
        paymentId: payment._id,
        reference: payment.reference,
        status: payment.status,
        plan,
        expiresAt: endDate,
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/admin/payments/:id/reject — Reject manual payment proof with feedback notes
router.post('/payments/:id/reject', async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const rawId = req.params.id;
    const paymentId = Array.isArray(rawId) ? rawId[0] : rawId;
    const adminUser = req.user!;
    const { reviewNotes } = z
      .object({ reviewNotes: z.string().trim().min(3, 'Rejection reason must be at least 3 characters') })
      .parse(req.body);

    const payment = await Payment.findById(paymentId);
    if (!payment) {
      res.status(404).json({ success: false, error: { message: 'Payment record not found.' } });
      return;
    }

    if (payment.status === 'SUCCESS') {
      res.status(400).json({ success: false, error: { message: 'Cannot reject a payment that has already been approved.' } });
      return;
    }

    payment.status = 'REJECTED';
    payment.adminReviewNotes = reviewNotes;
    payment.reviewedBy = adminUser._id;
    payment.reviewedAt = new Date();
    await payment.save();

    res.status(200).json({
      success: true,
      message: 'Payment proof rejected. Rejection reason recorded.',
      data: {
        paymentId: payment._id,
        reference: payment.reference,
        status: payment.status,
        reviewNotes,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: { message: 'Validation failed', details: error.flatten().fieldErrors } });
      return;
    }
    next(error);
  }
});

// ----------------------------------------------------
// 12. PHYSICAL RECEIVING BANK ACCOUNT MANAGEMENT
// ----------------------------------------------------
const bankDetailsUpdateSchema = z.object({
  bankName: z
    .string()
    .trim()
    .min(2, 'Bank name must be at least 2 characters')
    .max(100, 'Bank name cannot exceed 100 characters')
    .regex(/^[^<>{}$`]+$/, 'Bank name contains invalid characters'),
  accountName: z
    .string()
    .trim()
    .min(2, 'Account name must be at least 2 characters')
    .max(100, 'Account name cannot exceed 100 characters')
    .regex(/^[^<>{}$`]+$/, 'Account name contains invalid characters'),
  accountNumber: z
    .string()
    .trim()
    .min(5, 'Account number must be at least 5 digits')
    .max(20, 'Account number cannot exceed 20 digits')
    .regex(/^[0-9]+$/, 'Account number must consist only of digits'),
  currency: z.string().trim().max(5).default('NGN'),
  instructions: z
    .string()
    .trim()
    .max(500, 'Instructions cannot exceed 500 characters')
    .default('Use your registered MarkDriller email address as the payment narration or transfer remark.'),
});

// GET /api/admin/bank-details — Fetch current dynamic bank account details
router.get('/bank-details', async (_req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const details = await getDynamicBankDetails();
    res.status(200).json({ success: true, data: details });
  } catch (error) {
    next(error);
  }
});

// PUT /api/admin/bank-details — Only administrator can update receiving bank account
router.put('/bank-details', async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = bankDetailsUpdateSchema.parse(req.body);
    const adminUserId = req.user!._id;

    const setting = await SystemSetting.findOneAndUpdate(
      { key: 'OFFICIAL_BANK_DETAILS' },
      {
        value: data,
        description: 'Official physical receiving bank account for direct candidate wire transfers and scratch card bulk payments',
        updatedBy: adminUserId,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.status(200).json({
      success: true,
      message: 'Official physical receiving bank account updated successfully.',
      data: setting.value,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: { message: 'Validation failed', details: error.flatten().fieldErrors } });
      return;
    }
    next(error);
  }
});

// ----------------------------------------------------
// 7B. CUSTOMER SUPPORT CONFIGURATION MANAGEMENT
// ----------------------------------------------------
const supportSettingsUpdateSchema = z.object({
  whatsappNumber: z
    .string()
    .trim()
    .min(7, 'WhatsApp number must be at least 7 digits')
    .max(25, 'WhatsApp number is too long')
    .regex(/^[0-9+() -]{7,25}$/, 'Invalid WhatsApp phone format'),
  whatsappDisplay: z.string().trim().max(50).optional().default(''),
  whatsappEnabled: z.boolean().optional().default(true),
  phone: z
    .string()
    .trim()
    .min(7, 'Phone number must be at least 7 digits')
    .max(25, 'Phone number is too long')
    .regex(/^[0-9+() -]{7,25}$/, 'Invalid phone format'),
  phoneDisplay: z.string().trim().max(50).optional().default(''),
  phoneEnabled: z.boolean().optional().default(true),
  email: z.string().trim().email('Invalid support email address').max(100),
  emailDisplay: z.string().trim().max(100).optional().default(''),
  emailEnabled: z.boolean().optional().default(true),
  workingHours: z.string().trim().max(120).optional().default('Mon – Sat: 8:00 AM – 8:00 PM WAT'),
});

// GET /api/admin/support-settings — Fetch current dynamic customer support settings
router.get('/support-settings', async (_req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const config = await getDynamicSupportConfig();
    res.status(200).json({ success: true, data: config });
  } catch (error) {
    next(error);
  }
});

// PUT /api/admin/support-settings — Administrator updates customer support channels
router.put('/support-settings', async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = supportSettingsUpdateSchema.parse(req.body);
    const adminUserId = req.user!._id;

    // Normalize WhatsApp number to clean numeric format for wa.me URL generation
    const normalizedWhatsApp = data.whatsappNumber.replace(/[^0-9]/g, '');

    const sanitizedData = {
      whatsappNumber: normalizedWhatsApp,
      whatsappDisplay: data.whatsappDisplay || data.whatsappNumber,
      whatsappEnabled: data.whatsappEnabled,
      phone: data.phone.trim(),
      phoneDisplay: data.phoneDisplay || data.phone.trim(),
      phoneEnabled: data.phoneEnabled,
      email: data.email.trim().toLowerCase(),
      emailDisplay: data.emailDisplay || data.email.trim().toLowerCase(),
      emailEnabled: data.emailEnabled,
      workingHours: data.workingHours.trim(),
    };

    const setting = await SystemSetting.findOneAndUpdate(
      { key: 'CUSTOMER_SUPPORT_CONFIG' },
      {
        value: sanitizedData,
        description: 'Official MarkDriller customer support channels and contact numbers',
        updatedBy: adminUserId,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.status(200).json({
      success: true,
      message: 'Customer support channels updated successfully.',
      data: setting.value,
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

// ----------------------------------------------------
// 8. INSTITUTIONS & COURSES MANAGEMENT
// ----------------------------------------------------
const institutionSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  shortCode: z.string().min(2, 'Short code is required'),
  type: z.enum(['FEDERAL_UNI', 'STATE_UNI', 'PRIVATE_UNI', 'POLYTECHNIC', 'COLLEGE_OF_ED']),
  state: z.string().min(2, 'State is required'),
  founded: z.coerce.number().int().min(1900).max(2030),
  minJambCutoff: z.coerce.number().int().min(100).max(400),
  popularCourses: z.array(z.string()).default([]),
  facultiesCount: z.coerce.number().int().min(1).default(1),
  website: z.string().optional().default(''),
  admissionNote: z.string().optional().default(''),
  isPublished: z.boolean().default(true),
});

router.get('/institutions', async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { page = '1', limit = '20', search, type, state } = req.query;
    const filter: Record<string, any> = {};
    if (type && type !== 'ALL') filter.type = type;
    if (state && state !== 'ALL') filter.state = new RegExp(String(state), 'i');
    if (search) {
      const sanitized = String(search).trim().slice(0, 60);
      filter.$or = [
        { name: { $regex: sanitized, $options: 'i' } },
        { shortCode: { $regex: sanitized, $options: 'i' } },
      ];
    }

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const [institutions, total] = await Promise.all([
      Institution.find(filter).sort({ name: 1 }).skip(skip).limit(limitNum).lean(),
      Institution.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: {
        institutions,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.max(1, Math.ceil(total / limitNum)),
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

router.post('/institutions', async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = institutionSchema.parse(req.body);
    const created = await Institution.create({
      ...data,
      shortCode: data.shortCode.toUpperCase().trim(),
    });
    res.status(201).json({ success: true, data: created });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: { message: 'Validation failed', details: error.flatten().fieldErrors } });
      return;
    }
    next(error);
  }
});

router.put('/institutions/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const rawId = req.params.id;
    const id = Array.isArray(rawId) ? rawId[0] : rawId;
    const updated = await Institution.findByIdAndUpdate(id, req.body, { new: true });
    if (!updated) {
      res.status(404).json({ success: false, error: { message: 'Institution not found.' } });
      return;
    }
    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
});

router.delete('/institutions/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const rawId = req.params.id;
    const id = Array.isArray(rawId) ? rawId[0] : rawId;
    const deleted = await Institution.findByIdAndDelete(id);
    if (!deleted) {
      res.status(404).json({ success: false, error: { message: 'Institution not found.' } });
      return;
    }
    await Course.deleteMany({ institutionId: id });
    res.status(200).json({ success: true, message: 'Institution and associated courses deleted successfully.' });
  } catch (error) {
    next(error);
  }
});

const courseSchema = z.object({
  institutionId: z.string().min(1, 'Institution ID is required'),
  name: z.string().min(2, 'Course name is required'),
  faculty: z.string().min(2, 'Faculty is required'),
  jambCutoff: z.coerce.number().int().min(100).max(400),
  utmeSubjectRequirements: z.array(z.string()).min(1, 'At least one subject requirement is required'),
  directEntryRequirements: z.string().optional().default(''),
  careerOpportunities: z.array(z.string()).default([]),
  isAvailable: z.boolean().default(true),
});

router.get('/courses', async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { institutionId, page = '1', limit = '50' } = req.query;
    const filter: Record<string, any> = {};
    if (institutionId) filter.institutionId = institutionId;

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 50));
    const skip = (pageNum - 1) * limitNum;

    const [courses, total] = await Promise.all([
      Course.find(filter).populate('institutionId', 'name shortCode').sort({ name: 1 }).skip(skip).limit(limitNum).lean(),
      Course.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: {
        courses,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.max(1, Math.ceil(total / limitNum)),
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

router.post('/courses', async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = courseSchema.parse(req.body);
    const created = await Course.create(data);
    res.status(201).json({ success: true, data: created });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: { message: 'Validation failed', details: error.flatten().fieldErrors } });
      return;
    }
    next(error);
  }
});

router.put('/courses/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const rawId = req.params.id;
    const id = Array.isArray(rawId) ? rawId[0] : rawId;
    const updated = await Course.findByIdAndUpdate(id, req.body, { new: true });
    if (!updated) {
      res.status(404).json({ success: false, error: { message: 'Course not found.' } });
      return;
    }
    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
});

router.delete('/courses/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const rawId = req.params.id;
    const id = Array.isArray(rawId) ? rawId[0] : rawId;
    const deleted = await Course.findByIdAndDelete(id);
    if (!deleted) {
      res.status(404).json({ success: false, error: { message: 'Course not found.' } });
      return;
    }
    res.status(200).json({ success: true, message: 'Course deleted successfully.' });
  } catch (error) {
    next(error);
  }
});

// ----------------------------------------------------
// 9. BLOG & EDITORIAL MANAGEMENT
// ----------------------------------------------------
const blogSchema = z.object({
  title: z.string().min(3, 'Title is required'),
  slug: z.string().min(2).optional(),
  category: z.enum([
    'JAMB_GUIDES',
    'WAEC_INSIGHTS',
    'NECO_EXCELLENCE',
    'GCE_PREP',
    'NABTEB_STRATEGY',
    'POST_UTME',
    'STUDY_TECHNIQUES',
  ]),
  examBoard: z
    .enum(['JAMB', 'WAEC', 'NECO', 'GCE', 'NABTEB', 'POST-UTME', 'GENERAL'])
    .optional()
    .default('GENERAL'),
  author: z.string().min(2, 'Author is required'),
  authorRole: z.string().min(2, 'Author role is required'),
  publishedDate: z.string().optional(),
  readTime: z.string().optional().default('5 min read'),
  summary: z.string().min(5, 'Summary is required'),
  content: z.array(z.string()).min(1, 'At least one content paragraph is required'),
  tags: z.array(z.string()).default([]),
  imageUrl: z.string().optional().default(''),
  imageCaption: z.string().optional().default(''),
  keyTakeaways: z.array(z.string()).optional().default([]),
  isPublished: z.boolean().default(true),
});

router.get('/blog', async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { page = '1', limit = '20', category, examBoard } = req.query;
    const filter: Record<string, any> = {};
    if (category && category !== 'ALL') filter.category = category;
    if (examBoard && examBoard !== 'ALL') filter.examBoard = examBoard;

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const [articles, total] = await Promise.all([
      BlogPost.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limitNum).lean(),
      BlogPost.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: {
        articles,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.max(1, Math.ceil(total / limitNum)),
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

router.post('/blog', async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = blogSchema.parse(req.body);
    const slug = data.slug || data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const publishedDate = data.publishedDate || new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

    const created = await BlogPost.create({
      ...data,
      slug,
      publishedDate,
    });
    res.status(201).json({ success: true, data: created });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: { message: 'Validation failed', details: error.flatten().fieldErrors } });
      return;
    }
    next(error);
  }
});

router.put('/blog/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const rawId = req.params.id;
    const id = Array.isArray(rawId) ? rawId[0] : rawId;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, error: { message: 'Invalid article ID' } });
      return;
    }
    const validatedData = blogSchema.partial().parse(req.body);
    const updated = await BlogPost.findByIdAndUpdate(id, validatedData, { new: true, runValidators: true });
    if (!updated) {
      res.status(404).json({ success: false, error: { message: 'Article not found.' } });
      return;
    }
    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: { message: 'Validation failed', details: error.flatten().fieldErrors } });
      return;
    }
    next(error);
  }
});

router.delete('/blog/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const rawId = req.params.id;
    const id = Array.isArray(rawId) ? rawId[0] : rawId;
    const deleted = await BlogPost.findByIdAndDelete(id);
    if (!deleted) {
      res.status(404).json({ success: false, error: { message: 'Article not found.' } });
      return;
    }
    res.status(200).json({ success: true, message: 'Article deleted successfully.' });
  } catch (error) {
    next(error);
  }
});

// ----------------------------------------------------
// 10. TESTIMONIALS MANAGEMENT
// ----------------------------------------------------
const testimonialSchema = z.object({
  studentName: z.string().min(2, 'Student name is required'),
  examTaken: z.string().min(2, 'Exam taken is required'),
  score: z.string().min(1, 'Score is required'),
  year: z.coerce.number().int().default(2025),
  quote: z.string().min(5, 'Quote is required'),
  universityAdmitted: z.string().optional().default(''),
  avatarUrl: z.string().optional().default(''),
  isFeatured: z.boolean().default(true),
  isApproved: z.boolean().default(true),
});

router.get('/testimonials', async (_req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const testimonials = await Testimonial.find().sort({ createdAt: -1 }).lean();
    res.status(200).json({ success: true, data: testimonials });
  } catch (error) {
    next(error);
  }
});

router.post('/testimonials', async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = testimonialSchema.parse(req.body);
    const created = await Testimonial.create(data);
    res.status(201).json({ success: true, data: created });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: { message: 'Validation failed', details: error.flatten().fieldErrors } });
      return;
    }
    next(error);
  }
});

router.put('/testimonials/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const rawId = req.params.id;
    const id = Array.isArray(rawId) ? rawId[0] : rawId;
    const updated = await Testimonial.findByIdAndUpdate(id, req.body, { new: true });
    if (!updated) {
      res.status(404).json({ success: false, error: { message: 'Testimonial not found.' } });
      return;
    }
    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
});

router.delete('/testimonials/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const rawId = req.params.id;
    const id = Array.isArray(rawId) ? rawId[0] : rawId;
    const deleted = await Testimonial.findByIdAndDelete(id);
    if (!deleted) {
      res.status(404).json({ success: false, error: { message: 'Testimonial not found.' } });
      return;
    }
    res.status(200).json({ success: true, message: 'Testimonial deleted successfully.' });
  } catch (error) {
    next(error);
  }
});

// ----------------------------------------------------
// 11. VIDEO LESSONS MANAGEMENT
// ----------------------------------------------------
const videoSchema = z.object({
  title: z.string().min(2, 'Title is required'),
  videoId: z.string().min(3, 'YouTube Video ID is required'),
  duration: z.string().default('15:00'),
  examId: z.string().optional(),
  subjectId: z.string().optional(),
  topicName: z.string().optional().default('General Revision'),
  isPremium: z.boolean().default(false),
  order: z.coerce.number().int().default(0),
  isPublished: z.boolean().default(true),
});

router.get('/videos', async (_req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const videos = await VideoLesson.find()
      .populate('examId', 'name shortCode')
      .populate('subjectId', 'name code')
      .sort({ order: 1, createdAt: 1 })
      .lean();
    res.status(200).json({ success: true, data: videos });
  } catch (error) {
    next(error);
  }
});

router.post('/videos', async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = videoSchema.parse(req.body);
    const created = await VideoLesson.create(data);
    res.status(201).json({ success: true, data: created });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: { message: 'Validation failed', details: error.flatten().fieldErrors } });
      return;
    }
    next(error);
  }
});

router.put('/videos/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const rawId = req.params.id;
    const id = Array.isArray(rawId) ? rawId[0] : rawId;
    const updated = await VideoLesson.findByIdAndUpdate(id, req.body, { new: true });
    if (!updated) {
      res.status(404).json({ success: false, error: { message: 'Video not found.' } });
      return;
    }
    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
});

router.delete('/videos/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const rawId = req.params.id;
    const id = Array.isArray(rawId) ? rawId[0] : rawId;
    const deleted = await VideoLesson.findByIdAndDelete(id);
    if (!deleted) {
      res.status(404).json({ success: false, error: { message: 'Video not found.' } });
      return;
    }
    res.status(200).json({ success: true, message: 'Video deleted successfully.' });
  } catch (error) {
    next(error);
  }
});

// ----------------------------------------------------
// 12. FLASHCARDS MANAGEMENT
// ----------------------------------------------------
const flashcardSchema = z.object({
  examId: z.string().min(1, 'Exam ID is required'),
  subjectId: z.string().min(1, 'Subject ID is required'),
  topicId: z.string().optional(),
  front: z.string().min(2, 'Front prompt is required'),
  back: z.string().min(2, 'Back answer is required'),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']).default('MEDIUM'),
  isPublished: z.boolean().default(true),
});

router.get('/flashcards', async (_req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const flashcards = await Flashcard.find()
      .populate('examId', 'name shortCode')
      .populate('subjectId', 'name code')
      .populate('topicId', 'name')
      .sort({ createdAt: -1 })
      .lean();
    res.status(200).json({ success: true, data: flashcards });
  } catch (error) {
    next(error);
  }
});

router.post('/flashcards', async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = flashcardSchema.parse(req.body);
    const created = await Flashcard.create(data);
    res.status(201).json({ success: true, data: created });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: { message: 'Validation failed', details: error.flatten().fieldErrors } });
      return;
    }
    next(error);
  }
});

router.put('/flashcards/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const rawId = req.params.id;
    const id = Array.isArray(rawId) ? rawId[0] : rawId;
    const updated = await Flashcard.findByIdAndUpdate(id, req.body, { new: true });
    if (!updated) {
      res.status(404).json({ success: false, error: { message: 'Flashcard not found.' } });
      return;
    }
    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
});

router.delete('/flashcards/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const rawId = req.params.id;
    const id = Array.isArray(rawId) ? rawId[0] : rawId;
    const deleted = await Flashcard.findByIdAndDelete(id);
    if (!deleted) {
      res.status(404).json({ success: false, error: { message: 'Flashcard not found.' } });
      return;
    }
    res.status(200).json({ success: true, message: 'Flashcard deleted successfully.' });
  } catch (error) {
    next(error);
  }
});

// ----------------------------------------------------
// 13. SUBSCRIPTIONS DIRECTORY & MANAGEMENT
// ----------------------------------------------------
router.get('/subscriptions', async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { status, plan, page = '1', limit = '20' } = req.query;
    const filter: Record<string, any> = {};
    if (status && status !== 'ALL') filter.status = status;
    if (plan && plan !== 'ALL') filter.plan = plan;

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const [subscriptions, total] = await Promise.all([
      Subscription.find(filter)
        .populate('userId', 'fullName email role isVerified')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Subscription.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: {
        subscriptions,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.max(1, Math.ceil(total / limitNum)),
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

const modifySubscriptionSchema = z.object({
  plan: z.enum(['FREE', 'PRO_MONTHLY', 'PRO_BIMONTHLY', 'PRO_QUARTERLY', 'PRO_ANNUAL']).optional(),
  status: z.enum(['ACTIVE', 'EXPIRED', 'CANCELLED']).optional(),
  extendDays: z.number().int().optional(),
});

router.post('/subscriptions/:id/modify', async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const rawId = req.params.id;
    const id = Array.isArray(rawId) ? rawId[0] : rawId;
    const data = modifySubscriptionSchema.parse(req.body);

    const sub = await Subscription.findById(id);
    if (!sub) {
      res.status(404).json({ success: false, error: { message: 'Subscription not found.' } });
      return;
    }

    if (data.plan) sub.plan = data.plan;
    if (data.status) sub.status = data.status;
    if (data.extendDays && data.extendDays > 0) {
      const currentEnd = sub.endDate && new Date(sub.endDate) > new Date() ? new Date(sub.endDate) : new Date();
      sub.endDate = new Date(currentEnd.getTime() + data.extendDays * 24 * 60 * 60 * 1000);
      sub.status = 'ACTIVE';
    }

    await sub.save();
    res.status(200).json({ success: true, message: 'Subscription modified successfully.', data: sub });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: { message: 'Validation failed', details: error.flatten().fieldErrors } });
      return;
    }
    next(error);
  }
});

// ----------------------------------------------------
// 14. PAYMENTS AUDIT DIRECTORY
// ----------------------------------------------------
router.get('/payments', async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { status, provider, page = '1', limit = '20' } = req.query;
    const filter: Record<string, any> = {};
    if (status && status !== 'ALL') filter.status = status;
    if (provider && provider !== 'ALL') filter.provider = provider;

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const [payments, total] = await Promise.all([
      Payment.find(filter)
        .populate('userId', 'fullName email')
        .populate('reviewedBy', 'fullName email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Payment.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: {
        payments,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.max(1, Math.ceil(total / limitNum)),
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

// ----------------------------------------------------
// 15. MEDIA AUDIT & STORAGE TELEMETRY
// ----------------------------------------------------
router.get('/media', async (_req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const materialsFiles = fs.existsSync(STORAGE_DIR_ABSOLUTE)
      ? fs.readdirSync(STORAGE_DIR_ABSOLUTE).map((file) => {
          const stats = fs.statSync(path.join(STORAGE_DIR_ABSOLUTE, file));
          return {
            filename: file,
            sizeBytes: stats.size,
            createdAt: stats.birthtime,
            type: 'study_material',
          };
        })
      : [];

    const receiptFiles = fs.existsSync(RECEIPTS_DIR_ABSOLUTE)
      ? fs.readdirSync(RECEIPTS_DIR_ABSOLUTE).map((file) => {
          const stats = fs.statSync(path.join(RECEIPTS_DIR_ABSOLUTE, file));
          return {
            filename: file,
            sizeBytes: stats.size,
            createdAt: stats.birthtime,
            type: 'payment_receipt',
          };
        })
      : [];

    const allFiles = [...materialsFiles, ...receiptFiles];
    const totalBytes = allFiles.reduce((acc, f) => acc + f.sizeBytes, 0);

    res.status(200).json({
      success: true,
      data: {
        totalFiles: allFiles.length,
        totalBytes,
        totalMegabytes: Math.round((totalBytes / (1024 * 1024)) * 100) / 100,
        files: allFiles.slice(0, 100),
      },
    });
  } catch (error) {
    next(error);
  }
});

// ----------------------------------------------------
// 16. CUSTOMER SUPPORT TICKETS & COMPLAINTS
// ----------------------------------------------------
router.get('/support/tickets', async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const pageNum = Math.max(1, parseInt((req.query.page as string) || '1', 10));
    const limitNum = Math.min(100, Math.max(1, parseInt((req.query.limit as string) || '20', 10)));
    const status = req.query.status as string;
    const category = req.query.category as string;
    const search = req.query.search as string;

    const filter: any = {};
    if (status && ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'].includes(status)) {
      filter.status = status;
    }
    if (category) {
      filter.category = category;
    }
    if (search && search.trim()) {
      const q = search.trim();
      filter.$or = [
        { ticketReference: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
        { fullName: { $regex: q, $options: 'i' } },
        { subject: { $regex: q, $options: 'i' } },
      ];
    }

    const [tickets, total, totalOpen, totalInProgress, totalResolved, totalClosed, totalFailedEmail] =
      await Promise.all([
        SupportTicket.find(filter)
          .sort({ createdAt: -1 })
          .skip((pageNum - 1) * limitNum)
          .limit(limitNum)
          .lean(),
        SupportTicket.countDocuments(filter),
        SupportTicket.countDocuments({ status: 'OPEN' }),
        SupportTicket.countDocuments({ status: 'IN_PROGRESS' }),
        SupportTicket.countDocuments({ status: 'RESOLVED' }),
        SupportTicket.countDocuments({ status: 'CLOSED' }),
        SupportTicket.countDocuments({ emailDeliveryStatus: 'FAILED' }),
      ]);

    res.status(200).json({
      success: true,
      data: {
        tickets,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.max(1, Math.ceil(total / limitNum)),
        },
        counts: {
          total,
          open: totalOpen,
          inProgress: totalInProgress,
          resolved: totalResolved,
          closed: totalClosed,
          failedEmail: totalFailedEmail,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

const updateTicketSchema = z.object({
  status: z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  adminNotes: z.string().max(2000).optional(),
});

router.patch('/support/tickets/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = updateTicketSchema.parse(req.body);
    const updatePayload: any = { ...data };
    if (data.status === 'RESOLVED') {
      updatePayload.resolvedAt = new Date();
    }

    const ticket = await SupportTicket.findByIdAndUpdate(req.params.id, { $set: updatePayload }, { new: true }).lean();
    if (!ticket) {
      res.status(404).json({ success: false, error: { message: 'Support ticket not found' } });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Support ticket updated successfully',
      data: ticket,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: { message: 'Validation failed', details: error.flatten().fieldErrors } });
      return;
    }
    next(error);
  }
});

router.post('/support/tickets/:id/resend', async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const ticket = await SupportTicket.findById(req.params.id);
    if (!ticket) {
      res.status(404).json({ success: false, error: { message: 'Support ticket not found' } });
      return;
    }

    const supportConfig = await getDynamicSupportConfig();
    const adminSupportEmail =
      supportConfig.email && supportConfig.email.trim()
        ? supportConfig.email.trim()
        : process.env.ADMIN_EMAIL || 'support@markdriller.com';

    const dispatchResult = await sendSupportComplaintNotificationEmail({
      supportRecipientEmail: adminSupportEmail,
      ticketReference: ticket.ticketReference,
      fullName: ticket.fullName,
      email: ticket.email,
      phone: ticket.phone,
      category: ticket.category,
      subject: ticket.subject,
      message: ticket.message,
      priority: ticket.priority,
      userId: ticket.userId?.toString(),
      createdAt: ticket.createdAt,
    });

    ticket.emailDeliveryStatus = dispatchResult.success ? 'SENT' : 'FAILED';
    if (dispatchResult.messageId) ticket.emailMessageId = dispatchResult.messageId;
    if (dispatchResult.error) ticket.emailError = dispatchResult.error;
    ticket.emailRecipient = adminSupportEmail;
    await ticket.save();

    res.status(200).json({
      success: dispatchResult.success,
      message: dispatchResult.success
        ? 'Email delivered successfully to configured support address'
        : 'Email dispatch failed',
      data: {
        emailDeliveryStatus: ticket.emailDeliveryStatus,
        emailMessageId: ticket.emailMessageId,
        emailRecipient: ticket.emailRecipient,
        error: dispatchResult.error,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;



