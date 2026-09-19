import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { Profile } from '../models/Profile.js';
import { Exam } from '../models/Exam.js';
import { generateToken } from '../utils/jwt.js';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimiter.js';
import { generateNumericOtp, hashOtp, verifyOtpHash } from '../utils/otp.js';
import { sendVerificationEmail, sendPasswordResetEmail } from '../services/emailService.js';
import { env } from '../config/env.js';

const router = Router();

const registerSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Please provide a valid email address').max(100),
  password: z.string().min(6, 'Password must be at least 6 characters').max(100),
  targetExamCode: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email('Please provide a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

const verifyEmailSchema = z.object({
  email: z.string().email('Please provide a valid email address'),
  otp: z.string().length(6, 'Verification code must be exactly 6 digits'),
});

const resendVerificationSchema = z.object({
  email: z.string().email('Please provide a valid email address'),
});

const forgotPasswordSchema = z.object({
  email: z.string().email('Please provide a valid email address'),
});

const verifyResetOtpSchema = z.object({
  email: z.string().email('Please provide a valid email address'),
  otp: z.string().length(6, 'Reset code must be exactly 6 digits'),
});

const resetPasswordSchema = z.object({
  email: z.string().email('Please provide a valid email address'),
  otp: z.string().length(6, 'Reset code must be exactly 6 digits'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters').max(100),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters'),
});

// POST /api/auth/register — Full lifecycle with OTP generation and dispatch
router.post(
  '/register',
  authLimiter,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = registerSchema.parse(req.body);

      const existingUser = await User.findOne({ email: data.email.toLowerCase() });
      if (existingUser) {
        res.status(409).json({
          success: false,
          error: { message: 'An account with this email address already exists.' },
        });
        return;
      }

      // Hash password with bcrypt (12 salt rounds)
      const salt = await bcrypt.genSalt(12);
      const passwordHash = await bcrypt.hash(data.password, salt);

      // Check if target exam code exists
      let targetExamId = undefined;
      if (data.targetExamCode) {
        const exam = await Exam.findOne({ shortCode: data.targetExamCode.toUpperCase() });
        if (exam) {
          targetExamId = exam._id;
        }
      }

      // Generate 6-digit verification OTP
      const plainOtp = generateNumericOtp();
      const hashedOtp = hashOtp(plainOtp);
      const otpExpires = new Date(Date.now() + env.OTP_EXPIRATION_MINUTES * 60 * 1000);

      const user = await User.create({
        fullName: data.fullName,
        email: data.email.toLowerCase(),
        passwordHash,
        role: 'STUDENT',
        targetExam: targetExamId,
        isVerified: false,
        verificationOtp: hashedOtp,
        verificationOtpExpires: otpExpires,
        verificationOtpAttempts: 0,
        verificationOtpLastSent: new Date(),
      });

      // Create linked default Profile
      await Profile.create({
        userId: user._id,
      });

      // Dispatch verification email
      try {
        await sendVerificationEmail(user.email, user.fullName, plainOtp, env.OTP_EXPIRATION_MINUTES);
      } catch (emailErr: any) {
        console.error('⚠️ [AUTH REGISTRATION] Failed to dispatch verification email:', emailErr?.message || emailErr);
      }

      const token = generateToken({
        userId: user._id.toString(),
        email: user.email,
        role: user.role,
      });

      res.status(201).json({
        success: true,
        message: 'Account created successfully. A 6-digit verification code has been sent to your email.',
        data: {
          token,
          user: user.toJSON(),
          needsVerification: true,
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

// POST /api/auth/login
router.post(
  '/login',
  authLimiter,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = loginSchema.parse(req.body);

      // Select passwordHash explicitly since it is excluded by default
      const user = await User.findOne({ email: data.email.toLowerCase() })
        .select('+passwordHash')
        .populate('targetExam', 'name shortCode');

      if (!user) {
        res.status(401).json({
          success: false,
          error: { message: 'The email address or password you entered is incorrect.' },
        });
        return;
      }

      if (user.accountStatus === 'SUSPENDED' || user.accountStatus === 'LOCKED') {
        res.status(403).json({
          success: false,
          error: { message: 'Your account has been suspended. Please contact support@markdriller.com.' },
        });
        return;
      }

      const isMatch = await user.comparePassword(data.password);
      if (!isMatch) {
        res.status(401).json({
          success: false,
          error: { message: 'The email address or password you entered is incorrect.' },
        });
        return;
      }

      const token = generateToken({
        userId: user._id.toString(),
        email: user.email,
        role: user.role,
      });

      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: {
          token,
          user: user.toJSON(),
          needsVerification: !user.isVerified,
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

// POST /api/auth/verify-email — Verify 6-digit OTP and activate account
router.post(
  '/verify-email',
  authLimiter,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email, otp } = verifyEmailSchema.parse(req.body);

      const user = await User.findOne({ email: email.toLowerCase() })
        .select('+verificationOtp +verificationOtpExpires +verificationOtpAttempts');

      if (!user) {
        res.status(404).json({ success: false, error: { message: 'User account not found.' } });
        return;
      }

      if (user.isVerified) {
        res.status(200).json({
          success: true,
          message: 'Account is already verified.',
          data: { isVerified: true },
        });
        return;
      }

      if (!user.verificationOtp || !user.verificationOtpExpires) {
        res.status(400).json({
          success: false,
          error: { message: 'No pending verification code found. Please request a new code.' },
        });
        return;
      }

      // Check max attempts
      if (user.verificationOtpAttempts >= env.OTP_MAX_ATTEMPTS) {
        res.status(429).json({
          success: false,
          error: { message: 'Maximum verification attempts exceeded. Please request a new code.' },
        });
        return;
      }

      // Check expiration
      if (new Date() > user.verificationOtpExpires) {
        res.status(400).json({
          success: false,
          error: { message: 'Verification code has expired. Please request a new code.' },
        });
        return;
      }

      // Verify OTP hash
      const isValid = verifyOtpHash(otp, user.verificationOtp);
      if (!isValid) {
        user.verificationOtpAttempts += 1;
        await user.save();
        const attemptsLeft = env.OTP_MAX_ATTEMPTS - user.verificationOtpAttempts;
        res.status(400).json({
          success: false,
          error: {
            message: `Invalid verification code. ${attemptsLeft > 0 ? `${attemptsLeft} attempt(s) remaining.` : 'Code locked, please request a new code.'}`,
          },
        });
        return;
      }

      // Success: mark verified and invalidate OTP
      user.isVerified = true;
      user.verificationOtp = undefined;
      user.verificationOtpExpires = undefined;
      user.verificationOtpAttempts = 0;
      await user.save();

      res.status(200).json({
        success: true,
        message: 'Email successfully verified! Your account is now fully active.',
        data: { isVerified: true },
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

// POST /api/auth/resend-verification — Controlled resend with cooldown
router.post(
  '/resend-verification',
  authLimiter,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email } = resendVerificationSchema.parse(req.body);

      const user = await User.findOne({ email: email.toLowerCase() })
        .select('+verificationOtpLastSent');

      if (!user) {
        // Safe response to prevent enumeration
        res.status(200).json({
          success: true,
          message: 'If the email exists and requires verification, a new code has been sent.',
        });
        return;
      }

      if (user.isVerified) {
        res.status(200).json({
          success: true,
          message: 'Account is already verified.',
          data: { isVerified: true },
        });
        return;
      }

      // Cooldown check
      if (user.verificationOtpLastSent) {
        const elapsedSec = (Date.now() - user.verificationOtpLastSent.getTime()) / 1000;
        if (elapsedSec < env.OTP_RESEND_COOLDOWN_SECONDS) {
          const waitSec = Math.ceil(env.OTP_RESEND_COOLDOWN_SECONDS - elapsedSec);
          res.status(429).json({
            success: false,
            error: { message: `Please wait ${waitSec} seconds before requesting another code.` },
          });
          return;
        }
      }

      const plainOtp = generateNumericOtp();
      user.verificationOtp = hashOtp(plainOtp);
      user.verificationOtpExpires = new Date(Date.now() + env.OTP_EXPIRATION_MINUTES * 60 * 1000);
      user.verificationOtpAttempts = 0;
      user.verificationOtpLastSent = new Date();
      await user.save();

      // Dispatch fresh verification email
      try {
        await sendVerificationEmail(user.email, user.fullName, plainOtp, env.OTP_EXPIRATION_MINUTES);
      } catch (emailErr: any) {
        console.error('⚠️ [AUTH RESEND OTP] Failed to dispatch verification email:', emailErr?.message || emailErr);
      }

      res.status(200).json({
        success: true,
        message: 'A fresh verification code has been dispatched to your email.',
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

// POST /api/auth/forgot-password — Request password reset OTP
router.post(
  '/forgot-password',
  authLimiter,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email } = forgotPasswordSchema.parse(req.body);

      const user = await User.findOne({ email: email.toLowerCase() })
        .select('+resetPasswordOtpLastSent');

      if (!user) {
        // Constant-time-like generic response to prevent account enumeration
        res.status(200).json({
          success: true,
          message: 'If an account exists with this email address, a password recovery code has been sent.',
        });
        return;
      }

      // Cooldown check
      if (user.resetPasswordOtpLastSent) {
        const elapsedSec = (Date.now() - user.resetPasswordOtpLastSent.getTime()) / 1000;
        if (elapsedSec < env.OTP_RESEND_COOLDOWN_SECONDS) {
          const waitSec = Math.ceil(env.OTP_RESEND_COOLDOWN_SECONDS - elapsedSec);
          res.status(429).json({
            success: false,
            error: { message: `Please wait ${waitSec} seconds before requesting another password reset code.` },
          });
          return;
        }
      }

      const plainOtp = generateNumericOtp();
      user.resetPasswordOtp = hashOtp(plainOtp);
      user.resetPasswordOtpExpires = new Date(Date.now() + env.OTP_EXPIRATION_MINUTES * 60 * 1000);
      user.resetPasswordOtpAttempts = 0;
      user.resetPasswordOtpLastSent = new Date();
      await user.save();

      // Dispatch password reset email
      try {
        await sendPasswordResetEmail(user.email, user.fullName, plainOtp, env.OTP_EXPIRATION_MINUTES);
      } catch (emailErr: any) {
        console.error('⚠️ [AUTH FORGOT PASSWORD] Failed to dispatch password reset email:', emailErr?.message || emailErr);
      }

      res.status(200).json({
        success: true,
        message: 'If an account exists with this email address, a password recovery code has been sent.',
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

// POST /api/auth/verify-reset-otp — Validate recovery OTP before entering new password
router.post(
  '/verify-reset-otp',
  authLimiter,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email, otp } = verifyResetOtpSchema.parse(req.body);

      const user = await User.findOne({ email: email.toLowerCase() })
        .select('+resetPasswordOtp +resetPasswordOtpExpires +resetPasswordOtpAttempts');

      if (!user || !user.resetPasswordOtp || !user.resetPasswordOtpExpires) {
        res.status(400).json({
          success: false,
          error: { message: 'Invalid or expired password reset request.' },
        });
        return;
      }

      if (user.resetPasswordOtpAttempts >= env.OTP_MAX_ATTEMPTS) {
        res.status(429).json({
          success: false,
          error: { message: 'Maximum recovery attempts exceeded. Please request a new password reset code.' },
        });
        return;
      }

      if (new Date() > user.resetPasswordOtpExpires) {
        res.status(400).json({
          success: false,
          error: { message: 'Password recovery code has expired. Please request a new code.' },
        });
        return;
      }

      const isValid = verifyOtpHash(otp, user.resetPasswordOtp);
      if (!isValid) {
        user.resetPasswordOtpAttempts += 1;
        await user.save();
        const attemptsLeft = env.OTP_MAX_ATTEMPTS - user.resetPasswordOtpAttempts;
        res.status(400).json({
          success: false,
          error: {
            message: `Invalid recovery code. ${attemptsLeft > 0 ? `${attemptsLeft} attempt(s) remaining.` : 'Code locked, please request a new code.'}`,
          },
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Recovery code verified successfully.',
        data: { valid: true },
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

// POST /api/auth/reset-password — Set new password using verified OTP
router.post(
  '/reset-password',
  authLimiter,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email, otp, newPassword } = resetPasswordSchema.parse(req.body);

      const user = await User.findOne({ email: email.toLowerCase() })
        .select('+resetPasswordOtp +resetPasswordOtpExpires +resetPasswordOtpAttempts +passwordHash');

      if (!user || !user.resetPasswordOtp || !user.resetPasswordOtpExpires) {
        res.status(400).json({
          success: false,
          error: { message: 'Invalid or expired password reset request.' },
        });
        return;
      }

      if (user.resetPasswordOtpAttempts >= env.OTP_MAX_ATTEMPTS) {
        res.status(429).json({
          success: false,
          error: { message: 'Maximum attempts exceeded. Please request a fresh password recovery code.' },
        });
        return;
      }

      if (new Date() > user.resetPasswordOtpExpires) {
        res.status(400).json({
          success: false,
          error: { message: 'Password recovery code has expired.' },
        });
        return;
      }

      const isValid = verifyOtpHash(otp, user.resetPasswordOtp);
      if (!isValid) {
        user.resetPasswordOtpAttempts += 1;
        await user.save();
        res.status(400).json({
          success: false,
          error: { message: 'Invalid recovery code.' },
        });
        return;
      }

      // Hash new password with bcrypt salt 12
      const salt = await bcrypt.genSalt(12);
      user.passwordHash = await bcrypt.hash(newPassword, salt);

      // Invalidate reset OTP
      user.resetPasswordOtp = undefined;
      user.resetPasswordOtpExpires = undefined;
      user.resetPasswordOtpAttempts = 0;
      await user.save();

      res.status(200).json({
        success: true,
        message: 'Password updated successfully! You may now log in with your new password.',
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

// GET /api/auth/me
router.get(
  '/me',
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await User.findById(req.user!._id)
        .populate('targetExam', 'name shortCode description')
        .populate('selectedSubjects', 'name code');

      const profile = await Profile.findOne({ userId: req.user!._id });

      res.status(200).json({
        success: true,
        data: {
          user: user?.toJSON(),
          profile,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/auth/change-password
router.post(
  '/change-password',
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = changePasswordSchema.parse(req.body);

      const user = await User.findById(req.user!._id).select('+passwordHash');
      if (!user) {
        res.status(404).json({ success: false, error: { message: 'User not found' } });
        return;
      }

      const isMatch = await user.comparePassword(data.currentPassword);
      if (!isMatch) {
        res.status(400).json({
          success: false,
          error: { message: 'Current password is incorrect.' },
        });
        return;
      }

      const salt = await bcrypt.genSalt(12);
      user.passwordHash = await bcrypt.hash(data.newPassword, salt);
      await user.save();

      res.status(200).json({
        success: true,
        message: 'Password changed successfully.',
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

// POST /api/auth/logout
router.post('/logout', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Logged out successfully.',
  });
});

export default router;
