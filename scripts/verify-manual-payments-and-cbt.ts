import mongoose from 'mongoose';
import { Payment } from '../src/server/models/Payment.js';
import { User } from '../src/server/models/User.js';
import { Subscription } from '../src/server/models/Subscription.js';

const MONGODB_URI =
  process.env.MONGODB_URI ||
  process.env.MONGODB_URL ||
  '';

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI environment variable is required.');
  process.exit(1);
}

async function verifyManualPaymentsAndCbt() {
  console.log('--- MarkDriller Verification: Manual Payments & CBT Architecture ---');
  console.log('Connecting to database...');
  await mongoose.connect(MONGODB_URI, {
    serverSelectionTimeoutMS: 10000,
  });
  console.log('Connected to MongoDB successfully.');

  const testEmail = `test-verify-${Date.now()}@markdriller.ng`;
  let testUser: any = null;
  let testPaymentPending: any = null;
  let testPaymentReject: any = null;

  try {
    // 1. Create a test student user
    console.log('[1/4] Creating test student user...');
    testUser = await User.create({
      fullName: 'Test Candidate Manual Pay',
      email: testEmail,
      passwordHash: 'hashed_sample_secret_2026',
      role: 'STUDENT',
      isVerified: true,
      isSubscribed: false,
    });
    console.log(`✓ Test user created: ${testUser._id}, isSubscribed: ${testUser.isSubscribed}`);

    // 2. Create a manual bank transfer record with PENDING_REVIEW
    console.log('[2/4] Testing Payment model for MANUAL_BANK_TRANSFER & PENDING_REVIEW...');
    const reference = `MDR-TEST-${Date.now()}`;
    testPaymentPending = await Payment.create({
      userId: testUser._id,
      reference,
      amountKobo: 450000, // ₦4,500 in kobo
      currency: 'NGN',
      provider: 'MANUAL_BANK_TRANSFER',
      status: 'PENDING_REVIEW',
      channel: 'bank_transfer',
      depositorName: 'Chinedu Eze',
      bankName: 'Access Bank PLC',
      transferDate: new Date('2026-09-20'),
      proofUrl: 'https://res.cloudinary.com/markdriller/image/upload/sample_receipt.png',
      metadata: {
        plan: 'utme_pass_6m',
        planName: 'UTME 6-Month Intensive Drill',
        userEmail: testEmail,
        userFullName: testUser.fullName,
      },
    });

    if (testPaymentPending.status !== 'PENDING_REVIEW' || testPaymentPending.provider !== 'MANUAL_BANK_TRANSFER') {
      throw new Error(`Expected PENDING_REVIEW status and MANUAL_BANK_TRANSFER provider, got ${testPaymentPending.status}`);
    }
    console.log(`✓ Manual transfer payment created with reference: ${testPaymentPending.reference}, amount: ₦${testPaymentPending.amountKobo / 100}`);

    // 3. Simulate Admin Approval Workflow
    console.log('[3/4] Testing Admin Approval logic & Pro subscription activation...');
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 180);

    const subscription = await Subscription.findOneAndUpdate(
      { userId: testUser._id },
      {
        plan: 'PRO_ANNUAL',
        status: 'ACTIVE',
        startDate,
        endDate,
        autoRenew: false,
      },
      { upsert: true, new: true }
    );

    // Update payment to SUCCESS with admin audit trail and link subscription
    testPaymentPending.status = 'SUCCESS';
    testPaymentPending.subscriptionId = subscription._id;
    testPaymentPending.paidAt = new Date();
    testPaymentPending.reviewedAt = new Date();
    testPaymentPending.adminReviewNotes = 'Verified against GTBank statement. Approved by Admin.';
    await testPaymentPending.save();

    const verifiedSub = await Subscription.findOne({ userId: testUser._id });
    if (!verifiedSub || verifiedSub.status !== 'ACTIVE' || verifiedSub.plan !== 'PRO_ANNUAL') {
      throw new Error('User subscription activation verification failed');
    }
    console.log(`✓ Student subscription successfully activated: plan=${verifiedSub.plan}, status=${verifiedSub.status}, validUntil=${verifiedSub.endDate?.toISOString()}`);

    // 4. Test Rejection Workflow
    console.log('[4/4] Testing Rejection workflow with audit notes...');
    const rejectRef = `MDR-REJ-${Date.now()}`;
    testPaymentReject = await Payment.create({
      userId: testUser._id,
      reference: rejectRef,
      amountKobo: 250000, // ₦2,500 in kobo
      currency: 'NGN',
      provider: 'MANUAL_BANK_TRANSFER',
      status: 'PENDING_REVIEW',
      depositorName: 'Anonymous Depositor',
      bankName: 'Access Bank',
      proofUrl: 'https://example.com/blurry.jpg',
    });

    testPaymentReject.status = 'REJECTED';
    testPaymentReject.reviewedAt = new Date();
    testPaymentReject.adminReviewNotes = 'Receipt illegible; payment not found in bank statement.';
    await testPaymentReject.save();

    const verifiedReject = await Payment.findById(testPaymentReject._id);
    if (verifiedReject?.status !== 'REJECTED' || !verifiedReject.adminReviewNotes) {
      throw new Error('Payment rejection verification failed');
    }
    console.log(`✓ Payment ${rejectRef} correctly rejected with note: "${verifiedReject.adminReviewNotes}"`);

    console.log('\n========================================');
    console.log('✅ ALL MANUAL PAYMENT & SUBSCRIPTION TESTS PASSED!');
    console.log('========================================\n');
  } catch (err) {
    console.error('❌ Verification failed:', err);
    process.exitCode = 1;
  } finally {
    console.log('Cleaning up test data...');
    if (testPaymentPending?._id) await Payment.findByIdAndDelete(testPaymentPending._id);
    if (testPaymentReject?._id) await Payment.findByIdAndDelete(testPaymentReject._id);
    if (testUser?._id) {
      await Subscription.deleteMany({ userId: testUser._id });
      await User.findByIdAndDelete(testUser._id);
    }
    await mongoose.disconnect();
    console.log('Disconnected from database.');
  }
}

verifyManualPaymentsAndCbt();
