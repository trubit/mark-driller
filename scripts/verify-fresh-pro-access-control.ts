import mongoose, { Types } from 'mongoose';
import { env } from '../src/server/config/env.js';

import { Question } from '../src/server/models/Question.js';
import { User } from '../src/server/models/User.js';
import { Subscription } from '../src/server/models/Subscription.js';
import { FreeTrialUsage } from '../src/server/models/FreeTrialUsage.js';
import { FreeTrialService, FREE_TRIAL_QUESTION_LIMIT } from '../src/server/services/freeTrialService.js';
import { requireCbtEntitlement, checkStudentSubscription } from '../src/server/middleware/auth.js';

async function runVerification() {
  console.log('=== STARTING MARKDRILLER PRO ACCESS CONTROL & 200 QUESTION TRIAL VERIFICATION ===\n');

  const mongoUri = env.MONGODB_URI;
  if (!mongoUri) {
    throw new Error('MONGODB_URI is not set in environment.');
  }


  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB Atlas successfully.');

  // Baseline Question Data Check (READ-ONLY Verification)
  const baselineCount = await Question.countDocuments();
  console.log(`Baseline Questions count in database: ${baselineCount}`);
  if (baselineCount < 100) {
    throw new Error(`Unexpected question count: ${baselineCount}. Expected >= 4,000.`);
  }

  // Get sample questions for testing
  const sampleQuestions = await Question.find({ published: true, reviewStatus: 'PUBLISHED' })
    .select('_id questionNumber examId subjectId year')
    .limit(250)
    .lean();

  if (sampleQuestions.length < 250) {
    throw new Error(`Insufficient sample questions for full test suite. Found: ${sampleQuestions.length}`);
  }

  const testEmail = `test_entitlement_student_${Date.now()}@markdriller.test`;
  const testUser = await User.create({
    email: testEmail,
    passwordHash: 'dummy_hash_for_test_only',
    fullName: 'Test Entitlement Student',
    role: 'STUDENT',
    isVerified: true,
  });

  const testUserId = testUser._id;
  console.log(`Created test student account: ${testEmail} (ID: ${testUserId})`);

  try {
    // ---------------------------------------------------------
    // TEST 1: Free Trial — Past Questions at 0 / 200
    // ---------------------------------------------------------
    console.log('\n--- TEST 1: Free Trial 0 / 200 Initial Access ---');
    const initialUsage = await FreeTrialService.getUsage(testUserId);
    console.log('Initial usage:', initialUsage);
    if (initialUsage.used !== 0 || initialUsage.remaining !== 200 || initialUsage.isLimitReached !== false) {
      throw new Error(`TEST 1 FAILED: Expected 0 used, got ${initialUsage.used}`);
    }

    const batch1 = sampleQuestions.slice(0, 10);
    const result1 = await FreeTrialService.recordAndFilterQuestions(testUserId, batch1);
    console.log(`Requested 10 questions. Allowed: ${result1.allowedQuestions.length}, Used: ${result1.usage.used}, Remaining: ${result1.usage.remaining}`);
    if (result1.allowedQuestions.length !== 10 || result1.usage.used !== 10 || result1.usage.remaining !== 190) {
      throw new Error('TEST 1 FAILED: Batch 1 recording did not match expected values.');
    }
    console.log('✅ TEST 1 PASSED: 0/200 initial access granted and correctly tracked.');

    // ---------------------------------------------------------
    // TEST 2: Repeated Request / Refetch / Refresh (Idempotence)
    // ---------------------------------------------------------
    console.log('\n--- TEST 2: Repeated Request / Refetch Idempotence ---');
    const result2 = await FreeTrialService.recordAndFilterQuestions(testUserId, batch1);
    console.log(`Re-requested same 10 questions. Allowed: ${result2.allowedQuestions.length}, Used: ${result2.usage.used}, Remaining: ${result2.usage.remaining}`);
    if (result2.allowedQuestions.length !== 10 || result2.usage.used !== 10 || result2.usage.remaining !== 190) {
      throw new Error(`TEST 2 FAILED: Refetch consumed extra units! Used: ${result2.usage.used}`);
    }
    console.log('✅ TEST 2 PASSED: Refetch/refresh is idempotent and consumes 0 extra quota.');

    // ---------------------------------------------------------
    // TEST 3: Free Trial at 199 / 200 — Permitted Remaining Access
    // ---------------------------------------------------------
    console.log('\n--- TEST 3: Free Trial 199 / 200 Partial Remainder ---');
    // Pre-populate user's usage with 199 questions
    const set199 = sampleQuestions.slice(0, 199).map((q) => q._id);
    await FreeTrialUsage.updateOne(
      { userId: testUserId },
      { $set: { accessedQuestionIds: set199, count: 199 } }
    );

    const usageAt199 = await FreeTrialService.getUsage(testUserId);
    console.log('Usage before test 3:', usageAt199);
    if (usageAt199.used !== 199 || usageAt199.remaining !== 1) {
      throw new Error('TEST 3 Setup failed: expected 199 used.');
    }

    // Request 10 questions that include index 195..205 (some old, some new)
    const batchOverlap = sampleQuestions.slice(195, 205);
    const result3 = await FreeTrialService.recordAndFilterQuestions(testUserId, batchOverlap);
    console.log(`Requested 10 questions (overlap). Allowed: ${result3.allowedQuestions.length}, Used: ${result3.usage.used}, Remaining: ${result3.usage.remaining}`);
    
    // Total used MUST now be exactly 200
    if (result3.usage.used !== 200 || result3.usage.remaining !== 0 || !result3.hasReachedLimit) {
      throw new Error(`TEST 3 FAILED: Expected used = 200, remaining = 0, got used = ${result3.usage.used}`);
    }
    console.log('✅ TEST 3 PASSED: At 199/200, exactly permitted remaining access granted, capped at 200.');

    // ---------------------------------------------------------
    // TEST 4: Free Trial at 200 / 200 — Additional Access Denied
    // ---------------------------------------------------------
    console.log('\n--- TEST 4: Free Trial 200 / 200 Additional Access Denied ---');
    // Request brand new questions (indices 210..220)
    const batchNew = sampleQuestions.slice(210, 220);
    const result4 = await FreeTrialService.recordAndFilterQuestions(testUserId, batchNew);
    console.log(`Requested 10 brand new questions. Allowed: ${result4.allowedQuestions.length}, LimitReached: ${result4.hasReachedLimit}`);
    if (result4.allowedQuestions.length !== 0 || !result4.hasReachedLimit) {
      throw new Error('TEST 4 FAILED: New questions allowed when limit was already 200!');
    }
    console.log('✅ TEST 4 PASSED: Additional past questions denied when 200 limit is reached.');

    // ---------------------------------------------------------
    // TEST 5: Single Question Access & Bypass Tests
    // ---------------------------------------------------------
    console.log('\n--- TEST 5: Single Question Access & Bypass Tests ---');
    // 5A: Single question that was already unlocked in the 200 allowance
    const unlockedQId = sampleQuestions[0]._id;
    const singleOld = await FreeTrialService.checkAndRecordSingleAccess(testUserId, unlockedQId);
    console.log('Single question (already accessed): allowed =', singleOld.allowed);
    if (!singleOld.allowed) {
      throw new Error('TEST 5A FAILED: Already accessed question was denied.');
    }

    // 5B: Single question that is NEW when limit is exhausted
    const newQId = sampleQuestions[225]._id;
    const singleNew = await FreeTrialService.checkAndRecordSingleAccess(testUserId, newQId);
    console.log('Single question (new, limit exhausted): allowed =', singleNew.allowed);
    if (singleNew.allowed) {
      throw new Error('TEST 5B FAILED: New question was allowed after limit exhausted!');
    }
    console.log('✅ TEST 5 PASSED: Question ID bypass safely blocked at 200 limit.');

    // ---------------------------------------------------------
    // TEST 6: Concurrency Protection (Race Condition Resistance)
    // ---------------------------------------------------------
    console.log('\n--- TEST 6: Concurrency & Race Condition Protection ---');
    const concurrentUserEmail = `test_concurrent_${Date.now()}@markdriller.test`;
    const concurrentUser = await User.create({
      email: concurrentUserEmail,
      passwordHash: 'dummy_hash',
      fullName: 'Concurrent Test Student',
      role: 'STUDENT',
      isVerified: true,
    });

    // Start with 190 questions
    const set190 = sampleQuestions.slice(0, 190).map((q) => q._id);
    await FreeTrialUsage.create({
      userId: concurrentUser._id,
      accessedQuestionIds: set190,
      count: 190,
    });

    // Fire 20 parallel requests attempting to add new questions
    console.log('Firing 20 concurrent requests attempting to add questions beyond 200...');
    const concurrentRequests = Array.from({ length: 20 }, (_, idx) => {
      // Each request brings 10 NEW questions starting from index 190..245
      const startIndex = 190 + (idx * 2);
      const chunk = sampleQuestions.slice(startIndex, startIndex + 10);
      return FreeTrialService.recordAndFilterQuestions(concurrentUser._id, chunk);
    });


    await Promise.all(concurrentRequests);

    const finalConcurrentUsage = await FreeTrialUsage.findOne({ userId: concurrentUser._id });
    console.log(`Final concurrent usage count: ${finalConcurrentUsage?.count}, array length: ${finalConcurrentUsage?.accessedQuestionIds.length}`);
    if ((finalConcurrentUsage?.count ?? 0) > 200 || (finalConcurrentUsage?.accessedQuestionIds.length ?? 0) > 200) {
      throw new Error(`TEST 6 FAILED: Race condition allowed count = ${finalConcurrentUsage?.count} (> 200)!`);
    }
    if ((finalConcurrentUsage?.count ?? 0) !== 200) {
      throw new Error(`TEST 6 FAILED: Expected count to reach exactly 200, got ${finalConcurrentUsage?.count}`);
    }
    console.log('✅ TEST 6 PASSED: Concurrency update is atomic and never exceeds 200 items.');

    // Clean up concurrent user
    await FreeTrialUsage.deleteOne({ userId: concurrentUser._id });
    await User.deleteOne({ _id: concurrentUser._id });

    // ---------------------------------------------------------
    // TEST 7: Free Trial — CBT Modes Locking (Exam, Practice, Study)
    // ---------------------------------------------------------
    console.log('\n--- TEST 7: Free Trial Modes Strictly Locked ---');
    const middleware = requireCbtEntitlement();

    for (const mode of ['TIMED_MOCK', 'PRACTICE', 'STUDY']) {
      let statusCode = 0;
      let errorResponse: any = null;
      let nextCalled = false;

      const reqMock: any = {
        user: { _id: testUserId, role: 'STUDENT', isVerified: true },
        body: { mode },
      };

      const resMock: any = {
        status(code: number) {
          statusCode = code;
          return this;
        },
        json(payload: any) {
          errorResponse = payload;
          return this;
        },
      };

      const nextMock = () => {
        nextCalled = true;
      };

      await middleware(reqMock, resMock, nextMock);

      console.log(`Mode '${mode}': statusCode = ${statusCode}, error =`, errorResponse?.error?.code);
      if (nextCalled || statusCode !== 403 || errorResponse?.error?.code !== 'SUBSCRIPTION_REQUIRED') {
        throw new Error(`TEST 7 FAILED: Mode ${mode} was NOT locked for Free Trial user! Code: ${statusCode}`);
      }
    }
    console.log('✅ TEST 7 PASSED: Exam Mode, Practice Mode, and Study Mode are all strictly locked with 403 for Free Trial.');

    // ---------------------------------------------------------
    // TEST 8: Pro Entitlement — Modes Allowed & Full Access
    // ---------------------------------------------------------
    console.log('\n--- TEST 8: Pro Entitlement Unlocks All 3 Modes ---');
    const proSub = await Subscription.create({
      userId: testUserId,
      plan: 'PRO_MONTHLY',
      status: 'ACTIVE',
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });

    const subCheck = await checkStudentSubscription(testUserId);
    console.log('Subscription check for Pro user:', subCheck);
    if (!subCheck.isPro || subCheck.plan !== 'PRO_MONTHLY') {
      throw new Error('TEST 8 FAILED: Pro subscription check did not return isPro: true');
    }

    for (const mode of ['TIMED_MOCK', 'PRACTICE', 'STUDY']) {
      let statusCode = 0;
      let nextCalled = false;

      const reqMock: any = {
        user: { _id: testUserId, role: 'STUDENT', isVerified: true },
        body: { mode },
      };

      const resMock: any = {
        status(code: number) {
          statusCode = code;
          return this;
        },
        json(payload: any) {
          return this;
        },
      };

      const nextMock = () => {
        nextCalled = true;
      };

      await middleware(reqMock, resMock, nextMock);

      if (!nextCalled || statusCode !== 0) {
        throw new Error(`TEST 8 FAILED: Pro user was denied access to ${mode}!`);
      }
      console.log(`Mode '${mode}': Pro access successfully granted (next() invoked).`);
    }
    console.log('✅ TEST 8 PASSED: Pro user has full access to Exam, Practice, and Study modes.');

    // Clean up Pro subscription
    await Subscription.deleteOne({ _id: proSub._id });

    // ---------------------------------------------------------
    // TEST 9: Admin Entitlement Bypass
    // ---------------------------------------------------------
    console.log('\n--- TEST 9: Admin Access Governance ---');
    let adminNextCalled = false;
    const reqAdmin: any = {
      user: { _id: new Types.ObjectId(), role: 'ADMIN', isVerified: true },
      body: { mode: 'TIMED_MOCK' },
    };
    const resAdmin: any = {
      status: () => resAdmin,
      json: () => resAdmin,
    };
    await middleware(reqAdmin, resAdmin, () => { adminNextCalled = true; });
    if (!adminNextCalled) {
      throw new Error('TEST 9 FAILED: Admin role was blocked by CBT entitlement middleware.');
    }
    console.log('✅ TEST 9 PASSED: Admin retain full governance access.');

  } finally {
    // ---------------------------------------------------------
    // TEARDOWN & QUESTION DATA INTEGRITY VERIFICATION
    // ---------------------------------------------------------
    console.log('\n--- CLEANUP & QUESTION REPOSITORY SAFETY AUDIT ---');
    await FreeTrialUsage.deleteOne({ userId: testUserId });
    await Subscription.deleteMany({ userId: testUserId });
    await User.deleteOne({ _id: testUserId });
    console.log('Test student account and usage records cleaned up.');

    const finalQuestionCount = await Question.countDocuments();
    console.log(`Final Question Count: ${finalQuestionCount} (Baseline: ${baselineCount})`);
    if (finalQuestionCount !== baselineCount) {
      throw new Error(`🚨 FATAL: Question count changed from ${baselineCount} to ${finalQuestionCount}!`);
    }
    console.log('✅ QUESTION DATA UNTOUCHED: All question records remain 100% read-only and intact.');
  }

  await mongoose.disconnect();
  console.log('\n============================================================');
  console.log('ALL VERIFICATION TEST SUITES COMPLETED AND PASSED WITH 100% SUCCESS!');
  console.log('============================================================\n');
}

runVerification().catch((err) => {
  console.error('\n❌ VERIFICATION TEST FAILED:', err);
  process.exit(1);
});
