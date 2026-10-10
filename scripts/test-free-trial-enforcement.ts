import { env } from '../src/server/config/env.js';
import mongoose, { Types } from 'mongoose';
import '../src/server/models/index.js';
import { FreeTrialUsage } from '../src/server/models/FreeTrialUsage.js';
import { FreeTrialService, MAX_FREE_TRIALS } from '../src/server/services/freeTrialService.js';

async function main() {
  await mongoose.connect(env.MONGODB_URI);
  console.log('--- Testing Free Trial Enforcement (Isolated Test User) ---');

  const testUserId = new Types.ObjectId();

  try {
    // 1. Initial State (0 used)
    let status0 = await FreeTrialService.getTrialStatus(testUserId, false);
    console.log('Initial Trial Status (0 used):', {
      used: status0.used,
      remaining: status0.remaining,
      isExhausted: status0.isExhausted,
    });
    if (status0.used !== 0 || status0.remaining !== 3 || status0.isExhausted !== false) {
      throw new Error('Initial status failed: expected 0 used, 3 remaining, not exhausted');
    }

    // 2. Consume Trial 1
    const res1 = await FreeTrialService.consumeTrialAttempt(testUserId);
    console.log('After Trial 1 Consumption:', {
      success: res1.success,
      used: res1.usage.used,
      remaining: res1.usage.remaining,
      isExhausted: res1.usage.isExhausted,
    });
    if (!res1.success || res1.usage.used !== 1 || res1.usage.remaining !== 2 || res1.usage.isExhausted !== false) {
      throw new Error('Trial 1 consumption failed');
    }

    // 3. Consume Trial 2
    const res2 = await FreeTrialService.consumeTrialAttempt(testUserId);
    console.log('After Trial 2 Consumption:', {
      success: res2.success,
      used: res2.usage.used,
      remaining: res2.usage.remaining,
      isExhausted: res2.usage.isExhausted,
    });
    if (!res2.success || res2.usage.used !== 2 || res2.usage.remaining !== 1 || res2.usage.isExhausted !== false) {
      throw new Error('Trial 2 consumption failed');
    }

    // 4. Consume Trial 3 (Final free trial)
    const res3 = await FreeTrialService.consumeTrialAttempt(testUserId);
    console.log('After Trial 3 Consumption:', {
      success: res3.success,
      used: res3.usage.used,
      remaining: res3.usage.remaining,
      isExhausted: res3.usage.isExhausted,
    });
    if (!res3.success || res3.usage.used !== 3 || res3.usage.remaining !== 0 || res3.usage.isExhausted !== true) {
      throw new Error('Trial 3 consumption failed');
    }

    // 5. Attempt Trial 4 (Must be REJECTED immediately!)
    const res4 = await FreeTrialService.consumeTrialAttempt(testUserId);
    console.log('Trial 4 Consumption Attempt (MUST FAIL):', {
      success: res4.success,
      used: res4.usage.used,
      remaining: res4.usage.remaining,
      isExhausted: res4.usage.isExhausted,
    });
    if (res4.success !== false || res4.usage.used !== 3 || res4.usage.remaining !== 0 || res4.usage.isExhausted !== true) {
      throw new Error('Trial 4 was NOT blocked! Critical failure');
    }

    // 6. Test Rollback on failed session initialization
    console.log('Testing rollback on failure...');
    await FreeTrialService.rollbackTrial(testUserId);
    const statusAfterRollback = await FreeTrialService.getTrialStatus(testUserId, false);
    console.log('After Rollback:', {
      used: statusAfterRollback.used,
      remaining: statusAfterRollback.remaining,
      isExhausted: statusAfterRollback.isExhausted,
    });
    if (statusAfterRollback.used !== 2 || statusAfterRollback.remaining !== 1) {
      throw new Error('Rollback failed');
    }

    // Re-consume back to 3
    await FreeTrialService.consumeTrialAttempt(testUserId);
    const finalStatus = await FreeTrialService.getTrialStatus(testUserId, false);
    if (!finalStatus.isExhausted) {
      throw new Error('Final state should be exhausted');
    }

    // 7. Concurrency Test: 10 parallel consume requests on an account with 2 attempts
    console.log('Testing concurrency safety under 10 simultaneous race conditions...');
    const concurrentUserId = new Types.ObjectId();
    // Pre-consume 2
    await FreeTrialService.consumeTrialAttempt(concurrentUserId);
    await FreeTrialService.consumeTrialAttempt(concurrentUserId);

    // Now 10 parallel calls compete for the 1 remaining trial
    const results = await Promise.all(
      Array.from({ length: 10 }).map(() => FreeTrialService.consumeTrialAttempt(concurrentUserId))
    );

    const successfulAttempts = results.filter((r) => r.success);
    const rejectedAttempts = results.filter((r) => !r.success);

    console.log(`Concurrency Results: ${successfulAttempts.length} succeeded, ${rejectedAttempts.length} rejected`);
    if (successfulAttempts.length !== 1) {
      throw new Error(`Concurrency race condition detected: expected exactly 1 winner, got ${successfulAttempts.length}`);
    }

    const concurrentFinal = await FreeTrialService.getTrialStatus(concurrentUserId, false);
    console.log('Concurrent User Final Status:', concurrentFinal);
    if (concurrentFinal.used !== 3 || concurrentFinal.remaining !== 0 || !concurrentFinal.isExhausted) {
      throw new Error('Concurrent user trial count corrupted');
    }

    // Cleanup test users
    await FreeTrialUsage.deleteOne({ userId: testUserId });
    await FreeTrialUsage.deleteOne({ userId: concurrentUserId });

    console.log('✅ ALL FREE TRIAL ENFORCEMENT & CONCURRENCY TESTS PASSED!');
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((err) => {
  console.error('❌ TEST FAILED:', err);
  process.exit(1);
});
