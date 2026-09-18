import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { env } from './config/env.js';
import { connectDatabase, disconnectDatabase } from './config/database.js';
import { seedInitialData } from './utils/seedData.js';
import { apiLimiter } from './middleware/rateLimiter.js';
import { errorHandler } from './middleware/errorHandler.js';
import healthRouter from './routes/health.js';
import examBoardsRouter from './routes/examBoards.js';
import leadsRouter from './routes/leads.js';
import authRouter from './routes/auth.js';
import examsRouter from './routes/exams.js';
import questionsRouter from './routes/questions.js';
import cbtRouter from './routes/cbt.js';
import resultsRouter from './routes/results.js';
import adminRouter from './routes/admin.js';
import materialsRouter from './routes/materials.js';
import subscriptionsRouter from './routes/subscriptions.js';

const __filename = fileURLToPath(import.meta.url);

const __dirname = path.dirname(__filename);

const app = express();

// Security HTTP headers
app.use(
  helmet({
    contentSecurityPolicy: env.NODE_ENV === 'production' ? {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", 'https://js.paystack.co'],
        connectSrc: [
          "'self'",
          'https://api.paystack.co',
          'https://api.cloudinary.com',
          'https://*.onrender.com',
          'https://markdriller.com',
          'https://www.markdriller.com',
          env.CLIENT_URL,
          env.CORS_ORIGIN,
        ].filter(Boolean),
        frameSrc: ["'self'", 'https://checkout.paystack.com'],
        imgSrc: ["'self'", 'data:', 'https:', 'blob:'],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
      },
    } : false,
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    hsts: env.NODE_ENV === 'production' ? { maxAge: 31536000, includeSubDomains: true, preload: true } : false,
  })
);

// Strict CORS configuration
const allowedOrigins = [
  env.CLIENT_URL,
  env.CORS_ORIGIN,
  process.env.RENDER_EXTERNAL_URL,
  'https://markdriller.com',
  'https://www.markdriller.com',
  'http://127.0.0.1:3009',
  'http://localhost:3009',
  'http://127.0.0.1:5009',
  'http://localhost:5009',
].filter(Boolean) as string[];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile clients, curl, server-to-server)
      if (!origin) return callback(null, true);
      if (
        allowedOrigins.includes(origin) ||
        origin.endsWith('.onrender.com') ||
        (env.NODE_ENV !== 'production' && (origin.includes('localhost') || origin.includes('127.0.0.1')))
      ) {
        return callback(null, true);
      }
      return callback(new Error('CORS access denied: origin not authorized.'));
    },
    credentials: true,
  })
);

// Request body parsing with strict size limits to prevent DoS & preserve rawBody for webhook HMAC verification
app.use(
  express.json({
    limit: '100kb',
    verify: (req: any, _res, buf) => {
      req.rawBody = buf;
    },
  })
);
app.use(express.urlencoded({ extended: true, limit: '100kb' }));

// Global API rate limiting
app.use('/api', apiLimiter);

// Health check endpoint is registered BEFORE the database barrier
// so liveness probes and startup sequencing scripts answer immediately
app.use('/api/health', healthRouter);

// Ensure API requests wait for database connection to be ready
let dbReady = false;
const dbPromise = connectDatabase()
  .then(() => {
    dbReady = true;
    if (env.NODE_ENV !== 'production') {
      seedInitialData().catch((err) => console.error('Seed error:', err));
    }
  })
  .catch((err) => {
    console.error('❌ Database connection error during startup:', err);
  });


app.use('/api', async (req, res, next) => {
  if (req.path === '/health' || req.path === '/health/') {
    return next();
  }
  if (!dbReady && mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      success: false,
      error: {
        message: 'Database connection is initializing. Please retry in a few moments.',
      },
    });
  }
  next();
});

// API Route Registration
app.use('/api/auth', authRouter);
app.use('/api/exams', examsRouter);
app.use('/api/questions', questionsRouter);
app.use('/api/cbt', cbtRouter);
app.use('/api/results', resultsRouter);
app.use('/api/admin', adminRouter);
app.use('/api/materials', materialsRouter);
app.use('/api/subscriptions', subscriptionsRouter);
app.use('/api/exam-boards', examBoardsRouter);
app.use('/api/leads', leadsRouter);

// Production Static Serving
if (env.NODE_ENV === 'production') {
  const distPath = fs.existsSync(path.resolve(__dirname, '../index.html'))
    ? path.resolve(__dirname, '../')
    : path.resolve(process.cwd(), 'dist');

  app.use(express.static(distPath));
  app.get('*', (_req, res) => {
    res.sendFile(path.resolve(distPath, 'index.html'));
  });
}

// 404 for unmatched API requests
app.use('/api/*', (_req, res) => {
  res.status(404).json({
    success: false,
    error: {
      message: 'API endpoint not found',
    },
  });
});

// Centralized safe error handling
app.use(errorHandler);

// Start server immediately on 0.0.0.0
const server = app.listen(env.PORT, '0.0.0.0', () => {
  console.log(`🚀 MarkDriller Full-Stack Server running on http://127.0.0.1:${env.PORT} [${env.NODE_ENV}]`);
});

// Graceful shutdown handling
const gracefulShutdown = async (signal: string) => {
  console.log(`\n🛑 Received ${signal}. Shutting down MarkDriller server gracefully...`);
  
  server.close(async () => {
    console.log('HTTP server closed.');
    await disconnectDatabase();
    process.exit(0);
  });

  // Force shutdown after 8 seconds if still hanging
  setTimeout(() => {
    console.error('Forced shutdown after timeout.');
    process.exit(1);
  }, 8000).unref();
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

export { app, server, dbPromise };
