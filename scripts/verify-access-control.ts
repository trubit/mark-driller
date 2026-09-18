/**
 * MarkDriller Access Control & Route Separation Verification Suite
 * Tests all authentication, email verification, and RBAC authorization barriers
 * without opening any browser (as per critical execution directive).
 */

import { app, server, dbPromise } from '../src/server/index.js';
import { User } from '../src/server/models/User.js';
import { generateToken } from '../src/server/utils/jwt.js';
import bcrypt from 'bcryptjs';

async function runTests() {
  console.log('\n======================================================');
  console.log('MARKDRILLER ACCESS CONTROL & SECURITY TEST SUITE');
  console.log('======================================================\n');

  // Wait for database connection
  await dbPromise;
  console.log('✓ Database connection established.');

  const port = (server.address() as any)?.port || 5009;
  const baseUrl = `http://127.0.0.1:${port}`;
  console.log(`✓ Test target running on ${baseUrl}`);

  const dummyHash = await bcrypt.hash('Password123!', 10);

  // 1. Seed or retrieve test user fixtures
  const verifiedStudent = await User.findOneAndUpdate(
    { email: 'test_verified_student@markdriller.test' },
    {
      fullName: 'Verified Student',
      email: 'test_verified_student@markdriller.test',
      passwordHash: dummyHash,
      role: 'STUDENT',
      isVerified: true,
      accountStatus: 'ACTIVE',
    },
    { upsert: true, new: true }
  );

  const unverifiedStudent = await User.findOneAndUpdate(
    { email: 'test_unverified_student@markdriller.test' },
    {
      fullName: 'Unverified Student',
      email: 'test_unverified_student@markdriller.test',
      passwordHash: dummyHash,
      role: 'STUDENT',
      isVerified: false,
      accountStatus: 'ACTIVE',
    },
    { upsert: true, new: true }
  );

  const verifiedAdmin = await User.findOneAndUpdate(
    { email: 'test_verified_admin@markdriller.test' },
    {
      fullName: 'Platform Administrator',
      email: 'test_verified_admin@markdriller.test',
      passwordHash: dummyHash,
      role: 'ADMIN',
      isVerified: true,
      accountStatus: 'ACTIVE',
    },
    { upsert: true, new: true }
  );

  const suspendedStudent = await User.findOneAndUpdate(
    { email: 'test_suspended_student@markdriller.test' },
    {
      fullName: 'Suspended Student',
      email: 'test_suspended_student@markdriller.test',
      passwordHash: dummyHash,
      role: 'STUDENT',
      isVerified: true,
      accountStatus: 'SUSPENDED',
    },
    { upsert: true, new: true }
  );

  // Generate tokens
  const verifiedStudentToken = generateToken({
    userId: verifiedStudent._id.toString(),
    email: verifiedStudent.email,
    role: verifiedStudent.role,
  });

  const unverifiedStudentToken = generateToken({
    userId: unverifiedStudent._id.toString(),
    email: unverifiedStudent.email,
    role: unverifiedStudent.role,
  });

  const verifiedAdminToken = generateToken({
    userId: verifiedAdmin._id.toString(),
    email: verifiedAdmin.email,
    role: verifiedAdmin.role,
  });

  const suspendedStudentToken = generateToken({
    userId: suspendedStudent._id.toString(),
    email: suspendedStudent.email,
    role: suspendedStudent.role,
  });

  let passedCount = 0;
  let failedCount = 0;

  async function assertCase(
    name: string,
    endpoint: string,
    options: RequestInit,
    expectedStatus: number,
    expectedBodyCheck?: (body: any) => boolean
  ) {
    try {
      const res = await fetch(`${baseUrl}${endpoint}`, options);
      const json = await res.json().catch(() => null);

      const statusMatch = res.status === expectedStatus;
      const bodyMatch = expectedBodyCheck ? expectedBodyCheck(json) : true;

      if (statusMatch && bodyMatch) {
        console.log(`  ✓ PASS: ${name} [HTTP ${res.status}]`);
        passedCount++;
      } else {
        console.error(`  ✗ FAIL: ${name}`);
        console.error(`    Expected HTTP: ${expectedStatus}, Actual: ${res.status}`);
        console.error(`    Response Body:`, json);
        failedCount++;
      }
    } catch (err: any) {
      console.error(`  ✗ ERROR: ${name} - ${err.message}`);
      failedCount++;
    }
  }

  console.log('\n--- GROUP 1: UNAUTHENTICATED PROTECTION (Expected HTTP 401) ---');
  await assertCase(
    'Unauthenticated student stats access',
    '/api/exams/dashboard/stats',
    { method: 'GET' },
    401
  );
  await assertCase(
    'Unauthenticated CBT start access',
    '/api/cbt/start',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    },
    401
  );
  await assertCase(
    'Unauthenticated student results access',
    '/api/results',
    { method: 'GET' },
    401
  );
  await assertCase(
    'Unauthenticated student bookmarks access',
    '/api/questions/user/bookmarks',
    { method: 'GET' },
    401
  );
  await assertCase(
    'Unauthenticated active subscription access',
    '/api/subscriptions/my-subscription',
    { method: 'GET' },
    401
  );
  await assertCase(
    'Unauthenticated admin overview telemetry access',
    '/api/admin/overview',
    { method: 'GET' },
    401
  );

  console.log('\n--- GROUP 2: EMAIL VERIFICATION REQUIREMENT (Expected HTTP 403 needsVerification) ---');
  await assertCase(
    'Unverified student accessing dashboard stats',
    '/api/exams/dashboard/stats',
    {
      method: 'GET',
      headers: { Authorization: `Bearer ${unverifiedStudentToken}` },
    },
    403,
    (b) => b?.error?.needsVerification === true
  );
  await assertCase(
    'Unverified student attempting to start CBT',
    '/api/cbt/start',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${unverifiedStudentToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ examId: '65f000000000000000000001', subjectId: '65f000000000000000000002' }),
    },
    403,
    (b) => b?.error?.needsVerification === true
  );
  await assertCase(
    'Unverified student accessing results',
    '/api/results',
    {
      method: 'GET',
      headers: { Authorization: `Bearer ${unverifiedStudentToken}` },
    },
    403,
    (b) => b?.error?.needsVerification === true
  );
  await assertCase(
    'Unverified student accessing bookmarks',
    '/api/questions/user/bookmarks',
    {
      method: 'GET',
      headers: { Authorization: `Bearer ${unverifiedStudentToken}` },
    },
    403,
    (b) => b?.error?.needsVerification === true
  );
  await assertCase(
    'Unverified student accessing active subscription',
    '/api/subscriptions/my-subscription',
    {
      method: 'GET',
      headers: { Authorization: `Bearer ${unverifiedStudentToken}` },
    },
    403,
    (b) => b?.error?.needsVerification === true
  );

  console.log('\n--- GROUP 3: ADMIN SEPARATION & RBAC RESTRICTION (Expected HTTP 403 Forbidden) ---');
  await assertCase(
    'Verified student attempting access to /api/admin/overview',
    '/api/admin/overview',
    {
      method: 'GET',
      headers: { Authorization: `Bearer ${verifiedStudentToken}` },
    },
    403
  );
  await assertCase(
    'Verified student attempting access to /api/admin/users',
    '/api/admin/users',
    {
      method: 'GET',
      headers: { Authorization: `Bearer ${verifiedStudentToken}` },
    },
    403
  );

  console.log('\n--- GROUP 4: ACCOUNT STATUS VALIDATION (Expected HTTP 403) ---');
  await assertCase(
    'Suspended user attempting to access /api/auth/me',
    '/api/auth/me',
    {
      method: 'GET',
      headers: { Authorization: `Bearer ${suspendedStudentToken}` },
    },
    403
  );
  await assertCase(
    'Suspended user attempting to access dashboard stats',
    '/api/exams/dashboard/stats',
    {
      method: 'GET',
      headers: { Authorization: `Bearer ${suspendedStudentToken}` },
    },
    403
  );

  console.log('\n--- GROUP 5: INVALID & EXPIRED TOKEN REJECTION (Expected HTTP 401) ---');
  await assertCase(
    'Bogus JWT token attempting to access dashboard stats',
    '/api/exams/dashboard/stats',
    {
      method: 'GET',
      headers: { Authorization: 'Bearer invalid.forged.jwt.token' },
    },
    401
  );

  console.log('\n--- GROUP 6: AUTHORIZED VALID ACCESS (Expected HTTP 200 OK) ---');
  await assertCase(
    'Verified student accessing dashboard stats',
    '/api/exams/dashboard/stats',
    {
      method: 'GET',
      headers: { Authorization: `Bearer ${verifiedStudentToken}` },
    },
    200,
    (b) => b?.success === true
  );
  await assertCase(
    'Verified student accessing results list',
    '/api/results',
    {
      method: 'GET',
      headers: { Authorization: `Bearer ${verifiedStudentToken}` },
    },
    200,
    (b) => b?.success === true
  );
  await assertCase(
    'Verified student accessing subscription plan status',
    '/api/subscriptions/my-subscription',
    {
      method: 'GET',
      headers: { Authorization: `Bearer ${verifiedStudentToken}` },
    },
    200,
    (b) => b?.success === true
  );
  await assertCase(
    'Verified administrator accessing /api/admin/overview',
    '/api/admin/overview',
    {
      method: 'GET',
      headers: { Authorization: `Bearer ${verifiedAdminToken}` },
    },
    200,
    (b) => b?.success === true && typeof b?.data?.totalUsers === 'number'
  );

  console.log('\n--- GROUP 7: PUBLIC INFORMATION ENDPOINTS (Expected HTTP 200 OK Unauthenticated) ---');
  await assertCase(
    'Public health check endpoint',
    '/api/health',
    { method: 'GET' },
    200
  );
  await assertCase(
    'Public exam boards catalog',
    '/api/exam-boards',
    { method: 'GET' },
    200
  );
  await assertCase(
    'Public active exams list',
    '/api/exams',
    { method: 'GET' },
    200
  );
  await assertCase(
    'Public past questions catalog (without answer reveal)',
    '/api/questions?page=1&limit=2',
    { method: 'GET' },
    200
  );
  await assertCase(
    'Public subscription tiers list',
    '/api/subscriptions/plans',
    { method: 'GET' },
    200
  );

  console.log('\n======================================================');
  console.log(`TEST RESULTS: ${passedCount} PASSED | ${failedCount} FAILED`);
  console.log('======================================================\n');

  // Close server cleanly
  server.close(() => {
    process.exit(failedCount === 0 ? 0 : 1);
  });
}

runTests().catch((err) => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
