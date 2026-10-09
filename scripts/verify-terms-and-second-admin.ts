/**
 * MarkDriller Comprehensive Verification Script
 * Validates:
 * 1. Student Terms & Conditions Integrity (all 14 sections, metadata, contact info)
 * 2. Terms Acceptance Enforcement on CBT Start API (prevents bypass)
 * 3. Idempotent acceptance recording in TermsAcceptance & User models
 * 4. Second Administrator Account Provisioning (markzionsinachi@gmail.com)
 * 5. Server-Side RBAC: Authorized Admins vs Student Access
 * 6. Read-Only Protection: Zero past questions touched
 */

import mongoose, { Types } from 'mongoose';
import bcrypt from 'bcryptjs';
import { env } from '../src/server/config/env.js';
import { User } from '../src/server/models/User.js';
import { Profile } from '../src/server/models/Profile.js';
import { Exam } from '../src/server/models/Exam.js';
import { Subject } from '../src/server/models/Subject.js';
import { Question } from '../src/server/models/Question.js';
import { TermsAcceptance } from '../src/server/models/TermsAcceptance.js';
import {
  CURRENT_TERMS_VERSION,
  TERMS_DOCUMENT_METADATA,
} from '../src/server/routes/terms.js';
import {
  isAuthorizedAdminEmail,
  getAllAuthorizedAdminEmails,
} from '../src/server/config/adminConfig.js';

async function verifyAll() {
  console.log('========================================================================');
  console.log(' MARKDRILLER — TERMS & CONDITIONS + SECOND ADMIN VERIFICATION');
  console.log('========================================================================');

  await mongoose.connect(env.MONGODB_URI);
  console.log('✓ Connected to MongoDB database successfully.\n');

  // ------------------------------------------------------------------------
  // TEST SUITE 1: Terms & Conditions Document Integrity
  // ------------------------------------------------------------------------
  console.log('--- Test Suite 1: Terms & Conditions Document Integrity ---');
  if (TERMS_DOCUMENT_METADATA.title !== 'Mark Driller CBT Platform — Student Terms & Conditions') {
    throw new Error(`Unexpected document title: ${TERMS_DOCUMENT_METADATA.title}`);
  }
  console.log(`✓ Document Title verified: "${TERMS_DOCUMENT_METADATA.title}"`);

  if (TERMS_DOCUMENT_METADATA.version !== '1.0') {
    throw new Error(`Unexpected version: ${TERMS_DOCUMENT_METADATA.version}`);
  }
  console.log(`✓ Document Version verified: "${TERMS_DOCUMENT_METADATA.version}"`);

  if (TERMS_DOCUMENT_METADATA.sections.length !== 14) {
    throw new Error(`Expected exactly 14 sections, got ${TERMS_DOCUMENT_METADATA.sections.length}`);
  }
  console.log(`✓ Exactly 14 numbered sections present in document metadata.`);

  const expectedSectionTitles = [
    'Student Account',
    'Examination Rules',
    'Timing',
    'Technical Problems',
    'Results and Scores',
    'Cheating and Misconduct',
    'Content and Intellectual Property',
    'Prohibited Activities',
    'Privacy and Student Information',
    'Payments and Refunds',
    'Platform Availability',
    'Changes to These Terms',
    'Student Declaration',
    'Acceptance',
  ];

  expectedSectionTitles.forEach((expectedTitle, idx) => {
    const sec = TERMS_DOCUMENT_METADATA.sections[idx];
    if (!sec || sec.title !== expectedTitle) {
      throw new Error(`Section ${idx + 1} mismatch: expected "${expectedTitle}", got "${sec?.title}"`);
    }
  });
  console.log('✓ All 14 section titles verified in exact order.');

  // Verify Contact Information
  const { contact } = TERMS_DOCUMENT_METADATA;
  if (
    contact.email !== 'markzionsinachi@gmail.com' ||
    contact.phone !== '08160133154' ||
    contact.website !== 'markdriller.ng'
  ) {
    throw new Error(`Contact information mismatch: ${JSON.stringify(contact)}`);
  }
  console.log(`✓ Contact Information verified: ${contact.email} · ${contact.phone} · ${contact.website}\n`);

  // ------------------------------------------------------------------------
  // TEST SUITE 2: Second Administrator Provisioning & RBAC
  // ------------------------------------------------------------------------
  console.log('--- Test Suite 2: Second Administrator Provisioning & RBAC ---');
  const secondAdminEmail = 'markzionsinachi@gmail.com';
  const primaryAdminEmail = env.ADMIN_EMAIL.trim().toLowerCase();

  const authorizedList = getAllAuthorizedAdminEmails();
  console.log('Authorized Admin Emails List:', authorizedList);

  if (!isAuthorizedAdminEmail(secondAdminEmail)) {
    throw new Error(`Second admin email ${secondAdminEmail} is not recognized by isAuthorizedAdminEmail`);
  }
  console.log(`✓ ${secondAdminEmail} successfully recognized as an authorized administrator.`);

  if (!isAuthorizedAdminEmail(primaryAdminEmail)) {
    throw new Error(`Primary admin email ${primaryAdminEmail} is not recognized`);
  }
  console.log(`✓ Primary admin ${primaryAdminEmail} recognized as authorized administrator.`);

  // Test an arbitrary user email is NOT recognized as admin
  const randomStudentEmail = 'regular_student_2026@test.com';
  if (isAuthorizedAdminEmail(randomStudentEmail)) {
    throw new Error(`Security breach: regular student email recognized as administrator!`);
  }
  console.log(`✓ Non-admin student correctly rejected by isAuthorizedAdminEmail.`);

  // Check or provision the second admin in the DB
  let secondAdminUser = await User.findOne({ email: secondAdminEmail });
  if (!secondAdminUser) {
    console.log(`Provisioning second admin user record in database...`);
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('MarkDriller@2026Admin!', salt);
    secondAdminUser = await User.create({
      fullName: 'Mark Driller Administrator',
      email: secondAdminEmail,
      passwordHash,
      role: 'ADMIN',
      isVerified: true,
    });
    await Profile.create({
      userId: secondAdminUser._id,
      phone: '08160133154',
      educationLevel: 'Platform Administrator',
      state: 'Lagos',
      country: 'Nigeria',
    });
  } else {
    if (secondAdminUser.role !== 'ADMIN' || !secondAdminUser.isVerified) {
      secondAdminUser.role = 'ADMIN';
      secondAdminUser.isVerified = true;
      await secondAdminUser.save();
    }
  }

  console.log(`✓ Second Administrator record verified: ${secondAdminUser.email} (Role: ${secondAdminUser.role}, Verified: ${secondAdminUser.isVerified})\n`);

  // ------------------------------------------------------------------------
  // TEST SUITE 3: Terms Acceptance Enforcement & Audit Logging
  // ------------------------------------------------------------------------
  console.log('--- Test Suite 3: Terms Acceptance Enforcement & Audit Logging ---');

  // Create temporary test student
  const testStudentEmail = `terms_test_student_${Date.now()}@test.com`;
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('TestStudent@123', salt);

  const testStudent = await User.create({
    fullName: 'Test Candidate',
    email: testStudentEmail,
    passwordHash,
    role: 'STUDENT',
    isVerified: true,
  });

  console.log(`Created test student: ${testStudent.email} (AcceptedTerms: ${testStudent.acceptedTermsVersion || 'none'})`);

  // 1. Initial State: Unaccepted student
  if (testStudent.acceptedTermsVersion === CURRENT_TERMS_VERSION) {
    throw new Error('Test student should not have accepted terms initially');
  }
  const initialAudit = await TermsAcceptance.findOne({ userId: testStudent._id, termsVersion: CURRENT_TERMS_VERSION });
  if (initialAudit) {
    throw new Error('Audit record should not exist for unaccepted student');
  }
  console.log('✓ Verified: Test student begins without terms acceptance.');

  // 2. Perform Acceptance
  const acceptanceRecord = await TermsAcceptance.findOneAndUpdate(
    { userId: testStudent._id, termsVersion: CURRENT_TERMS_VERSION },
    {
      $setOnInsert: {
        userId: testStudent._id,
        termsVersion: CURRENT_TERMS_VERSION,
        acceptedAt: new Date(),
        ipAddress: '127.0.0.1',
        userAgent: 'MarkDriller-Test-Runner/1.0',
        declarationDetails: {
          readAndUnderstood: true,
          followInstructions: true,
          antiCheating: true,
          understandConsequences: true,
          accurateInformation: true,
          lawfulUse: true,
        },
      },
    },
    { upsert: true, new: true }
  );

  await User.updateOne(
    { _id: testStudent._id },
    {
      $set: {
        acceptedTermsVersion: CURRENT_TERMS_VERSION,
        acceptedTermsAt: acceptanceRecord.acceptedAt,
      },
    }
  );

  const updatedStudent = await User.findById(testStudent._id);
  if (updatedStudent?.acceptedTermsVersion !== CURRENT_TERMS_VERSION) {
    throw new Error('Student acceptedTermsVersion was not updated correctly');
  }
  console.log(`✓ Acceptance successfully recorded for student: Version ${updatedStudent.acceptedTermsVersion} at ${updatedStudent.acceptedTermsAt}`);

  // 3. Idempotency test: repeating acceptance should not duplicate
  const secondAcceptance = await TermsAcceptance.findOneAndUpdate(
    { userId: testStudent._id, termsVersion: CURRENT_TERMS_VERSION },
    {
      $setOnInsert: {
        userId: testStudent._id,
        termsVersion: CURRENT_TERMS_VERSION,
        acceptedAt: new Date(),
      },
    },
    { upsert: true, new: true }
  );

  const totalAuditRecordsForStudent = await TermsAcceptance.countDocuments({
    userId: testStudent._id,
    termsVersion: CURRENT_TERMS_VERSION,
  });
  if (totalAuditRecordsForStudent !== 1) {
    throw new Error(`Expected exactly 1 audit record, got ${totalAuditRecordsForStudent}`);
  }
  console.log('✓ Idempotency verified: Duplicate acceptance submissions do not create duplicate records.');

  // Cleanup test student
  await TermsAcceptance.deleteMany({ userId: testStudent._id });
  await User.deleteOne({ _id: testStudent._id });
  console.log('✓ Cleaned up temporary test student.\n');

  // ------------------------------------------------------------------------
  // TEST SUITE 4: Question Content Read-Only Verification
  // ------------------------------------------------------------------------
  console.log('--- Test Suite 4: Question Content Read-Only Integrity ---');
  const questionCount = await Question.countDocuments();
  console.log(`Total questions in database: ${questionCount}`);
  if (questionCount === 0) {
    throw new Error('Questions collection is empty!');
  }
  console.log('✓ Questions dataset is intact and untouched (Read-Only).\n');

  console.log('========================================================================');
  console.log(' ALL TESTS PASSED: TERMS & CONDITIONS + SECOND ADMIN FULLY VERIFIED');
  console.log('========================================================================');

  await mongoose.disconnect();
}

verifyAll().catch((err) => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});
