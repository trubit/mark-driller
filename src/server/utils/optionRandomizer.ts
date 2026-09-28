import crypto from 'node:crypto';

export interface OptionItem {
  key: 'A' | 'B' | 'C' | 'D';
  text: string;
}

export interface RandomizableQuestion {
  _id?: any;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: 'A' | 'B' | 'C' | 'D' | string;
  [key: string]: any;
}

/**
 * Deterministic pseudo-random number generator using a seed string.
 * Generates an integer in [0, max) using SHA-256 hash slicing.
 */
function createSeededRandom(seed: string) {
  let counter = 0;
  return function next(max: number): number {
    const hash = crypto.createHash('sha256').update(`${seed}_${counter++}`).digest();
    const val = hash.readUInt32BE(0);
    return val % max;
  };
}

/**
 * Safely shuffles the options of a question and updates the correctAnswer
 * position to point to the new location of the original correct option.
 * 
 * - Preserves option text 100% accurately.
 * - Preserves semantic correctness 100% accurately.
 * - Deterministic when given a seed (e.g. questionId or attemptId + questionId).
 * - Distributes correct answers evenly across A, B, C, D (~25% each across the catalog).
 */
export function randomizeQuestionOptions<T extends RandomizableQuestion>(
  question: T,
  seed?: string
): T {
  // If options are missing or incomplete, return as-is
  if (!question || !question.optionA || !question.optionB || !question.optionC || !question.optionD) {
    return question;
  }

  const rawCorrect = (String(question.correctAnswer || 'A').toUpperCase()) as 'A' | 'B' | 'C' | 'D';
  const originalOptions: OptionItem[] = [
    { key: 'A', text: question.optionA },
    { key: 'B', text: question.optionB },
    { key: 'C', text: question.optionC },
    { key: 'D', text: question.optionD },
  ];

  // Determine seed for shuffling
  const effectiveSeed = seed || (question._id ? question._id.toString() : question.optionA + (question.questionText || ''));
  const rand = createSeededRandom(effectiveSeed);

  // Fisher-Yates shuffle with seeded PRNG
  const shuffled = [...originalOptions];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = rand(i + 1);
    const temp = shuffled[i];
    shuffled[i] = shuffled[j];
    shuffled[j] = temp;
  }

  // Find the new position of the original correct option
  const newCorrectIndex = shuffled.findIndex((opt) => opt.key === rawCorrect);
  const optionKeys: ('A' | 'B' | 'C' | 'D')[] = ['A', 'B', 'C', 'D'];
  const newCorrectAnswer = optionKeys[newCorrectIndex !== -1 ? newCorrectIndex : 0];

  return {
    ...question,
    optionA: shuffled[0].text,
    optionB: shuffled[1].text,
    optionC: shuffled[2].text,
    optionD: shuffled[3].text,
    correctAnswer: newCorrectAnswer,
  };
}
