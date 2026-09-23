import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { Exam } from '../models/Exam.js';
import { Question } from '../models/Question.js';
import { StudyMaterial } from '../models/StudyMaterial.js';

const router = Router();

const DB_STATUS_MAP: Record<number, string> = {
  0: 'disconnected',
  1: 'connected',
  2: 'connecting',
  3: 'disconnecting',
};

router.get('/', async (_req: Request, res: Response) => {
  const dbState = mongoose.connection.readyState;
  const dbStatus = DB_STATUS_MAP[dbState] || 'unknown';

  let counts = { exams: 0, questions: 0, materials: 0 };
  if (dbState === 1) {
    try {
      const [exams, questions, materials] = await Promise.all([
        Exam.countDocuments(),
        Question.countDocuments(),
        StudyMaterial.countDocuments(),
      ]);
      counts = { exams, questions, materials };
    } catch {
      // ignore telemetry errors during transition
    }
  }

  const maskedHost = mongoose.connection.host || (env.MONGODB_URI.includes('@') ? env.MONGODB_URI.split('@')[1]?.split('?')[0] : 'local');

  res.status(200).json({
    success: true,
    data: {
      status: 'healthy',
      service: 'Mark Driller API',
      uptimeSeconds: Math.floor(process.uptime()),
      database: dbStatus,
      databaseHost: maskedHost,
      databaseReady: dbState === 1,
      counts,
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

