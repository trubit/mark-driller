import { Router, Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import {
  Institution,
  Course,
  BlogPost,
  Testimonial,
  VideoLesson,
  Flashcard,
} from '../models/index.js';

const router = Router();

function escapeRegex(text: string): string {
  return text.slice(0, 60).replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}

// ----------------------------------------------------
// 1. NIGERIAN TERTIARY INSTITUTIONS & COURSES
// ----------------------------------------------------
router.get('/institutions', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { state, type, search, maxCutoff, page = '1', limit = '20' } = req.query;
    const filter: Record<string, any> = { isPublished: true };

    if (state && typeof state === 'string' && state.trim() !== 'ALL') {
      filter.state = new RegExp(`^${escapeRegex(state.trim())}$`, 'i');
    }
    if (type && typeof type === 'string' && type.trim() !== 'ALL') {
      filter.type = type.trim();
    }
    if (maxCutoff && !isNaN(Number(maxCutoff))) {
      filter.minJambCutoff = { $lte: Number(maxCutoff) };
    }
    if (search && typeof search === 'string' && search.trim()) {
      const sanitized = escapeRegex(search.trim());
      filter.$or = [
        { name: { $regex: sanitized, $options: 'i' } },
        { shortCode: { $regex: sanitized, $options: 'i' } },
        { state: { $regex: sanitized, $options: 'i' } },
        { popularCourses: { $regex: sanitized, $options: 'i' } },
      ];
    }

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const [institutions, total] = await Promise.all([
      Institution.find(filter).sort({ minJambCutoff: -1, name: 1 }).skip(skip).limit(limitNum).lean(),
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

router.get('/institutions/:id', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const rawId = req.params.id;
    const id = Array.isArray(rawId) ? rawId[0] : rawId;

    let institution = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      institution = await Institution.findById(id).lean();
    }
    if (!institution) {
      institution = await Institution.findOne({ shortCode: id.toUpperCase(), isPublished: true }).lean();
    }

    if (!institution) {
      res.status(404).json({ success: false, error: { message: 'Institution not found.' } });
      return;
    }

    const courses = await Course.find({ institutionId: institution._id, isAvailable: true }).lean();

    res.status(200).json({
      success: true,
      data: {
        ...institution,
        courses,
      },
    });
  } catch (error) {
    next(error);
  }
});

// ----------------------------------------------------
// 2. ACADEMIC BLOG & EDITORIAL GUIDES
// ----------------------------------------------------
router.get('/blog', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { category, examBoard, search, page = '1', limit = '10' } = req.query;
    const filter: Record<string, any> = { isPublished: true };

    if (category && typeof category === 'string' && category.trim() !== 'ALL') {
      filter.category = category.trim();
    }
    if (examBoard && typeof examBoard === 'string' && examBoard.trim() !== 'ALL') {
      filter.examBoard = examBoard.trim().toUpperCase();
    }
    if (search && typeof search === 'string' && search.trim()) {
      const sanitized = escapeRegex(search.trim());
      filter.$or = [
        { title: { $regex: sanitized, $options: 'i' } },
        { summary: { $regex: sanitized, $options: 'i' } },
        { tags: { $regex: sanitized, $options: 'i' } },
      ];
    }

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string, 10) || 10));
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

router.get('/blog/:slug', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const rawSlug = req.params.slug;
    const slug = Array.isArray(rawSlug) ? rawSlug[0] : rawSlug;

    if (!slug || typeof slug !== 'string' || !/^[a-z0-9-]+$/.test(slug)) {
      res.status(400).json({ success: false, error: { message: 'Invalid article slug format.' } });
      return;
    }

    const article = await BlogPost.findOneAndUpdate(
      { slug, isPublished: true },
      { $inc: { viewCount: 1 } },
      { new: true }
    ).lean();

    if (!article) {
      res.status(404).json({ success: false, error: { message: 'Article not found.' } });
      return;
    }

    res.status(200).json({ success: true, data: article });
  } catch (error) {
    next(error);
  }
});

// ----------------------------------------------------
// 3. VERIFIED STUDENT TESTIMONIALS
// ----------------------------------------------------
router.get('/testimonials', async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const testimonials = await Testimonial.find({ isApproved: true })
      .sort({ isFeatured: -1, createdAt: -1 })
      .limit(20)
      .lean();

    res.status(200).json({ success: true, data: testimonials });
  } catch (error) {
    next(error);
  }
});

// ----------------------------------------------------
// 4. VIDEO LESSONS (Curriculum-aligned)
// ----------------------------------------------------
router.get('/videos', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { examId, subjectId } = req.query;
    const filter: Record<string, any> = { isPublished: true };

    if (examId && mongoose.Types.ObjectId.isValid(examId as string)) {
      filter.examId = new mongoose.Types.ObjectId(examId as string);
    }
    if (subjectId && mongoose.Types.ObjectId.isValid(subjectId as string)) {
      filter.subjectId = new mongoose.Types.ObjectId(subjectId as string);
    }

    const videos = await VideoLesson.find(filter)
      .populate('examId', 'name shortCode')
      .populate('subjectId', 'name code')
      .sort({ order: 1, createdAt: 1 })
      .lean();

    res.status(200).json({ success: true, data: videos });
  } catch (error) {
    next(error);
  }
});

// ----------------------------------------------------
// 5. FLASHCARDS
// ----------------------------------------------------
router.get('/flashcards', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { examId, subjectId, difficulty } = req.query;
    const filter: Record<string, any> = { isPublished: true };

    if (examId && mongoose.Types.ObjectId.isValid(examId as string)) {
      filter.examId = new mongoose.Types.ObjectId(examId as string);
    }
    if (subjectId && mongoose.Types.ObjectId.isValid(subjectId as string)) {
      filter.subjectId = new mongoose.Types.ObjectId(subjectId as string);
    }
    if (difficulty && ['EASY', 'MEDIUM', 'HARD'].includes((difficulty as string).toUpperCase())) {
      filter.difficulty = (difficulty as string).toUpperCase();
    }

    const flashcards = await Flashcard.find(filter)
      .populate('examId', 'name shortCode')
      .populate('subjectId', 'name code')
      .populate('topicId', 'name')
      .limit(100)
      .lean();

    res.status(200).json({ success: true, data: flashcards });
  } catch (error) {
    next(error);
  }
});

export default router;

