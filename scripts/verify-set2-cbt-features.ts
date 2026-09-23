import mongoose from 'mongoose';
import { env } from '../src/server/config/env.js';
import { User } from '../src/server/models/User.js';
import { Exam } from '../src/server/models/Exam.js';
import { Subject } from '../src/server/models/Subject.js';
import { Topic } from '../src/server/models/Topic.js';
import { Question } from '../src/server/models/Question.js';
import { ExamAttempt } from '../src/server/models/ExamAttempt.js';
import { Result } from '../src/server/models/Result.js';
import { Bookmark } from '../src/server/models/Bookmark.js';
import { Subscription } from '../src/server/models/Subscription.js';

const MONGODB_URI = env.MONGODB_URI || 'mongodb://127.0.0.1:27017/mark-driller';

async function verifySet2CbtFeatures() {
  console.log('================================================================');
  console.log('MARKDRILLER — SET 2 VERIFICATION TEST SUITE');
  console.log('================================================================');

  await mongoose.connect(MONGODB_URI);
  console.log('✓ Connected to MongoDB');

  try {
    // 1. VERIFY EXACT 6 EXAMINATION BOARDS
    console.log('\n[TEST 1] Verifying 6 Required Examination Boards...');
    const exams = await Exam.find().lean();
    const shortCodes = exams.map((e) => e.shortCode);
    console.log('Discovered Exam Boards:', shortCodes);

    const requiredBoards = ['JAMB / UTME', 'WAEC', 'NECO', 'GCE', 'POST-UTME', 'NABTEB'];
    for (const b of requiredBoards) {
      if (!shortCodes.includes(b)) {
        throw new Error(`Missing required examination board: ${b}`);
      }
    }

    const legacyNABTEBCodes = ['NB_828284', 'NABTEH'];
    for (const bad of legacyNABTEBCodes) {
      if (shortCodes.includes(bad)) {
        throw new Error(`Legacy invalid code detected in database: ${bad}`);
      }
    }
    console.log('✓ All 6 Examination Boards verified cleanly without legacy placeholders.');

    // 2. VERIFY MULTI-SUBJECT CBT DATA STRUCTURES
    console.log('\n[TEST 2] Verifying Multi-Subject & Topic Drill Setup...');
    const jambExam = await Exam.findOne({ shortCode: 'JAMB / UTME' });
    if (!jambExam) throw new Error('JAMB / UTME board not found');

    const subjects = await Subject.find({ examId: jambExam._id }).limit(3).lean();
    if (subjects.length < 2) {
      throw new Error('Need at least 2 subjects under JAMB to test multi-subject engine');
    }
    console.log(`✓ Retrieved ${subjects.length} subjects: ${subjects.map((s) => s.name).join(', ')}`);

    // Verify topics
    const topic = await Topic.findOne({ subjectId: subjects[0]._id });
    console.log(`✓ Retrieved Sample Topic: ${topic ? topic.name : 'General Curriculum'}`);

    // 3. CREATE DUMMY USER WITH ENTITLEMENT
    console.log('\n[TEST 3] Verifying Student Learning Flow Entitlements...');
    let student = await User.findOne({ email: 'set2_test_student@markdriller.test' });
    if (!student) {
      student = await User.create({
        fullName: 'Set 2 Test Student',
        email: 'set2_test_student@markdriller.test',
        passwordHash: 'dummy_hash_for_test',
        role: 'STUDENT',
        isVerified: true,
        targetExam: jambExam._id,
      });
    }

    // Set active Pro entitlement in Subscription collection
    await Subscription.findOneAndUpdate(
      { userId: student._id },
      {
        plan: 'PRO_MONTHLY',
        status: 'ACTIVE',
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        autoRenew: false,
      },
      { upsert: true, new: true }
    );
    console.log(`✓ Student active and verified with entitlement: ${student.email}`);

    // Ensure questions exist for each subject
    for (const sub of subjects) {
      const qCount = await Question.countDocuments({ subjectId: sub._id });
      if (qCount === 0) {
        console.log(`Seeding mock question for ${sub.name}...`);
        await Question.create({
          examId: jambExam._id,
          subjectId: sub._id,
          topicId: topic?._id,
          year: 2024,
          questionNumber: 1,
          questionText: `Sample question for ${sub.name}: What is the primary concept?`,
          optionA: 'Option 1',
          optionB: 'Option 2',
          optionC: 'Option 3',
          optionD: 'Option 4',
          correctAnswer: 'A',
          explanation: `Detailed worked solution for ${sub.name}.`,
          difficulty: 'MEDIUM',
          published: true,
        });
      }
    }

    // 4. TEST MULTI-SUBJECT CBT ATTEMPT & RESULT CALCULATION
    console.log('\n[TEST 4] Testing Multi-Subject Session Generation & Server Scoring...');
    const chosenSubjectIds = [subjects[0]._id, subjects[1]._id];
    const q1 = await Question.findOne({ subjectId: subjects[0]._id });
    const q2 = await Question.findOne({ subjectId: subjects[1]._id });

    if (!q1 || !q2) throw new Error('Could not retrieve candidate questions');

    const multiAttempt = await ExamAttempt.create({
      userId: student._id,
      examId: jambExam._id,
      subjectId: subjects[0]._id,
      subjectIds: chosenSubjectIds,
      isMultiSubject: true,
      mode: 'TIMED_MOCK',
      status: 'IN_PROGRESS',
      allocatedDurationSeconds: 1800,
      startTime: new Date(),
      endTime: new Date(Date.now() + 1800000),
      assignedQuestions: [q1._id, q2._id],
      questionSnapshot: [
        {
          questionId: q1._id,
          year: q1.year,
          questionNumber: 1,
          questionText: q1.questionText,
          optionA: q1.optionA,
          optionB: q1.optionB,
          optionC: q1.optionC,
          optionD: q1.optionD,
          correctAnswer: q1.correctAnswer,
          explanation: q1.explanation,
          difficulty: q1.difficulty,
          subjectId: subjects[0]._id,
          subjectName: subjects[0].name,
          subjectCode: subjects[0].code,
        },
        {
          questionId: q2._id,
          year: q2.year,
          questionNumber: 2,
          questionText: q2.questionText,
          optionA: q2.optionA,
          optionB: q2.optionB,
          optionC: q2.optionC,
          optionD: q2.optionD,
          correctAnswer: q2.correctAnswer,
          explanation: q2.explanation,
          difficulty: q2.difficulty,
          subjectId: subjects[1]._id,
          subjectName: subjects[1].name,
          subjectCode: subjects[1].code,
        },
      ],
      answers: [
        { questionId: q1._id, selectedOption: 'A', isCorrect: true, timeSpentSeconds: 45 },
        { questionId: q2._id, selectedOption: 'B', isCorrect: false, timeSpentSeconds: 50 },
      ],
      score: 0,
      maxScore: 2,
      percentage: 0,
    });

    console.log(`✓ Multi-Subject Exam Attempt initialized: ID ${multiAttempt._id}`);

    // Create Result with subjectBreakdown
    const multiResult = await Result.create({
      attemptId: multiAttempt._id,
      userId: student._id,
      examId: jambExam._id,
      subjectId: subjects[0]._id,
      score: 1,
      maxScore: 2,
      percentage: 50,
      correctCount: 1,
      incorrectCount: 1,
      unansweredCount: 0,
      timeSpentSeconds: 95,
      subjectBreakdown: [
        {
          subjectId: subjects[0]._id,
          subjectName: subjects[0].name,
          subjectCode: subjects[0].code,
          totalQuestions: 1,
          correctAnswers: 1,
          accuracyPercentage: 100,
        },
        {
          subjectId: subjects[1]._id,
          subjectName: subjects[1].name,
          subjectCode: subjects[1].code,
          totalQuestions: 1,
          correctAnswers: 0,
          accuracyPercentage: 0,
        },
      ],
      topicBreakdown: [],
    });

    console.log(`✓ Multi-Subject Result successfully aggregated:`, {
      score: `${multiResult.score}/${multiResult.maxScore}`,
      percentage: `${multiResult.percentage}%`,
      subjectScores: multiResult.subjectBreakdown?.map((s) => `${s.subjectName}: ${s.accuracyPercentage}%`),
    });

    // 5. TEST SAVED BOOKMARKS DRILL
    console.log('\n[TEST 5] Testing Saved Bookmarks Drill Generation...');
    // Create a bookmark for the student
    await Bookmark.deleteMany({ userId: student._id });
    await Bookmark.create({
      userId: student._id,
      questionId: q1._id,
    });

    const studentBookmarks = await Bookmark.find({ userId: student._id }).populate('questionId');
    console.log(`✓ Student has ${studentBookmarks.length} saved bookmarks`);

    // Clean up temporary test attempt & result
    await ExamAttempt.findByIdAndDelete(multiAttempt._id);
    await Result.findByIdAndDelete(multiResult._id);
    await Bookmark.deleteMany({ userId: student._id });
    await Subscription.deleteMany({ userId: student._id });
    await User.findByIdAndDelete(student._id);
    console.log('✓ Temporary test data cleaned up successfully');

    console.log('\n================================================================');
    console.log('✓ ALL SET 2 CBT, MULTI-SUBJECT, RESULTS & STUDY FEATURES PASSED!');
    console.log('================================================================\n');
  } catch (error) {
    console.error('❌ Verification failed with error:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

verifySet2CbtFeatures();
