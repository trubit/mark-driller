/**
 * MarkDriller Dedicated Background Worker Service
 *
 * Runs asynchronous scheduled jobs, question ingestion, and periodic tasks
 * isolated from the user-facing high-concurrency API server.
 */

import { env } from './config/env.js';
import { connectDatabase, disconnectDatabase } from './config/database.js';
import { questionSyncScheduler } from './services/questionSyncScheduler.js';

async function bootstrapWorker() {
  console.log('====================================================');
  console.log(' MarkDriller Background Worker Service Starting');
  console.log(` Environment: ${env.NODE_ENV}`);
  console.log('====================================================');

  try {
    // Connect with a smaller connection pool dedicated to worker tasks
    await connectDatabase({ maxPoolSize: 20, minPoolSize: 2 });
    console.log('✓ Worker connected to database.');

    // Start Question Acquisition & Sync Scheduler
    questionSyncScheduler.start();
    console.log('✓ Question synchronization scheduler active.');

    console.log('🚀 MarkDriller Worker ready and listening for jobs.');
  } catch (error) {
    console.error('❌ Fatal error during worker startup:', error);
    process.exit(1);
  }
}

// Graceful shutdown handling for container termination
const gracefulWorkerShutdown = async (signal: string) => {
  console.log(`\n🛑 Worker received ${signal}. Stopping scheduler and disconnecting...`);
  questionSyncScheduler.stop();

  try {
    await disconnectDatabase();
    console.log('✓ Worker shut down cleanly.');
    process.exit(0);
  } catch (err) {
    console.error('Error during worker shutdown:', err);
    process.exit(1);
  }
};

process.on('SIGTERM', () => gracefulWorkerShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulWorkerShutdown('SIGINT'));

bootstrapWorker();
