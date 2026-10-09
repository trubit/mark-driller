import { Request, Response, NextFunction } from 'express';
import { verifyToken, TokenPayload } from '../utils/jwt.js';
import { User, IUser, UserRole } from '../models/User.js';
import { isAuthorizedAdminEmail } from '../config/adminConfig.js';

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

    const isConfiguredAdmin = isAuthorizedAdminEmail(req.user.email);

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
 * 2. User email matches an authorized administrator email
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

  const hasAdminPrivilege =
    req.user.role === 'ADMIN' ||
    isAuthorizedAdminEmail(req.user.email);

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

export const FREE_PERMITTED_YEAR = 2024;

/**
 * Enforce authentication and verification for CBT examinations:
 * - Free Students: Allowed access to CBT suite strictly restricted to 3 free trials and the permitted Free Year (2024).
 * - Pro Students: Full unrestricted access across all years (2015–2025), all subjects, and unlimited attempts.
 * - Admin: Unrestricted administrative access.
 */
export function requireCbtEntitlement() {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ success: false, error: { message: 'Authentication required. Please sign in to access CBT examination.' } });
      return;
    }

    if (!req.user.isVerified) {
      res.status(403).json({
        success: false,
        error: {
          message: 'Email verification required before accessing CBT examination.',
          needsVerification: true,
        },
      });
      return;
    }

    next();
  };
}



