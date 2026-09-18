import http from 'node:http';
import mongoose from 'mongoose';
import { env } from '../src/server/config/env.js';
import { Exam } from '../src/server/models/Exam.js';
import { Subject } from '../src/server/models/Subject.js';
import { StudyMaterial } from '../src/server/models/StudyMaterial.js';
import { User } from '../src/server/models/User.js';
import { Subscription } from '../src/server/models/Subscription.js';
import jwt from 'jsonwebtoken';

import { generateToken } from '../src/server/utils/jwt.js';

const API_BASE = 'http://127.0.0.1:5009';

function makeRequest(
  urlStr: string,
  options: {
    method?: string;
    headers?: Record<string, string>;
    body?: any;
  } = {}
): Promise<{ status: number; headers: http.IncomingHttpHeaders; body: any; rawBuffer?: Buffer }> {
  return new Promise((resolve, reject) => {
    const parsed = new URL(urlStr);
    const bodyStr = options.body ? JSON.stringify(options.body) : null;
    const req = http.request(
      {
        hostname: parsed.hostname,
        port: parsed.port,
        path: parsed.pathname + parsed.search,
        method: options.method || 'GET',
        headers: {
          ...(bodyStr ? { 'Content-Type': 'application/json' } : {}),
          ...(options.headers || {}),
        },
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on('data', (c) => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)));
        res.on('end', () => {
          const rawBuffer = Buffer.concat(chunks);
          let parsedBody: any = null;
          try {
            parsedBody = JSON.parse(rawBuffer.toString('utf8'));
          } catch {
            parsedBody = rawBuffer.toString('utf8');
          }
          resolve({
            status: res.statusCode || 0,
            headers: res.headers,
            body: parsedBody,
            rawBuffer,
          });
        });
      }
    );
    req.on('error', reject);
    if (bodyStr) req.write(bodyStr);
    req.end();
  });
}

async function runAudit() {
  await mongoose.connect(env.MONGODB_URI);
  console.log('============================================================');
  console.log('AUDIT: MATERIAL ENTITLEMENTS, FREE SAMPLE ACCESS & CBT VALIDATION');
  console.log('============================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(name: string, condition: boolean, detail: string) {
    if (condition) {
      console.log(`[PASS] ${name}: ${detail}`);
      passed++;
    } else {
      console.error(`[FAIL] ${name}: ${detail}`);
      failed++;
    }
  }

  // Create two test users: one Free student, one Pro student
  const freeEmail = `free_scholar_${Date.now()}@example.com`;
  const freeUser = await User.create({
    fullName: 'Free Student Test',
    email: freeEmail,
    passwordHash: 'dummy_hash_for_headless_test',
    role: 'STUDENT',
    isVerified: true,
  });
  const freeToken = generateToken({
    userId: freeUser._id.toString(),
    email: freeUser.email,
    role: 'STUDENT',
  });

  const proEmail = `pro_scholar_${Date.now()}@example.com`;
  const proUser = await User.create({
    fullName: 'Pro Student Test',
    email: proEmail,
    passwordHash: 'dummy_hash_for_headless_test',
    role: 'STUDENT',
    isVerified: true,
  });
  await Subscription.create({
    userId: proUser._id,
    plan: 'PRO_MONTHLY',
    status: 'ACTIVE',
    startDate: new Date(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    amountPaidKobo: 350000,
    currency: 'NGN',
  });
  const proToken = generateToken({
    userId: proUser._id.toString(),
    email: proUser.email,
    role: 'STUDENT',
  });

  // 1. Test Free Material Download by Free User
  const freeMaterial = await StudyMaterial.findOne({ isPremium: false, isPublished: true });
  if (freeMaterial) {
    const res = await makeRequest(`${API_BASE}/api/materials/${freeMaterial._id}/download`, {
      headers: { Authorization: `Bearer ${freeToken}` },
    });
    const isPdf = res.rawBuffer ? res.rawBuffer.slice(0, 5).toString() === '%PDF-' : false;
    assert(
      'Free Material Download (Free Student)',
      res.status === 200 && isPdf,
      `Status: ${res.status}, Magic Bytes: "${res.rawBuffer?.slice(0, 5).toString()}" (Title: ${freeMaterial.title})`
    );
  }

  // 2. Test Pro Material Download by Free User -> HTTP 403 Forbidden with SUBSCRIPTION_REQUIRED
  const proMaterial = await StudyMaterial.findOne({ isPremium: true, isPublished: true });
  if (proMaterial) {
    const res = await makeRequest(`${API_BASE}/api/materials/${proMaterial._id}/download`, {
      headers: { Authorization: `Bearer ${freeToken}` },
    });
    assert(
      'Pro Material Download Guard (Free Student)',
      res.status === 403 && res.body?.error?.code === 'SUBSCRIPTION_REQUIRED',
      `Status: ${res.status}, Code: ${res.body?.error?.code}, Requires Upgrade: ${res.body?.error?.requiresUpgrade}`
    );
  }

  // 3. Test Pro Material Download by Pro User -> HTTP 200 OK
  if (proMaterial) {
    const res = await makeRequest(`${API_BASE}/api/materials/${proMaterial._id}/download`, {
      headers: { Authorization: `Bearer ${proToken}` },
    });
    const isPdf = res.rawBuffer ? res.rawBuffer.slice(0, 5).toString() === '%PDF-' : false;
    assert(
      'Pro Material Download (Pro Student)',
      res.status === 200 && isPdf,
      `Status: ${res.status}, Magic Bytes: "${res.rawBuffer?.slice(0, 5).toString()}"`
    );
  }

  // 4. Test Subject List Question Counts & Filtering
  const exams = await Exam.find().lean();
  let totalSubjectsChecked = 0;
  let allHaveQuestions = true;

  for (const ex of exams) {
    const res = await makeRequest(`${API_BASE}/api/exams/${ex._id}/subjects?hasQuestions=true`);
    if (res.status === 200 && Array.isArray(res.body?.data)) {
      for (const subj of res.body.data) {
        totalSubjectsChecked++;
        if (!subj.questionCount || subj.questionCount <= 0) {
          allHaveQuestions = false;
        }
      }
    }
  }
  assert(
    'Subject Query & Question Count Enrichment',
    totalSubjectsChecked >= 42 && allHaveQuestions,
    `Verified ${totalSubjectsChecked} active subjects across 6 boards. All have valid question counts.`
  );

  // 5. Test CBT Start on all active boards & subjects (Pro User) -> Verify 0 Bad Requests (400)
  let cbtSuccessCount = 0;
  let cbtErrors = 0;

  for (const ex of exams) {
    const subjects = await Subject.find({ examId: ex._id }).lean();
    for (const sub of subjects) {
      const res = await makeRequest(`${API_BASE}/api/cbt/start`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${proToken}` },
        body: {
          examId: ex._id.toString(),
          subjectId: sub._id.toString(),
          mode: 'TIMED_MOCK',
          durationMinutes: 15,
          questionCount: 5,
        },
      });

      if (res.status === 201 && res.body?.data?.attemptId) {
        cbtSuccessCount++;
      } else {
        console.error(`CBT start failed for ${ex.shortCode} - ${sub.code}:`, res.status, res.body);
        cbtErrors++;
      }
    }
  }

  assert(
    'Zero HTTP 400 on CBT Start (All Boards & Subjects)',
    cbtErrors === 0 && cbtSuccessCount >= 42,
    `Tested ${cbtSuccessCount} subjects across all 6 boards. Exactly 0 returned HTTP 400 Bad Request!`
  );

  // Clean up test records
  await User.deleteMany({ _id: { $in: [freeUser._id, proUser._id] } });
  await Subscription.deleteMany({ userId: { $in: [freeUser._id, proUser._id] } });
  await mongoose.disconnect();

  console.log('\n------------------------------------------------------------');
  console.log(`TOTAL SPECIFIC AUDIT CHECKS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log('------------------------------------------------------------\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runAudit().catch((err) => {
  console.error(err);
  process.exit(1);
});
