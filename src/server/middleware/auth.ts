import { Request, Response, NextFunction } from 'express';
import { verifyToken, TokenPayload } from '../utils/jwt.js';
import { User, IUser, UserRole } from '../models/User.js';
import { env } from '../config/env.js';

export interface AuthenticatedRequest extends Request {
  user?: IUser;
  tokenPayload?: TokenPayload;
}

export async function authenticateToken(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    res.status(401).json({
      success: false,
      error: { message: 'Authentication required. No token provided.' },
    });
    return;
  }

  try {
    const decoded = verifyToken(token);
    const user = await User.findById(decoded.userId);

    if (!user) {
      res.status(401).json({
        success: false,
        error: { message: 'User belonging to this token no longer exists.' },
      });
      return;
    }

    if (user.accountStatus === 'SUSPENDED' || user.accountStatus === 'LOCKED') {
      res.status(403).json({
        success: false,
        error: { message: `Your account is ${user.accountStatus.toLowerCase()}. Access denied.` },
      });
      return;
    }

    req.user = user;
    req.tokenPayload = decoded;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      error: { message: 'Invalid or expired authentication token.' },
    });
  }
}

export function requireRole(allowedRoles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { message: 'Authentication required.' },
      });
      return;
    }

    const normalizedUserEmail = (req.user.email || '').trim().toLowerCase();
    const normalizedAdminEmail = (env.ADMIN_EMAIL || '').trim().toLowerCase();
    const isConfiguredAdmin = Boolean(normalizedAdminEmail) && normalizedUserEmail === normalizedAdminEmail;

    if (isConfiguredAdmin && allowedRoles.includes('ADMIN')) {
      return next();
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: { message: 'Forbidden. You do not have permission to access this resource.' },
      });
      return;
    }
    next();
  };
}

export function requireVerified(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: { message: 'Authentication required.' },
    });
    return;
  }

  if (!req.user.isVerified) {
    res.status(403).json({
      success: false,
      error: {
        message: 'Email verification required before accessing this resource.',
        needsVerification: true,
      },
    });
    return;
  }

  next();
}

/**
 * Administrator Authorization Middleware
 *
 * Grants administrative privileges if:
 * 1. User holds ADMIN role, OR
 * 2. User email matches the configured ADMIN_EMAIL
 */
export function requireAdmin(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: { message: 'Authentication required. Please sign in.' },
    });
    return;
  }

  const normalizedUserEmail = (req.user.email || '').trim().toLowerCase();
  const normalizedAdminEmail = (env.ADMIN_EMAIL || '').trim().toLowerCase();

  const hasAdminPrivilege =
    req.user.role === 'ADMIN' ||
    (Boolean(normalizedAdminEmail) && normalizedUserEmail === normalizedAdminEmail);

  if (!hasAdminPrivilege) {
    res.status(403).json({
      success: false,
      error: { message: 'Access denied. You do not possess administrator privileges.' },
    });
    return;
  }

  next();
}

export const FREE_TIER_MONTHLY_CBT_LIMIT = 3;

/**
 * Helper to query and refresh student subscription state
 */
export async function checkStudentSubscription(userId: any) {
  const { Subscription } = await import('../models/Subscription.js');
  const sub = await Subscription.findOne({ userId, status: 'ACTIVE' }).sort({ createdAt: -1 });
  
  if (!sub) {
    return { isPro: false, plan: 'FREE', status: 'ACTIVE' as const };
  }

  // Check expiration
  if (sub.endDate && new Date(sub.endDate) < new Date()) {
    sub.status = 'EXPIRED';
    await sub.save();
    return { isPro: false, plan: 'FREE', status: 'EXPIRED' as const };
  }

  return { isPro: sub.plan !== 'FREE', plan: sub.plan, status: sub.status };
}

/**
 * Enforce subscription entitlement for CBT Mock examinations
 * Free tier: Limited to FREE_TIER_MONTHLY_CBT_LIMIT (3) completed attempts per month on single syllabus scope
 * Pro tiers: Unlimited examination access across all years & multi-subject simulations
 */
export function requireCbtEntitlement() {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ success: false, error: { message: 'Authentication required.' } });
      return;
    }

    // Admins have unrestricted examination access
    if (req.user.role === 'ADMIN') {
      next();
      return;
    }

    const { isPro, plan } = await checkStudentSubscription(req.user._id);

    if (isPro) {
      next();
      return;
    }

    // Email verification check for free trial entitlement
    if (!req.user.isVerified) {
      res.status(403).json({
        success: false,
        error: {
          code: 'EMAIL_VERIFICATION_REQUIRED',
          message: 'Please verify your email address to unlock your free trial CBT practice sessions.',
        },
      });
      return;
    }

    // Timed CBT Mock exam simulation is an authoritative Pro feature
    const body = req.body || {};
    if (body.mode === 'TIMED_MOCK') {
      res.status(403).json({
        success: false,
        error: {
          code: 'SUBSCRIPTION_REQUIRED',
          message: 'Timed CBT Mock Examinations require an active Pro subscription. Upgrade to unlock full simulated exam conditions.',
          currentPlan: plan,
        },
      });
      return;
    }

    // Check multi-year or premium scope restriction for free tier
    if (body.allYears === true || (Array.isArray(body.years) && body.years.length > 1)) {
      res.status(403).json({
        success: false,
        error: {
          code: 'PREMIUM_FEATURE_REQUIRED',
          message: 'Multi-year question pooling and all-years selection are Pro Scholar features. Please upgrade to unlock the entire 20-year archive.',
          currentPlan: plan,
        },
      });
      return;
    }

    // Check monthly free attempt usage count
    const { ExamAttempt } = await import('../models/ExamAttempt.js');
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const completedThisMonth = await ExamAttempt.countDocuments({
      userId: req.user._id,
      status: 'COMPLETED',
      createdAt: { $gte: startOfMonth },
    });

    if (completedThisMonth >= FREE_TIER_MONTHLY_CBT_LIMIT) {
      res.status(403).json({
        success: false,
        error: {
          code: 'FREE_TRIAL_EXHAUSTED',
          message: `You have completed your ${FREE_TIER_MONTHLY_CBT_LIMIT} free examination attempts for this month. Upgrade to MarkDriller Pro for unlimited exams, all years, and step-by-step worked solutions.`,
          currentPlan: plan,
          completedThisMonth,
          freeLimit: FREE_TIER_MONTHLY_CBT_LIMIT,
        },
      });
      return;
    }

    // Student has free trial quota remaining
    (req as any).isFreeTrial = true;
    (req as any).freeTrialRemaining = FREE_TIER_MONTHLY_CBT_LIMIT - completedThisMonth;
    next();
  };
}


