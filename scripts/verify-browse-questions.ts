import mongoose from 'mongoose';
import { Exam } from '../src/server/models/Exam.js';
import { Subject } from '../src/server/models/Subject.js';
import { Question } from '../src/server/models/Question.js';
import { QuestionSyncLog } from '../src/server/models/QuestionSyncLog.js';

import http from 'node:http';

const API_BASE = 'http://127.0.0.1:5009';
const MONGO_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/markdriller';

let inProcessServer: any = null;

function checkHealth(): Promise<boolean> {
  return new Promise((resolve) => {
    const req = http.get(`${API_BASE}/api/health`, (res) => {
      resolve(res.statusCode === 200);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(1000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function ensureServerRunning(): Promise<boolean> {
  const alreadyUp = await checkHealth();
  if (alreadyUp) {
    return false;
  }

  console.log('[Runner] Server not detected on port 5009. Booting in-process test server...');
  const serverModule = await import('../src/server/index.js');
  inProcessServer = serverModule.server;

  if (serverModule.dbPromise) {
    await serverModule.dbPromise;
  }

  const start = Date.now();
  while (Date.now() - start < 15000) {
    if (await checkHealth()) {
      console.log('[Runner] In-process server is online and ready on http://127.0.0.1:5009.');
      return true;
    }
    await new Promise((r) => setTimeout(r, 250));
  }

  throw new Error('Timed out waiting for test server to become ready on port 5009');
}

async function runVerification() {
  console.log('====================================================');
  console.log('MARKDRILLER DYNAMIC QUESTION ACQUISITION VERIFICATION');
  console.log('====================================================');

  try {
    await ensureServerRunning();
  } catch (err: any) {
    console.warn('[Runner] Warning during server check:', err.message);
  }

  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(MONGO_URI);
  }
  console.log('✓ Connected to MongoDB for verification audit');

  try {
    // 1. Find WAEC and Biology
    const waecExam = await Exam.findOne({ shortCode: 'WAEC' }).lean();
    if (!waecExam) throw new Error('WAEC Exam not found in database');
    const bioSubject = await Subject.findOne({ examId: waecExam._id, code: 'BIO' }).lean();
    if (!bioSubject) throw new Error('WAEC Biology subject not found in database');

    console.log(`\n--- TEST 1: ON-DEMAND ACQUISITION FOR EMPTY CURRICULUM ---`);
    console.log(`Target: WAEC (${waecExam._id}) - BIO (${bioSubject._id})`);

    // Check count in MongoDB before query
    const initialBioCount = await Question.countDocuments({
      examId: waecExam._id,
      subjectId: bioSubject._id,
    });
    console.log(`Initial WAEC Biology count in MongoDB: ${initialBioCount}`);

    // Query questions endpoint
    const res1 = await fetch(
      `${API_BASE}/api/questions?examId=${waecExam._id}&subjectId=${bioSubject._id}&limit=10`
    );
    if (!res1.ok) {
      throw new Error(`GET /api/questions failed with status ${res1.status}: ${await res1.text()}`);
    }
    const data1: any = await res1.json();

    console.log(`Response status: ${res1.status}, success: ${data1.success}`);
    console.log(`Acquired on demand: ${data1.data?.acquiredOnDemand}`);
    console.log(`Total questions returned: ${data1.data?.questions?.length}`);
    console.log(`Pagination total: ${data1.data?.pagination?.total}`);

    if (initialBioCount === 0) {
      if (!data1.data?.acquiredOnDemand) {
        throw new Error('Expected acquiredOnDemand to be true for previously empty curriculum');
      }
      if (data1.data?.questions?.length === 0) {
        throw new Error('Expected questions to be acquired and returned');
      }
    }

    const firstQ = data1.data.questions[0];
    console.log(`\nSample Acquired Question:`);
    console.log(`- Question Text: "${firstQ.questionText}"`);
    console.log(`- Option A: ${firstQ.optionA}`);
    console.log(`- Option B: ${firstQ.optionB}`);
    console.log(`- Correct Answer: ${firstQ.correctAnswer}`);
    console.log(`- Explanation: ${firstQ.explanation}`);
    console.log(`- Exam: ${firstQ.examId?.shortCode}, Subject: ${firstQ.subjectId?.name}`);

    // Verify persisted in MongoDB
    const postBioCount = await Question.countDocuments({
      examId: waecExam._id,
      subjectId: bioSubject._id,
    });
    console.log(`Post-acquisition WAEC Biology count in MongoDB: ${postBioCount}`);
    if (postBioCount === 0) {
      throw new Error('Questions were not persisted to MongoDB!');
    }

    console.log(`\n--- TEST 2: CACHED SUBSEQUENT ACCESS (ZERO PROVIDER CALLS) ---`);
    const res2 = await fetch(
      `${API_BASE}/api/questions?examId=${waecExam._id}&subjectId=${bioSubject._id}&limit=10`
    );
    const data2: any = await res2.json();
    console.log(`Subsequent query acquiredOnDemand: ${data2.data?.acquiredOnDemand}`);
    if (data2.data?.acquiredOnDemand === true) {
      throw new Error('Subsequent query should hit MongoDB cache, not trigger on-demand acquisition again!');
    }
    console.log('✓ Cache hit confirmed: questions served directly from MongoDB without external provider overhead');

    console.log(`\n--- TEST 3: CONCURRENT REQUEST COALESCING (MUTEX LOCK) ---`);
    const necoExam = await Exam.findOne({ shortCode: 'NECO' }).lean();
    if (!necoExam) throw new Error('NECO Exam not found');
    const mathSubject = await Subject.findOne({ examId: necoExam._id, code: 'MTH' }).lean();
    if (!mathSubject) throw new Error('NECO Mathematics not found');

    // Fire 2 concurrent requests simultaneously for NECO Mathematics
    console.log('Triggering 2 simultaneous requests for NECO Mathematics...');
    const [coalesce1, coalesce2] = await Promise.all([
      fetch(`${API_BASE}/api/questions?examId=${necoExam._id}&subjectId=${mathSubject._id}&limit=10`).then((r) => r.json() as Promise<any>),
      fetch(`${API_BASE}/api/questions?examId=${necoExam._id}&subjectId=${mathSubject._id}&limit=10`).then((r) => r.json() as Promise<any>),
    ]);

    console.log(`Request 1 total: ${coalesce1.data?.pagination?.total}`);
    console.log(`Request 2 total: ${coalesce2.data?.pagination?.total}`);

    // Verify deduplication: no duplicate question numbers for NECO MTH
    const necoQuestions = await Question.find({
      examId: necoExam._id,
      subjectId: mathSubject._id,
    }).lean();

    const qNumSet = new Set();
    let hasDuplicate = false;
    for (const q of necoQuestions) {
      const key = `${q.year}_${q.questionNumber}`;
      if (qNumSet.has(key)) {
        hasDuplicate = true;
        break;
      }
      qNumSet.add(key);
    }
    if (hasDuplicate) {
      throw new Error('Duplicate questions detected! Coalescing lock or unique constraint failed.');
    }
    console.log(`✓ Coalescing lock verified: ${necoQuestions.length} unique questions saved, zero duplicates created`);

    console.log(`\n--- TEST 4: SECURITY & VALIDATION PROTECTIONS ---`);
    // Invalid ObjectId
    const badRes = await fetch(`${API_BASE}/api/questions?examId=invalid_id&subjectId=123`);
    console.log(`Invalid query param status: ${badRes.status} (Expected 400)`);
    if (badRes.status !== 400) {
      throw new Error('Expected 400 Bad Request for invalid parameters');
    }

    // SSRF / Unauthorized endpoint protection
    const unauthRes = await fetch(`${API_BASE}/api/questions/acquire-curriculum`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ examId: waecExam._id, subjectId: bioSubject._id }),
    });
    console.log(`Unauthenticated acquire-curriculum status: ${unauthRes.status} (Expected 401)`);
    if (unauthRes.status !== 401) {
      throw new Error('Expected 401 Unauthorized for unauthenticated curriculum sync');
    }

    console.log(`\n--- TEST 5: SYNC AUDIT TRAIL LOGGING ---`);
    const recentLogs = await QuestionSyncLog.find().sort({ createdAt: -1 }).limit(3).lean();
    console.log(`Recent Sync Logs recorded in MongoDB: ${recentLogs.length}`);
    for (const log of recentLogs) {
      const duration =
        log.durationMs ??
        (log.completedAt && log.startedAt
          ? new Date(log.completedAt).getTime() - new Date(log.startedAt).getTime()
          : 0);
      console.log(
        `- Provider: ${log.sourceProvider}, Trigger: ${log.trigger}, Status: ${log.status}, Inserted: ${log.totalInserted}, Duration: ${duration}ms`
      );
    }

    console.log('\n====================================================');
    console.log('ALL TESTS PASSED WITH 100% SUCCESS!');
    console.log('====================================================');
  } finally {
    if (inProcessServer) {
      try {
        inProcessServer.close();
      } catch {}
    }
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  }
}

runVerification().catch((err) => {
  console.error('Verification failed:', err);
  process.exit(1);
});
