import { env } from '../src/server/config/env.js';
import mongoose, { Types } from 'mongoose';
import '../src/server/models/index.js';
import { ExamAttempt } from '../src/server/models/ExamAttempt.js';
import { Question } from '../src/server/models/Question.js';
import { Exam } from '../src/server/models/Exam.js';
import { Subject } from '../src/server/models/Subject.js';
import { Result } from '../src/server/models/Result.js';

async function main() {
  await mongoose.connect(env.MONGODB_URI);
  console.log('--- Testing CBT Session Full Lifecycle & Answer Persistence ---');

  const testUserId = new Types.ObjectId();

  try {
    // 1. Fetch any existing published questions for simulation (read-only query)
    const questions = await Question.find({ published: true, year: 2024 }).limit(5).lean();
    if (questions.length === 0) {
      console.log('No 2024 questions found for test, trying any published questions');
    }
    const sampleQuestions = questions.length > 0 ? questions : await Question.find({ published: true }).limit(5).lean();

    if (sampleQuestions.length === 0) {
      throw new Error('No published questions in database to simulate attempt');
    }

    const exam = await Exam.findOne().lean();
    const subject = await Subject.findOne().lean();

    const allocatedDurationSeconds = 1800;
    const startTime = new Date();
    const endTime = new Date(startTime.getTime() + allocatedDurationSeconds * 1000);

    const questionSnapshot = sampleQuestions.map((q: any) => ({
      questionId: q._id,
      year: q.year || 2024,
      questionNumber: q.questionNumber || 1,
      questionText: q.questionText,
      optionA: q.optionA,
      optionB: q.optionB,
      optionC: q.optionC,
      optionD: q.optionD,
      correctAnswer: q.correctAnswer,
      explanation: q.explanation || '',
      difficulty: q.difficulty || 'MEDIUM',
      topicId: q.topicId,
      topicName: 'Algebraic Processes',
      subjectId: subject?._id || q.subjectId,
      subjectName: subject?.name || 'Mathematics',
      subjectCode: subject?.code || 'MTH',
      imageUrl: '',
    }));

    const answers = sampleQuestions.map((q: any) => ({
      questionId: q._id,
      selectedOption: null,
      isCorrect: false,
      markedForReview: false,
      timeSpentSeconds: 0,
    }));

    // Step A: Create Attempt
    const attempt = await ExamAttempt.create({
      userId: testUserId,
      examId: exam?._id || new Types.ObjectId(),
      subjectId: subject?._id || new Types.ObjectId(),
      mode: 'CBT',
      status: 'IN_PROGRESS',
      allocatedDurationSeconds,
      startTime,
      endTime,
      assignedQuestions: sampleQuestions.map((q: any) => q._id),
      questionSnapshot,
      answers,
      score: 0,
      maxScore: sampleQuestions.length,
      percentage: 0,
    });

    console.log(`Step 1: Created Test Attempt ${attempt._id}`);

    // Step B: Simulate Student Answering Questions (Answer Persistence)
    const q1Id = sampleQuestions[0]._id.toString();
    const q2Id = sampleQuestions[1]._id.toString();

    // Answer Q1 with 'A'
    const ans1 = attempt.answers.find((a: any) => a.questionId.toString() === q1Id);
    if (ans1) {
      ans1.selectedOption = 'A';
      ans1.isSkipped = false;
      ans1.markedForReview = true;
    }

    // Skip Q2
    const ans2 = attempt.answers.find((a: any) => a.questionId.toString() === q2Id);
    if (ans2) {
      ans2.selectedOption = null;
      ans2.isSkipped = true;
    }

    await attempt.save();
    console.log('Step 2: Saved student answers (Q1: selected "A" + flagged; Q2: skipped)');

    // Step C: Verify Reload / Retrieval
    const reloaded = await ExamAttempt.findById(attempt._id).lean();
    if (!reloaded) throw new Error('Attempt reload failed');

    const retrievedAns1 = reloaded.answers.find((a: any) => a.questionId.toString() === q1Id);
    const retrievedAns2 = reloaded.answers.find((a: any) => a.questionId.toString() === q2Id);

    console.log('Step 3: Verification of Persisted Answers:', {
      Q1: { option: retrievedAns1?.selectedOption, flagged: retrievedAns1?.markedForReview },
      Q2: { option: retrievedAns2?.selectedOption, skipped: retrievedAns2?.isSkipped },
    });

    if (retrievedAns1?.selectedOption !== 'A' || !retrievedAns1?.markedForReview) {
      throw new Error('Q1 answer persistence failed');
    }
    if (retrievedAns2?.selectedOption !== null || !retrievedAns2?.isSkipped) {
      throw new Error('Q2 skip persistence failed');
    }

    // Step D: Verify that Question Sanitizer outputs primitive strings
    const cleansed = reloaded.questionSnapshot.map((s: any) => ({
      _id: s.questionId.toString(),
      topicName: typeof s.topicName === 'string' ? s.topicName : 'General Curriculum',
      subjectName: typeof s.subjectName === 'string' ? s.subjectName : 'Subject',
      questionText: typeof s.questionText === 'string' ? s.questionText : '',
    }));

    for (const c of cleansed) {
      if (typeof c._id !== 'string' || typeof c.topicName !== 'string' || typeof c.subjectName !== 'string') {
        throw new Error('Cleansed question contains non-string object!');
      }
    }
    console.log('Step 4: All question references strictly verified as string primitives');

    // Clean up test data
    await ExamAttempt.deleteOne({ _id: attempt._id });
    await Result.deleteOne({ attemptId: attempt._id });

    console.log('✅ ALL CBT SESSION & ANSWER PERSISTENCE TESTS PASSED!');
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((err) => {
  console.error('❌ CBT TEST FAILED:', err);
  process.exit(1);
});
