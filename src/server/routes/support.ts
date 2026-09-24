import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import crypto from 'crypto';
import { SupportTicket, SupportCategory } from '../models/SupportTicket.js';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth.js';
import { leadSubmissionLimiter } from '../middleware/rateLimiter.js';

const router = Router();

const createTicketSchema = z.object({
  fullName: z.string().trim().min(1, 'Please provide your full name').max(100),
  email: z.string().trim().email('Please provide a valid email address').max(100),
  phone: z.string().trim().max(30).optional().or(z.literal('')),
  category: z.enum([
    'PAYMENT_PROBLEM',
    'LOGIN_PROBLEM',
    'QUESTION_ERROR',
    'TECHNICAL_PROBLEM',
    'SUBSCRIPTION_PROBLEM',
    'OTHER',
  ]),
  subject: z.string().trim().max(200).optional().default('General Inquiry'),
  message: z.string().trim().min(2, 'Message must be at least 2 characters').max(5000),
});

// POST /api/support — Submit official student support inquiry / ticket (Rate limited)
router.post(
  '/',
  leadSubmissionLimiter,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = createTicketSchema.parse(req.body);

      const ticketReference = `TK-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;

      // Check if user is authenticated via optional Bearer token
      let userId: any = undefined;
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        try {
          const { verifyToken } = await import('../utils/jwt.js');
          const token = authHeader.split(' ')[1];
          const decoded = verifyToken(token);
          if (decoded && decoded.userId) {
            userId = decoded.userId;
          }
        } catch {
          // Non-fatal, proceed as unauthenticated guest inquiry
        }
      }

      const ticket = await SupportTicket.create({
        ticketReference,
        userId,
        fullName: data.fullName,
        email: data.email,
        phone: data.phone || '',
        category: data.category as SupportCategory,
        subject: data.subject,
        message: data.message,
        status: 'OPEN',
        priority: data.category === 'PAYMENT_PROBLEM' ? 'HIGH' : 'MEDIUM',
      });

      res.status(201).json({
        success: true,
        message: 'Your support ticket has been registered successfully. Our academic and technical operations team will review your inquiry.',
        data: {
          ticketReference: ticket.ticketReference,
          category: ticket.category,
          status: ticket.status,
          createdAt: ticket.createdAt,
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
  }
);

// GET /api/support/my-tickets — Retrieve logged-in student's support history
router.get(
  '/my-tickets',
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!._id;
      const tickets = await SupportTicket.find({
        $or: [{ userId }, { email: req.user!.email }],
      })
        .sort({ createdAt: -1 })
        .limit(20)
        .lean();

      res.status(200).json({
        success: true,
        data: tickets,
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
