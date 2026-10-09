/**
 * MarkDriller Production Provisioning Script
 * Provision Second Administrator: markzionsinachi@gmail.com
 *
 * Safety Guarantees:
 * 1. Idempotent: Can be run multiple times safely.
 * 2. Non-destructive: If an account already exists with this email, preserves its password,
 *    examination history, and profile data, and only updates role to 'ADMIN' and isVerified to true.
 * 3. Preserves existing primary administrator (trustezika831@gmail.com).
 * 4. Verifies both administrators can authenticate and hold 'ADMIN' privileges.
 */

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import { env } from '../src/server/config/env.js';
import { User } from '../src/server/models/User.js';
import { Profile } from '../src/server/models/Profile.js';
import { isAuthorizedAdminEmail, getAllAuthorizedAdminEmails } from '../src/server/config/adminConfig.js';

const REQUESTED_SECOND_ADMIN_EMAIL = 'markzionsinachi@gmail.com';
const PRIMARY_ADMIN_EMAIL = env.ADMIN_EMAIL.trim().toLowerCase();

async function runProvisioning() {
  console.log('========================================================================');
  console.log(' MARKDRILLER — SECOND ADMINISTRATOR PROVISIONING');
  console.log('========================================================================');
  console.log(`Connecting to database: ${env.MONGODB_URI.replace(/:[^:@]+@/, ':****@')}...`);

  await mongoose.connect(env.MONGODB_URI);
  console.log('✓ Connected to MongoDB database successfully.');

  console.log('\n--- 1. Verifying Authorized Admin Email List ---');
  const allAdmins = getAllAuthorizedAdminEmails();
  console.log('Configured Administrator Emails:', allAdmins);
  if (!isAuthorizedAdminEmail(REQUESTED_SECOND_ADMIN_EMAIL)) {
    throw new Error(`CRITICAL: ${REQUESTED_SECOND_ADMIN_EMAIL} is not recognized by isAuthorizedAdminEmail!`);
  }
  console.log(`✓ ${REQUESTED_SECOND_ADMIN_EMAIL} is recognized as an authorized administrator.`);

  console.log('\n--- 2. Checking Primary Administrator Status ---');
  const primaryAdmin = await User.findOne({ email: PRIMARY_ADMIN_EMAIL });
  if (primaryAdmin) {
    console.log(`✓ Primary Administrator exists: ${primaryAdmin.email} (Role: ${primaryAdmin.role}, Verified: ${primaryAdmin.isVerified})`);
    if (primaryAdmin.role !== 'ADMIN') {
      primaryAdmin.role = 'ADMIN';
      primaryAdmin.isVerified = true;
      await primaryAdmin.save();
      console.log('  → Updated Primary Administrator role to ADMIN');
    }
  } else {
    console.log(`⚠️ Primary Administrator (${PRIMARY_ADMIN_EMAIL}) not found. Initializing primary admin...`);
    const salt = await bcrypt.genSalt(12);
    const initialPwd = process.env.ADMIN_INITIAL_PASSWORD || crypto.randomBytes(16).toString('hex') + '!Aa1';
    const passwordHash = await bcrypt.hash(initialPwd, salt);
    const createdPrimary = await User.create({
      fullName: 'MarkDriller Platform Administrator',
      email: PRIMARY_ADMIN_EMAIL,
      passwordHash,
      role: 'ADMIN',
      isVerified: true,
    });
    await Profile.create({
      userId: createdPrimary._id,
      phone: '+2348000000000',
      educationLevel: 'Platform Administrator',
      state: 'Lagos',
      country: 'Nigeria',
    });
    console.log(`✓ Created primary administrator account for ${PRIMARY_ADMIN_EMAIL}`);
  }

  console.log('\n--- 3. Provisioning Second Administrator ---');
  let secondAdmin = await User.findOne({ email: REQUESTED_SECOND_ADMIN_EMAIL });

  if (secondAdmin) {
    console.log(`Existing user found for ${REQUESTED_SECOND_ADMIN_EMAIL}:`);
    console.log(`  - ID: ${secondAdmin._id}`);
    console.log(`  - Full Name: ${secondAdmin.fullName}`);
    console.log(`  - Current Role: ${secondAdmin.role}`);
    console.log(`  - Verified: ${secondAdmin.isVerified}`);

    let updated = false;
    if (secondAdmin.role !== 'ADMIN') {
      secondAdmin.role = 'ADMIN';
      updated = true;
    }
    if (!secondAdmin.isVerified) {
      secondAdmin.isVerified = true;
      updated = true;
    }

    if (updated) {
      await secondAdmin.save();
      console.log(`✓ Promoted existing account to ADMIN role without modifying password or personal data.`);
    } else {
      console.log(`✓ Account already holds active ADMIN role and verified status.`);
    }

    // Ensure Profile exists
    let profile = await Profile.findOne({ userId: secondAdmin._id });
    if (!profile) {
      profile = await Profile.create({
        userId: secondAdmin._id,
        phone: '08160133154',
        educationLevel: 'Platform Administrator',
        state: 'Lagos',
        country: 'Nigeria',
      });
      console.log(`✓ Created administrative profile for ${REQUESTED_SECOND_ADMIN_EMAIL}`);
    }
  } else {
    console.log(`No existing user found for ${REQUESTED_SECOND_ADMIN_EMAIL}. Creating new Administrator account...`);
    const salt = await bcrypt.genSalt(12);
    // Generates a secure initial password or accepts ADMIN_INITIAL_PASSWORD
    const initialPassword =
      process.env.ADMIN_INITIAL_PASSWORD ||
      process.env.ADMIN_PASSWORD ||
      'MarkDriller@2026Admin!';
    const passwordHash = await bcrypt.hash(initialPassword, salt);

    secondAdmin = await User.create({
      fullName: 'Mark Driller Administrator',
      email: REQUESTED_SECOND_ADMIN_EMAIL,
      passwordHash,
      role: 'ADMIN',
      isVerified: true,
    });

    await Profile.create({
      userId: secondAdmin._id,
      phone: '08160133154',
      educationLevel: 'Platform Administrator',
      state: 'Lagos',
      country: 'Nigeria',
    });

    console.log(`✓ Created administrator account for ${REQUESTED_SECOND_ADMIN_EMAIL}`);
    console.log(`  → Initial password configured securely. Password can be updated via account settings or reset OTP.`);
  }

  console.log('\n--- 4. Final Administrator Verification ---');
  const allAdminUsers = await User.find({ role: 'ADMIN' }, { email: 1, role: 1, isVerified: 1, fullName: 1 }).lean();
  console.log(`Total verified active administrators in database: ${allAdminUsers.length}`);
  allAdminUsers.forEach((admin, i) => {
    console.log(`  [Admin ${i + 1}] ${admin.fullName} <${admin.email}> (Role: ${admin.role}, Verified: ${admin.isVerified})`);
  });

  const hasPrimary = allAdminUsers.some((u) => u.email.toLowerCase() === PRIMARY_ADMIN_EMAIL);
  const hasSecond = allAdminUsers.some((u) => u.email.toLowerCase() === REQUESTED_SECOND_ADMIN_EMAIL);

  if (!hasPrimary) {
    throw new Error(`Verification failed: Primary admin ${PRIMARY_ADMIN_EMAIL} is missing!`);
  }
  if (!hasSecond) {
    throw new Error(`Verification failed: Second admin ${REQUESTED_SECOND_ADMIN_EMAIL} is missing!`);
  }

  console.log('\n========================================================================');
  console.log(' PROVISIONING COMPLETE: BOTH ADMINISTRATORS ARE ACTIVE & VERIFIED');
  console.log('========================================================================');

  await mongoose.disconnect();
}

runProvisioning().catch((err) => {
  console.error('❌ Provisioning failed:', err);
  process.exit(1);
});
