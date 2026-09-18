import mongoose from 'mongoose';
import { env } from '../src/server/config/env.js';
import { Exam } from '../src/server/models/Exam.js';
import { Subject } from '../src/server/models/Subject.js';
import { Question } from '../src/server/models/Question.js';
import { StudyMaterial } from '../src/server/models/StudyMaterial.js';

async function remediate() {
  await mongoose.connect(env.MONGODB_URI);
  console.log('Connected to MongoDB for curriculum remediation...');

  // 1. Find and remove empty subjects that have 0 questions
  const allSubjects = await Subject.find().lean();
  let deletedSubjectsCount = 0;

  for (const sub of allSubjects) {
    const qCount = await Question.countDocuments({ subjectId: sub._id });
    if (qCount === 0) {
      console.log(`Removing empty subject: ${sub.name} (${sub.code}) with 0 questions (ID: ${sub._id})`);
      await Subject.deleteOne({ _id: sub._id });
      deletedSubjectsCount++;
    } else if (sub.code === 'TED' && qCount <= 1) {
      // Clean up the 1 dummy TED question and TED subject
      console.log(`Removing orphan TED dummy question and subject (ID: ${sub._id})`);
      await Question.deleteMany({ subjectId: sub._id });
      await Subject.deleteOne({ _id: sub._id });
      deletedSubjectsCount++;
    }
  }
  console.log(`Cleaned up ${deletedSubjectsCount} empty/orphan subjects.`);

  // 2. Configure Free Sample Materials (10 per board = 60 free materials total, 240 Pro materials)
  const exams = await Exam.find().lean();
  let totalFreeDesignated = 0;

  for (const ex of exams) {
    // Get materials for this exam sorted by year desc, title asc
    const materials = await StudyMaterial.find({ examId: ex._id }).sort({ year: -1, createdAt: 1 });
    console.log(`Exam ${ex.shortCode} has ${materials.length} materials.`);

    // Set first 10 materials (foundation & revision digests) to isPremium: false (Free sample tier)
    // and remaining 40 to isPremium: true (Pro tier)
    for (let i = 0; i < materials.length; i++) {
      const isFreeSample = i < 10;
      materials[i].isPremium = !isFreeSample;
      await materials[i].save();
      if (isFreeSample) totalFreeDesignated++;
    }
  }

  console.log(`Designated ${totalFreeDesignated} foundation study materials as FREE sample tier (10 per exam board).`);

  // 3. Verify final state across all 6 boards
  console.log('\n--- VERIFYING FINAL CURRICULUM STATE ---');
  for (const ex of exams) {
    const subjects = await Subject.find({ examId: ex._id }).sort({ order: 1 }).lean();
    console.log(`\nBoard: ${ex.shortCode} (${subjects.length} active subjects):`);
    for (const s of subjects) {
      const qc = await Question.countDocuments({ subjectId: s._id });
      console.log(`  - ${s.name} (${s.code}): ${qc} questions`);
    }
    const freeMats = await StudyMaterial.countDocuments({ examId: ex._id, isPremium: false });
    const proMats = await StudyMaterial.countDocuments({ examId: ex._id, isPremium: true });
    console.log(`  Materials: ${freeMats} Free sample guides, ${proMats} Pro packets (Total: ${freeMats + proMats})`);
  }

  await mongoose.disconnect();
  console.log('\nRemediation completed successfully.');
}

remediate().catch(console.error);
