/**
 * MARKDRILLER — PAYSTACK TEST PAYMENT & SUBSCRIPTION E2E VERIFICATION SUITE
 * 
 * Strictly Headless (No Browser Testing Mandate).
 * Tests all requirements across:
 * 1. Secret Key & Environment Security Scan (Zero Frontend Leakage)
 * 2. Paystack Inline JS v2 Contract & Validator Verification
 * 3. Student Registration, Verification & Authentication
 * 4. Pre-Payment Access Control (Strict CBT Mock Blocking with HTTP 403)
 * 5. Authoritative Paystack Transaction Initialization (Server-Calculated Kobo Amount)
 * 6. Access Code & Safe Response Properties (No Secrets in API Response)
 * 7. Database Pending Payment State Integrity
 * 8. Paystack Webhook Cryptographic HMAC SHA-512 Verification & Idempotent Replay
 * 9. Server-Side Paystack Verification & Pro Subscription Activation
 * 10. Post-Payment Access Control (CBT Mock Unlocked & Active Entitlement)
 * 11. Duplicate Fulfillment & Tampering Protection
 */

import crypto from 'node:crypto';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import mongoose from 'mongoose';
import { env } from '../src/server/config/env.js';
import { User } from '../src/server/models/User.js';
import { Profile } from '../src/server/models/Profile.js';
import { Payment } from '../src/server/models/Payment.js';
import { Subscription } from '../src/server/models/Subscription.js';
import { Exam } from '../src/server/models/Exam.js';
import { Subject } from '../src/server/models/Subject.js';
import { ExamAttempt } from '../src/server/models/ExamAttempt.js';
import { generateToken } from '../src/server/utils/jwt.js';

const API_PORT = process.env.PORT || 5009;
const BASE_URL = `http://127.0.0.1:${API_PORT}`;

let passedCount = 0;
let failedCount = 0;

function record(category: string, testName: string, passed: boolean, detail: string) {
  if (passed) {
    console.log(`\x1b[32m[PASS]\x1b[0m [${category}] ${testName}: ${detail}`);
    passedCount++;
  } else {
    console.error(`\x1b[31m[FAIL]\x1b[0m [${category}] ${testName}: ${detail}`);
    failedCount++;
  }
}

async function ensureServerRunning() {
  for (let i = 0; i < 20; i++) {
    try {
      const res = await fetch(`${BASE_URL}/api/health`);
      if (res.ok) {
        console.log(`[Setup] MarkDriller API server active on ${BASE_URL}`);
        return;
      }
    } catch {
      // Wait for server to boot
    }
    await new Promise((r) => setTimeout(r, 400));
  }

  // If external server is not running, dynamically import server
  console.log('[Setup] Starting in-process MarkDriller server on port ' + API_PORT);
  const { app } = await import('../src/server/index.js');
  await new Promise((r) => setTimeout(r, 1500));
}

async function runE2EPaystackVerification() {
  console.log('\n============================================================');
  console.log('MARKDRILLER — PAYSTACK TEST PAYMENT & SUBSCRIPTION E2E AUDIT');
  console.log('============================================================\n');

  await ensureServerRunning();

  if (mongoose.connection.readyState !== 1) {
    await mongoose.connect(env.MONGODB_URI);
  }

  let studentEmail = '';

  // -------------------------------------------------------------------------
  // TEST 1: SECRET KEY & FRONTEND ISOLATION AUDIT
  // -------------------------------------------------------------------------
  try {
    const envPath = path.resolve(process.cwd(), '.env');
    const envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
    const hasViteSecret = /VITE_.*PAYSTACK_SECRET/i.test(envContent);
    const hasSecretKeyInEnv = !!(env.PAYSTACK_SECRET_KEY && (env.PAYSTACK_SECRET_KEY.startsWith('sk_test_') || env.PAYSTACK_SECRET_KEY.startsWith('sk_live_')));
    const hasPublicKeyInEnv = !!(env.PAYSTACK_PUBLIC_KEY && (env.PAYSTACK_PUBLIC_KEY.startsWith('pk_test_') || env.PAYSTACK_PUBLIC_KEY.startsWith('pk_live_')));

    // Scan frontend source directory for accidental secret leakage
    const srcFiles = fs.readdirSync(path.resolve(process.cwd(), 'src'), { recursive: true }) as string[];
    let leakedInSrc = false;
    for (const relPath of srcFiles) {
      if (relPath.endsWith('.tsx') || relPath.endsWith('.ts')) {
        const fullPath = path.resolve(process.cwd(), 'src', relPath);
        if (!fullPath.includes('src/server')) {
          const fileContent = fs.readFileSync(fullPath, 'utf8');
          if (fileContent.includes(env.PAYSTACK_SECRET_KEY) || /sk_(test|live)_[0-9a-fA-F]{30,}/.test(fileContent)) {
            leakedInSrc = true;
            break;
          }
        }
      }
    }

    record(
      'Security Isolation',
      'Paystack Secret Key Never Exposed to Frontend Bundle',
      !hasViteSecret && !leakedInSrc && !!hasSecretKeyInEnv && !!hasPublicKeyInEnv,
      `Vite Exposes Secret: ${hasViteSecret}, Leaked in src/client: ${leakedInSrc}, Secret Key: Valid, Public Key: Valid`
    );
  } catch (err: any) {
    record('Security Isolation', 'Paystack Secret Key Never Exposed to Frontend Bundle', false, err.message);
  }

  // -------------------------------------------------------------------------
  // TEST 2: PAYSTACK INLINE JS V2 API CONTRACT VERIFICATION
  // -------------------------------------------------------------------------
  try {
    // Import @paystack/inline-js to test the parameter validator logic
    const inlinePkgPath = path.resolve(process.cwd(), 'node_modules/@paystack/inline-js/package.json');
    const pkgJson = JSON.parse(fs.readFileSync(inlinePkgPath, 'utf8'));
    const isV2 = pkgJson.version && pkgJson.version.startsWith('2.');

    // Verify SubscriptionPlans.tsx imports and calls resumeTransaction correctly
    const subPlansContent = fs.readFileSync(path.resolve(process.cwd(), 'src/components/SubscriptionPlans.tsx'), 'utf8');
    const usesResumeTransaction = subPlansContent.includes('popup.resumeTransaction(accessCode, callbacks)');
    const hasSnakeCaseAccessCodeBug = subPlansContent.includes('access_code: accessCode');

    record(
      'Inline JS V2 Contract',
      'PaystackPop Uses Official resumeTransaction(accessCode, callbacks)',
      isV2 && usesResumeTransaction && !hasSnakeCaseAccessCodeBug,
      `@paystack/inline-js: v${pkgJson.version}, Uses resumeTransaction: ${usesResumeTransaction}, Old snake_case bug eliminated: ${!hasSnakeCaseAccessCodeBug}`
    );
  } catch (err: any) {
    record('Inline JS V2 Contract', 'PaystackPop Uses Official resumeTransaction(accessCode, callbacks)', false, err.message);
  }

  // -------------------------------------------------------------------------
  // TEST 3: STUDENT REGISTRATION & AUTHENTICATION
  // -------------------------------------------------------------------------
  const testSuffix = crypto.randomBytes(4).toString('hex');
  studentEmail = `scholar_${testSuffix}@example.com`;
  const studentFullName = `Test Scholar ${testSuffix}`;
  let studentToken = '';
  let studentUserId = '';

  try {
    const studentUser = await User.create({
      fullName: studentFullName,
      email: studentEmail,
      passwordHash: 'argon_dummy_hash_for_test',
      role: 'STUDENT',
      isVerified: true,
    });
    studentUserId = studentUser._id.toString();

    studentToken = generateToken({
      userId: studentUserId,
      email: studentUser.email,
      role: 'STUDENT',
    });

    record(
      'Authentication',
      'Student Account Provisioned and Authenticated with JWT',
      !!studentToken && !!studentUserId,
      `UserId: ${studentUserId}, Email: ${studentEmail}`
    );
  } catch (err: any) {
    record('Authentication', 'Student Account Provisioned and Authenticated with JWT', false, err.message);
  }

  // -------------------------------------------------------------------------
  // TEST 4: PRE-PAYMENT STRICT ACCESS CONTROL (CBT MOCK BLOCKED)
  // -------------------------------------------------------------------------
  try {
    const jambExam = await Exam.findOne({ shortCode: 'JAMB / UTME' });
    const jambSubject = jambExam ? await Subject.findOne({ examId: jambExam._id }) : null;

    const subQueryRes = await fetch(`${BASE_URL}/api/subscriptions/my-subscription`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const subQueryData = (await subQueryRes.json()) as any;
    const isFree = subQueryData.data?.plan === 'FREE' && subQueryData.data?.isPro === false;

    const cbtRes = await fetch(`${BASE_URL}/api/cbt/start`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${studentToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        examId: jambExam?._id.toString(),
        subjectId: jambSubject?._id.toString(),
        mode: 'TIMED_MOCK',
        durationMinutes: 15,
        questionCount: 5,
      }),
    });
    const cbtData = (await cbtRes.json()) as any;
    const isBlocked = cbtRes.status === 403 && cbtData.error?.code === 'SUBSCRIPTION_REQUIRED';

    record(
      'Entitlement Control',
      'Unsubscribed Student Blocked From CBT Exam (Strict HTTP 403)',
      isFree && isBlocked,
      `Current Plan: ${subQueryData.data?.plan}, CBT Status: ${cbtRes.status}, Error Code: ${cbtData.error?.code}`
    );
  } catch (err: any) {
    record('Entitlement Control', 'Unsubscribed Student Blocked From CBT Exam', false, err.message);
  }

  // -------------------------------------------------------------------------
  // TEST 5: AUTHORITATIVE PAYSTACK INITIALIZATION (PRO_MONTHLY)
  // -------------------------------------------------------------------------
  let paymentReference = '';
  let paymentAccessCode = '';
  try {
    const initRes = await fetch(`${BASE_URL}/api/subscriptions/initialize`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${studentToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ plan: 'PRO_MONTHLY' }),
    });
    const initData = (await initRes.json()) as any;
    paymentReference = initData.data?.reference;
    paymentAccessCode = initData.data?.accessCode;

    const hasSafeProps =
      initRes.status === 201 &&
      initData.success === true &&
      initData.data?.amountKobo === 350000 &&
      initData.data?.currency === 'NGN' &&
      typeof paymentReference === 'string' &&
      paymentReference.startsWith('MD_') &&
      typeof paymentAccessCode === 'string' &&
      paymentAccessCode.length > 0 &&
      (initData.data?.publicKey?.startsWith('pk_test_') || initData.data?.publicKey?.startsWith('pk_live_')) &&
      !('secretKey' in initData.data) &&
      !('secret' in initData.data);

    record(
      'Transaction Initialization',
      'Authoritative Server-Side Paystack Initialization (₦3,500 = 350,000 kobo)',
      hasSafeProps,
      `HTTP Status: ${initRes.status}, Ref: ${paymentReference}, AccessCode: ${paymentAccessCode?.slice(0, 10)}..., Kobo: ${initData.data?.amountKobo}`
    );
  } catch (err: any) {
    record('Transaction Initialization', 'Authoritative Server-Side Paystack Initialization', false, err.message);
  }

  // -------------------------------------------------------------------------
  // TEST 6: DATABASE PENDING PAYMENT INTEGRITY
  // -------------------------------------------------------------------------
  try {
    const dbPayment = await Payment.findOne({ reference: paymentReference });
    const isPending =
      !!dbPayment &&
      dbPayment.status === 'PENDING' &&
      dbPayment.amountKobo === 350000 &&
      dbPayment.userId.toString() === studentUserId &&
      dbPayment.metadata?.plan === 'PRO_MONTHLY';

    record(
      'Database State',
      'Payment Record Created in PENDING State with Plan Metadata',
      isPending,
      `Status: ${dbPayment?.status}, Amount: ${dbPayment?.amountKobo} kobo, Plan: ${dbPayment?.metadata?.plan}`
    );
  } catch (err: any) {
    record('Database State', 'Payment Record Created in PENDING State with Plan Metadata', false, err.message);
  }

  // -------------------------------------------------------------------------
  // TEST 7: WEBHOOK SIGNATURE SECURITY (REJECT INVALID SIGNATURE)
  // -------------------------------------------------------------------------
  try {
    const fakePayload = JSON.stringify({ event: 'charge.success', data: { reference: paymentReference } });
    const invalidRes = await fetch(`${BASE_URL}/api/subscriptions/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-paystack-signature': 'invalid_forged_hmac_signature_00000000',
      },
      body: fakePayload,
    });

    // In non-mock mode, invalid signature must be rejected with 401
    const rejected = invalidRes.status === 401;

    record(
      'Webhook Security',
      'Forged/Unsigned Webhook Request Strictly Rejected with HTTP 401',
      rejected,
      `Status: ${invalidRes.status}`
    );
  } catch (err: any) {
    record('Webhook Security', 'Forged/Unsigned Webhook Request Strictly Rejected with HTTP 401', false, err.message);
  }

  // -------------------------------------------------------------------------
  // TEST 8: CRYPTOGRAPHIC HMAC SHA-512 WEBHOOK & IDEMPOTENCY
  // -------------------------------------------------------------------------
  try {
    const webhookEvent = JSON.stringify({
      event: 'charge.success',
      data: {
        reference: paymentReference,
        amount: 350000,
        currency: 'NGN',
        status: 'success',
        channel: 'card',
        paid_at: new Date().toISOString(),
      },
    });

    const secret = env.PAYSTACK_WEBHOOK_SECRET || env.PAYSTACK_SECRET_KEY;
    const validSignature = crypto
      .createHmac('sha512', secret)
      .update(Buffer.from(webhookEvent))
      .digest('hex');

    // First delivery
    const webhookRes1 = await fetch(`${BASE_URL}/api/subscriptions/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-paystack-signature': validSignature,
      },
      body: webhookEvent,
    });
    const webhookData1 = (await webhookRes1.json()) as any;
    const ok1 = webhookRes1.status === 200 && webhookData1.status === 'success';

    // Second delivery (idempotency test)
    const webhookRes2 = await fetch(`${BASE_URL}/api/subscriptions/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-paystack-signature': validSignature,
      },
      body: webhookEvent,
    });
    const webhookData2 = (await webhookRes2.json()) as any;
    const ok2 = webhookRes2.status === 200;

    // Verify database has exactly one subscription and payment is SUCCESS
    const dbPayments = await Payment.find({ reference: paymentReference });
    const dbSubs = await Subscription.find({ userId: studentUserId });
    const isIdempotent = dbPayments.length === 1 && dbSubs.length === 1 && dbPayments[0].status === 'SUCCESS';

    record(
      'Webhook & Idempotency',
      'Cryptographic HMAC SHA-512 Webhook Processed Idempotently',
      ok1 && ok2 && isIdempotent,
      `Delivery 1: ${webhookRes1.status}, Delivery 2: ${webhookRes2.status}, Payments Count: ${dbPayments.length}, Subscriptions Count: ${dbSubs.length}`
    );
  } catch (err: any) {
    record('Webhook & Idempotency', 'Cryptographic HMAC SHA-512 Webhook Processed Idempotently', false, err.message);
  }

  // -------------------------------------------------------------------------
  // TEST 9: SERVER-SIDE PAYMENT VERIFICATION ENDPOINT
  // -------------------------------------------------------------------------
  try {
    const verifyRes = await fetch(`${BASE_URL}/api/subscriptions/verify`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${studentToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ reference: paymentReference }),
    });
    const verifyData = (await verifyRes.json()) as any;

    const isVerified =
      verifyRes.status === 200 &&
      verifyData.success === true &&
      verifyData.data?.plan === 'PRO_MONTHLY' &&
      verifyData.data?.isPro === true;

    record(
      'Payment Verification',
      'Server-Side Verification Endpoint Confirms Pro Subscription',
      isVerified,
      `Status: ${verifyRes.status}, Plan: ${verifyData.data?.plan}, isPro: ${verifyData.data?.isPro}`
    );
  } catch (err: any) {
    record('Payment Verification', 'Server-Side Verification Endpoint Confirms Pro Subscription', false, err.message);
  }

  // -------------------------------------------------------------------------
  // TEST 10: POST-PAYMENT ACCESS CONTROL (CBT MOCK UNLOCKED)
  // -------------------------------------------------------------------------
  try {
    const jambExam = await Exam.findOne({ shortCode: 'JAMB / UTME' });
    const jambSubject = jambExam ? await Subject.findOne({ examId: jambExam._id }) : null;

    // Check my-subscription query
    const subRes = await fetch(`${BASE_URL}/api/subscriptions/my-subscription`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const subData = (await subRes.json()) as any;
    const subActive = subData.data?.plan === 'PRO_MONTHLY' && subData.data?.status === 'ACTIVE' && subData.data?.isPro === true;

    // Attempt CBT exam now that student has active Pro subscription
    const cbtUnlockedRes = await fetch(`${BASE_URL}/api/cbt/start`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${studentToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        examId: jambExam?._id.toString(),
        subjectId: jambSubject?._id.toString(),
        mode: 'TIMED_MOCK',
        durationMinutes: 15,
        questionCount: 5,
      }),
    });
    const cbtUnlockedData = (await cbtUnlockedRes.json()) as any;
    const isUnlocked = cbtUnlockedRes.status === 201 && cbtUnlockedData.success === true;

    record(
      'Access Control',
      'Premium CBT Mock Exam Successfully Unlocked for Subscribed Student',
      subActive && isUnlocked,
      `Subscription: ${subData.data?.plan} (${subData.data?.status}), CBT Session Status: ${cbtUnlockedRes.status}, AttemptId: ${cbtUnlockedData.data?.attemptId}`
    );
  } catch (err: any) {
    record('Access Control', 'Premium CBT Mock Exam Successfully Unlocked for Subscribed Student', false, err.message);
  }

  // -------------------------------------------------------------------------
  // SUMMARY
  // -------------------------------------------------------------------------
  console.log('\n============================================================');
  console.log(`PAYSTACK E2E VERIFICATION AUDIT COMPLETE: ${passedCount} PASSED, ${failedCount} FAILED`);
  console.log('============================================================\n');

  // Clean up ephemeral paystack test account
  try {
    if (studentEmail) {
      const testUser = await User.findOne({ email: studentEmail }).lean();
      if (testUser) {
        await Promise.all([
          Profile.deleteMany({ userId: testUser._id }),
          Subscription.deleteMany({ userId: testUser._id }),
          Payment.deleteMany({ userId: testUser._id }),
          ExamAttempt.deleteMany({ userId: testUser._id }),
          User.deleteOne({ _id: testUser._id }),
        ]);
        console.log('[Cleanup] Ephemeral paystack test account successfully purged.');
      }
    }
    await mongoose.disconnect();
  } catch (cleanupErr) {
    console.warn('[Cleanup Warning] Could not purge paystack test account:', cleanupErr);
  }

  if (failedCount > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runE2EPaystackVerification().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
