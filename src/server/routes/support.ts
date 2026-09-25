import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import crypto from 'crypto';
import { SupportTicket, SupportCategory } from '../models/SupportTicket.js';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth.js';
import { leadSubmissionLimiter } from '../middleware/rateLimiter.js';
import { getDynamicSupportConfig } from '../services/supportConfigService.js';

import {
  sendSupportComplaintNotificationEmail,
  sendCustomerTicketConfirmationEmail,
} from '../services/emailService.js';
import { env } from '../config/env.js';

const router = Router();

// GET /api/support/contact-info — Public, read-only customer support configuration
router.get('/contact-info', async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const config = await getDynamicSupportConfig();
    // Cache for 60 seconds with 120s stale-while-revalidate to ensure instant responsiveness without stale locks
    res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=60, stale-while-revalidate=120');
    res.status(200).json({
      success: true,
      data: {
        whatsappNumber: config.whatsappNumber,
        whatsappDisplay: config.whatsappDisplay,
        whatsappEnabled: config.whatsappEnabled,
        phone: config.phone,
        phoneDisplay: config.phoneDisplay,
        phoneEnabled: config.phoneEnabled,
        email: config.email,
        emailDisplay: config.emailDisplay,
        emailEnabled: config.emailEnabled,
        workingHours: config.workingHours,
      },
    });
  } catch (error) {
    next(error);
  }
});

const createTicketSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(1, 'Please provide your full name')
    .max(100, 'Name must not exceed 100 characters')
    .refine((val) => !/[\r\n]/.test(val), 'Name cannot contain line breaks'),
  email: z
    .string()
    .trim()
    .email('Please provide a valid email address')
    .max(100, 'Email must not exceed 100 characters')
    .refine((val) => !/[\r\n]/.test(val), 'Email cannot contain line breaks'),
  phone: z
    .string()
    .trim()
    .max(30, 'Phone must not exceed 30 characters')
    .optional()
    .or(z.literal('')),
  category: z.enum([
    'PAYMENT_PROBLEM',
    'LOGIN_PROBLEM',
    'QUESTION_ERROR',
    'TECHNICAL_PROBLEM',
    'SUBSCRIPTION_PROBLEM',
    'OTHER',
  ]),
  subject: z
    .string()
    .trim()
    .max(200, 'Subject must not exceed 200 characters')
    .optional()
    .default('General Support Inquiry')
    .transform((val) => val.replace(/[\r\n]+/g, ' ').trim()),
  message: z
    .string()
    .trim()
    .min(2, 'Message must be at least 2 characters')
    .max(5000, 'Message must not exceed 5000 characters'),
  idempotencyKey: z.string().trim().max(100).optional(),
});

// POST /api/support — Submit official student support inquiry / ticket (Rate limited)
router.post(
  '/',
  leadSubmissionLimiter,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = createTicketSchema.parse(req.body);

      // 1. Check for authenticated user via Bearer token
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
          // Non-fatal, proceed as guest inquiry
        }
      }

      // 2. Prevent rapid duplicate submissions (idempotency check)
      if (data.idempotencyKey) {
        const existingWithKey = await SupportTicket.findOne({
          idempotencyKey: data.idempotencyKey,
        }).lean();
        if (existingWithKey) {
          res.status(200).json({
            success: true,
            message: `Your support request has been registered previously. Reference: ${existingWithKey.ticketReference}.`,
            data: {
              ticketReference: existingWithKey.ticketReference,
              category: existingWithKey.category,
              status: existingWithKey.status,
              createdAt: existingWithKey.createdAt,
              emailDeliveryStatus: existingWithKey.emailDeliveryStatus,
            },
          });
          return;
        }
      }

      // Double-submit protection within 20s window with identical email and message
      const recentDuplicate = await SupportTicket.findOne({
        email: data.email.toLowerCase(),
        message: data.message,
        createdAt: { $gte: new Date(Date.now() - 20000) },
      }).lean();

      if (recentDuplicate) {
        res.status(200).json({
          success: true,
          message: `Your support request was already received. Reference: ${recentDuplicate.ticketReference}.`,
          data: {
            ticketReference: recentDuplicate.ticketReference,
            category: recentDuplicate.category,
            status: recentDuplicate.status,
            createdAt: recentDuplicate.createdAt,
            emailDeliveryStatus: recentDuplicate.emailDeliveryStatus,
          },
        });
        return;
      }

      // 3. Generate official unique ticket reference: MD-SUP-XXXXXXXX
      const timestampPart = Date.now().toString(36).toUpperCase();
      const randomPart = crypto.randomBytes(3).toString('hex').toUpperCase();
      const ticketReference = `MD-SUP-${timestampPart}${randomPart}`;

      const priority =
        data.category === 'PAYMENT_PROBLEM' || data.category === 'SUBSCRIPTION_PROBLEM'
          ? 'HIGH'
          : 'MEDIUM';

      // 4. Persist ticket in MongoDB FIRST
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
        priority,
        emailDeliveryStatus: 'NOT_SENT',
        idempotencyKey: data.idempotencyKey || undefined,
      });

      // 5. Retrieve authoritative Admin Support Email dynamically from MongoDB
      const supportConfig = await getDynamicSupportConfig();
      const adminSupportEmail =
        supportConfig.email && supportConfig.email.trim()
          ? supportConfig.email.trim()
          : env.ADMIN_EMAIL || 'support@markdriller.com';

      // 6. Send transactional notification email to configured Admin Support Email
      let emailDeliveryStatus: 'SENT' | 'FAILED' = 'FAILED';
      let emailMessageId: string | undefined;
      let emailError: string | undefined;

      try {
        const dispatchResult = await sendSupportComplaintNotificationEmail({
          supportRecipientEmail: adminSupportEmail,
          ticketReference,
          fullName: data.fullName,
          email: data.email,
          phone: data.phone || undefined,
          category: data.category,
          subject: data.subject,
          message: data.message,
          priority,
          userId: userId?.toString(),
          createdAt: ticket.createdAt,
        });

        if (dispatchResult.success) {
          emailDeliveryStatus = 'SENT';
          emailMessageId = dispatchResult.messageId;
        } else {
          emailDeliveryStatus = 'FAILED';
          emailError = dispatchResult.error || 'Failed to dispatch email';
        }
      } catch (emailErr: any) {
        emailDeliveryStatus = 'FAILED';
        emailError = emailErr.message || 'Unknown email dispatch error';
      }

      // 7. Update ticket record with email delivery outcome in MongoDB
      await SupportTicket.updateOne(
        { _id: ticket._id },
        {
          $set: {
            emailDeliveryStatus,
            emailMessageId,
            emailRecipient: adminSupportEmail,
            emailError,
          },
        }
      );

      // 8. Optionally send customer confirmation receipt
      try {
        const custResult = await sendCustomerTicketConfirmationEmail({
          customerEmail: data.email,
          customerName: data.fullName,
          supportEmail: adminSupportEmail,
          ticketReference,
          category: data.category,
          subject: data.subject,
          message: data.message,
        });

        if (custResult.success) {
          await SupportTicket.updateOne(
            { _id: ticket._id },
            {
              $set: {
                customerNotified: true,
                customerNotificationMessageId: custResult.messageId,
              },
            }
          );
        }
      } catch (custErr: any) {
        console.warn('⚠️ [SUPPORT NOTIFICATION] Customer confirmation email dispatch failed:', custErr.message);
      }

      // 9. Respond to customer with official ticket reference
      res.status(201).json({
        success: true,
        message: `Your support request has been submitted successfully. Reference: ${ticket.ticketReference}. Our support team will review your inquiry.`,
        data: {
          ticketReference: ticket.ticketReference,
          category: ticket.category,
          status: ticket.status,
          createdAt: ticket.createdAt,
          emailDeliveryStatus,
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
