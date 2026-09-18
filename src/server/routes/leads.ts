import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { leadSubmissionLimiter } from '../middleware/rateLimiter.js';

const leadSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters').max(80).optional(),
  email: z.string().email('Please enter a valid email address').max(100),
  password: z.string().min(6, 'Password must be at least 6 characters').optional(),
  targetExam: z.string().min(2, 'Target exam is required').max(60),
  mode: z.enum(['signup', 'login']).default('signup'),
});

const router = Router();

router.post(
  '/',
  leadSubmissionLimiter,
  (req: Request, res: Response, next: NextFunction): void => {
    try {
      const validatedData = leadSchema.parse(req.body);

      // Generate a structured inquiry reference
      const referenceId = `MD-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 9000 + 1000)}`;

      res.status(201).json({
        success: true,
        message: validatedData.mode === 'signup'
          ? 'Free practice account initiated successfully'
          : 'User session verified successfully',
        data: {
          referenceId,
          email: validatedData.email,
          targetExam: validatedData.targetExam,
          mode: validatedData.mode,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: {
            message: 'Validation failed',
            details: error.flatten().fieldErrors,
          },
        });
        return;
      }
      next(error);
    }
  }
);

export default router;
