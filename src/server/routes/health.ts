import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { env } from '../config/env.js';

const router = Router();

const DB_STATUS_MAP: Record<number, string> = {
  0: 'disconnected',
  1: 'connected',
  2: 'connecting',
  3: 'disconnecting',
};

router.get('/', (_req: Request, res: Response) => {
  const dbState = mongoose.connection.readyState;
  const dbStatus = DB_STATUS_MAP[dbState] || 'unknown';

  res.status(200).json({
    success: true,
    data: {
      status: 'healthy',
      service: 'Mark Driller API',
      uptimeSeconds: Math.floor(process.uptime()),
      database: dbStatus,
      databaseReady: dbState === 1,
      email: {
        provider: env.EMAIL_PROVIDER,
        sender: 'MarkDriller <oliversmith2140@gmail.com>',
        apiConfigured: Boolean(env.BREVO_API_KEY),
      },
      timestamp: new Date().toISOString(),
    },
  });
});

export default router;
