import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { Exam } from '../models/Exam.js';
import { Subject } from '../models/Subject.js';
import { Topic } from '../models/Topic.js';
import { Question } from '../models/Question.js';
import { User } from '../models/User.js';
import { ExamAttempt } from '../models/ExamAttempt.js';
import { authenticateToken, requireRole, requireVerified, AuthenticatedRequest } from '../middleware/auth.js';
import { metadataCache } from '../utils/cache.js';

const router = Router();

const targetExamSchema = z.object({
  examId: z.string().min(1, 'Exam ID is required'),
  subjectIds: z.array(z.string()).optional(),
});

// GET /api/exams — List all active examination boards (Cached for high throughput)
router.get('/', async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const cacheKey = 'exams:list';
    const cached = metadataCache.get(cacheKey);
    if (cached) {
      res.status(200).json({ success: true, data: cached });
      return;
    }

    const exams = await Exam.find({ isActive: true }).sort({ order: 1 }).lean();
    if (exams.length > 0) {
      metadataCache.set(cacheKey, exams, 300);
    }
    res.status(200).json({ success: true, data: exams });
  } catch (error) {
    next(error);
  }
});

// GET /api/exams/:examId/subjects — List all subjects for an exam with topic and question counts
router.get('/:examId/subjects', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const rawExamId = req.params.examId;
    const examId = Array.isArray(rawExamId) ? rawExamId[0] : rawExamId;
    const hasQ = req.query.hasQuestions === 'true';
    const cacheKey = `subjects:${examId}:${hasQ}`;

    const cached = metadataCache.get(cacheKey);
    if (cached) {
      res.status(200).json({ success: true, data: cached });
      return;
    }

    const subjects = await Subject.find({ examId }).sort({ order: 1 }).lean();
    if (subjects.length === 0) {
      res.status(200).json({ success: true, data: [] });
      return;
    }

    const subjectIds = subjects.map((s) => s._id);
    const [topicCounts, questionCounts] = await Promise.all([
      Topic.aggregate([
        { $match: { subjectId: { $in: subjectIds } } },
        { $group: { _id: '$subjectId', count: { $sum: 1 } } },
      ]),
      Question.aggregate([
        { $match: { subjectId: { $in: subjectIds }, published: true, reviewStatus: 'PUBLISHED' } },
        { $group: { _id: '$subjectId', count: { $sum: 1 } } },
      ]),
    ]);

    const topicMap = new Map<string, number>();
    for (const tc of topicCounts) {
      topicMap.set(tc._id.toString(), tc.count);
    }

    const questionMap = new Map<string, number>();
    for (const qc of questionCounts) {
      questionMap.set(qc._id.toString(), qc.count);
    }

    let enriched = subjects.map((subj) => ({
      ...subj,
      topicCount: topicMap.get(subj._id.toString()) || 0,
      questionCount: questionMap.get(subj._id.toString()) || 0,
    }));

    if (hasQ) {
      enriched = enriched.filter((s) => (s.questionCount || 0) > 0);
    }

    metadataCache.set(cacheKey, enriched, 300);
    res.status(200).json({ success: true, data: enriched });
  } catch (error) {
    next(error);
  }
});

// GET /api/subjects/:subjectId/topics — List all syllabus topics for a subject
router.get('/subjects/:subjectId/topics', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const rawSubjectId = req.params.subjectId;
    const subjectId = Array.isArray(rawSubjectId) ? rawSubjectId[0] : rawSubjectId;
    const cacheKey = `topics:${subjectId}`;

    const cached = metadataCache.get(cacheKey);
    if (cached) {
      res.status(200).json({ success: true, data: cached });
      return;
    }

    const topics = await Topic.find({ subjectId }).sort({ order: 1 }).lean();
    metadataCache.set(cacheKey, topics, 300);
    res.status(200).json({ success: true, data: topics });
  } catch (error) {
    next(error);
  }
});

// PUT /api/exams/user/target-exam — Update student's target examination & subjects
router.put(
  '/user/target-exam',
  authenticateToken,
  requireVerified,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = targetExamSchema.parse(req.body);

      const exam = await Exam.findById(data.examId);
      if (!exam) {
        res.status(404).json({ success: false, error: { message: 'Selected exam does not exist.' } });
        return;
      }

      const user = await User.findById(req.user!._id);
      if (!user) {
        res.status(404).json({ success: false, error: { message: 'User not found.' } });
        return;
      }

      user.targetExam = exam._id;
      if (data.subjectIds) {
        user.selectedSubjects = data.subjectIds as any;
      }
      await user.save();

      const updated = await User.findById(user._id)
        .populate('targetExam', 'name shortCode description')
        .populate('selectedSubjects', 'name code');

      res.status(200).json({
        success: true,
        message: 'Target examination updated successfully.',
        data: updated?.toJSON(),
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: { message: 'Validation error', details: error.flatten().fieldErrors },
        });
        return;
      }
      next(error);
    }
  }
);

// GET /api/exams/dashboard/stats — Aggregated metrics for the logged-in student
router.get(
  '/dashboard/stats',
  authenticateToken,
  requireVerified,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!._id;

      // Fetch user with target exam
      const user = await User.findById(userId).populate('targetExam', 'name shortCode syllabusYear description');

      // Fetch student's attempt statistics
      const attempts = await ExamAttempt.find({ userId })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('examId', 'shortCode')
        .populate('subjectId', 'name code');

      const totalAttempts = await ExamAttempt.countDocuments({ userId, status: 'COMPLETED' });

      // Calculate score average
      const completedAttempts = await ExamAttempt.find({ userId, status: 'COMPLETED' });
      const averageScore =
        completedAttempts.length > 0
          ? Math.round(completedAttempts.reduce((acc, curr) => acc + (curr.percentage || 0), 0) / completedAttempts.length)
          : 0;

      // Available subjects for target exam
      let availableSubjects: any[] = [];
      if (user?.targetExam) {
        availableSubjects = await Subject.find({ examId: (user.targetExam as any)._id }).sort({ order: 1 });
      }

      res.status(200).json({
        success: true,
        data: {
          targetExam: user?.targetExam || null,
          totalAttempts,
          averageScore,
          recentAttempts: attempts,
          availableSubjects,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/exams — (Admin Only) Create a new examination board
router.post(
  '/',
  authenticateToken,
  requireRole(['ADMIN']),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const exam = await Exam.create(req.body);
      res.status(201).json({ success: true, data: exam });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/exams/subjects — (Admin Only) Create a new subject under an exam
router.post(
  '/subjects',
  authenticateToken,
  requireRole(['ADMIN']),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const subject = await Subject.create(req.body);
      res.status(201).json({ success: true, data: subject });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/exams/topics — (Admin Only) Create a new topic under a subject
router.post(
  '/topics',
  authenticateToken,
  requireRole(['ADMIN']),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const topic = await Topic.create(req.body);
      res.status(201).json({ success: true, data: topic });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
