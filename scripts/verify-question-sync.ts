import mongoose from 'mongoose';
import { connectDatabase } from '../src/server/config/database.js';
import { Exam } from '../src/server/models/Exam.js';
import { Subject } from '../src/server/models/Subject.js';
import { Topic } from '../src/server/models/Topic.js';
import { Question } from '../src/server/models/Question.js';
import { ExamAttempt } from '../src/server/models/ExamAttempt.js';
import { QuestionSyncLog } from '../src/server/models/QuestionSyncLog.js';
import { User } from '../src/server/models/User.js';
import { QuestionIngestionService } from '../src/server/services/questionIngestionService.js';
import {
  IQuestionSourceAdapter,
  NormalizedRawQuestion,
  FetchOptions,
  FetchResult,
  QuestionSourceUnavailableError,
  AdminFileImportAdapter,
} from '../src/server/services/questionSourceAdapter.js';
import { questionSyncScheduler } from '../src/server/services/questionSyncScheduler.js';

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`  ✅ PASS: ${testName}${detail ? ` (${detail})` : ''}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${testName}${detail ? ` — ${detail}` : ''}`);
    failed++;
  }
}

async function runTests() {
  console.log('\n=============================================================');
  console.log('🧪 RUNNING MARKDRILLER QUESTION ACQUISITION & SYNC TEST SUITE');
  console.log('=============================================================\n');

  await connectDatabase();

  // Setup test sandbox records
  const testExamCode = 'TEST-JAMB';
  const testSubCode = 'TEST-MTH';

  let testExam = await Exam.findOne({ shortCode: testExamCode });
  if (!testExam) {
    testExam = await Exam.create({
      name: 'Test Examination Board for Sync Verification',
      shortCode: testExamCode,
      slug: 'test-jamb-sync',
      region: 'Nigeria',
      questionCount: 0,
      order: 99,
    });
  }

  let testSubject = await Subject.findOne({ examId: testExam._id, code: testSubCode });
  if (!testSubject) {
    testSubject = await Subject.create({
      examId: testExam._id,
      name: 'Test Mathematics',
      code: testSubCode,
      order: 1,
    });
  }

  let testTopic = await Topic.findOne({ subjectId: testSubject._id, name: 'Calculus Integration' });
  if (!testTopic) {
    testTopic = await Topic.create({
      subjectId: testSubject._id,
      name: 'Calculus Integration',
      order: 1,
    });
  }

  // Clean any previous test questions
  await Question.deleteMany({ examId: testExam._id });
  await QuestionSyncLog.deleteMany({ sourceProvider: { $regex: 'TEST_' } });

  // ---------------------------------------------------------------------------
  // TEST 1 — New Question Acquisition & Ingestion
  // External source -> new question -> validation -> MongoDB -> publishing rules
  // ---------------------------------------------------------------------------
  console.log('\n--- Test 1: New Question Acquisition & Validation ---');
  const mockAdapter1: IQuestionSourceAdapter = {
    providerName: 'TEST_AUTHORIZED_FEED_A',
    async fetchQuestions(_opts: FetchOptions): Promise<FetchResult> {
      return {
        provider: 'TEST_AUTHORIZED_FEED_A',
        questions: [
          {
            sourceQuestionId: 'EXT-Q-101',
            examShortCode: testExamCode,
            subjectCode: testSubCode,
            year: 2024,
            questionNumber: 1,
            questionText: 'Evaluate the definite integral of 2x dx from 0 to 4.',
            optionA: '8',
            optionB: '16',
            optionC: '24',
            optionD: '32',
            correctAnswer: 'B',
            explanation: 'The antiderivative of 2x is x^2. Evaluating from 0 to 4 gives 4^2 - 0 = 16.',
            difficulty: 'MEDIUM',
            topicHint: 'Calculus',
            sourceReference: 'Accredited Curriculum Board Feed Paper 2024',
            licenseInfo: 'Open Educational Content License',
          },
        ],
      };
    },
  };

  const result1 = await QuestionIngestionService.ingestFromAdapter(
    mockAdapter1,
    { examShortCode: testExamCode, subjectCode: testSubCode },
    'MANUAL_ADMIN'
  );

  assert(result1.totalInserted === 1, 'Ingests 1 new question from authorized adapter');
  assert(result1.totalSkipped === 0, 'No duplicates on initial run');

  const savedQ1 = await Question.findOne({ sourceQuestionId: 'EXT-Q-101' });
  assert(Boolean(savedQ1), 'Question document persisted in MongoDB');
  assert(savedQ1?.sourceProvider === 'TEST_AUTHORIZED_FEED_A', 'Source provider recorded');
  assert(savedQ1?.syncVersion === 1, 'Initial sync version initialized to 1');
  assert(savedQ1?.correctAnswer === 'B', 'Correct answer properly stored without invention');

  // Verify sync telemetry log was recorded
  const syncLog1 = await QuestionSyncLog.findById(result1.syncLogId);
  assert(Boolean(syncLog1), 'QuestionSyncLog audit record generated');
  assert(syncLog1?.status === 'SUCCESS', 'Sync status marked as SUCCESS');
  assert(syncLog1?.totalInserted === 1, 'Telemetry records 1 inserted');

  // ---------------------------------------------------------------------------
  // TEST 2 — Duplicate Question Detection
  // External source -> existing question -> duplicate detected -> no duplicate created
  // ---------------------------------------------------------------------------
  console.log('\n--- Test 2: Duplicate Question Detection ---');
  const result2 = await QuestionIngestionService.ingestFromAdapter(
    mockAdapter1,
    { examShortCode: testExamCode, subjectCode: testSubCode },
    'MANUAL_ADMIN'
  );

  assert(result2.totalInserted === 0, 'Does not insert duplicate question');
  assert(result2.totalSkipped === 1, 'Duplicate detected and skipped');

  const countAfterDup = await Question.countDocuments({ examId: testExam._id });
  assert(countAfterDup === 1, 'Total questions count in MongoDB remains 1');

  // ---------------------------------------------------------------------------
  // TEST 3 — Updated Question (Safe Versioning)
  // External source -> existing source ID -> changed content -> record updated safely
  // ---------------------------------------------------------------------------
  console.log('\n--- Test 3: Updated Question Handling & Version Bump ---');
  const mockAdapterUpdated: IQuestionSourceAdapter = {
    providerName: 'TEST_AUTHORIZED_FEED_A',
    async fetchQuestions(_opts: FetchOptions): Promise<FetchResult> {
      return {
        provider: 'TEST_AUTHORIZED_FEED_A',
        questions: [
          {
            sourceQuestionId: 'EXT-Q-101', // Same external source ID
            examShortCode: testExamCode,
            subjectCode: testSubCode,
            year: 2024,
            questionNumber: 1,
            // Updated question text and explanation from publisher
            questionText: 'Evaluate the definite integral of 2x dx from 0 to 4 with respect to x.',
            optionA: '8',
            optionB: '16',
            optionC: '24',
            optionD: '32',
            correctAnswer: 'B',
            explanation: 'Detailed: Antiderivative F(x) = x^2. F(4) - F(0) = 16 - 0 = 16.',
            difficulty: 'EASY',
            topicHint: 'Calculus',
          },
        ],
      };
    },
  };

  const result3 = await QuestionIngestionService.ingestFromAdapter(
    mockAdapterUpdated,
    { examShortCode: testExamCode, subjectCode: testSubCode },
    'MANUAL_ADMIN'
  );

  assert(result3.totalUpdated === 1, 'Detected content change and performed update');
  assert(result3.totalInserted === 0, 'No extra duplicate inserted');

  const updatedQ1 = await Question.findOne({ sourceQuestionId: 'EXT-Q-101' });
  assert(updatedQ1?.syncVersion === 2, 'Version incremented to 2');
  assert(
    updatedQ1?.questionText === 'Evaluate the definite integral of 2x dx from 0 to 4 with respect to x.',
    'Question text successfully updated to new version'
  );

  // ---------------------------------------------------------------------------
  // TEST 4 — Invalid / Malformed Question (Quarantine Layer)
  // External source -> malformed question -> validation fails -> rejected, valid questions continue
  // ---------------------------------------------------------------------------
  console.log('\n--- Test 4: Malformed Question Quarantine & Validation Resilience ---');
  const mockAdapterMalformed: IQuestionSourceAdapter = {
    providerName: 'TEST_AUTHORIZED_FEED_B',
    async fetchQuestions(_opts: FetchOptions): Promise<FetchResult> {
      return {
        provider: 'TEST_AUTHORIZED_FEED_B',
        questions: [
          // Malformed question: missing options and invalid answer 'Z'
          {
            sourceQuestionId: 'MALFORMED-1',
            examShortCode: testExamCode,
            subjectCode: testSubCode,
            year: 2024,
            questionNumber: 2,
            questionText: 'Invalid incomplete question',
            optionA: '',
            optionB: '',
            optionC: '',
            optionD: '',
            correctAnswer: 'Z' as any, // Invalid enum value
          },
          // Valid question in same batch
          {
            sourceQuestionId: 'VALID-2',
            examShortCode: testExamCode,
            subjectCode: testSubCode,
            year: 2024,
            questionNumber: 3,
            questionText: 'Differentiate f(x) = 5x^3 - 2x with respect to x.',
            optionA: '15x^2 - 2',
            optionB: '10x - 2',
            optionC: '15x - 2',
            optionD: '5x^2 - 2',
            correctAnswer: 'A',
            explanation: "f'(x) = 3 * 5x^2 - 2 = 15x^2 - 2.",
            difficulty: 'MEDIUM',
          },
        ],
      };
    },
  };

  const result4 = await QuestionIngestionService.ingestFromAdapter(
    mockAdapterMalformed,
    { examShortCode: testExamCode, subjectCode: testSubCode },
    'MANUAL_ADMIN'
  );

  assert(result4.totalFailed === 1, 'Malformed question rejected and quarantined');
  assert(result4.totalInserted === 1, 'Valid question in same batch successfully processed');
  assert(result4.quarantineErrors.length === 1, 'Quarantine error details captured for admin audit');

  // ---------------------------------------------------------------------------
  // TEST 5 — Source Unavailable / Network Failure
  // External API unavailable -> retry backoff -> fails safely -> existing MongoDB questions preserved
  // ---------------------------------------------------------------------------
  console.log('\n--- Test 5: External Source Unavailable Graceful Failure ---');
  const countBeforeFail = await Question.countDocuments({ examId: testExam._id });

  const mockFailingAdapter: IQuestionSourceAdapter = {
    providerName: 'TEST_OFFLINE_SOURCE',
    async fetchQuestions(_opts: FetchOptions): Promise<FetchResult> {
      throw new QuestionSourceUnavailableError('Connection refused: Provider endpoint 503 Service Unavailable');
    },
  };

  let caughtError = false;
  try {
    await QuestionIngestionService.ingestFromAdapter(mockFailingAdapter, {}, 'MANUAL_ADMIN');
  } catch (err: any) {
    caughtError = true;
    assert(err instanceof QuestionSourceUnavailableError, 'Throws QuestionSourceUnavailableError on provider failure');
  }

  assert(caughtError, 'External source failure caught gracefully');
  const countAfterFail = await Question.countDocuments({ examId: testExam._id });
  assert(countBeforeFail === countAfterFail, 'Existing MongoDB question bank completely unharmed');

  // Verify telemetry logged the failure
  const failedLog = await QuestionSyncLog.findOne({ sourceProvider: 'TEST_OFFLINE_SOURCE' }).sort({ startedAt: -1 });
  assert(failedLog?.status === 'FAILED', 'SyncLog status marked as FAILED with error message');

  // ---------------------------------------------------------------------------
  // TEST 6 — Rate Limiting & Responsible Fetching
  // Provider returns HTTP 429 -> respects Retry-After -> backs off without crashing
  // ---------------------------------------------------------------------------
  console.log('\n--- Test 6: Rate Limiting Handling & Responsible Fetching ---');
  const mockRateLimitedAdapter: IQuestionSourceAdapter = {
    providerName: 'TEST_RATE_LIMITED_SOURCE',
    async fetchQuestions(_opts: FetchOptions): Promise<FetchResult> {
      throw new QuestionSourceUnavailableError('HTTP 429 Too Many Requests. Rate limit exceeded.', true, 120);
    },
  };

  let rateLimitCaught = false;
  try {
    await QuestionIngestionService.ingestFromAdapter(mockRateLimitedAdapter, {}, 'MANUAL_ADMIN');
  } catch (err: any) {
    rateLimitCaught = true;
    assert(err.isRateLimited === true, 'Identifies HTTP 429 rate limit response');
    assert(err.retryAfterSeconds === 120, 'Respects provider Retry-After interval');
  }
  assert(rateLimitCaught, 'Rate limit handled gracefully');

  const rateLimitLog = await QuestionSyncLog.findOne({ sourceProvider: 'TEST_RATE_LIMITED_SOURCE' }).sort({ startedAt: -1 });
  assert(rateLimitLog?.status === 'RATE_LIMITED', 'Sync audit log marked as RATE_LIMITED');

  // ---------------------------------------------------------------------------
  // TEST 7 — Active CBT Question Snapshot Stability
  // Student starts CBT -> sync updates question in MongoDB -> active CBT attempt remains unchanged
  // ---------------------------------------------------------------------------
  console.log('\n--- Test 7: Active CBT Question Snapshot Stability ---');

  // Find or create test student
  let testStudent = await User.findOne({ email: 'test.student.sync@markdriller.com' });
  if (!testStudent) {
    testStudent = await User.create({
      fullName: 'Test Student Sync',
      email: 'test.student.sync@markdriller.com',
      passwordHash: 'dummy',
      role: 'STUDENT',
      isVerified: true,
    });
  }

  const targetQuestion = await Question.findOne({ sourceQuestionId: 'VALID-2' });
  if (!targetQuestion) throw new Error('Setup failed: target question not found');

  // Student starts CBT exam — creates questionSnapshot
  const attemptSnapshot = [
    {
      questionId: targetQuestion._id,
      year: targetQuestion.year,
      questionNumber: targetQuestion.questionNumber,
      questionText: targetQuestion.questionText,
      optionA: targetQuestion.optionA,
      optionB: targetQuestion.optionB,
      optionC: targetQuestion.optionC,
      optionD: targetQuestion.optionD,
      correctAnswer: targetQuestion.correctAnswer,
      explanation: targetQuestion.explanation,
      difficulty: targetQuestion.difficulty,
      topicId: targetQuestion.topicId,
      topicName: 'Calculus Integration',
    },
  ];

  const cbtAttempt = await ExamAttempt.create({
    userId: testStudent._id,
    examId: testExam._id,
    subjectId: testSubject._id,
    mode: 'TIMED_MOCK',
    status: 'IN_PROGRESS',
    allocatedDurationSeconds: 1800,
    startTime: new Date(),
    assignedQuestions: [targetQuestion._id],
    questionSnapshot: attemptSnapshot,
    answers: [
      {
        questionId: targetQuestion._id,
        selectedOption: 'A',
        isCorrect: true,
      },
    ],
  });

  const originalQuestionTextInExam = cbtAttempt.questionSnapshot[0].questionText;

  // Background question sync modifies or deletes the question in MongoDB
  targetQuestion.questionText = 'COMPLETELY ALTERED QUESTION TEXT BY EXTERNAL SYNC JOB';
  targetQuestion.correctAnswer = 'D'; // Changed key
  await targetQuestion.save();

  // Student reloads CBT exam attempt or submits
  const reloadedAttempt = await ExamAttempt.findById(cbtAttempt._id);
  assert(Boolean(reloadedAttempt), 'CBT Attempt loaded');
  assert(
    reloadedAttempt?.questionSnapshot[0].questionText === originalQuestionTextInExam,
    'Active student attempt question snapshot remains identical despite DB change'
  );
  assert(
    reloadedAttempt?.questionSnapshot[0].correctAnswer === 'A',
    'Student answer grading snapshot remains consistent (unaltered by sync)'
  );

  // ---------------------------------------------------------------------------
  // TEST 8 — Security & Admin CSV/JSON Dataset Import
  // Parse, validate, duplicate detection, and role protection
  // ---------------------------------------------------------------------------
  console.log('\n--- Test 8: Admin Dataset Import (CSV & JSON) & Security ---');

  // Test CSV Parsing
  const validCsv = `question,optionA,optionB,optionC,optionD,answer,year,number
"Find the slope of y = 3x + 7","1","3","7","10","B",2024,10
"Calculate 15% of 200","15","20","30","40","C",2024,11`;

  const csvResult = await QuestionIngestionService.ingestFromFile(validCsv, 'csv', {
    defaultExam: testExamCode,
    defaultSubject: testSubCode,
  });

  assert(csvResult.totalInserted === 2, 'CSV dataset parsed and inserted 2 valid questions');
  assert(csvResult.status === 'SUCCESS', 'CSV import status SUCCESS');

  // Test JSON Parsing
  const validJson = JSON.stringify([
    {
      sourceQuestionId: 'ADMIN-JSON-1',
      questionText: 'What is the sum of angles in a triangle?',
      optionA: '90 degrees',
      optionB: '180 degrees',
      optionC: '270 degrees',
      optionD: '360 degrees',
      correctAnswer: 'B',
      year: 2024,
      questionNumber: 12,
    },
  ]);

  const jsonResult = await QuestionIngestionService.ingestFromFile(validJson, 'json', {
    defaultExam: testExamCode,
    defaultSubject: testSubCode,
  });

  assert(jsonResult.totalInserted === 1, 'JSON dataset parsed and inserted 1 valid question');

  // Test Duplicate Import Prevention
  const dupJsonResult = await QuestionIngestionService.ingestFromFile(validJson, 'json', {
    defaultExam: testExamCode,
    defaultSubject: testSubCode,
  });
  assert(dupJsonResult.totalSkipped === 1, 'Duplicate file dataset questions skipped');

  // Test Scheduler Toggle
  questionSyncScheduler.setEnabled(true);
  const statusActive = await questionSyncScheduler.getStatus();
  assert(statusActive.enabled === true, 'Scheduler can be toggled ON at runtime');

  questionSyncScheduler.setEnabled(false);
  const statusInactive = await questionSyncScheduler.getStatus();
  assert(statusInactive.enabled === false, 'Scheduler can be toggled OFF at runtime');

  // Cleanup test artifacts
  await Question.deleteMany({ examId: testExam._id });
  await ExamAttempt.deleteMany({ examId: testExam._id });
  await Subject.deleteOne({ _id: testSubject._id });
  await Exam.deleteOne({ _id: testExam._id });

  console.log('\n=============================================================');
  console.log(`🏁 VERIFICATION COMPLETE: ${passed} PASSED, ${failed} FAILED`);
  console.log('=============================================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
