import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs';
import { Subscription, PlanType } from '../models/Subscription.js';
import { Payment } from '../models/Payment.js';
import { User } from '../models/User.js';
import { SystemSetting } from '../models/SystemSetting.js';
import { authenticateToken, requireVerified, AuthenticatedRequest } from '../middleware/auth.js';
import { sendSubscriptionEmail } from '../services/emailService.js';
import { PaystackService } from '../services/paystackService.js';
import { receiptUpload, validateReceiptFileSignature, RECEIPTS_DIR_ABSOLUTE } from '../middleware/upload.js';
import { CloudinaryService } from '../services/cloudinaryService.js';
import { env } from '../config/env.js';

const router = Router();

export const SUBSCRIPTION_PLANS = [
  {
    id: 'FREE',
    name: 'Free Starter',
    priceNGN: 0,
    priceKobo: 0,
    billingPeriod: 'Forever Free',
    description: 'Essential revision tools for secondary students beginning exam prep.',
    features: [
      'Access to 200+ past questions',
      '3 Timed CBT mock examinations per month',
      'Standard answer keys',
      'Basic student dashboard & score history',
    ],
    isPopular: false,
  },
  {
    id: 'PRO_MONTHLY',
    name: '1 Month Pro Pass',
    priceNGN: 3500,
    priceKobo: 350000,
    billingPeriod: '1 Month',
    description: 'Complete high-stakes preparation suite for JAMB / UTME and WAEC candidates.',
    features: [
      'Unlimited CBT mock examinations with official timer',
      'Full question bank access (30,000+ past questions)',
      'Detailed step-by-step worked mathematical solutions',
      'In-depth syllabus topic mastery & weakness analytics',
      'Downloadable formula sheets and revision summaries',
    ],
    isPopular: false,
  },
  {
    id: 'PRO_BIMONTHLY',
    name: '2 Months Intensive Pass',
    priceNGN: 6500,
    priceKobo: 650000,
    billingPeriod: '2 Months (Fixed Duration)',
    description: 'Two-month dedicated preparation pass for exam revision and multi-subject mocks.',
    features: [
      'All Pro features for a fixed 60-day period',
      'Multi-year past question pooling (2020–2025)',
      'Advanced timing & shuffle options',
      'Instant study mode with worked explanations',
      'Full performance analytics & weakness diagnostics',
    ],
    isPopular: true,
  },
  {
    id: 'PRO_QUARTERLY',
    name: '3 Months Term Scholar',
    priceNGN: 10000,
    priceKobo: 1000000,
    billingPeriod: '3 Months (Quarterly)',
    description: 'Complete academic term syllabus coverage for secondary & UTME candidates.',
    features: [
      'All Pro features for full 90-day term',
      'Unlimited CBT timed mocks & study mode',
      'Priority offline study material access',
      'Topic-by-topic mastery tracking',
      'Save ₦500 compared to monthly renewal',
    ],
    isPopular: false,
  },
  {
    id: 'PRO_ANNUAL',
    name: '1 Year Annual Scholar',
    priceNGN: 25000,
    priceKobo: 2500000,
    billingPeriod: '1 Year (Save 40%)',
    description: 'Full-year comprehensive coverage for Post-UTME, WAEC, NECO and university admissions.',
    features: [
      'All Pro features included for 365 days',
      'Post-UTME university-specific screening drills',
      'Offline PDF download bundles for all subjects',
      'Dedicated academic counseling webinars',
      'Guaranteed syllabus updates for 2026/2027 sessions',
    ],
    isPopular: false,
  },
];

export function getPlanDurationDays(plan: PlanType): number {
  switch (plan) {
    case 'PRO_ANNUAL':
      return 365;
    case 'PRO_QUARTERLY':
      return 90;
    case 'PRO_BIMONTHLY':
      return 60;
    case 'PRO_MONTHLY':
    default:
      return 30;
  }
}

// GET /api/subscriptions/plans — Public subscription tiers
router.get('/plans', (_req: Request, res: Response) => {
  res.status(200).json({ success: true, data: SUBSCRIPTION_PLANS });
});

export interface DynamicBankDetails {
  isConfigured: boolean;
  bankName: string;
  accountName: string;
  accountNumber: string;
  currency: string;
  instructions: string;
}

export async function getDynamicBankDetails(): Promise<DynamicBankDetails> {
  try {
    const setting = await SystemSetting.findOne({ key: 'OFFICIAL_BANK_DETAILS' }).lean();
    if (setting && setting.value && typeof setting.value === 'object') {
      const val = setting.value as any;
      const bankName = String(val.bankName || '').trim();
      const accountName = String(val.accountName || '').trim();
      const accountNumber = String(val.accountNumber || '').trim();
      const currency = String(val.currency || 'NGN').trim();
      const instructions = String(val.instructions || '').trim();

      const isConfigured = Boolean(bankName && accountNumber);
      return {
        isConfigured,
        bankName,
        accountName,
        accountNumber,
        currency,
        instructions: instructions || 'Use your registered MarkDriller email address as the payment narration or transfer remark.',
      };
    }
  } catch (error) {
    console.warn('⚠️ Could not fetch dynamic bank details from DB:', error);
  }

  return {
    isConfigured: false,
    bankName: '',
    accountName: '',
    accountNumber: '',
    currency: 'NGN',
    instructions: 'Official receiving bank account details are currently being updated by platform administration.',
  };
}

// GET /api/subscriptions/bank-details — Official account details for direct bank transfer (Public endpoint, dynamic from database)
router.get('/bank-details', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const details = await getDynamicBankDetails();
    res.status(200).json({ success: true, data: details });
  } catch (error) {
    next(error);
  }
});

// GET /api/subscriptions/receipts/:filename — Stream / render uploaded candidate receipt image or PDF
router.get('/receipts/:filename', (req: Request, res: Response, next: NextFunction) => {
  try {
    const rawFilename = Array.isArray(req.params.filename) ? req.params.filename[0] : req.params.filename;
    const filename = path.basename(String(rawFilename || ''));
    const filePath = path.join(RECEIPTS_DIR_ABSOLUTE, filename);

    if (!fs.existsSync(filePath)) {
      res.status(404).json({ success: false, error: { message: 'Receipt not found.' } });
      return;
    }

    const ext = path.extname(filename).toLowerCase();
    const mimeTypes: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.webp': 'image/webp',
      '.pdf': 'application/pdf',
    };

    res.setHeader('Content-Type', mimeTypes[ext] || 'application/octet-stream');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    fs.createReadStream(filePath).pipe(res);
  } catch (error) {
    next(error);
  }
});


// ----------------------------------------------------
// PAYSTACK WEBHOOK (Unauthenticated, verified via HMAC SHA-512)
// ----------------------------------------------------
router.post('/webhook', async (req: Request, res: Response): Promise<void> => {
  try {
    const signature = req.headers['x-paystack-signature'] as string;
    if (!signature) {
      res.status(401).json({ success: false, error: { message: 'Missing webhook signature.' } });
      return;
    }

    const rawBody = (req as any).rawBody || JSON.stringify(req.body);

    // Cryptographically verify signature
    const isValidSignature = PaystackService.verifyWebhookSignature(rawBody, signature);
    if (!isValidSignature) {
      res.status(401).json({ success: false, error: { message: 'Invalid webhook signature.' } });
      return;
    }

    const event = req.body;

    if (event && event.event === 'charge.success') {
      const { reference, amount } = event.data;

      const payment = await Payment.findOne({ reference });
      if (!payment) {
        // Unknown transaction reference
        res.status(200).json({ status: 'ignored', message: 'Payment record not found locally.' });
        return;
      }

      // Idempotency check: if already processed, return 200 without duplicate side effects
      if (payment.status === 'SUCCESS') {
        res.status(200).json({ status: 'success', message: 'Payment already processed.' });
        return;
      }

      payment.status = 'SUCCESS';
      payment.paidAt = event.data.paid_at ? new Date(event.data.paid_at) : new Date();
      payment.channel = event.data.channel || 'card';
      await payment.save();

      const plan: PlanType = payment.metadata?.plan || 'PRO_MONTHLY';
      const durationDays = getPlanDurationDays(plan);
      const startDate = new Date();
      const endDate = new Date(startDate.getTime() + durationDays * 24 * 60 * 60 * 1000);

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

      payment.subscriptionId = subscription._id;
      await payment.save();

      // Send confirmation email asynchronously
      const user = await User.findById(payment.userId);
      if (user) {
        const planConfig = SUBSCRIPTION_PLANS.find((p) => p.id === plan);
        sendSubscriptionEmail(
          user.email,
          user.fullName,
          planConfig?.name || plan,
          Math.round((amount || payment.amountKobo) / 100),
          reference
        );
      }
    }

    res.status(200).json({ status: 'success' });
  } catch (err) {
    console.error('Paystack webhook error:', err);
    res.status(500).json({ status: 'error' });
  }
});

// ----------------------------------------------------
// AUTHENTICATED SUBSCRIPTION ENDPOINTS
// ----------------------------------------------------
router.use(authenticateToken, requireVerified);

// GET /api/subscriptions/my-subscription — Active subscription details
router.get('/my-subscription', async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!._id;

    const sub = await Subscription.findOne({
      userId,
      status: 'ACTIVE',
    }).sort({ createdAt: -1 });

    if (!sub) {
      res.status(200).json({
        success: true,
        data: {
          plan: 'FREE',
          status: 'ACTIVE',
          startDate: req.user!.createdAt,
          endDate: null,
          isPro: false,
        },
      });
      return;
    }

    // Check if subscription has expired
    if (sub.endDate && new Date(sub.endDate) < new Date()) {
      sub.status = 'EXPIRED';
      await sub.save();
      res.status(200).json({
        success: true,
        data: {
          plan: 'FREE',
          status: 'EXPIRED',
          isPro: false,
        },
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        ...sub.toJSON(),
        isPro: sub.plan !== 'FREE',
      },
    });
  } catch (error) {
    next(error);
  }
});

const initializeSchema = z.object({
  plan: z.enum(['PRO_MONTHLY', 'PRO_BIMONTHLY', 'PRO_QUARTERLY', 'PRO_ANNUAL']),
});

// POST /api/subscriptions/initialize — Generate Paystack transaction reference
router.post('/initialize', async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { plan } = initializeSchema.parse(req.body);
    const userId = req.user!._id;
    const userEmail = req.user!.email;

    const planConfig = SUBSCRIPTION_PLANS.find((p) => p.id === plan);
    if (!planConfig) {
      res.status(400).json({ success: false, error: { message: 'Invalid subscription tier.' } });
      return;
    }

    // Generate unique collision-resistant transaction reference
    const reference = `MD_${Date.now()}_${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

    // Initialize with Paystack API
    const paystackInit = await PaystackService.initializeTransaction({
      email: userEmail,
      amountKobo: planConfig.priceKobo,
      reference,
      plan,
      metadata: {
        userId: userId.toString(),
        userEmail,
        planName: planConfig.name,
      },
    });

    // Create Payment record in PENDING status
    const payment = await Payment.create({
      userId,
      reference,
      amountKobo: planConfig.priceKobo,
      currency: 'NGN',
      provider: 'PAYSTACK',
      status: 'PENDING',
      metadata: {
        plan,
        userEmail,
        planName: planConfig.name,
        accessCode: paystackInit.accessCode,
        authorizationUrl: paystackInit.authorizationUrl,
      },
    });

    res.status(201).json({
      success: true,
      data: {
        reference: payment.reference,
        amountKobo: payment.amountKobo,
        currency: payment.currency,
        plan,
        userEmail,
        publicKey: env.PAYSTACK_PUBLIC_KEY,
        authorizationUrl: paystackInit.authorizationUrl,
        accessCode: paystackInit.accessCode,
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
});

const verifySchema = z.object({
  reference: z.string().min(1, 'Reference is required'),
});

// POST /api/subscriptions/verify — Verify Paystack reference and activate student tier
router.post('/verify', async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { reference } = verifySchema.parse(req.body);
    const userId = req.user!._id;

    const payment = await Payment.findOne({ reference, userId });
    if (!payment) {
      res.status(404).json({ success: false, error: { message: 'Transaction reference not found.' } });
      return;
    }

    // Idempotency: if already verified, return existing subscription immediately
    if (payment.status === 'SUCCESS') {
      const existingSub = await Subscription.findOne({ userId });
      res.status(200).json({
        success: true,
        message: 'Transaction was already verified successfully.',
        data: {
          ...(existingSub ? existingSub.toJSON() : {}),
          isPro: existingSub ? existingSub.plan !== 'FREE' : false,
        },
      });
      return;
    }

    // Server-side verification with official Paystack API
    const verification = await PaystackService.verifyTransaction(reference);

    if (!verification.success || verification.status !== 'success') {
      res.status(400).json({
        success: false,
        error: { message: 'Paystack transaction could not be confirmed as successful.' },
      });
      return;
    }

    // Validate amount integrity if returned by gateway
    if (verification.amountKobo > 0 && verification.amountKobo !== payment.amountKobo) {
      res.status(400).json({
        success: false,
        error: { message: 'Payment verification failed due to amount mismatch.' },
      });
      return;
    }

    // Mark payment success
    payment.status = 'SUCCESS';
    payment.paidAt = verification.paidAt || new Date();
    payment.channel = verification.channel || 'card';
    await payment.save();

    const plan: PlanType = payment.metadata?.plan || 'PRO_MONTHLY';
    const durationDays = getPlanDurationDays(plan);

    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + durationDays * 24 * 60 * 60 * 1000);

    // Create or update subscription record
    let subscription = await Subscription.findOne({ userId });
    if (subscription) {
      subscription.plan = plan;
      subscription.status = 'ACTIVE';
      subscription.startDate = startDate;
      subscription.endDate = endDate;
      await subscription.save();
    } else {
      subscription = await Subscription.create({
        userId,
        plan,
        status: 'ACTIVE',
        startDate,
        endDate,
      });
    }

    payment.subscriptionId = subscription._id;
    await payment.save();

    // Send confirmation email asynchronously
    const planConfig = SUBSCRIPTION_PLANS.find((p) => p.id === plan);
    sendSubscriptionEmail(
      req.user!.email,
      req.user!.fullName,
      planConfig?.name || plan,
      Math.round(payment.amountKobo / 100),
      payment.reference
    );

    res.status(200).json({
      success: true,
      message: 'Subscription successfully activated!',
      data: {
        plan: subscription.plan,
        status: subscription.status,
        startDate: subscription.startDate,
        endDate: subscription.endDate,
        reference: payment.reference,
        isPro: true,
      },
    });
  } catch (error) {
    next(error);
  }
});

const manualProofSchema = z.object({
  plan: z.enum(['PRO_MONTHLY', 'PRO_BIMONTHLY', 'PRO_QUARTERLY', 'PRO_ANNUAL']),
  depositorName: z.string().trim().min(2, 'Depositor name must be at least 2 characters'),
  bankName: z.string().trim().min(2, 'Bank name is required'),
  amountPaidNGN: z.number().positive('Amount paid must be greater than zero'),
  transferDate: z.string().optional(),
  proofUrl: z.string().min(5, 'Valid payment receipt or screenshot URL is required'),
  notes: z.string().max(500).optional(),
});

// POST /api/subscriptions/upload-receipt — Candidate receipt file upload (images & PDF)
router.post(
  '/upload-receipt',
  authenticateToken,
  requireVerified,
  (req, res, next) => {
    receiptUpload.single('receipt')(req, res, (err) => {
      if (err) {
        return res.status(400).json({ success: false, error: { message: err.message || 'Receipt upload error.' } });
      }
      next();
    });
  },
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.file) {
        res.status(400).json({ success: false, error: { message: 'No receipt file uploaded.' } });
        return;
      }

      const filePath = req.file.path;
      const originalName = req.file.originalname;

      // Validate authentic image or PDF binary signature (magic bytes)
      const isValidSig = await validateReceiptFileSignature(filePath);
      if (!isValidSig) {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
        res.status(400).json({
          success: false,
          error: { message: 'Uploaded file content does not match an approved image screenshot or PDF document.' },
        });
        return;
      }

      const isCloudinary = env.STORAGE_PROVIDER === 'cloudinary' && CloudinaryService.isConfigured();

      if (isCloudinary) {
        try {
          const cloudRes = await CloudinaryService.uploadFile(filePath, originalName);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
          res.status(200).json({
            success: true,
            data: {
              fileUrl: cloudRes.secureUrl,
              filename: cloudRes.publicId,
              originalName,
            },
          });
          return;
        } catch (cloudErr) {
          console.warn('Cloudinary receipt upload failed, falling back to local storage:', cloudErr);
        }
      }

      const fileUrl = `/api/subscriptions/receipts/${path.basename(req.file.filename)}`;
      res.status(200).json({
        success: true,
        data: {
          fileUrl,
          filename: req.file.filename,
          originalName,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/subscriptions/manual-proof — Submit proof of direct bank transfer for admin review
router.post(
  '/manual-proof',
  authenticateToken,
  requireVerified,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = manualProofSchema.parse(req.body);
      const userId = req.user!._id;

      const planConfig = SUBSCRIPTION_PLANS.find((p) => p.id === data.plan);
      if (!planConfig) {
        res.status(400).json({ success: false, error: { message: 'Invalid subscription plan selected.' } });
        return;
      }

      // Check for an existing pending review proof for this user
      const existingPending = await Payment.findOne({
        userId,
        provider: 'MANUAL_BANK_TRANSFER',
        status: 'PENDING_REVIEW',
      });

      if (existingPending) {
        res.status(409).json({
          success: false,
          error: {
            message:
              'You already have a manual payment proof currently pending review by our administrative team. Reference: ' +
              existingPending.reference,
          },
        });
        return;
      }

      const reference = `MNL_${Date.now()}_${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

      const payment = await Payment.create({
        userId,
        reference,
        amountKobo: Math.round(data.amountPaidNGN * 100),
        currency: 'NGN',
        provider: 'MANUAL_BANK_TRANSFER',
        status: 'PENDING_REVIEW',
        channel: 'direct_bank_transfer',
        depositorName: data.depositorName,
        bankName: data.bankName,
        proofUrl: data.proofUrl,
        transferDate: data.transferDate ? new Date(data.transferDate) : new Date(),
        metadata: {
          plan: data.plan,
          planName: planConfig.name,
          notes: data.notes || '',
          userEmail: req.user!.email,
          userFullName: req.user!.fullName,
        },
      });

      res.status(201).json({
        success: true,
        message: 'Your payment proof has been submitted successfully and is pending administrator verification.',
        data: {
          reference: payment.reference,
          status: payment.status,
          plan: data.plan,
          amountPaidNGN: data.amountPaidNGN,
          submittedAt: payment.createdAt,
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

// GET /api/subscriptions/my-payments — Return the logged-in student's complete payment history
router.get(
  '/my-payments',
  authenticateToken,
  requireVerified,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!._id;
      const payments = await Payment.find({ userId })
        .sort({ createdAt: -1 })
        .limit(50)
        .lean();

      res.status(200).json({
        success: true,
        data: payments,
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;

