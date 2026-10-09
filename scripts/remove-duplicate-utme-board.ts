import { connectDatabase } from '../src/server/config/database.js';
import { Exam } from '../src/server/models/Exam.js';
import { Subject } from '../src/server/models/Subject.js';
import { Question } from '../src/server/models/Question.js';

async function main() {
  console.log('--- Step 1: Connecting to MongoDB ---');
  await connectDatabase();

  console.log('--- Step 2: Locating duplicate UTME exam board ---');
  // Find duplicate UTME board
  const duplicateExam = await Exam.findOne({
    $or: [
      { shortCode: 'UTME', slug: 'utme' },
      { _id: '6ab187b7c51970d266966ffe' }
    ]
  });

  if (!duplicateExam) {
    console.log('ℹ No duplicate UTME board found. It may have already been removed.');
  } else {
    console.log(`Found duplicate exam board: ${duplicateExam.shortCode} — ${duplicateExam.name} (ID: ${duplicateExam._id})`);

    // Verify question safety before removing anything
    const questionCount = await Question.countDocuments({ examId: duplicateExam._id });
    console.log(`Questions linked to duplicate board: ${questionCount}`);

    if (questionCount > 0) {
      throw new Error(`CRITICAL: Found ${questionCount} questions on duplicate board! Aborting to protect data.`);
    }

    // Remove orphaned subjects under duplicate board
    const subjectsRemoved = await Subject.deleteMany({ examId: duplicateExam._id });
    console.log(`✔ Removed ${subjectsRemoved.deletedCount} orphaned subject(s) under duplicate board.`);

    // Delete the duplicate exam board
    await Exam.deleteOne({ _id: duplicateExam._id });
    console.log(`✔ Successfully removed duplicate exam board: ${duplicateExam._id}`);
  }

  console.log('--- Step 3: Verifying canonical JAMB / UTME board ---');
  const canonicalExam = await Exam.findOne({ shortCode: 'JAMB / UTME' });
  if (!canonicalExam) {
    throw new Error('CRITICAL: Canonical "JAMB / UTME" board not found!');
  }
  console.log(`✔ Canonical exam board intact: ${canonicalExam.shortCode} — ${canonicalExam.name} (ID: ${canonicalExam._id})`);

  const canonicalSubjects = await Subject.countDocuments({ examId: canonicalExam._id });
  const canonicalQuestions = await Question.countDocuments({ examId: canonicalExam._id });
  console.log(`✔ Canonical JAMB / UTME has ${canonicalSubjects} subjects and ${canonicalQuestions} questions.`);

  console.log('--- Step 4: Final list of active exam boards ---');
  const allExams = await Exam.find({}, 'shortCode name slug order').sort({ order: 1 }).lean();
  console.log(allExams.map(e => `[${e.shortCode}] ${e.name} (order: ${e.order})`).join('\n'));

  process.exit(0);
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
