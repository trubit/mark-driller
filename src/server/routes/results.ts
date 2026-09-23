import { Router, Response, NextFunction } from 'express';
import { Result } from '../models/Result.js';
import { authenticateToken, requireVerified, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

// All result endpoints require student authentication and verified email
router.use(authenticateToken, requireVerified);

// GET /api/results — Paginated list of student's exam results
router.get('/', async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!._id;
    const { page = '1', limit = '10' } = req.query;

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    const [results, total] = await Promise.all([
      Result.find({ userId })
        .populate('examId', 'name shortCode')
        .populate('subjectId', 'name code')
        .populate('attemptId', 'mode startTime submittedAt')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Result.countDocuments({ userId }),
    ]);

    const totalPages = Math.ceil(total / limitNum);

    res.status(200).json({
      success: true,
      data: {
        results,
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

// GET /api/results/analytics/overview — Comprehensive aggregated performance & readiness metrics
router.get(
  '/analytics/overview',
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!._id;

      const results = await Result.find({ userId })
        .populate('examId', 'name shortCode')
        .populate('subjectId', 'name code')
        .sort({ createdAt: 1 })
        .lean();

      if (results.length === 0) {
        res.status(200).json({
          success: true,
          data: {
            readinessScore: 0,
            totalMocksTaken: 0,
            totalQuestionsAnswered: 0,
            totalCorrectAnswers: 0,
            overallAccuracy: 0,
            totalTimeSpentSeconds: 0,
            averageScore: 0,
            subjectPerformance: [],
            topicStrengths: [],
            topicWeaknesses: [],
            recentTrend: [],
          },
        });
        return;
      }

      // Aggregate global statistics
      let totalQuestionsAnswered = 0;
      let totalCorrectAnswers = 0;
      let totalTimeSpentSeconds = 0;
      let totalPercentageSum = 0;

      const subjectAggMap = new Map<
        string,
        {
          subjectId: string;
          subjectName: string;
          subjectCode: string;
          scores: number[];
        }
      >();

      const topicAggMap = new Map<
        string,
        {
          topicId?: string;
          topicName: string;
          total: number;
          correct: number;
        }
      >();

      const recentTrend: { date: string; percentage: number; subjectCode: string; attemptId: string }[] = [];

      results.forEach((r) => {
        totalQuestionsAnswered += r.correctCount + r.incorrectCount;
        totalCorrectAnswers += r.correctCount;
        totalTimeSpentSeconds += r.timeSpentSeconds || 0;
        totalPercentageSum += r.percentage;

        // Subject aggregation
        const subjId = (r.subjectId as any)?._id?.toString() || 'unknown';
        const subjName = (r.subjectId as any)?.name || 'Subject';
        const subjCode = (r.subjectId as any)?.code || 'SUB';

        if (!subjectAggMap.has(subjId)) {
          subjectAggMap.set(subjId, {
            subjectId: subjId,
            subjectName: subjName,
            subjectCode: subjCode,
            scores: [],
          });
        }
        subjectAggMap.get(subjId)!.scores.push(r.percentage);

        // Topic breakdown aggregation
        if (r.topicBreakdown && Array.isArray(r.topicBreakdown)) {
          r.topicBreakdown.forEach((tb) => {
            const topicKey = tb.topicName;
            if (!topicAggMap.has(topicKey)) {
              topicAggMap.set(topicKey, {
                topicId: tb.topicId?.toString(),
                topicName: tb.topicName,
                total: 0,
                correct: 0,
              });
            }
            const tEntry = topicAggMap.get(topicKey)!;
            tEntry.total += tb.totalQuestions;
            tEntry.correct += tb.correctAnswers;
            if (tb.topicId && !tEntry.topicId) {
              tEntry.topicId = tb.topicId.toString();
            }
          });
        }

        recentTrend.push({
          date: r.createdAt.toISOString().split('T')[0],
          percentage: r.percentage,
          subjectCode: subjCode,
          attemptId: r.attemptId?.toString(),
        });
      });

      const averageScore = Math.round(totalPercentageSum / results.length);
      const overallAccuracy =
        totalQuestionsAnswered > 0 ? Math.round((totalCorrectAnswers / totalQuestionsAnswered) * 100) : 0;

      // Subject performance cards
      const subjectPerformance = Array.from(subjectAggMap.values()).map((s) => {
        const attemptCount = s.scores.length;
        const avg = Math.round(s.scores.reduce((a, b) => a + b, 0) / attemptCount);
        const highest = Math.max(...s.scores);
        const lowest = Math.min(...s.scores);
        return {
          subjectId: s.subjectId,
          subjectName: s.subjectName,
          subjectCode: s.subjectCode,
          attemptCount,
          averageScore: avg,
          highestScore: highest,
          lowestScore: lowest,
        };
      });

      // Topic strengths and weaknesses
      const evaluatedTopics = Array.from(topicAggMap.values()).map((t) => {
        const acc = t.total > 0 ? Math.round((t.correct / t.total) * 100) : 0;
        return {
          topicId: t.topicId,
          topicName: t.topicName,
          totalQuestions: t.total,
          correctAnswers: t.correct,
          accuracyPercentage: acc,
        };
      });

      const topicStrengths = evaluatedTopics
        .filter((t) => t.accuracyPercentage >= 70)
        .sort((a, b) => b.accuracyPercentage - a.accuracyPercentage)
        .slice(0, 5);

      const topicWeaknesses = evaluatedTopics
        .filter((t) => t.accuracyPercentage < 60)
        .sort((a, b) => a.accuracyPercentage - b.accuracyPercentage)
        .slice(0, 5);

      // Exam Readiness Score Calculation:
      // 70% weighted on average mock scores + 30% weighted on curriculum topic coverage
      const uniqueTopicsCount = evaluatedTopics.length;
      const mockScoreComponent = averageScore * 0.7;
      const topicCoverageComponent = Math.min(30, (uniqueTopicsCount / 8) * 30);
      const readinessScore = Math.min(100, Math.round(mockScoreComponent + topicCoverageComponent));

      res.status(200).json({
        success: true,
        data: {
          readinessScore,
          totalMocksTaken: results.length,
          totalQuestionsAnswered,
          totalCorrectAnswers,
          overallAccuracy,
          totalTimeSpentSeconds,
          averageScore,
          subjectPerformance,
          topicStrengths,
          topicWeaknesses,
          recentTrend: recentTrend.slice(-10), // last 10 attempts
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/results/:resultId — Details of a specific result
router.get('/:resultId', async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const rawId = req.params.resultId;
    const resultId = Array.isArray(rawId) ? rawId[0] : rawId;
    const userId = req.user!._id;

    const result = await Result.findById(resultId)
      .populate('examId', 'name shortCode')
      .populate('subjectId', 'name code')
      .populate('attemptId');

    if (!result) {
      res.status(404).json({ success: false, error: { message: 'Result not found.' } });
      return;
    }

    if (result.userId.toString() !== userId.toString()) {
      res.status(403).json({ success: false, error: { message: 'Unauthorized access.' } });
      return;
    }

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

export default router;

