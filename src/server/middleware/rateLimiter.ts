import rateLimit from 'express-rate-limit';

// Custom key generator: Use authenticated user ID when available to prevent blocking multiple students behind shared campus NAT IPs
const userAwareKeyGenerator = (req: any) => {
  if (req.user && req.user._id) {
    return `usr_${req.user._id}`;
  }
  const forwarded = req.headers['x-forwarded-for'];
  const ip = Array.isArray(forwarded) ? forwarded[0] : (forwarded ? forwarded.split(',')[0].trim() : req.ip);
  return ip || 'unknown_client';
};

// Global API rate limiter: max 3000 requests per 15 minutes per user/IP
// Skips Kubernetes liveness and readiness health probes
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3000,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: userAwareKeyGenerator,
  skip: (req) => req.path === '/health' || req.path === '/api/health' || req.originalUrl === '/api/health',
  message: {
    success: false,
    error: {
      message: 'Too many requests, please try again after 15 minutes',
    },
  },
});

// Auth rate limiter: max 60 requests per 15 minutes per IP
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      message: 'Too many authentication attempts, please try again later',
    },
  },
});

// Strict rate limiter for lead submissions: max 20 requests per 15 minutes per IP
export const leadSubmissionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      message: 'Too many submissions, please try again later',
    },
  },
});

// Rate limiter for study material downloads: max 50 downloads per 15 minutes per IP
export const materialDownloadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      message: 'Download request limit reached. Please wait a few minutes before downloading more revision packs.',
    },
  },
});

// Rate limiter for material uploads: max 30 uploads per 15 minutes per IP
export const materialUploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      message: 'Upload rate limit reached. Please wait before uploading additional files.',
    },
  },
});


