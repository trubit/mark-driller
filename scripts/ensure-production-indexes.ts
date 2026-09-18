/**
 * MarkDriller Production Database Index Verification & Sync
 * 
 * Invoked during deployment / bootstrap to guarantee all compound indexes,
 * unique constraints, and text indexes are created in MongoDB ahead of traffic.
 */

import mongoose from 'mongoose';
import { env } from '../src/server/config/env.js';
import {
  User,
  Profile,
  Exam,
  Subject,
  Topic,
  Question,
  Bookmark,
  ExamAttempt,
  Result,
  StudyMaterial,
  Subscription,
  Payment,
  QuestionSyncLog,
} from '../src/server/models/index.js';

const models = [
  { name: 'User', model: User },
  { name: 'Profile', model: Profile },
  { name: 'Exam', model: Exam },
  { name: 'Subject', model: Subject },
  { name: 'Topic', model: Topic },
  { name: 'Question', model: Question },
  { name: 'Bookmark', model: Bookmark },
  { name: 'ExamAttempt', model: ExamAttempt },
  { name: 'Result', model: Result },
  { name: 'StudyMaterial', model: StudyMaterial },
  { name: 'Subscription', model: Subscription },
  { name: 'Payment', model: Payment },
  { name: 'QuestionSyncLog', model: QuestionSyncLog },
];

async function ensureIndexes() {
  console.log('====================================================');
  console.log('MARKDRILLER — PRODUCTION DATABASE INDEX SYNCHRONIZATION');
  console.log('====================================================');
  console.log(`Connecting to MongoDB URI: ${env.MONGODB_URI.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@')}`);

  await mongoose.connect(env.MONGODB_URI, {
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
  });

  console.log('Connected to database:', mongoose.connection.name);

  for (const { name, model } of models) {
    try {
      console.log(`\nSynchronizing indexes for model [${name}]...`);
      await model.syncIndexes();
      const existingIndexes = await model.collection.indexes();
      console.log(`✔ [${name}] has ${existingIndexes.length} active indexes:`);
      for (const idx of existingIndexes) {
        console.log(`   - ${idx.name}: ${JSON.stringify(idx.key)}`);
      }
    } catch (err) {
      console.error(`❌ Error synchronizing indexes for ${name}:`, err);
      throw err;
    }
  }

  console.log('\n====================================================');
  console.log('✔ All production database indexes verified and synchronized successfully.');
  console.log('====================================================');
}

ensureIndexes()
  .then(async () => {
    await mongoose.disconnect();
    process.exit(0);
  })
  .catch(async (err) => {
    console.error('Fatal error during index synchronization:', err);
    await mongoose.disconnect().catch(() => {});
    process.exit(1);
  });
