import { z } from 'zod';
import path from 'node:path';
import fs from 'node:fs';

// Load environment variables from .env file natively if available
const envPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envPath) && typeof process.loadEnvFile === 'function') {
  try {
    process.loadEnvFile(envPath);
  } catch (e) {
    console.warn('Notice: error reading .env file:', e);
  }
}

const defaultAppUrl = process.env.APP_URL || process.env.RENDER_EXTERNAL_URL || (process.env.NODE_ENV === 'production' ? 'https://markdriller.com' : 'http://127.0.0.1:5009');
const defaultClientUrl = process.env.CLIENT_URL || process.env.RENDER_EXTERNAL_URL || (process.env.NODE_ENV === 'production' ? 'https://markdriller.com' : 'http://127.0.0.1:3009');
const defaultCorsOrigin = process.env.CORS_ORIGIN || process.env.RENDER_EXTERNAL_URL || (process.env.NODE_ENV === 'production' ? 'https://markdriller.com' : 'http://localhost:3009');
const rawMongoUri = process.env.MONGODB_URI || process.env.MONGODB_URL;
const defaultMongoUri = rawMongoUri || (process.env.ALLOW_LOCAL_DB === 'true' ? 'mongodb://127.0.0.1:27017/markdriller' : (process.env.NODE_ENV === 'production' ? 'mongodb://markdriller-mongodb:27017/markdriller' : 'mongodb://127.0.0.1:27017/markdriller'));

export const envSchema = z.object({
  PORT: z.string().default('5009').transform((val) => parseInt(val, 10)),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  APP_URL: z.string().default(defaultAppUrl),
  CLIENT_URL: z.string().default(defaultClientUrl),
  CORS_ORIGIN: z.string().default(defaultCorsOrigin),
  MONGODB_URI: z.string().default(defaultMongoUri),
  // Administrator Email Authorization (Required server-side configuration)
  ADMIN_EMAIL: z
    .string()
    .email('ADMIN_EMAIL must be a valid email address')
    .default('admin@markdriller.com')
    .transform((val) => val.trim().toLowerCase()),

  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters').default('markdriller_dev_super_secret_jwt_key_2026_change_in_production'),
  JWT_EXPIRES_IN: z.string().default('24h'),
  SESSION_SECRET: z.string().default('markdriller_session_secret_2026'),

  // Email Configuration (SMTP / Brevo)
  EMAIL_PROVIDER: z.string().default('brevo'),
  EMAIL_HOST: z.string().default('smtp-relay.brevo.com'),
  EMAIL_PORT: z.string().default('465').transform((val) => parseInt(val, 10)),
  EMAIL_USER: z.string().default(''),
  EMAIL_PASSWORD: z.string().default(''),
  EMAIL_FROM: z.string().default('"MarkDriller" <oliversmith2140@gmail.com>'),
  BREVO_API_KEY: z.string().default(''),

  // OTP Configuration
  OTP_EXPIRATION_MINUTES: z.string().default('15').transform((val) => parseInt(val, 10)),
  OTP_MAX_ATTEMPTS: z.string().default('5').transform((val) => parseInt(val, 10)),
  OTP_RESEND_COOLDOWN_SECONDS: z.string().default('60').transform((val) => parseInt(val, 10)),

  // Paystack Configuration
  PAYSTACK_SECRET_KEY: z.string().default('sk_test_mock_secret_key_markdriller_2026'),
  PAYSTACK_PUBLIC_KEY: z.string().default('pk_test_mock_public_key_markdriller_2026'),
  PAYSTACK_WEBHOOK_SECRET: z.string().default('whsec_markdriller_webhook_secret_2026'),

  // Storage Configuration
  STORAGE_PROVIDER: z.enum(['local', 'cloudinary']).default('local'),
  STORAGE_DIR: z.string().default('uploads/materials'),
  CLOUDINARY_CLOUD_NAME: z.string().default(''),
  CLOUDINARY_API_KEY: z.string().default(''),
  CLOUDINARY_API_SECRET: z.string().default(''),
  CLOUDINARY_FOLDER: z.string().default('markdriller/materials'),

  // Dynamic Question Acquisition & Synchronization
  QUESTION_SYNC_ENABLED: z.string().default('false').transform((val) => val === 'true' || val === '1'),
  QUESTION_SYNC_INTERVAL_HOURS: z.string().default('6').transform((val) => Math.max(1, parseInt(val, 10) || 6)),
  QUESTION_SOURCE_API_URL: z.string().default(''),
  QUESTION_SOURCE_API_KEY: z.string().default(''),
  QUESTION_SOURCE_TIMEOUT_MS: z.string().default('10000').transform((val) => parseInt(val, 10) || 10000),
  QUESTION_SOURCE_BATCH_SIZE: z.string().default('50').transform((val) => parseInt(val, 10) || 50),
  QUESTION_AUTO_PUBLISH: z.string().default('false').transform((val) => val === 'true' || val === '1'),
}).refine(
  (data) => {
    if (data.NODE_ENV === 'production') {
      if (data.JWT_SECRET.includes('change_in_production') || data.JWT_SECRET === 'markdriller_dev_super_secret_jwt_key_2026_change_in_production') {
        return false;
      }
    }
    return true;
  },
  {
    message: 'CRITICAL SECURITY ERROR: Default development JWT_SECRET cannot be used in production environment.',
    path: ['JWT_SECRET'],
  }
).refine(
  (data) => {
    if (data.NODE_ENV === 'production') {
      if (data.SESSION_SECRET === 'markdriller_session_secret_2026') {
        return false;
      }
    }
    return true;
  },
  {
    message: 'CRITICAL SECURITY ERROR: Default SESSION_SECRET cannot be used in production environment.',
    path: ['SESSION_SECRET'],
  }
).refine(
  (data) => {
    if (data.NODE_ENV === 'production' && process.env.ALLOW_LOCAL_DB !== 'true') {
      if (data.MONGODB_URI.includes('127.0.0.1') || data.MONGODB_URI.includes('localhost')) {
        return false;
      }
    }
    return true;
  },
  {
    message: 'CRITICAL CONFIGURATION ERROR: Production MONGODB_URI must not point to localhost or 127.0.0.1 unless ALLOW_LOCAL_DB=true is set.',
    path: ['MONGODB_URI'],
  }
).refine(
  (data) => {
    if (data.NODE_ENV === 'production') {
      if (data.PAYSTACK_SECRET_KEY.includes('_mock_') || data.PAYSTACK_SECRET_KEY.startsWith('sk_test_mock')) {
        return false;
      }
    }
    return true;
  },
  {
    message: 'CRITICAL CONFIGURATION ERROR: Mock Paystack keys are strictly forbidden in production environment.',
    path: ['PAYSTACK_SECRET_KEY'],
  }
).refine(
  (data) => {
    if (data.NODE_ENV === 'production') {
      const urls = [data.APP_URL, data.CLIENT_URL, data.CORS_ORIGIN];
      if (urls.some(u => u.includes('localhost') || u.includes('127.0.0.1'))) {
        return false;
      }
    }
    return true;
  },
  {
    message: 'CRITICAL CONFIGURATION ERROR: Production URLs (APP_URL, CLIENT_URL, CORS_ORIGIN) must not point to localhost or 127.0.0.1.',
    path: ['CLIENT_URL'],
  }
);

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:', parsed.error.format());
  process.exit(1);
}

export const env = parsed.data;

