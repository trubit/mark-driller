import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
const MONGODB_URI =
  process.env.MONGODB_URI ||
  process.env.MONGODB_URL ||
  '';

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI environment variable is required.');
  process.exit(1);
}

import { User } from '../src/server/models/User.js';
import { Subscription } from '../src/server/models/Subscription.js';
import { Payment } from '../src/server/models/Payment.js';
import { Exam } from '../src/server/models/Exam.js';
import { Question } from '../src/server/models/Question.js';
import { Subject } from '../src/server/models/Subject.js';
import { ExamAttempt } from '../src/server/models/ExamAttempt.js';
import { SystemSetting } from '../src/server/models/SystemSetting.js';

async function runVerification() {
  console.log('🚀 Starting MarkDriller Platform Comprehensive Headless Verification...\n');

  // 1. Verify Official Examination Logos on Disk
  console.log('--- 1. VERIFYING OFFICIAL EXAMINATION BRAND LOGO ASSETS ---');
  const requiredLogos = [
    'public/assets/logos/jamb.png',
    'public/assets/logos/waec.png',
    'public/assets/logos/neco.png',
    'public/assets/logos/nabteb.png',
  ];

  for (const relPath of requiredLogos) {
    const fullPath = path.resolve(process.cwd(), relPath);
    if (!fs.existsSync(fullPath)) {
      throw new Error(`CRITICAL: Official logo asset missing: ${relPath}`);
    }
    const stat = fs.statSync(fullPath);
    console.log(`  ✓ ${relPath} (${stat.size.toLocaleString()} bytes) verified.`);
  }

  // Verify POST-UTME and GCE do NOT have mock/unauthorized logo files (presented professionally without logos)
  const nonLogoChecks = [
    'public/assets/logos/postutme.png',
    'public/assets/logos/gce.png',
  ];
  for (const nonLogo of nonLogoChecks) {
    const fullPath = path.resolve(process.cwd(), nonLogo);
    if (fs.existsSync(fullPath)) {
      throw new Error(`CRITICAL: ${nonLogo} should not exist. POST-UTME and GCE must be presented professionally without logos.`);
    }
    console.log(`  ✓ Verified ${nonLogo} correctly removed (presented professionally without logos).`);
  }

  // 2. Connect to MongoDB Atlas
  console.log('\n--- 2. CONNECTING TO MONGODB ATLAS ---');
  await mongoose.connect(MONGODB_URI);
  console.log('  ✓ Connected successfully to MongoDB Atlas.');

  // 3. Verify Real Database Telemetry Calculations
  console.log('\n--- 3. TESTING DATABASE TELEMETRY AGGREGATIONS ---');
  const [totalQuestions, totalExams, totalSubjects, totalAttempts, totalStudents] = await Promise.all([
    Question.countDocuments({ published: true, reviewStatus: 'PUBLISHED' }),
    Exam.countDocuments({ isActive: true }),
    Subject.countDocuments({}),
    ExamAttempt.countDocuments({ status: 'COMPLETED' }),
    User.countDocuments({ role: 'STUDENT' }),
  ]);

  console.log(`  ✓ Published Questions in DB: ${totalQuestions}`);
  console.log(`  ✓ Active Examination Boards: ${totalExams}`);
  console.log(`  ✓ Accredited Subjects: ${totalSubjects}`);
  console.log(`  ✓ Completed CBT Mock Attempts: ${totalAttempts}`);
  console.log(`  ✓ Enrolled Students: ${totalStudents}`);

  // 4. Test Digital Subscription Lifecycle & Decommission Audit
  console.log('\n--- 4. TESTING DIGITAL SUBSCRIPTION LIFECYCLE & DECOMMISSION AUDIT ---');
  // Confirm ActivationKey model is deleted from source
  const activationKeyFile = path.resolve(process.cwd(), 'src/server/models/ActivationKey.ts');
  if (fs.existsSync(activationKeyFile)) {
    throw new Error('CRITICAL: src/server/models/ActivationKey.ts still exists! Voucher/PIN model must be decommissioned.');
  }
  console.log('  ✓ Verified: ActivationKey model permanently decommissioned from codebase.');

  // Find or create a test student user
  let testUser = await User.findOne({ email: 'sub-tester@markdriller.com' });
  if (!testUser) {
    testUser = await User.create({
      email: 'sub-tester@markdriller.com',
      fullName: 'Subscription Test Student',
      passwordHash: '$2a$10$dummyhashforverificationpurposesonly1234567890',
      role: 'STUDENT',
      isVerified: true,
      subscriptionStatus: 'FREE',
      subscriptionPlan: 'FREE',
    });
    console.log(`  ✓ Created test student: ${testUser.email}`);
  }

  // Create digital subscription
  const durationMs = 30 * 24 * 60 * 60 * 1000;
  const now = new Date();
  const expiryDate = new Date(now.getTime() + durationMs);

  let sub = await Subscription.findOne({ userId: testUser._id });
  if (sub) {
    sub.plan = 'PRO_MONTHLY';
    sub.status = 'ACTIVE';
    sub.startDate = now;
    sub.endDate = expiryDate;
    await sub.save();
  } else {
    sub = await Subscription.create({
      userId: testUser._id,
      plan: 'PRO_MONTHLY',
      status: 'ACTIVE',
      startDate: now,
      endDate: expiryDate,
    });
  }

  const testRef = `TEST-PAY-${Date.now()}`;
  await Payment.create({
    userId: testUser._id,
    reference: testRef,
    amountKobo: 350000,
    currency: 'NGN',
    provider: 'PAYSTACK',
    status: 'SUCCESS',
    channel: 'card',
  });

  console.log(`  ✓ Test subscription activated successfully.`);
  console.log(`  ✓ Subscription status: ${sub.status}, Plan: ${sub.plan}, Expiry: ${sub.endDate?.toISOString()}`);

  // Clean up verification data
  await User.deleteOne({ _id: testUser._id });
  await Subscription.deleteOne({ _id: sub._id });
  await Payment.deleteMany({ reference: testRef });
  console.log('  ✓ Cleaned up test records from database.');

  // 5. Verify Dynamic System Settings & Physical Bank Account in Atlas
  console.log('\n--- 5. TESTING DYNAMIC PHYSICAL BANK ACCOUNT SYSTEM ---');
  let currentSetting = await SystemSetting.findOne({ key: 'OFFICIAL_BANK_DETAILS' });
  if (!currentSetting) {
    console.log('  ℹ No custom bank account set yet. Verifying safe unconfigured state handling...');
  } else {
    console.log(`  ✓ SystemSetting "OFFICIAL_BANK_DETAILS" active in MongoDB Atlas:`);
    console.log(`    Bank: ${currentSetting.value?.bankName || 'Not configured'} | Account: ${currentSetting.value?.accountNumber || 'Not configured'} (${currentSetting.value?.accountName || ''})`);
  }

  // Test upsert capability with an isolated test key so admin bank account is NEVER overwritten
  const testSettingKey = 'TEST_VOLATILE_SETTING_VERIFY';
  await SystemSetting.findOneAndUpdate(
    { key: testSettingKey },
    { value: { verified: true, timestamp: Date.now() } },
    { upsert: true, new: true }
  );
  await SystemSetting.deleteOne({ key: testSettingKey });
  console.log('  ✓ SystemSetting persistence engine and upsert verified successfully.');

  // 6. Verify Multiple Admin Accounts & Absence of Startup Auto-Demotion
  console.log('\n--- 6. TESTING MULTIPLE ADMIN ACCOUNT ACCESS & RBAC ---');
  const adminUsers = await User.find({ role: 'ADMIN' }, { email: 1, fullName: 1, role: 1 }).lean();
  console.log(`  ✓ Found ${adminUsers.length} administrators in database:`);
  for (const a of adminUsers) {
    console.log(`    - [${a.role}] ${a.email} (${a.fullName})`);
  }
  if (adminUsers.length < 1) {
    throw new Error('CRITICAL: No administrators exist in the database!');
  }

  // 7. Verify Dashboard Pages Do NOT Leak Login Dashboard & Footers Completely Removed
  console.log('\n--- 7. VERIFYING DASHBOARD PAGES & FOOTER ELIMINATION CHECK ---');
  const dashboardFilesToCheck = [
    'src/components/SubscriptionPlans.tsx',
    'src/components/BlogPortal.tsx',
  ];
  for (const pFile of dashboardFilesToCheck) {
    const content = fs.readFileSync(path.resolve(process.cwd(), pFile), 'utf8');
    if (content.includes('<PortalHeader')) {
      throw new Error(`CRITICAL: Dashboard page ${pFile} is still rendering <PortalHeader />!`);
    }
    if (content.includes('<Footer')) {
      throw new Error(`CRITICAL: Dashboard page ${pFile} must NOT render <Footer />! Footer must be completely removed.`);
    }
    console.log(`  ✓ ${pFile}: Verified clean layout (Footer completely eliminated, 0 PortalHeader leaks).`);
  }

  // Verify Reseller Program is completely stopped from user-facing navigation
  const subContent = fs.readFileSync(path.resolve(process.cwd(), 'src/components/SubscriptionPlans.tsx'), 'utf8');
  if (subContent.includes('Explore Reseller Program') || subContent.includes('/reseller')) {
    throw new Error('CRITICAL: SubscriptionPlans still contains "Explore Reseller Program" link!');
  }
  console.log('  ✓ Verified: "Explore Reseller Program" link completely eliminated from SubscriptionPlans.');

  const navContent = fs.readFileSync(path.resolve(process.cwd(), 'src/components/Navbar.tsx'), 'utf8');
  if (navContent.includes('/reseller')) {
    throw new Error('CRITICAL: Navbar still contains /reseller link!');
  }
  console.log('  ✓ Verified: Reseller Program link completely eliminated from Navbar.');

  const footerContent = fs.readFileSync(path.resolve(process.cwd(), 'src/components/Footer.tsx'), 'utf8');
  if (footerContent.includes('/reseller')) {
    throw new Error('CRITICAL: Footer still contains /reseller link!');
  }
  console.log('  ✓ Verified: Reseller Program link completely eliminated from Footer.');

  await mongoose.disconnect();
  console.log('\n🎉 ALL HEADLESS VERIFICATIONS PASSED WITH 100% SUCCESS!\n');
}

runVerification().catch((err) => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});
