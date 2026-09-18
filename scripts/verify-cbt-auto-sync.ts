import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { Exam } from '../src/server/models/Exam.js';
import { Subject } from '../src/server/models/Subject.js';
import { Question } from '../src/server/models/Question.js';
import { User } from '../src/server/models/User.js';
import { env } from '../src/server/config/env.js';

const API_BASE = 'http://127.0.0.1:5009';
const MONGO_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/markdriller';

async function runCbtVerification() {
  console.log('====================================================');
  console.log('MARKDRILLER CBT ON-DEMAND AUTO-ACQUISITION TEST');
  console.log('====================================================');

  await mongoose.connect(MONGO_URI);
  console.log('✓ Connected to MongoDB');

  try {
    // 1. Locate or create a test verified student user
    let testUser = await User.findOne({ email: 'student_cbt_test@markdriller.com' });
    if (!testUser) {
      testUser = await User.create({
        fullName: 'CBT Test Student',
        email: 'student_cbt_test@markdriller.com',
        passwordHash: 'dummy_hash',
        role: 'STUDENT',
        isVerified: true,
      });
    } else if (!testUser.isVerified) {
      testUser.isVerified = true;
      await testUser.save();
    }

    const token = jwt.sign(
      { userId: testUser._id.toString(), role: testUser.role, isVerified: true },
      env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // 2. Find target exam and subject: JAMB & Mathematics
    const jambExam = await Exam.findOne({ shortCode: { $regex: /JAMB/i } }).lean();
    if (!jambExam) throw new Error('JAMB Exam not found in database');

    const mathSubject = await Subject.findOne({ examId: jambExam._id, code: 'MTH' }).lean();
    if (!mathSubject) throw new Error('JAMB Mathematics subject not found in database');

    console.log(`\n--- TEST: START CBT MOCK WITH AUTO-ACQUISITION ---`);
    console.log(`Target: ${jambExam.shortCode} - ${mathSubject.name} (${mathSubject.code})`);

    const preCount = await Question.countDocuments({
      examId: jambExam._id,
      subjectId: mathSubject._id,
    });
    console.log(`Pre-test question count in MongoDB: ${preCount}`);

    // Call POST /api/cbt/start
    const res = await fetch(`${API_BASE}/api/cbt/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        examId: jambExam._id.toString(),
        subjectId: mathSubject._id.toString(),
        mode: 'TIMED_MOCK',
        durationMinutes: 15,
        questionCount: 3,
      }),
    });

    const body: any = await res.json();
    console.log(`POST /api/cbt/start Status: ${res.status}`);

    if (!res.ok) {
      throw new Error(`CBT Start failed: ${JSON.stringify(body)}`);
    }

    console.log('✓ CBT Attempt successfully created:', body.data?.attemptId);
    console.log('✓ Allocated Duration:', body.data?.allocatedDurationSeconds, 'seconds');
    console.log('✓ Question Count:', body.data?.questionCount);

    const postCount = await Question.countDocuments({
      examId: jambExam._id,
      subjectId: mathSubject._id,
    });
    console.log(`Post-test question count in MongoDB: ${postCount}`);

    if (postCount === 0) {
      throw new Error('Questions were not persisted or acquired for CBT attempt');
    }

    console.log('\n====================================================');
    console.log('CBT AUTO-ACQUISITION VERIFICATION COMPLETED: 100% PASS');
    console.log('====================================================');
  } finally {
    await mongoose.disconnect();
  }
}

runCbtVerification().catch((err) => {
  console.error('CBT Verification error:', err);
  process.exit(1);
});
