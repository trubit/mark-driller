import mongoose from 'mongoose';
import { Exam } from '../src/server/models/Exam.js';
import { Subject } from '../src/server/models/Subject.js';
import { Question } from '../src/server/models/Question.js';

async function reset() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/markdriller');
  
  // Find WAEC BIO and NECO MTH
  const [waec, neco] = await Promise.all([
    Exam.findOne({ shortCode: 'WAEC' }),
    Exam.findOne({ shortCode: 'NECO' }),
  ]);

  if (waec) {
    const bio = await Subject.findOne({ examId: waec._id, code: 'BIO' });
    if (bio) {
      const res = await Question.deleteMany({ examId: waec._id, subjectId: bio._id });
      console.log(`Deleted ${res.deletedCount} WAEC BIO questions for fresh test run.`);
    }
  }

  if (neco) {
    const mth = await Subject.findOne({ examId: neco._id, code: 'MTH' });
    if (mth) {
      const res = await Question.deleteMany({ examId: neco._id, subjectId: mth._id });
      console.log(`Deleted ${res.deletedCount} NECO MTH questions for fresh test run.`);
    }
  }

  await mongoose.disconnect();
}

reset().catch(console.error);
