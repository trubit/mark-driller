import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import mongoose from 'mongoose';
import { Question } from '../models/Question.js';
import { Bookmark } from '../models/Bookmark.js';
import { Exam } from '../models/Exam.js';
import { Subject } from '../models/Subject.js';
import { Topic } from '../models/Topic.js';
import { authenticateToken, requireRole, requireVerified, AuthenticatedRequest } from '../middleware/auth.js';
import { QuestionIngestionService } from '../services/questionIngestionService.js';

const router = Router();

const objectIdSchema = z
  .string()
  .refine((val) => mongoose.Types.ObjectId.isValid(val), {
    message: 'Must be a valid 24-character hexadecimal ObjectId',
  });

const questionQuerySchema = z.object({
  examId: objectIdSchema.optional(),
  subjectId: objectIdSchema.optional(),
  topicId: objectIdSchema.optional(),
  year: z.coerce.number().int().min(1980).max(2035).optional(),
  difficulty: z
    .string()
    .transform((val) => val.toUpperCase())
    .pipe(z.enum(['EASY', 'MEDIUM', 'HARD']))
    .optional(),
  search: z.string().trim().max(200).optional(),
  page: z.coerce.number().int().min(1).max(10000).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

function escapeRegex(text: string): string {
  // Cap length to 60 chars to eliminate ReDoS risk
  const sanitized = text.slice(0, 60).trim();
  return sanitized.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const questionCreateSchema = z.object({
  examId: z.string().min(1, 'Exam ID is required'),
  subjectId: z.string().min(1, 'Subject ID is required'),
  topicId: z.string().optional(),
  year: z.number().int().min(1980).max(2030),
  questionNumber: z.number().int().min(1),
  questionText: z.string().min(3, 'Question text is required'),
  optionA: z.string().min(1, 'Option A is required'),
  optionB: z.string().min(1, 'Option B is required'),
  optionC: z.string().min(1, 'Option C is required'),
  optionD: z.string().min(1, 'Option D is required'),
  correctAnswer: z.enum(['A', 'B', 'C', 'D']),
  explanation: z.string().default(''),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']).default('MEDIUM'),
  imageUrl: z.string().optional(),
});

// GET /api/questions/user/bookmarks — Get bookmarked questions for the logged-in student
router.get(
  '/user/bookmarks',
  authenticateToken,
  requireVerified,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!._id;
      const bookmarks = await Bookmark.find({ userId })
        .populate({
          path: 'questionId',
          populate: [
            { path: 'examId', select: 'name shortCode' },
            { path: 'subjectId', select: 'name code' },
            { path: 'topicId', select: 'name' },
          ],
        })
        .sort({ createdAt: -1 });

      const questions = bookmarks
        .filter((b) => b.questionId != null)
        .map((b) => ({
          bookmarkId: b._id,
          bookmarkDate: b.createdAt,
          question: b.questionId,
        }));

      res.status(200).json({ success: true, data: questions });
    } catch (error) {
      next(error);
    }
  }
);

const acquireCurriculumSchema = z.object({
  examId: objectIdSchema,
  subjectId: objectIdSchema,
  year: z.number().int().min(1980).max(2035).optional(),
});

// POST /api/questions/acquire-curriculum — User dashboard trigger to sync accredited past questions for selected curriculum
router.post(
  '/acquire-curriculum',
  authenticateToken,
  requireVerified,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = acquireCurriculumSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({
          success: false,
          error: { message: 'Invalid curriculum parameters', details: parsed.error.flatten().fieldErrors },
        });
        return;
      }

      const { examId, subjectId, year } = parsed.data;
      const [examDoc, subjectDoc] = await Promise.all([
        Exam.findById(examId).lean(),
        Subject.findById(subjectId).lean(),
      ]);

      if (!examDoc || !subjectDoc) {
        res.status(404).json({
          success: false,
          error: { message: 'Exam board or subject not found' },
        });
        return;
      }

      const result = await QuestionIngestionService.acquireOnDemandForCurriculum({
        examShortCode: examDoc.shortCode,
        subjectCode: subjectDoc.code,
        year,
      });

      res.status(200).json({
        success: true,
        data: {
          exam: examDoc.shortCode,
          subject: subjectDoc.code,
          year: year || 'ALL',
          totalInserted: result.totalInserted,
          totalUpdated: result.totalUpdated,
          totalSkipped: result.totalSkipped,
          totalFetched: result.totalFetched,
          status: result.status,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/questions — List questions with filters, search, pagination, and on-demand acquisition
router.get('/', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const parseResult = questionQuerySchema.safeParse(req.query);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        error: {
          message: 'Invalid query parameters',
          details: parseResult.error.flatten().fieldErrors,
        },
      });
      return;
    }

    const {
      examId,
      subjectId,
      topicId,
      year,
      difficulty,
      search,
      page: pageNum,
      limit: limitNum,
    } = parseResult.data;

    const skip = (pageNum - 1) * limitNum;

    const filter: Record<string, any> = { published: true, reviewStatus: 'PUBLISHED' };

    if (examId) filter.examId = new mongoose.Types.ObjectId(examId);
    if (subjectId) filter.subjectId = new mongoose.Types.ObjectId(subjectId);
    if (topicId) filter.topicId = new mongoose.Types.ObjectId(topicId);
    if (year) filter.year = year;
    if (difficulty) filter.difficulty = difficulty;

    if (search && search.trim().length > 0) {
      const escaped = escapeRegex(search);
      if (escaped) {
        filter.$or = [
          { questionText: { $regex: escaped, $options: 'i' } },
          { explanation: { $regex: escaped, $options: 'i' } },
        ];
      }
    }

    let [questions, total] = await Promise.all([
      Question.find(filter)
        .populate('examId', 'name shortCode')
        .populate('subjectId', 'name code')
        .populate('topicId', 'name')
        .sort({ year: -1, questionNumber: 1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Question.countDocuments(filter),
    ]);

    let acquiredOnDemand = false;

    // If no questions exist locally for this exam and subject, trigger on-demand dynamic acquisition from accredited curriculum repository
    if (total === 0 && examId && subjectId) {
      try {
        const [examDoc, subjectDoc] = await Promise.all([
          Exam.findById(examId).lean(),
          Subject.findById(subjectId).lean(),
        ]);

        if (examDoc && subjectDoc) {
          const syncResult = await QuestionIngestionService.acquireOnDemandForCurriculum({
            examShortCode: examDoc.shortCode,
            subjectCode: subjectDoc.code,
            year: year,
          });

          if (syncResult.totalInserted > 0) {
            acquiredOnDemand = true;
            const [refetchedQuestions, refetchedTotal] = await Promise.all([
              Question.find(filter)
                .populate('examId', 'name shortCode')
                .populate('subjectId', 'name code')
                .populate('topicId', 'name')
                .sort({ year: -1, questionNumber: 1 })
                .skip(skip)
                .limit(limitNum)
                .lean(),
              Question.countDocuments(filter),
            ]);
            questions = refetchedQuestions;
            total = refetchedTotal;
          }
        }
      } catch (ingestErr) {
        console.error('[Questions Route] Dynamic acquisition error:', ingestErr);
      }
    }

    const totalPages = Math.max(1, Math.ceil(total / limitNum));

    res.status(200).json({
      success: true,
      data: {
        questions,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages,
          hasNextPage: pageNum < totalPages,
          hasPrevPage: pageNum > 1,
        },
        acquiredOnDemand,
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/questions/:id — Get single question details with explanation
router.get('/:id', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const rawId = req.params.id;
    const questionId = Array.isArray(rawId) ? rawId[0] : rawId;

    const question = await Question.findById(questionId)
      .populate('examId', 'name shortCode region')
      .populate('subjectId', 'name code')
      .populate('topicId', 'name description');

    if (!question) {
      res.status(404).json({ success: false, error: { message: 'Question not found' } });
      return;
    }

    res.status(200).json({ success: true, data: question });
  } catch (error) {
    next(error);
  }
});

// POST /api/questions/:id/bookmark — Toggle bookmark for logged in student
router.post(
  '/:id/bookmark',
  authenticateToken,
  requireVerified,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const rawId = req.params.id;
      const questionId = Array.isArray(rawId) ? rawId[0] : rawId;
      const userId = req.user!._id;

      const question = await Question.findById(questionId);
      if (!question) {
        res.status(404).json({ success: false, error: { message: 'Question not found' } });
        return;
      }

      const existingBookmark = await Bookmark.findOne({ userId, questionId });

      if (existingBookmark) {
        await Bookmark.deleteOne({ _id: existingBookmark._id });
        res.status(200).json({
          success: true,
          isBookmarked: false,
          message: 'Question removed from saved bookmarks.',
        });
      } else {
        await Bookmark.create({ userId, questionId });
        res.status(201).json({
          success: true,
          isBookmarked: true,
          message: 'Question saved to your bookmarks.',
        });
      }
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/questions — (Admin Only) Create a new question
router.post(
  '/',
  authenticateToken,
  requireRole(['ADMIN']),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validatedData = questionCreateSchema.parse(req.body);

      // Verify exam and subject exist
      const [exam, subject] = await Promise.all([
        Exam.findById(validatedData.examId),
        Subject.findById(validatedData.subjectId),
      ]);

      if (!exam || !subject) {
        res.status(400).json({
          success: false,
          error: { message: 'Referenced Exam or Subject does not exist.' },
        });
        return;
      }

      if (validatedData.topicId) {
        const topic = await Topic.findById(validatedData.topicId);
        if (!topic) {
          res.status(400).json({
            success: false,
            error: { message: 'Referenced Topic does not exist.' },
          });
          return;
        }
      }

      const question = await Question.create(validatedData);
      res.status(201).json({ success: true, data: question });
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
  }
);

// PUT /api/questions/:id — (Admin Only) Update question
router.put(
  '/:id',
  authenticateToken,
  requireRole(['ADMIN']),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const rawId = req.params.id;
      const questionId = Array.isArray(rawId) ? rawId[0] : rawId;

      const updated = await Question.findByIdAndUpdate(questionId, req.body, { new: true });
      if (!updated) {
        res.status(404).json({ success: false, error: { message: 'Question not found.' } });
        return;
      }

      res.status(200).json({ success: true, data: updated });
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /api/questions/:id — (Admin Only) Delete question
router.delete(
  '/:id',
  authenticateToken,
  requireRole(['ADMIN']),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const rawId = req.params.id;
      const questionId = Array.isArray(rawId) ? rawId[0] : rawId;

      const deleted = await Question.findByIdAndDelete(questionId);
      if (!deleted) {
        res.status(404).json({ success: false, error: { message: 'Question not found.' } });
        return;
      }

      // Also clean up any bookmarks for this question
      await Bookmark.deleteMany({ questionId });

      res.status(200).json({ success: true, message: 'Question deleted successfully.' });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
