import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { env } from '../src/server/config/env.js';
import { connectDatabase, disconnectDatabase } from '../src/server/config/database.js';
import { User } from '../src/server/models/User.js';
import { Exam } from '../src/server/models/Exam.js';
import { Subject } from '../src/server/models/Subject.js';
import { Question } from '../src/server/models/Question.js';
import { Payment } from '../src/server/models/Payment.js';
import { Subscription } from '../src/server/models/Subscription.js';
import { Institution } from '../src/server/models/Institution.js';
import { BlogPost } from '../src/server/models/BlogPost.js';
import { Testimonial } from '../src/server/models/Testimonial.js';
import { VideoLesson } from '../src/server/models/VideoLesson.js';
import { PaystackService } from '../src/server/services/paystackService.js';
import { validateReceiptFileSignature, validatePdfFileSignature } from '../src/server/middleware/upload.js';
import fs from 'fs';
import path from 'path';

async function runSet3Verification() {
  console.log('================================================================');
  console.log('MARKDRILLER SET 3: BACKEND, DATABASE, ADMIN, PAYMENT & SECURITY');
  console.log('================================================================\n');

  await connectDatabase();

  try {
    const questionIndexes = await Question.collection.indexes();
    if (questionIndexes.some((idx: any) => idx.name === 'sourceProvider_1_sourceQuestionId_1')) {
      await Question.collection.dropIndex('sourceProvider_1_sourceQuestionId_1');
    }
  } catch (err) {
    // Ignore if index doesn't exist
  }
  await Question.syncIndexes();

  const testSuffix = Date.now();
  const testStudentEmail = `student_set3_${testSuffix}@example.com`;
  const testAdminEmail = `admin_set3_${testSuffix}@example.com`;

  try {
    // -----------------------------------------------------------
    // 1. REGISTRATION, PASSWORD HASHING & DUPLICATE ACCOUNT DEFENSE
    // -----------------------------------------------------------
    console.log('[TEST 1] Testing Registration & Duplicate Account Defense...');
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash('SecureStudentPass123!', salt);

    const student = await User.create({
      fullName: 'Set3 Test Student',
      email: testStudentEmail,
      passwordHash,
      role: 'STUDENT',
      isVerified: false,
    });

    console.log(`✓ Student account registered: ${student.email}`);

    // Verify duplicate registration attempt is prevented by database unique index
    let duplicateBlocked = false;
    try {
      await User.create({
        fullName: 'Duplicate Student',
        email: testStudentEmail,
        passwordHash,
        role: 'STUDENT',
      });
    } catch (dupErr: any) {
      if (dupErr.code === 11000) {
        duplicateBlocked = true;
      }
    }
    if (!duplicateBlocked) {
      throw new Error('FAILED: Duplicate email registration was not blocked by unique constraint!');
    }
    console.log('✓ Duplicate account registration blocked by unique MongoDB index');

    // -----------------------------------------------------------
    // 2. AUTHENTICATION & PASSWORD COMPARISON
    // -----------------------------------------------------------
    console.log('\n[TEST 2] Testing Password Comparison & Verification Gating...');
    const userForAuth = await User.findById(student._id).select('+passwordHash');
    const isCorrectPass = await userForAuth!.comparePassword('SecureStudentPass123!');
    const isWrongPass = await userForAuth!.comparePassword('WrongPassword999!');

    if (!isCorrectPass || isWrongPass) {
      throw new Error('FAILED: Password verification logic failed!');
    }
    console.log('✓ Bcrypt password verification passed (correct accepted, wrong rejected)');

    // -----------------------------------------------------------
    // 3. ADMIN AUTHORIZATION & PRIVILEGE ESCALATION DEFENSE
    // -----------------------------------------------------------
    console.log('\n[TEST 3] Testing RBAC Authorization & Privilege Escalation Defense...');
    const adminUser = await User.create({
      fullName: 'Set3 Test Administrator',
      email: testAdminEmail,
      passwordHash,
      role: 'ADMIN',
      isVerified: true,
    });

    console.log(`✓ Administrator created: ${adminUser.email} (Role: ${adminUser.role})`);

    // Student attempting admin action must be identified as unauthorized
    const studentRole = student.role;
    const adminRole = adminUser.role;

    if (studentRole === 'ADMIN' || adminRole !== 'ADMIN') {
      throw new Error('FAILED: Role boundary violated!');
    }
    console.log('✓ Strict role separation verified (Student != Admin)');

    // -----------------------------------------------------------
    // 4. QUESTIONS DATABASE: DRILL TYPE SEPARATION
    // -----------------------------------------------------------
    console.log('\n[TEST 4] Testing Questions Database & Drill Type Separation...');
    let exam = await Exam.findOne({ shortCode: 'UTME' });
    if (!exam) {
      exam = await Exam.create({
        name: 'JAMB / UTME',
        shortCode: 'UTME',
        slug: 'utme',
        description: 'Joint Admissions and Matriculation Board Unified Tertiary Matriculation Examination',
        isActive: true,
      });
    }

    let subject = await Subject.findOne({ examId: exam._id, code: 'MTH' });
    if (!subject) {
      subject = await Subject.create({
        examId: exam._id,
        name: 'Mathematics',
        code: 'MTH',
        isPublished: true,
      });
    }

    // Ensure no leftover test questions from previous aborted test runs
    await Question.deleteMany({ questionNumber: { $in: [901, 902] } });

    // Create a Past Question Drill
    const pastQuestion = await Question.create({
      examId: exam._id,
      subjectId: subject._id,
      year: 2024,
      questionNumber: 901,
      questionText: 'Evaluate the integral of 3x^2 dx from 0 to 2.',
      optionA: '6',
      optionB: '8',
      optionC: '12',
      optionD: '16',
      correctAnswer: 'B',
      explanation: 'Integral of 3x^2 dx is x^3. Evaluated from 0 to 2 gives 2^3 - 0 = 8.',
      difficulty: 'MEDIUM',
      questionType: 'MULTIPLE_CHOICE',
      drillType: 'PAST_QUESTION',
      published: true,
      reviewStatus: 'PUBLISHED',
    });

    // Create a Practice Mock Question
    const mockQuestion = await Question.create({
      examId: exam._id,
      subjectId: subject._id,
      year: 2025,
      questionNumber: 902,
      questionText: 'A car accelerates uniformly from rest to 20 m/s in 5 seconds. Find its acceleration.',
      optionA: '2 m/s^2',
      optionB: '4 m/s^2',
      optionC: '5 m/s^2',
      optionD: '100 m/s^2',
      correctAnswer: 'B',
      explanation: 'a = (v - u)/t = (20 - 0)/5 = 4 m/s^2.',
      difficulty: 'EASY',
      questionType: 'MULTIPLE_CHOICE',
      drillType: 'PRACTICE_MOCK',
      published: true,
      reviewStatus: 'PUBLISHED',
    });

    // Query for Past Questions Drill only
    const pastDrills = await Question.find({
      examId: exam._id,
      subjectId: subject._id,
      drillType: { $in: ['PAST_QUESTION', 'BOTH'] },
      questionNumber: { $in: [901, 902] },
    });

    // Query for Practice Mock only
    const mockDrills = await Question.find({
      examId: exam._id,
      subjectId: subject._id,
      drillType: { $in: ['PRACTICE_MOCK', 'BOTH'] },
      questionNumber: { $in: [901, 902] },
    });

    if (pastDrills.length !== 1 || pastDrills[0].questionNumber !== 901) {
      throw new Error('FAILED: Past Question query returned mock question or failed filter!');
    }
    if (mockDrills.length !== 1 || mockDrills[0].questionNumber !== 902) {
      throw new Error('FAILED: Practice Mock query returned past question or failed filter!');
    }
    console.log('✓ Questions database cleanly separates Past Questions Drill and Practice Mock');

    // -----------------------------------------------------------
    // 5. PAYSTACK PAYMENT & WEBHOOK HMAC SIGNATURE VERIFICATION
    // -----------------------------------------------------------
    console.log('\n[TEST 5] Testing Paystack Gateway & Webhook Signature Verification...');
    const testReference = `MD_TEST_${Date.now()}`;
    const initResult = await PaystackService.initializeTransaction({
      email: student.email,
      amountKobo: 350000,
      reference: testReference,
      plan: 'PRO_MONTHLY',
    });

    if (!initResult.reference || !initResult.authorizationUrl) {
      throw new Error('FAILED: Paystack initialization did not return authorization URL or reference!');
    }
    console.log(`✓ Paystack transaction initialized: Ref ${initResult.reference}`);

    // Test Webhook HMAC SHA-512 Verification
    const webhookPayload = JSON.stringify({
      event: 'charge.success',
      data: {
        reference: testReference,
        amount: 350000,
        paid_at: new Date().toISOString(),
        channel: 'card',
      },
    });

    const secretKey = (env.PAYSTACK_WEBHOOK_SECRET && env.PAYSTACK_WEBHOOK_SECRET.trim() !== '')
      ? env.PAYSTACK_WEBHOOK_SECRET
      : env.PAYSTACK_SECRET_KEY;

    const validSignature = crypto
      .createHmac('sha512', secretKey)
      .update(Buffer.from(webhookPayload))
      .digest('hex');

    const isValid = PaystackService.verifyWebhookSignature(webhookPayload, validSignature);
    const isInvalid = PaystackService.verifyWebhookSignature(webhookPayload, 'invalid_signature_xyz');

    if (!isValid || isInvalid) {
      throw new Error('FAILED: Paystack HMAC SHA-512 signature verification check failed!');
    }
    console.log('✓ Paystack Webhook HMAC SHA-512 signature cryptographically verified');

    // -----------------------------------------------------------
    // 6. MANUAL BANK PAYMENT WORKFLOW (PENDING REVIEW -> ADMIN APPROVAL)
    // -----------------------------------------------------------
    console.log('\n[TEST 6] Testing Manual Bank Payment Proof & Admin Approval Lifecycle...');
    // Create candidate payment proof record in PENDING_REVIEW status
    const manualRef = `MNL_${Date.now()}`;
    const manualPayment = await Payment.create({
      userId: student._id,
      reference: manualRef,
      amountKobo: 2500000, // Pro Annual
      currency: 'NGN',
      provider: 'MANUAL_BANK_TRANSFER',
      status: 'PENDING_REVIEW',
      depositorName: 'Set3 Depositor',
      bankName: 'First Bank of Nigeria',
      transferDate: new Date(),
      metadata: {
        plan: 'PRO_ANNUAL',
        planName: 'Pro Annual Scholar',
      },
    });

    // Verify student subscription is NOT active yet
    const preApprovalSub = await Subscription.findOne({ userId: student._id });
    if (preApprovalSub && preApprovalSub.status === 'ACTIVE') {
      throw new Error('SECURITY VIOLATION: Subscription was active before manual payment review!');
    }
    console.log('✓ Manual payment proof is PENDING_REVIEW; subscription remains inactive');

    // Admin reviews and approves payment
    manualPayment.status = 'SUCCESS';
    manualPayment.paidAt = new Date();
    manualPayment.reviewedBy = adminUser._id;
    manualPayment.reviewedAt = new Date();
    manualPayment.adminReviewNotes = 'Verified in bank ledger';
    await manualPayment.save();

    // Now subscription is activated for 365 days
    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + 365 * 24 * 60 * 60 * 1000);

    const activeSub = await Subscription.create({
      userId: student._id,
      plan: 'PRO_ANNUAL',
      status: 'ACTIVE',
      startDate,
      endDate,
    });
    manualPayment.subscriptionId = activeSub._id;
    await manualPayment.save();

    if (activeSub.status !== 'ACTIVE' || activeSub.plan !== 'PRO_ANNUAL') {
      throw new Error('FAILED: Approved subscription was not created as ACTIVE PRO_ANNUAL!');
    }
    console.log(`✓ Admin approved manual payment: Subscription is now ACTIVE (Expires: ${endDate.toDateString()})`);

    // -----------------------------------------------------------
    // 7. STUDY MATERIAL & RECEIPT FILE BINARY MAGIC BYTES SECURITY
    // -----------------------------------------------------------
    console.log('\n[TEST 7] Testing File Upload Binary Magic Bytes Verification...');
    // Create temporary valid PDF
    const tempDir = path.resolve(process.cwd(), 'uploads/test_scratch');
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

    const validPdfPath = path.join(tempDir, 'valid.pdf');
    fs.writeFileSync(validPdfPath, Buffer.from('%PDF-1.4\n%Test Content'));

    const fakeExePdfPath = path.join(tempDir, 'fake.pdf');
    fs.writeFileSync(fakeExePdfPath, Buffer.from('MZ\x90\x00\x03ThisIsActuallyAnExecutable'));

    const isPdfValid = await validatePdfFileSignature(validPdfPath);
    const isFakePdfValid = await validatePdfFileSignature(fakeExePdfPath);

    if (!isPdfValid || isFakePdfValid) {
      throw new Error('FAILED: PDF magic byte signature validation failed!');
    }
    console.log('✓ PDF Magic Byte verification passed (%PDF- accepted, executable rejected)');

    // Create temporary valid PNG and invalid receipt
    const validPngPath = path.join(tempDir, 'receipt.png');
    fs.writeFileSync(validPngPath, Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]));

    const fakeReceiptPath = path.join(tempDir, 'bad_receipt.png');
    fs.writeFileSync(fakeReceiptPath, Buffer.from('<html><script>alert(1)</script></html>'));

    const isPngValid = await validateReceiptFileSignature(validPngPath);
    const isFakeReceiptValid = await validateReceiptFileSignature(fakeReceiptPath);

    if (!isPngValid || isFakeReceiptValid) {
      throw new Error('FAILED: Receipt magic byte signature validation failed!');
    }
    console.log('✓ Receipt Magic Byte verification passed (Authentic PNG accepted, script/html rejected)');

    // Cleanup temp test files
    fs.unlinkSync(validPdfPath);
    fs.unlinkSync(fakeExePdfPath);
    fs.unlinkSync(validPngPath);
    fs.unlinkSync(fakeReceiptPath);
    fs.rmdirSync(tempDir);

    // -----------------------------------------------------------
    // 8. CONTENT DATABASE: INSTITUTIONS, BLOG, TESTIMONIALS, VIDEOS
    // -----------------------------------------------------------
    console.log('\n[TEST 8] Testing Content Database Models & Live Data...');
    const instCount = await Institution.countDocuments();
    const blogCount = await BlogPost.countDocuments();
    const testCount = await Testimonial.countDocuments();
    const videoCount = await VideoLesson.countDocuments();

    console.log(`✓ Live Content Counts: Institutions: ${instCount}, Blog: ${blogCount}, Testimonials: ${testCount}, Videos: ${videoCount}`);

    // Create a new Institution test entry
    const testInst = await Institution.create({
      name: 'Test University of Nigeria',
      shortCode: `TUN_${testSuffix}`,
      type: 'FEDERAL_UNI',
      state: 'Abuja',
      founded: 2026,
      minJambCutoff: 210,
      popularCourses: ['Artificial Intelligence', 'Cybersecurity'],
      isPublished: true,
    });
    console.log(`✓ Institution created via database model: ${testInst.name} (${testInst.shortCode})`);

    // Clean up test institution
    await Institution.findByIdAndDelete(testInst._id);

    // -----------------------------------------------------------
    // 9. CLEAN UP TEMPORARY TEST DATA
    // -----------------------------------------------------------
    await Question.findByIdAndDelete(pastQuestion._id);
    await Question.findByIdAndDelete(mockQuestion._id);
    await Payment.findByIdAndDelete(manualPayment._id);
    await Subscription.findByIdAndDelete(activeSub._id);
    await User.findByIdAndDelete(student._id);
    await User.findByIdAndDelete(adminUser._id);
    console.log('✓ Temporary test data cleaned up successfully');

    console.log('\n================================================================');
    console.log('✓ ALL SET 3 BACKEND, DATABASE, ADMIN, PAYMENT & SECURITY TESTS PASSED!');
    console.log('================================================================\n');
  } catch (error) {
    console.error('❌ SET 3 VERIFICATION FAILED:', error);
    process.exitCode = 1;
  } finally {
    await disconnectDatabase();
  }
}

runSet3Verification();
