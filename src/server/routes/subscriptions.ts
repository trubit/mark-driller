import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import crypto from 'crypto';
import { Subscription, PlanType } from '../models/Subscription.js';
import { Payment } from '../models/Payment.js';
import { User } from '../models/User.js';
import { authenticateToken, requireVerified, AuthenticatedRequest } from '../middleware/auth.js';
import { sendSubscriptionEmail } from '../services/emailService.js';
import { PaystackService } from '../services/paystackService.js';
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
    name: 'Pro Monthly Pass',
    priceNGN: 3500,
    priceKobo: 350000,
    billingPeriod: 'per month',
    description: 'Complete high-stakes preparation suite for JAMB / UTME and WAEC candidates.',
    features: [
      'Unlimited CBT mock examinations with official timer',
      'Full question bank access (30,000+ past questions)',
      'Detailed step-by-step worked mathematical solutions',
      'In-depth syllabus topic mastery & weakness analytics',
      'Downloadable formula sheets and revision summaries',
    ],
    isPopular: true,
  },
  {
    id: 'PRO_ANNUAL',
    name: 'Pro Annual Scholar',
    priceNGN: 25000,
    priceKobo: 2500000,
    billingPeriod: 'per year (Save 40%)',
    description: 'Full-year comprehensive coverage for Post-UTME, WAEC, and university admissions.',
    features: [
      'All Pro Monthly features included',
      'Post-UTME university-specific screening drills',
      'Offline PDF download bundles for all subjects',
      'Dedicated academic counseling webinars',
      'Guaranteed syllabus updates for 2026/2027 sessions',
    ],
    isPopular: false,
  },
];

// GET /api/subscriptions/plans — Public subscription tiers
router.get('/plans', (_req: Request, res: Response) => {
  res.status(200).json({ success: true, data: SUBSCRIPTION_PLANS });
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
    if (!isValidSignature && !PaystackService.isMockKey(env.PAYSTACK_SECRET_KEY)) {
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
      const durationDays = plan === 'PRO_ANNUAL' ? 365 : 30;
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
  plan: z.enum(['PRO_MONTHLY', 'PRO_ANNUAL']),
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
    const durationDays = plan === 'PRO_ANNUAL' ? 365 : 30;

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

export default router;
