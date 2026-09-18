import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env.js';

export interface AppError extends Error {
  statusCode?: number;
  details?: unknown;
  code?: number | string;
  keyValue?: Record<string, unknown>;
}

export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  let statusCode = err.statusCode || 500;
  let userMessage = 'We’re unable to complete this request right now. Please try again shortly.';
  let details: unknown = err.details;

  // Detailed technical logging strictly on the server
  console.error(
    `[Server Exception] ${req.method} ${req.originalUrl} | Status: ${statusCode} | ${err.name || 'Error'}: ${err.message}`
  );
  if (err.stack && env.NODE_ENV !== 'production') {
    console.error(err.stack);
  }

  // 1. Mongoose CastError (invalid ObjectId format)
  if (err.name === 'CastError') {
    statusCode = 400;
    userMessage = 'The requested resource identifier format is invalid.';
  }

  // 2. MongoDB Duplicate Key (code 11000)
  else if (err.code === 11000 || (err as any).name === 'MongoServerError' && err.code === 11000) {
    statusCode = 409;
    userMessage = 'An entry with these details already exists in the system.';
  }

  // 3. Zod Validation Error
  else if (err.name === 'ZodError') {
    statusCode = 400;
    userMessage = 'Please check your submission details and correct any highlighted errors.';
    if ((err as any).flatten) {
      details = (err as any).flatten().fieldErrors;
    }
  }

  // 4. JWT Authentication Errors
  else if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    statusCode = 401;
    userMessage = 'Your session has expired. Please sign in again to continue.';
  }

  // 5. Explicit Client Errors (4xx with custom safe messages)
  else if (statusCode >= 400 && statusCode < 500 && err.message) {
    // Disallow raw database or internal words in client-facing messages
    const rawLower = err.message.toLowerCase();
    const hasSensitiveWords =
      rawLower.includes('mongo') ||
      rawLower.includes('sql') ||
      rawLower.includes('collection') ||
      rawLower.includes('table') ||
      rawLower.includes('query') ||
      rawLower.includes('schema');

    userMessage = hasSensitiveWords
      ? 'The requested operation could not be completed with the provided data.'
      : err.message;
  }

  // 6. Server Errors (5xx)
  else {
    statusCode = 500;
    userMessage = 'We’re unable to complete this request right now. Please try again shortly.';
  }

  res.status(statusCode).json({
    success: false,
    error: {
      message: userMessage,
      ...(details ? { details } : {}),
    },
  });
};
