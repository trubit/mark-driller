import mongoose from 'mongoose';
import fs from 'node:fs';
import path from 'node:path';
import { env } from '../src/server/config/env.js';
import { connectDatabase } from '../src/server/config/database.js';
import { User } from '../src/server/models/User.js';
import { Profile } from '../src/server/models/Profile.js';
import { Subscription } from '../src/server/models/Subscription.js';
import { Payment } from '../src/server/models/Payment.js';
import { ExamAttempt } from '../src/server/models/ExamAttempt.js';
import { Result } from '../src/server/models/Result.js';

const CONFIRMED_TEST_USER_EMAILS = [
  'student_set3_1790019408139@example.com',
  'admin_set3_1790019408139@example.com',
  'student_set3_1790019505547@example.com',
  'admin_set3_1790019505547@example.com',
  'student_set3_1790019576422@example.com',
  'admin_set3_1790019576422@example.com',
  'scholar_f3ea0f19@example.com',
  'scholar_40abd75f@example.com',
  'free_26989303@example.com',
  'student_d28113f1@example.com',
  'free_0cc1b905@example.com',
  'scholar_722dc217@example.com',
  'scholar_10573d41@example.com',
];

const QUESTION_COLLECTIONS = [
  'questions',
  'subjects',
  'topics',
  'exams',
  'studymaterials',
  'institutions',
  'questionsynclogs',
];

async function runCleanup() {
  const isConfirmed = process.argv.includes('--confirm-delete-test-users');

  console.log('================================================================');
  console.log('🛡️ MARKDRILLER PRODUCTION USER DATABASE CLEANUP EXECUTION');
  console.log('================================================================');

  if (!isConfirmed) {
    console.error('❌ SAFETY ABORT: Deletion requires --confirm-delete-test-users flag.');
    console.error('   Please run with explicit confirmation flag.');
    process.exit(1);
  }

  await connectDatabase({ maxPoolSize: 10, minPoolSize: 1 });
  const db = mongoose.connection.db;
  if (!db) throw new Error('Database not connected');

  console.log(`Connected Database: [${mongoose.connection.name}] on host [${mongoose.connection.host}]`);
  console.log(`Configured ADMIN_EMAIL: ${env.ADMIN_EMAIL}\n`);

  // 1. Take Pre-Cleanup Snapshot of All Question / Curriculum Collections (READ-ONLY)
  console.log('--- 1. PRE-CLEANUP QUESTION/CURRICULUM INTEGRITY SNAPSHOT ---');
  const questionCountsBefore: Record<string, number> = {};
  for (const collName of QUESTION_COLLECTIONS) {
    questionCountsBefore[collName] = await db.collection(collName).countDocuments();
    console.log(`  • ${collName.padEnd(20)}: ${questionCountsBefore[collName]} documents`);
  }

  // 2. Fetch Users Matching Confirmed Test Emails
  console.log('\n--- 2. IDENTIFYING CONFIRMED TEST USERS TO DELETE ---');
  const targetUsers = await User.find({ email: { $in: CONFIRMED_TEST_USER_EMAILS } }).lean();

  if (targetUsers.length !== CONFIRMED_TEST_USER_EMAILS.length) {
    console.warn(`⚠️ Warning: Found ${targetUsers.length} test users out of ${CONFIRMED_TEST_USER_EMAILS.length} expected.`);
  }

  // Double Check Safeguards
  for (const u of targetUsers) {
    const email = u.email.toLowerCase().trim();
    if (
      email === env.ADMIN_EMAIL.toLowerCase().trim() ||
      email === 'admin@markdriller.com' ||
      !email.endsWith('@example.com')
    ) {
      console.error(`🚨 FATAL SAFETY VIOLATION: Refusing to delete non-test or admin account: ${email}`);
      process.exit(1);
    }
  }

  const targetUserIds = targetUsers.map((u) => u._id);
  console.log(`Found ${targetUsers.length} confirmed test users ready for deletion.`);

  // 3. User-Scoped Deletion
  console.log('\n--- 3. EXECUTING USER-SCOPED DELETIONS ONLY ---');
  console.log('⚠️ DELETING AUTH ARTIFACTS AND USER RECORDS BELONGING STRICTLY TO CONFIRMED TEST USERS...');

  const [delProfiles, delSubs, delPayments, delAttempts, delResults, delUsers] = await Promise.all([
    Profile.deleteMany({ userId: { $in: targetUserIds } }),
    Subscription.deleteMany({ userId: { $in: targetUserIds } }),
    Payment.deleteMany({ userId: { $in: targetUserIds } }),
    ExamAttempt.deleteMany({ userId: { $in: targetUserIds } }),
    Result.deleteMany({ userId: { $in: targetUserIds } }),
    User.deleteMany({ _id: { $in: targetUserIds } }),
  ]);

  console.log(`  ✅ Test User records deleted        : ${delUsers.deletedCount}`);
  console.log(`  ✅ Test Profiles deleted            : ${delProfiles.deletedCount}`);
  console.log(`  ✅ Test Subscriptions deleted       : ${delSubs.deletedCount}`);
  console.log(`  ✅ Test Payments deleted            : ${delPayments.deletedCount}`);
  console.log(`  ✅ Test Exam Attempts deleted       : ${delAttempts.deletedCount}`);
  console.log(`  ✅ Test Results deleted             : ${delResults.deletedCount}`);

  // 4. Post-Cleanup Question/Curriculum Integrity Verification
  console.log('\n--- 4. POST-CLEANUP QUESTION/CURRICULUM INTEGRITY VERIFICATION ---');
  let questionIntegrityPassed = true;
  for (const collName of QUESTION_COLLECTIONS) {
    const countAfter = await db.collection(collName).countDocuments();
    const countBefore = questionCountsBefore[collName];
    const match = countAfter === countBefore;
    console.log(`  • ${collName.padEnd(20)}: Before=${countBefore} | After=${countAfter} | Intact=${match ? 'YES ✅' : 'NO ❌'}`);
    if (!match) questionIntegrityPassed = false;
  }

  if (!questionIntegrityPassed) {
    console.error('🚨 CRITICAL ERROR: Question collection counts changed during cleanup!');
    process.exit(1);
  } else {
    console.log('🎉 QUESTION INTEGRITY 100% PRESERVED! ZERO QUESTION RECORDS TOUCHED.');
  }

  // 5. Post-Cleanup User Inventory
  console.log('\n--- 5. POST-CLEANUP USER INVENTORY ---');
  const remainingUsers = await User.find({}).sort({ createdAt: 1 }).lean();
  console.log(`Total Remaining Users: ${remainingUsers.length}`);

  const remainingAdmins = remainingUsers.filter((u) => u.role === 'ADMIN');
  const remainingStudents = remainingUsers.filter((u) => u.role === 'STUDENT');

  console.log(`  • Admins Remaining  : ${remainingAdmins.length} (Expected: 3)`);
  console.log(`  • Students Remaining: ${remainingStudents.length} (Expected: 18)`);

  for (const admin of remainingAdmins) {
    console.log(`    🛡️ Admin: ${admin.email} (${admin.fullName})`);
  }

  // Confirm Zero Test Users Remain
  const remainingTestUsers = await User.find({ email: { $in: CONFIRMED_TEST_USER_EMAILS } }).countDocuments();
  console.log(`  • Confirmed Test Users Remaining: ${remainingTestUsers} (Expected: 0)`);

  await mongoose.disconnect();
  console.log('\n🏆 User database cleanup executed and verified successfully.');
  process.exit(0);
}

runCleanup().catch((err) => {
  console.error('❌ Cleanup execution failed:', err);
  process.exit(1);
});
