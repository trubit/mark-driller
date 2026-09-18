import { Router, Request, Response, NextFunction } from 'express';
import { Exam } from '../models/Exam.js';
import { Subject } from '../models/Subject.js';

const router = Router();

let cachedExamBoards: { data: any; meta: any; timestamp: number } | null = null;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export function invalidateExamBoardsCache(): void {
  cachedExamBoards = null;
}

// GET /api/exam-boards
router.get('/', async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (cachedExamBoards && Date.now() - cachedExamBoards.timestamp < CACHE_TTL_MS) {
      res.setHeader('X-Cache', 'HIT');
      res.status(200).json({
        success: true,
        data: cachedExamBoards.data,
        meta: cachedExamBoards.meta,
      });
      return;
    }

    const exams = await Exam.find({ isActive: true }).sort({ order: 1 }).lean();

    if (exams.length > 0) {
      const examIds = exams.map((e) => e._id);
      const allSubjects = await Subject.find({ examId: { $in: examIds } }).sort({ order: 1 }).lean();

      // Group subjects by examId
      const subjectsByExam = new Map<string, typeof allSubjects>();
      for (const subj of allSubjects) {
        const key = subj.examId.toString();
        if (!subjectsByExam.has(key)) subjectsByExam.set(key, []);
        subjectsByExam.get(key)!.push(subj);
      }

      const enriched = exams.map((exam) => {
        const subjects = subjectsByExam.get(exam._id.toString()) || [];
        return {
          _id: exam._id,
          id: exam.slug,
          name: exam.name,
          shortCode: exam.shortCode,
          region: exam.region,
          questionCount: exam.questionCount || 0,
          syllabusYear: exam.syllabusYear,
          coreSubjects: subjects.map((s) => s.name),
          subjects: subjects.map((s) => ({ _id: s._id, name: s.name, code: s.code })),
        };
      });

      const responsePayload = {
        data: enriched,
        meta: {
          totalBoards: enriched.length,
          totalQuestions: enriched.reduce((sum, b) => sum + b.questionCount, 0),
        },
      };

      cachedExamBoards = { ...responsePayload, timestamp: Date.now() };
      res.setHeader('X-Cache', 'MISS');

      res.status(200).json({
        success: true,
        ...responsePayload,
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: [],
      meta: { totalBoards: 0, totalQuestions: 0 },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/exam-boards/:shortCode
router.get('/:shortCode', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const rawCode = req.params.shortCode;
    const shortCode = (Array.isArray(rawCode) ? rawCode[0] : rawCode)?.toUpperCase();
    const exam = await Exam.findOne({ shortCode, isActive: true });
    if (!exam) {
      res.status(404).json({ success: false, error: { message: 'Exam board not found' } });
      return;
    }

    const subjects = await Subject.find({ examId: exam._id }).sort({ order: 1 });

    res.status(200).json({
      success: true,
      data: {
        exam,
        subjects,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
