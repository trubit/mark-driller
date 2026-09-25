import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { env } from '../src/server/config/env.js';
import { connectDatabase } from '../src/server/config/database.js';
import { User } from '../src/server/models/User.js';
import { Profile } from '../src/server/models/Profile.js';
import { Question } from '../src/server/models/Question.js';
import { Subject } from '../src/server/models/Subject.js';
import { Topic } from '../src/server/models/Topic.js';
import { Exam } from '../src/server/models/Exam.js';
import { Payment } from '../src/server/models/Payment.js';
import { SupportTicket } from '../src/server/models/SupportTicket.js';
import { getDynamicSupportConfig } from '../src/server/services/supportConfigService.js';

async function runPostCleanupVerification() {
  console.log('================================================================');
  console.log('🔍 MARKDRILLER POST-CLEANUP VERIFICATION AUDIT (API/CLI ONLY)');
  console.log('================================================================');

  await connectDatabase({ maxPoolSize: 10, minPoolSize: 1 });
  const db = mongoose.connection.db;
  if (!db) throw new Error('Database connection failed');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, message: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  // --- 1. Question & Curriculum Integrity Check ---
  console.log('\n--- 1. Examination & Question Data Integrity Check ---');
  const questionCount = await Question.countDocuments();
  const subjectCount = await Subject.countDocuments();
  const topicCount = await Topic.countDocuments();
  const examCount = await Exam.countDocuments();

  assert(questionCount === 4204, `Question count is exactly 4,204 (found: ${questionCount})`);
  assert(subjectCount === 43, `Subject count is exactly 43 (found: ${subjectCount})`);
  assert(topicCount === 234, `Topic count is exactly 234 (found: ${topicCount})`);
  assert(examCount === 7, `Exam count is exactly 7 (found: ${examCount})`);

  // Sample question integrity check
  const sampleQuestion = await Question.findOne().lean();
  assert(
    sampleQuestion !== null &&
      typeof sampleQuestion.questionText === 'string' &&
      sampleQuestion.questionText.length > 0 &&
      typeof sampleQuestion.optionA === 'string' &&
      typeof sampleQuestion.optionB === 'string' &&
      typeof sampleQuestion.correctAnswer === 'string',
    `Question document schema and content are intact (Sample: "${sampleQuestion?.questionText.slice(0, 45)}...", Answer: ${sampleQuestion?.correctAnswer})`
  );

  // --- 2. User Inventory Post-Cleanup ---
  console.log('\n--- 2. Post-Cleanup User Inventory ---');
  const allUsers = await User.find({}).sort({ createdAt: 1 }).lean();
  assert(allUsers.length === 21, `Total remaining users is 21 (found: ${allUsers.length})`);

  const admins = allUsers.filter((u) => u.role === 'ADMIN');
  const students = allUsers.filter((u) => u.role === 'STUDENT');

  assert(admins.length === 3, `Preserved 3 Admin/Staff accounts (found: ${admins.length})`);
  assert(students.length === 18, `Preserved 18 Real Student accounts (found: ${students.length})`);

  const primaryAdmin = await User.findOne({ email: env.ADMIN_EMAIL.toLowerCase() });
  assert(primaryAdmin !== null && primaryAdmin.role === 'ADMIN', `Primary Admin (${env.ADMIN_EMAIL}) is active with ADMIN role`);

  const platformAdmin = await User.findOne({ email: 'admin@markdriller.com' });
  assert(platformAdmin !== null && platformAdmin.role === 'ADMIN', 'Platform Administrator (admin@markdriller.com) is active with ADMIN role');

  const thirdAdmin = await User.findOne({ email: 'emmanuelezele1@gmail.com' });
  assert(thirdAdmin !== null && thirdAdmin.role === 'ADMIN', 'Designated Administrator (emmanuelezele1@gmail.com) is active with ADMIN role');

  // Verify Zero Test Users in Database
  const testUsersCount = await User.countDocuments({ email: { $regex: /@example\.com$/i } });
  assert(testUsersCount === 0, `Zero test accounts with @example.com remain (found: ${testUsersCount})`);

  // Verify Real Users have payments and profiles intact
  const paymentsCount = await Payment.countDocuments();
  assert(paymentsCount === 14, `Real customer payments remain intact (found: ${paymentsCount})`);

  const ticketsCount = await SupportTicket.countDocuments();
  assert(ticketsCount === 4, `Customer support tickets remain intact (found: ${ticketsCount})`);

  // --- 3. Dynamic Customer Support Settings ---
  console.log('\n--- 3. Dynamic Customer Support Settings Verification ---');
  const supportConfig = await getDynamicSupportConfig();
  assert(
    typeof supportConfig.email === 'string' && supportConfig.email.length > 0,
    `Dynamic Customer Support setting successfully resolved (Email: ${supportConfig.email}, WhatsApp: ${supportConfig.whatsappDisplay})`
  );

  // --- 4. Ephemeral Real Customer Registration & Auth Flow Verification ---
  console.log('\n--- 4. Ephemeral Registration & Lifecycle Test (Self-Cleaning) ---');
  const ephemeralEmail = `ephemeral_verify_${Date.now()}@markdriller.test`;
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('TestPass123!@#', salt);

  const testRegistration = await User.create({
    fullName: 'Ephemeral Verification User',
    email: ephemeralEmail,
    passwordHash,
    role: 'STUDENT',
    isVerified: true,
  });

  assert(testRegistration._id !== undefined, 'Ephemeral user registered successfully in database');

  const passValid = await testRegistration.comparePassword('TestPass123!@#');
  assert(passValid === true, 'Registered user password verification succeeded');

  const passInvalid = await testRegistration.comparePassword('WrongPassword');
  assert(passInvalid === false, 'Invalid password correctly rejected');

  // Immediately remove the ephemeral verification user so ZERO test users are left behind
  await User.deleteOne({ _id: testRegistration._id });
  const checkRemoved = await User.findById(testRegistration._id);
  assert(checkRemoved === null, 'Ephemeral verification user purged immediately (NO TEST USERS LEFT BEHIND)');

  // Final count check
  const finalUserCount = await User.countDocuments();
  assert(finalUserCount === 21, `Final user count strictly preserved at 21 (found: ${finalUserCount})`);

  console.log('\n======================================================');
  console.log(`VERIFICATION SUMMARY: ${passed} Passed, ${failed} Failed`);
  console.log('======================================================');

  await mongoose.disconnect();
  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runPostCleanupVerification().catch((err) => {
  console.error('❌ Post-cleanup verification error:', err);
  process.exit(1);
});
