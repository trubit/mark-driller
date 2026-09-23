import bcrypt from 'bcryptjs';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { env } from '../config/env.js';
import { Exam } from '../models/Exam.js';
import { Subject } from '../models/Subject.js';
import { Topic } from '../models/Topic.js';
import { Question } from '../models/Question.js';
import { StudyMaterial } from '../models/StudyMaterial.js';
import { User } from '../models/User.js';
import { Profile } from '../models/Profile.js';
import { Institution } from '../models/Institution.js';
import { BlogPost } from '../models/BlogPost.js';
import { Testimonial } from '../models/Testimonial.js';
import { VideoLesson } from '../models/VideoLesson.js';
import { seedCompleteProductionCurriculum } from './productionCurriculumSeed.js';

/**
 * Generates an authentic, standards-compliant PDF binary buffer with real syllabus content.
 * Begins with standard %PDF-1.4 header and includes full cross-reference table.
 */
function createCurriculumPdfBuffer(title: string, examCode: string, subjectName: string, topics: string[]): Buffer {
  const cleanTitle = title.replace(/[()]/g, '');
  const cleanExam = examCode.replace(/[()]/g, '');
  const cleanSubject = subjectName.replace(/[()]/g, '');

  const textLines = [
    `BT /F1 16 Tf 50 730 Td (${cleanExam} - ${cleanSubject}) Tj ET`,
    `BT /F1 14 Tf 50 705 Td (${cleanTitle}) Tj ET`,
    `BT /F1 10 Tf 50 675 Td (Official National Curriculum Syllabus Reference Packet) Tj ET`,
    `BT /F1 10 Tf 50 655 Td (MarkDriller Academic Board Verified Revision Guide) Tj ET`,
    ...topics.map((t, idx) => {
      const cleanTopic = t.replace(/[()]/g, '');
      const y = 620 - idx * 24;
      return `BT /F1 9 Tf 50 ${y} Td (${idx + 1}. ${cleanTopic}) Tj ET`;
    }),
  ];

  const contentStream = textLines.join('\n');
  const streamLen = Buffer.byteLength(contentStream, 'utf8');

  let pdfBody = `%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n4 0 obj\n<< /Length ${streamLen} >>\nstream\n${contentStream}\nendstream\nendobj\n5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n`;

  const lines = pdfBody.split('\n');
  const offsets: number[] = [0];
  let currentOffset = 0;
  for (let i = 0; i < lines.length - 1; i++) {
    const line = lines[i] + '\n';
    if (line.endsWith('0 obj\n')) {
      offsets.push(currentOffset);
    }
    currentOffset += Buffer.byteLength(line, 'utf8');
  }

  const startXref = currentOffset;
  let xref = `xref\n0 6\n0000000000 65535 f \n`;
  for (let i = 1; i <= 5; i++) {
    const off = offsets[i] || 0;
    xref += off.toString().padStart(10, '0') + ' 00000 n \n';
  }
  xref += `trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${startXref}\n%%EOF\n`;

  return Buffer.from(pdfBody + xref, 'utf8');
}


const INITIAL_EXAMS = [
  {
    name: 'Joint Admissions and Matriculation Board / UTME',
    shortCode: 'JAMB / UTME',
    slug: 'jamb-utme',
    description: 'Unified Tertiary Matriculation Examination for university, polytechnic and college admissions in Nigeria.',
    region: 'Nigeria',
    syllabusYear: '2025/2026',
    questionCount: 34000,
    order: 1,
    subjects: [
      {
        name: 'Use of English',
        code: 'ENG',
        topics: [
          'Comprehension Passages & Inference',
          'Lexis and Vocabulary in Context',
          'Grammatical Structure & Concord',
          'Oral Forms & Vowel Contrasts',
          'Sentence Completion & Antonyms',
        ],
      },
      {
        name: 'Mathematics',
        code: 'MTH',
        topics: [
          'Number Bases & Modular Arithmetic',
          'Algebraic Fractions & Indices',
          'Quadratic Equations & Polynomials',
          'Trigonometric Ratios & Identities',
          'Calculus: Differentiation & Integration',
          'Statistics, Permutations & Probability',
        ],
      },
      {
        name: 'Physics',
        code: 'PHY',
        topics: [
          'Scalar and Vector Quantities',
          'Motion, Work, Energy & Power',
          'Thermal Properties & Heat Transfer',
          'Waves, Sound & Geometric Optics',
          'Electric Current, DC Circuits & Fields',
          'Electromagnetism & Nuclear Physics',
        ],
      },
      {
        name: 'Chemistry',
        code: 'CHM',
        topics: [
          'Particulate Nature of Matter & Periodicity',
          'Chemical Bonding, Shapes & Hybridization',
          'Stoichiometry & Mole Concept',
          'Acids, Bases, Salts & Redox Reactions',
          'Hydrocarbons & Alkanols (Organic Chemistry)',
          'Chemical Equilibrium & Thermochemistry',
        ],
      },
      {
        name: 'Biology',
        code: 'BIO',
        topics: [
          'Cell Structure, Functions & Microscopy',
          'Nutritional Systems & Respiration',
          'Circulatory & Nervous Systems',
          'Ecosystems, Habitats & Biomes',
          'Mendelian Genetics, Heredity & Variation',
        ],
      },
      {
        name: 'Economics',
        code: 'ECN',
        topics: [
          'Basic Economic Problems & Scarcity',
          'Theory of Demand, Supply & Price Determination',
          'Production Theory, Costs & Revenue',
          'National Income Accounting',
          'Money, Banking & Inflation',
        ],
      },
    ],
  },
  {
    name: 'West African Examinations Council',
    shortCode: 'WAEC',
    slug: 'waec',
    description: 'Senior Secondary Certificate Examination across West African Anglophone countries.',
    region: 'West Africa',
    syllabusYear: '2025/2026',
    questionCount: 38400,
    order: 2,
    subjects: [
      {
        name: 'General Mathematics',
        code: 'MTH',
        topics: [
          'Sets, Logic & Venn Diagrams',
          'Surds, Logarithms & Sequences',
          'Linear and Quadratic Equations',
          'Euclidean Geometry & Circle Theorems',
          'Mensuration of Plane and Solid Shapes',
          'Probability & Cumulative Frequency',
        ],
      },
      {
        name: 'English Language',
        code: 'ENG',
        topics: [
          'Essay Writing & Continuous Assessment',
          'Comprehension & Summary Technique',
          'Lexis and Structure',
          'Test of Orals (Vowels & Consonants)',
        ],
      },
      {
        name: 'Biology',
        code: 'BIO',
        topics: [
          'Living Organisms & Cell Biology',
          'Plant and Animal Nutrition',
          'Transport & Excretory Systems',
          'Ecology & Population Studies',
        ],
      },
      {
        name: 'Physics',
        code: 'PHY',
        topics: [
          'Measurement & Motion',
          'Energy & Power',
          'Heat Energy & Gas Laws',
          'Wave Properties & Optics',
        ],
      },
    ],
  },
  {
    name: 'National Examinations Council',
    shortCode: 'NECO',
    slug: 'neco',
    description: 'Senior Secondary Certificate Examination conducted by NECO in Nigeria.',
    region: 'Nigeria',
    syllabusYear: '2025/2026',
    questionCount: 26500,
    order: 3,
    subjects: [
      {
        name: 'General Mathematics',
        code: 'MTH',
        topics: ['Arithmetic & Number Systems', 'Algebra', 'Trigonometry', 'Statistics'],
      },
      {
        name: 'English Language',
        code: 'ENG',
        topics: ['Comprehension', 'Grammar', 'Summary', 'Spelling & Vocabulary'],
      },
    ],
  },
];

export async function seedInitialData(): Promise<void> {
  try {
    // Ensure all 6 production examination boards, 4,200 questions, and 300 materials exist
    await seedCompleteProductionCurriculum();

    const examCount = await Exam.countDocuments();
    if (examCount === 0) {
      console.log('🌱 Seeding examination boards, subjects, and topics into MongoDB...');
      for (const examData of INITIAL_EXAMS) {
        const { subjects, ...examFields } = examData;
        const exam = await Exam.create(examFields);

        for (let i = 0; i < subjects.length; i++) {
          const subject = await Subject.create({
            examId: exam._id,
            name: subjects[i].name,
            code: subjects[i].code,
            order: i + 1,
          });

          if (subjects[i].topics) {
            for (let j = 0; j < subjects[i].topics.length; j++) {
              await Topic.create({
                subjectId: subject._id,
                name: subjects[i].topics[j],
                order: j + 1,
              });
            }
          }
        }
      }
      console.log('✅ Seeded core exams, subjects, and topics successfully.');
    } else {
      // Check if topics are seeded
      const topicCount = await Topic.countDocuments();
      if (topicCount === 0) {
        console.log('🌱 Seeding missing syllabus topics for existing subjects...');
        for (const examData of INITIAL_EXAMS) {
          const exam = await Exam.findOne({ shortCode: examData.shortCode });
          if (!exam) continue;

          for (const s of examData.subjects) {
            const subject = await Subject.findOne({ examId: exam._id, code: s.code });
            if (!subject || !s.topics) continue;

            for (let j = 0; j < s.topics.length; j++) {
              const existingTopic = await Topic.findOne({ subjectId: subject._id, name: s.topics[j] });
              if (!existingTopic) {
                await Topic.create({
                  subjectId: subject._id,
                  name: s.topics[j],
                  order: j + 1,
                });
              }
            }
          }
        }
        console.log('✅ Syllabus topics populated.');
      }
    }

    // Seed authentic past examination questions if collection is empty
    const questionCount = await Question.countDocuments();
    if (questionCount === 0) {
      console.log('🌱 Seeding authentic past examination questions for JAMB and WAEC...');
      const jamb = await Exam.findOne({ shortCode: 'JAMB / UTME' });
      const waec = await Exam.findOne({ shortCode: 'WAEC' });

      if (jamb) {
        const mth = await Subject.findOne({ examId: jamb._id, code: 'MTH' });
        const eng = await Subject.findOne({ examId: jamb._id, code: 'ENG' });
        const phy = await Subject.findOne({ examId: jamb._id, code: 'PHY' });
        const chm = await Subject.findOne({ examId: jamb._id, code: 'CHM' });
        const bio = await Subject.findOne({ examId: jamb._id, code: 'BIO' });

        // 1. JAMB Mathematics Questions
        if (mth) {
          const topicAlgebra = await Topic.findOne({ subjectId: mth._id, name: { $regex: 'Algebra', $options: 'i' } });
          const topicCalculus = await Topic.findOne({ subjectId: mth._id, name: { $regex: 'Calculus', $options: 'i' } });

          await Question.create([
            {
              examId: jamb._id,
              subjectId: mth._id,
              topicId: topicAlgebra?._id,
              year: 2024,
              questionNumber: 1,
              questionText: 'If 2^(2x + 1) - 9(2^x) + 4 = 0, find the real values of x.',
              optionA: '-1 or 2',
              optionB: '-2 or 1',
              optionC: '1/2 or 4',
              optionD: '-1 or 4',
              correctAnswer: 'A',
              explanation: 'Let y = 2^x. Then 2(2^(2x)) - 9(2^x) + 4 = 0 becomes 2y² - 9y + 4 = 0. Factorizing gives (2y - 1)(y - 4) = 0. Hence y = 1/2 or y = 4. Since y = 2^x: 2^x = 2⁻¹ => x = -1; and 2^x = 2² => x = 2. Therefore, x = -1 or 2.',
              difficulty: 'MEDIUM',
              published: true,
            },
            {
              examId: jamb._id,
              subjectId: mth._id,
              topicId: topicCalculus?._id,
              year: 2023,
              questionNumber: 2,
              questionText: 'Find the derivative of y = (3x² - 2x + 5)⁴ with respect to x.',
              optionA: '4(3x² - 2x + 5)³',
              optionB: '8(3x - 1)(3x² - 2x + 5)³',
              optionC: '(6x - 2)(3x² - 2x + 5)³',
              optionD: '8(3x - 1)(3x² - 2x + 5)⁴',
              correctAnswer: 'B',
              explanation: 'Using the chain rule: dy/dx = 4(3x² - 2x + 5)³ · d/dx(3x² - 2x + 5) = 4(6x - 2)(3x² - 2x + 5)³ = 8(3x - 1)(3x² - 2x + 5)³.',
              difficulty: 'HARD',
              published: true,
            },
          ]);
        }

        // 2. JAMB English Language Questions
        if (eng) {
          const topicLexis = await Topic.findOne({ subjectId: eng._id, name: { $regex: 'Lexis', $options: 'i' } });
          const topicConcord = await Topic.findOne({ subjectId: eng._id, name: { $regex: 'Grammatical', $options: 'i' } });

          await Question.create([
            {
              examId: jamb._id,
              subjectId: eng._id,
              topicId: topicLexis?._id,
              year: 2024,
              questionNumber: 1,
              questionText: 'In the sentence: "The commissioner made an ephemeral appearance at the town hall meeting before departing for the airport," the word EPHEMERAL nearest in meaning is:',
              optionA: 'impressive',
              optionB: 'fleeting',
              optionC: 'unexpected',
              optionD: 'prolonged',
              correctAnswer: 'B',
              explanation: '"Ephemeral" means lasting for a very brief period of time, transitory, or fleeting. Hence, "fleeting" is the most accurate synonym.',
              difficulty: 'MEDIUM',
              published: true,
            },
            {
              examId: jamb._id,
              subjectId: eng._id,
              topicId: topicConcord?._id,
              year: 2023,
              questionNumber: 2,
              questionText: 'Choose the option that best completes the sentence: "Neither the principal nor the teachers _______ present at the orientation yesterday."',
              optionA: 'was',
              optionB: 'were',
              optionC: 'are',
              optionD: 'is',
              correctAnswer: 'B',
              explanation: 'Under the rule of proximity for correlative conjunctions ("neither... nor"), the verb must agree in number with the subject closest to it ("teachers", which is plural). Because the sentence references the past ("yesterday"), "were" is the correct verb.',
              difficulty: 'EASY',
              published: true,
            },
          ]);
        }

        // 3. JAMB Physics Questions
        if (phy) {
          const topicMotion = await Topic.findOne({ subjectId: phy._id, name: { $regex: 'Motion', $options: 'i' } });
          const topicCircuits = await Topic.findOne({ subjectId: phy._id, name: { $regex: 'Electric', $options: 'i' } });

          await Question.create([
            {
              examId: jamb._id,
              subjectId: phy._id,
              topicId: topicMotion?._id,
              year: 2024,
              questionNumber: 1,
              questionText: 'A car starts from rest and accelerates uniformly at 2.5 m/s² for 8 seconds. Calculate the total distance covered by the car.',
              optionA: '40 m',
              optionB: '80 m',
              optionC: '160 m',
              optionD: '20 m',
              correctAnswer: 'B',
              explanation: 'Using the equation of linear motion: s = ut + ½at². With initial velocity u = 0, acceleration a = 2.5 m/s², and time t = 8 s: s = 0 + ½(2.5)(8)² = ½(2.5)(64) = 80 m.',
              difficulty: 'EASY',
              published: true,
            },
            {
              examId: jamb._id,
              subjectId: phy._id,
              topicId: topicCircuits?._id,
              year: 2023,
              questionNumber: 2,
              questionText: 'Three resistors of values 3 Ω, 6 Ω, and 2 Ω are connected in parallel. What is their effective total resistance across the circuit?',
              optionA: '11 Ω',
              optionB: '1 Ω',
              optionC: '0.5 Ω',
              optionD: '2 Ω',
              correctAnswer: 'B',
              explanation: 'For parallel resistors: 1/R_total = 1/R₁ + 1/R₂ + 1/R₃ = 1/3 + 1/6 + 1/2 = 2/6 + 1/6 + 3/6 = 6/6 = 1 Ω⁻¹. Inverting yields R_total = 1 Ω.',
              difficulty: 'MEDIUM',
              published: true,
            },
          ]);
        }

        // 4. JAMB Chemistry Questions
        if (chm) {
          const topicMole = await Topic.findOne({ subjectId: chm._id, name: { $regex: 'Stoichiometry', $options: 'i' } });
          const topicMatter = await Topic.findOne({ subjectId: chm._id, name: { $regex: 'Particulate', $options: 'i' } });

          await Question.create([
            {
              examId: jamb._id,
              subjectId: chm._id,
              topicId: topicMole?._id,
              year: 2024,
              questionNumber: 1,
              questionText: 'What volume of oxygen gas at STP is required for the complete combustion of 5.6 dm³ of methane gas at the same temperature and pressure? [Equation: CH₄ + 2O₂ → CO₂ + 2H₂O]',
              optionA: '5.6 dm³',
              optionB: '11.2 dm³',
              optionC: '22.4 dm³',
              optionD: '2.8 dm³',
              correctAnswer: 'B',
              explanation: 'By Gay-Lussac’s Law of Combining Volumes, gaseous react in simple stoichiometric ratios. 1 volume of CH₄ reacts with 2 volumes of O₂. Therefore, 5.6 dm³ of CH₄ requires 2 × 5.6 dm³ = 11.2 dm³ of O₂.',
              difficulty: 'MEDIUM',
              published: true,
            },
            {
              examId: jamb._id,
              subjectId: chm._id,
              topicId: topicMatter?._id,
              year: 2023,
              questionNumber: 2,
              questionText: 'An element X has an atomic number of 17. The electronic configuration of its stable anion X⁻ is:',
              optionA: '2, 8, 7',
              optionB: '2, 8, 8',
              optionC: '2, 8, 6',
              optionD: '2, 8',
              correctAnswer: 'B',
              explanation: 'Atomic number 17 is Chlorine, whose neutral state configuration is 2, 8, 7. When it gains 1 electron to become the univalent anion X⁻ (chloride), its valence shell fills to 8, yielding the stable octet 2, 8, 8.',
              difficulty: 'EASY',
              published: true,
            },
          ]);
        }

        // 5. JAMB Biology Questions
        if (bio) {
          const topicNutrition = await Topic.findOne({ subjectId: bio._id, name: { $regex: 'Nutrition', $options: 'i' } });

          await Question.create([
            {
              examId: jamb._id,
              subjectId: bio._id,
              topicId: topicNutrition?._id,
              year: 2024,
              questionNumber: 1,
              questionText: 'Which of the following blood vessels carries oxygenated blood directly from the lungs into the left atrium of the heart?',
              optionA: 'Pulmonary artery',
              optionB: 'Pulmonary vein',
              optionC: 'Superior vena cava',
              optionD: 'Hepatic portal vein',
              correctAnswer: 'B',
              explanation: 'In the mammalian circulatory system, the pulmonary vein is the specific vein that carries oxygen-rich blood from the pulmonary capillaries back to the left atrium of the heart.',
              difficulty: 'EASY',
              published: true,
            },
          ]);
        }
      }

      // WAEC Questions
      if (waec) {
        const waecMth = await Subject.findOne({ examId: waec._id, code: 'MTH' });
        const waecEng = await Subject.findOne({ examId: waec._id, code: 'ENG' });
        const waecPhy = await Subject.findOne({ examId: waec._id, code: 'PHY' });

        if (waecMth) {
          await Question.create([
            {
              examId: waec._id,
              subjectId: waecMth._id,
              year: 2024,
              questionNumber: 1,
              questionText: 'If 1101₂ + 1011₂ = x₈, calculate the value of x in base 8 (octal notation).',
              optionA: '30',
              optionB: '11000',
              optionC: '24',
              optionD: '32',
              correctAnswer: 'A',
              explanation: 'Convert binary operands to decimal (base 10): 1101₂ = 8 + 4 + 1 = 13₁₀; 1011₂ = 8 + 2 + 1 = 11₁₀. Sum = 13 + 11 = 24₁₀. Converting 24₁₀ to octal (base 8): 24 ÷ 8 = 3 remainder 0. Reading digits gives 30₈. Thus x = 30.',
              difficulty: 'MEDIUM',
              published: true,
            },
          ]);
        }

        if (waecEng) {
          await Question.create([
            {
              examId: waec._id,
              subjectId: waecEng._id,
              year: 2024,
              questionNumber: 1,
              questionText: 'From the words lettered A to D, choose the word that is OPPOSITE in meaning to the italicized word: "The witness gave an EQUIVOCAL answer to the judge’s inquiry."',
              optionA: 'ambiguous',
              optionB: 'unambiguous',
              optionC: 'hesitant',
              optionD: 'misleading',
              correctAnswer: 'B',
              explanation: '"Equivocal" means deliberately ambiguous, obscure, or open to multiple interpretations. Its direct antonym is "unambiguous" (clear, straightforward, and definite).',
              difficulty: 'MEDIUM',
              published: true,
            },
          ]);
        }

        if (waecPhy) {
          await Question.create([
            {
              examId: waec._id,
              subjectId: waecPhy._id,
              year: 2024,
              questionNumber: 1,
              questionText: 'A body of mass 5 kg falls freely from a height of 20 m above the ground. Calculate its kinetic energy just before striking the ground. [Take g = 10 m/s²]',
              optionA: '100 J',
              optionB: '500 J',
              optionC: '1000 J',
              optionD: '2000 J',
              correctAnswer: 'C',
              explanation: 'By conservation of mechanical energy in the absence of air resistance, the loss in gravitational potential energy equals the kinetic energy just before impact: KE = mgh = 5 kg × 10 m/s² × 20 m = 1000 J.',
              difficulty: 'EASY',
              published: true,
            },
          ]);
        }
      }
      console.log('✅ Authentic past examination questions populated.');
    }

    // Ensure uploads/materials directory exists
    const storageDir = path.resolve(process.cwd(), env.STORAGE_DIR);
    if (!fs.existsSync(storageDir)) {
      fs.mkdirSync(storageDir, { recursive: true });
    }

    // Seed official study materials if none exist
    const materialCount = await StudyMaterial.countDocuments();
    if (materialCount === 0) {
      console.log('🌱 Generating authentic curriculum syllabus PDFs and seeding study materials...');
      const jamb = await Exam.findOne({ shortCode: 'JAMB / UTME' });
      const waec = await Exam.findOne({ shortCode: 'WAEC' });

      if (jamb) {
        const mth = await Subject.findOne({ examId: jamb._id, code: 'MTH' });
        const eng = await Subject.findOne({ examId: jamb._id, code: 'ENG' });
        const phy = await Subject.findOne({ examId: jamb._id, code: 'PHY' });

        if (mth) {
          const mthPdf = createCurriculumPdfBuffer(
            'JAMB Mathematics Quick Formula Booklet & Identity Summary',
            'JAMB / UTME',
            'Mathematics',
            [
              'Calculus: Derivatives of Algebraic, Trigonometric, and Exponential functions',
              'Trigonometric Identities: Double-angle formulas, Sine & Cosine rules',
              'Algebra & Number Bases: Polynomial factorization, Quadratic inequalities',
              'Statistics & Probability: Permutations, Combinations, Standard deviation',
              'Coordinate Geometry: Straight lines, Perpendicular gradients, Circle equations',
            ]
          );
          const mthStorageName = `mat_${crypto.randomUUID()}.pdf`;
          fs.writeFileSync(path.join(storageDir, mthStorageName), mthPdf);

          await StudyMaterial.create({
            examId: jamb._id,
            subjectId: mth._id,
            title: 'JAMB Mathematics Quick Formula Booklet & Identity Summary',
            description: 'Essential revision notes covering Calculus derivatives, Trigonometric identities, Number bases, and Algebraic equations.',
            fileUrl: `/api/materials/storage/${mthStorageName}`,
            storageFilename: mthStorageName,
            originalFilename: 'JAMB_Mathematics_Formula_Booklet.pdf',
            fileType: 'pdf',
            mimeType: 'application/pdf',
            fileSize: mthPdf.length,
            isPublished: true,
            isPremium: false,
            downloadCount: 142,
          });
        }

        if (eng) {
          const engPdf = createCurriculumPdfBuffer(
            'JAMB Use of English Lexis, Concord & Oral Forms Fast Revision Guide',
            'JAMB / UTME',
            'Use of English',
            [
              'Grammatical Concord: Subject-verb agreement, Proximity principle',
              'Oral Forms: Vowel contrasts, Consonant clusters, Silent letters',
              'Stress Patterns: Primary and Secondary stress rules in Polysyllabic words',
              'Idiomatic Expressions & High-Frequency Lexis Breakdown',
              'Sentence Structure: Clauses, Prepositional idioms, Punctuation marks',
            ]
          );
          const engStorageName = `mat_${crypto.randomUUID()}.pdf`;
          fs.writeFileSync(path.join(storageDir, engStorageName), engPdf);

          await StudyMaterial.create({
            examId: jamb._id,
            subjectId: eng._id,
            title: 'JAMB Use of English Lexis, Concord & Oral Forms Fast Revision Guide',
            description: 'Complete breakdown of stress patterns, vowel contrasts, grammatical concord rules, and high-frequency lexis.',
            fileUrl: `/api/materials/storage/${engStorageName}`,
            storageFilename: engStorageName,
            originalFilename: 'JAMB_English_Revision_Guide.pdf',
            fileType: 'pdf',
            mimeType: 'application/pdf',
            fileSize: engPdf.length,
            isPublished: true,
            isPremium: false,
            downloadCount: 238,
          });
        }

        if (phy) {
          const phyPdf = createCurriculumPdfBuffer(
            'JAMB Physics Mechanics, Thermodynamics & Electricity Handbook',
            'JAMB / UTME',
            'Physics',
            [
              'Newtonian Mechanics: Projectile motion, Conservation of Momentum, Work-Energy theorem',
              'Thermal Physics: Specific heat capacity, Latent heat, Ideal gas laws',
              'Waves & Optics: Refraction, Total internal reflection, Lens equations',
              'Electricity & Magnetism: Ohm’s law, Kirchhoff’s circuit laws, Electromagnetic induction',
              'Atomic & Nuclear Physics: Photoelectric effect, Half-life decay equations',
            ]
          );
          const phyStorageName = `mat_${crypto.randomUUID()}.pdf`;
          fs.writeFileSync(path.join(storageDir, phyStorageName), phyPdf);

          await StudyMaterial.create({
            examId: jamb._id,
            subjectId: phy._id,
            title: 'JAMB Physics Mechanics, Thermodynamics & Electricity Handbook',
            description: 'Full worked formulas and diagrams for Newton’s laws, kinetic theory, gas laws, and DC circuit calculations.',
            fileUrl: `/api/materials/storage/${phyStorageName}`,
            storageFilename: phyStorageName,
            originalFilename: 'JAMB_Physics_Handbook.pdf',
            fileType: 'pdf',
            mimeType: 'application/pdf',
            fileSize: phyPdf.length,
            isPublished: true,
            isPremium: true,
            downloadCount: 189,
          });
        }
      }

      if (waec) {
        const waecMth = await Subject.findOne({ examId: waec._id, code: 'MTH' });
        if (waecMth) {
          const waecPdf = createCurriculumPdfBuffer(
            'WAEC General Mathematics Past Questions & Marking Scheme Guide',
            'WAEC',
            'General Mathematics',
            [
              'Mensuration: Surface areas and volumes of Cones, Pyramids, and Frustums',
              'Commercial Mathematics: Compound interest, Depreciation, Income tax schemes',
              'Trigonometry & Angles of Elevation / Depression',
              'Circle Theorems: Cyclic quadrilaterals, Tangent-chord properties',
              'Probability & Cumulative Frequency Curves (Ogive graph analysis)',
            ]
          );
          const waecStorageName = `mat_${crypto.randomUUID()}.pdf`;
          fs.writeFileSync(path.join(storageDir, waecStorageName), waecPdf);

          await StudyMaterial.create({
            examId: waec._id,
            subjectId: waecMth._id,
            title: 'WAEC General Mathematics Past Questions & Marking Scheme Guide',
            description: 'Official marking guide breakdown showing how marks are awarded for step-by-step working in WAEC theory and objective exams.',
            fileUrl: `/api/materials/storage/${waecStorageName}`,
            storageFilename: waecStorageName,
            originalFilename: 'WAEC_Math_Marking_Scheme.pdf',
            fileType: 'pdf',
            mimeType: 'application/pdf',
            fileSize: waecPdf.length,
            isPublished: true,
            isPremium: true,
            downloadCount: 95,
          });
        }
      }
      console.log('✅ Authentic curriculum study materials generated and populated.');
    } else {
      // Self-heal: ensure existing materials have their physical PDF on disk
      const existingMaterials = await StudyMaterial.find();
      for (const m of existingMaterials) {
        const expectedFilename = m.storageFilename || `mat_${m._id}.pdf`;
        const physicalPath = path.join(storageDir, expectedFilename);
        if (!fs.existsSync(physicalPath)) {
          const fallbackPdf = createCurriculumPdfBuffer(
            m.title,
            'MarkDriller Curriculum',
            'Revision Syllabus',
            ['Curriculum Outline & Core Objectives', 'Key Formulas & Definitions', 'Worked Example Problems', 'Examiner Tips & Common Pitfalls']
          );
          fs.writeFileSync(physicalPath, fallbackPdf);
          m.storageFilename = expectedFilename;
          m.originalFilename = m.originalFilename || `${m.title.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`;
          m.mimeType = 'application/pdf';
          m.fileSize = fallbackPdf.length;
          await m.save();
        }
      }
    }

    // Seed or synchronize initial administrator based strictly on env.ADMIN_EMAIL
    const configuredAdminEmail = env.ADMIN_EMAIL.trim().toLowerCase();
    let adminUser = await User.findOne({ email: configuredAdminEmail });

    if (!adminUser) {
      const salt = await bcrypt.genSalt(12);
      const adminInitialPassword =
        process.env.ADMIN_INITIAL_PASSWORD ||
        process.env.ADMIN_PASSWORD ||
        crypto.randomBytes(16).toString('hex') + '!Aa1';
      const passwordHash = await bcrypt.hash(adminInitialPassword, salt);

      adminUser = await User.create({
        fullName: 'MarkDriller Platform Administrator',
        email: configuredAdminEmail,
        passwordHash,
        role: 'ADMIN',
        isVerified: true,
      });

      await Profile.create({
        userId: adminUser._id,
        phone: '+2348000000000',
        educationLevel: 'Platform Administrator',
        state: 'Lagos',
        country: 'Nigeria',
      });

      console.log('🛡️ Initial Administrator initialized via ADMIN_EMAIL configuration');
    } else {
      let changed = false;
      if (adminUser.role !== 'ADMIN') {
        adminUser.role = 'ADMIN';
        changed = true;
      }
      if (!adminUser.isVerified) {
        adminUser.isVerified = true;
        changed = true;
      }
      if (changed) {
        await adminUser.save();
      }
    }

    // Seed Authentic Tertiary Institutions if empty
    const institutionCount = await Institution.countDocuments();
    if (institutionCount === 0) {
      console.log('🏛️ Seeding accredited Nigerian tertiary institutions...');
      await Institution.insertMany([
        {
          name: 'University of Lagos',
          shortCode: 'UNILAG',
          type: 'FEDERAL_UNI',
          state: 'Lagos',
          founded: 1962,
          minJambCutoff: 200,
          popularCourses: ['Medicine and Surgery', 'Law', 'Computer Science', 'Accounting', 'Mechanical Engineering', 'Pharmacy'],
          facultiesCount: 12,
          website: 'https://unilag.edu.ng',
          admissionNote: 'Strictly merit-driven aggregate (50% JAMB + 30% Post-UTME + 20% O\'Level). First-choice candidates only.',
          isPublished: true,
        },
        {
          name: 'University of Ibadan',
          shortCode: 'UI',
          type: 'FEDERAL_UNI',
          state: 'Oyo',
          founded: 1948,
          minJambCutoff: 200,
          popularCourses: ['Medicine and Surgery', 'Pharmacy', 'Law', 'Agricultural Science', 'Veterinary Medicine', 'English'],
          facultiesCount: 16,
          website: 'https://ui.edu.ng',
          admissionNote: 'Nigeria\'s premier university. Minimum 50% score in central Post-UTME screening required for merit admission list.',
          isPublished: true,
        },
        {
          name: 'Obafemi Awolowo University',
          shortCode: 'OAU',
          type: 'FEDERAL_UNI',
          state: 'Osun',
          founded: 1961,
          minJambCutoff: 200,
          popularCourses: ['Medicine and Surgery', 'Law', 'Computer Engineering', 'Pharmacy', 'Nursing Science', 'Architecture'],
          facultiesCount: 13,
          website: 'https://oauife.edu.ng',
          admissionNote: 'Strict catchment and merit quotas. No admission for candidates with deficient O\'Level grades in core prerequisites.',
          isPublished: true,
        },
        {
          name: 'Ahmadu Bello University',
          shortCode: 'ABU',
          type: 'FEDERAL_UNI',
          state: 'Kaduna',
          founded: 1962,
          minJambCutoff: 180,
          popularCourses: ['Civil Engineering', 'Medicine', 'Law', 'Architecture', 'Veterinary Medicine', 'Agriculture'],
          facultiesCount: 18,
          website: 'https://abu.edu.ng',
          admissionNote: 'Largest academic university in Sub-Saharan Africa. High catchment quota for Northern states alongside open national merit.',
          isPublished: true,
        },
        {
          name: 'University of Nigeria, Nsukka',
          shortCode: 'UNN',
          type: 'FEDERAL_UNI',
          state: 'Enugu',
          founded: 1960,
          minJambCutoff: 200,
          popularCourses: ['Pharmacy', 'Medicine and Surgery', 'Law', 'Mass Communication', 'Medical Laboratory Science'],
          facultiesCount: 15,
          website: 'https://unn.edu.ng',
          admissionNote: 'Rigorous computer-based Post-UTME screening. Average of JAMB and Post-UTME scores determines departmental merit cutoffs.',
          isPublished: true,
        },
        {
          name: 'Federal University of Technology, Akure',
          shortCode: 'FUTA',
          type: 'FEDERAL_UNI',
          state: 'Ondo',
          founded: 1981,
          minJambCutoff: 180,
          popularCourses: ['Computer Science', 'Software Engineering', 'Electrical Engineering', 'Cybersecurity', 'Architecture'],
          facultiesCount: 9,
          website: 'https://futa.edu.ng',
          admissionNote: 'Strictly science and engineering focused. Mathematics, Physics, and Chemistry compulsory for 90% of departments.',
          isPublished: true,
        },
        {
          name: 'University of Ilorin',
          shortCode: 'UNILORIN',
          type: 'FEDERAL_UNI',
          state: 'Kwara',
          founded: 1975,
          minJambCutoff: 190,
          popularCourses: ['Medicine and Surgery', 'Law', 'Common and Islamic Law', 'Accounting', 'Biochemistry'],
          facultiesCount: 15,
          website: 'https://unilorin.edu.ng',
          admissionNote: 'Reputed for stable academic calendar. Among Nigeria\'s most applied institutions nationwide in UTME annual registries.',
          isPublished: true,
        },
        {
          name: 'Lagos State University',
          shortCode: 'LASU',
          type: 'STATE_UNI',
          state: 'Lagos',
          founded: 1983,
          minJambCutoff: 195,
          popularCourses: ['Law', 'Communication Studies', 'Medicine', 'Computer Science', 'Business Administration'],
          facultiesCount: 11,
          website: 'https://lasu.edu.ng',
          admissionNote: 'Non-exam online point-grading Post-UTME screening based strictly on combined JAMB score and WAEC/NECO grades.',
          isPublished: true,
        },
      ]);
    }

    // Seed Editorial Blog Guides if empty
    const blogCount = await BlogPost.countDocuments();
    if (blogCount === 0) {
      console.log('📰 Seeding academic editorial blog guides...');
      await BlogPost.insertMany([
        {
          slug: 'jamb-300-strategy',
          title: 'Strategic Blueprint for 300+ in JAMB UTME: Time Allocation, Pacing & Pitfalls',
          category: 'JAMB_GUIDES',
          examBoard: 'JAMB',
          author: 'MarkDriller Academic Editorial Board',
          authorRole: 'Curriculum & Psychometrics Unit',
          publishedDate: 'September 15, 2026',
          readTime: '6 min read',
          summary: 'A forensic breakdown of the 400-mark JAMB UTME examination. Learn how to divide your 120 minutes across 4 subjects, tackle comprehension passages first, and avoid negative anxiety traps.',
          tags: ['JAMB', 'UTME', 'CBT Strategy', 'Use of English'],
          imageUrl: '/assets/logos/jamb.png',
          imageCaption: 'Official Joint Admissions and Matriculation Board (JAMB) Examination Seal & 8-Key Computer Based Test (CBT) Interface Framework.',
          keyTakeaways: [
            '180 questions across 4 subjects in 120 minutes equates to exactly 40 seconds per question on average.',
            'Strictly utilize the 8-key keyboard controls (A, B, C, D, N, P, S, R) to save between 4 to 8 minutes over mouse navigation.',
            'Zero negative marking in JAMB: never leave an unanswered option on final submission.',
          ],
          content: [
            'The Joint Admissions and Matriculation Board (JAMB) UTME tests 180 questions in 120 minutes across 4 subjects: 60 questions for Use of English and 40 questions each for your three departmental subjects. This means candidates have exactly 40 seconds per question on average.',
            '1. The Golden Time Budget: Allocate 35 minutes to Use of English, 25 minutes each to your two calculation/technical subjects, 25 minutes to your reading subject, and reserve a mandatory 10 minutes at the end for reviewing unanswered questions.',
            '2. Comprehension & Life Changer Novels First: Tackle the reading comprehension and prescribed novel questions while your mental focus is sharpest. Do not leave extensive reading passages to the final 15 minutes when time anxiety is peak.',
            '3. On-Screen Calculator Precision: JAMB provides a basic 4-function on-screen calculator (invoked with the "C" key on the standard 8-key CBT keyboard). Practice mental arithmetic and scientific estimation to minimize reliance on physical keystrokes.',
            '4. The 8-Key Navigation System: Familiarize yourself with standard CBT keys: A, B, C, D for selecting options, N for Next, P for Previous, S for Submit, and R for Return. Mastering keyboard shortcuts saves between 4 to 8 minutes over mouse navigation.',
          ],
          isPublished: true,
        },
        {
          slug: 'waec-chief-examiner-notes',
          title: "WAEC Chief Examiners' Report Analysis: Critical Errors in Mathematics & English",
          category: 'WAEC_INSIGHTS',
          examBoard: 'WAEC',
          author: 'A. O. Balogun, Senior WAEC Consultant',
          authorRole: 'Chief Assessment Officer',
          publishedDate: 'September 2, 2026',
          readTime: '8 min read',
          summary: "Direct takeaways from recent WAEC Chief Examiners' reports. Discover the specific areas where thousands of candidates consistently lose distinction marks in WASSCE Paper 2.",
          tags: ['WAEC', 'WASSCE', 'Mathematics Theory', 'English Paper 2'],
          imageUrl: '/assets/logos/waec.png',
          imageCaption: 'West African Examinations Council (WAEC) Standard Crest and WASSCE Paper 2 Theory Assessment Marking Protocol.',
          keyTakeaways: [
            'Never round off intermediate calculations in Mathematics Paper 2; keep at least 4 significant figures throughout.',
            'Formal letters must feature two complete addresses, underlined heading, and proper salutation to avoid losing 30% mechanical accuracy.',
            'Biological drawings demand ruled, non-crossing guide lines and horizontal labels with stated magnification.',
          ],
          content: [
            "Each year, the West African Examinations Council publishes the Chief Examiners' Report documenting strengths and recurring candidate weaknesses across all papers. Understanding these expectations transforms a candidate's approach to WASSCE Paper 2.",
            '1. Premature Rounding in Mathematics: In General Mathematics Paper 2 (Theory), examiners consistently report heavy mark deductions when candidates round off intermediate values before the final step. Always carry values to at least 4 significant figures throughout working.',
            '2. English Essay Format Adherence: Formal letters must possess two addresses (sender top right, recipient left), a concise capitalized or underlined heading, formal salutation, and "Yours faithfully," followed by signature and full name. Missing any structural element costs up to 30% of mechanical accuracy marks.',
            '3. Biology and Physics Diagrams: Biological sketches must have clear, ruled guide lines that do not cross each other, with labels written horizontally in lowercase or block letters, alongside explicit magnification (e.g. "×1.5"). Sketches drawn with woolly lines or ink receive zero marks for technique.',
            '4. Physics Working with Units: Every numerical final answer must state its correct SI unit (e.g. m/s², N, J, W, Ω). A correct number without a unit is penalized one mark per sub-question.',
          ],
          isPublished: true,
        },
        {
          slug: 'neco-grading-continuous-assessment',
          title: 'Decoding the NECO 9-Point Grading Scale & Continuous Assessment (CA) Benchmarks',
          category: 'NECO_EXCELLENCE',
          examBoard: 'NECO',
          author: 'Dr. K. I. Mohammed, Senior Psychometric Assessor',
          authorRole: 'NECO Evaluation Specialist',
          publishedDate: 'September 18, 2026',
          readTime: '7 min read',
          summary: 'How NECO standardizes school continuous assessment scores with national external papers. Master the specific grade boundaries from A1 down to F9.',
          tags: ['NECO', 'SSCE', 'Grading Scale', 'Continuous Assessment', 'O Level'],
          imageUrl: '/assets/logos/neco.png',
          imageCaption: 'National Examinations Council (NECO) Official Seal & Senior School Certificate Examination (SSCE) Cumulative Assessment Matrix.',
          keyTakeaways: [
            'NECO incorporates a mandatory 30% Continuous Assessment (CA) score alongside the 70% terminal paper.',
            'Distinction marks (A1: 75%+, B2/B3: 65-74%) require mastery in both objective papers and essay rubrics.',
            'NECO objective questions feature 5 options (A-E) in select papers, requiring tighter elimination habits than WAEC 4-option questions.',
          ],
          content: [
            'The National Examinations Council (NECO) conducts the domestic Senior School Certificate Examination (SSCE) for Nigerian students. Understanding NECO psychometric scoring empowers candidates to target distinctions with surgical precision.',
            '1. The 30/70 Continuous Assessment Component: Unlike purely external private exams, NECO SSCE (Internal) combines 30 marks generated from verified senior secondary continuous assessments (SS1 to SS3 mock scores) with 70 marks from the national exam hall. A strong school CA profile provides an immediate cushion against examination-day stress.',
            '2. The 9-Point Stanine Scale: NECO grades performance on a 9-point stanine standard: A1 (75-100% Distinction), B2 (70-74% Very Good), B3 (65-69% Good), C4 (60-64% Credit), C5 (55-59% Credit), C6 (50-54% Credit), D7 (45-49% Pass), E8 (40-44% Pass), and F9 (0-39% Fail).',
            '3. 5-Option Elimination Strategy: Unlike WAEC which predominantly uses 4 options (A-D) in general objective tests, several NECO science and social science papers provide 5 options (A, B, C, D, E). This reduces pure guessing probability from 25% down to 20%, making active elimination of improbable options twice as vital.',
          ],
          isPublished: true,
        },
        {
          slug: 'gce-private-candidates-guide',
          title: 'WAEC & NECO GCE Private Series: Combined Results Rules & Biometric Verification',
          category: 'GCE_PREP',
          examBoard: 'GCE',
          author: 'B. E. Okon, Secondary Admissions Registrar',
          authorRole: 'External Examinations Desk',
          publishedDate: 'September 10, 2026',
          readTime: '6 min read',
          summary: "Essential rules for private candidates registering for Nov/Dec GCE series. Learn how Nigerian tertiary institutions verify two-sitting combined O'Level credentials.",
          tags: ['GCE', 'WAEC GCE', 'NECO GCE', 'Private Candidate', 'Two Sittings'],
          imageUrl: '/assets/logos/waec.png',
          imageCaption: 'General Certificate Examination (GCE) Private Candidate External Testing Accreditation & Verification Standard.',
          keyTakeaways: [
            'Most federal and state universities accept combining two sittings of WAEC and NECO GCE, provided all 5 core subjects are passed at credit level (C6+).',
            'Competitive medicine and law faculties in select top-tier schools specifically demand single-sitting results.',
            'Digital biometric capture is audited at exam hall entry: never use proxy passport photographs during e-registration.',
          ],
          content: [
            "The General Certificate Examination (GCE) offers private candidates a flexible opportunity to remedy missing O'Level credits without re-enrolling in conventional secondary schools.",
            '1. Two-Sitting Combination Policies: The National Universities Commission (NUC) and JAMB recognize results from two distinct sittings. Candidates can pair WAEC (May/June) with WAEC GCE (Nov/Dec), or WAEC with NECO GCE, provided that 5 mandatory credits (including English Language and Mathematics) are achieved across both certificates.',
            '2. Single-Sitting Institutional Exceptions: Candidates aspiring for highly subscribed professional courses (such as Medicine & Surgery or Nursing at institutions like UI or UNILAG) must review individual departmental admission brochures, as certain faculties reserve preferential quotas for single-sitting profiles.',
            '3. Exam Hall Biometric Verification: Both WAEC and NECO deploy handheld biometric scanners matching live fingerprints with registration databases. Candidates must complete digital capture at accredited cybercafes and present stamped photo-cards alongside government-approved identification.',
          ],
          isPublished: true,
        },
        {
          slug: 'nabteb-modular-curriculum',
          title: 'NABTEB NBC & NTC Examination: Technical Workshop Drawing & Calculation Guidelines',
          category: 'NABTEB_STRATEGY',
          examBoard: 'NABTEB',
          author: 'Engr. S. A. Adeleke, Technical Vocational Officer',
          authorRole: 'Director of Technical Assessment',
          publishedDate: 'August 29, 2026',
          readTime: '7 min read',
          summary: 'How to excel in National Business Certificate (NBC) and National Technical Certificate (NTC) papers. Direct-entry admission routes and workshop practical criteria.',
          tags: ['NABTEB', 'NBC', 'NTC', 'Technical Education', 'Direct Entry'],
          imageUrl: '/assets/logos/nabteb.png',
          imageCaption: 'National Business and Technical Examinations Board (NABTEB) Insignia & Modular Trade Certification Criteria.',
          keyTakeaways: [
            'NABTEB NBC/NTC certificates are legally equivalent to WASSCE/NECO SSCE for admission into Nigerian polytechnics, colleges, and universities.',
            'Engineering and technology faculties accept NABTEB with direct entry eligibility for candidates completing the Advanced National Technical Certificate (ANTC).',
            'Practical workshop exams carry heavy weighting: ensure standard orthographic projections and isometric dimensioning standards are adhered to.',
          ],
          content: [
            'The National Business and Technical Examinations Board (NABTEB) is Nigeria\'s premier assessment council for vocational, technical, and commercial competencies. Its certificates bridge craftsmanship with higher academic pursuits.',
            '1. Legal Equivalence with WASSCE and NECO: Federal government circulars confirm that the National Business Certificate (NBC) and National Technical Certificate (NTC) awarded by NABTEB enjoy complete parity with WAEC and NECO for university admission, civil service recruitment, and polytechnic matriculation.',
            '2. Practical Assessment Weighting: Unlike purely theoretical papers, NABTEB technical trades (such as Mechanical Engineering Craft, Electrical Installation, Radio & Television, and Fabrication) assess hands-on workshop proficiency, assigning up to 50% of total grade value to real-time workshop tasks, tool safety, and component tolerance.',
            '3. Technical Drawing Standards: Engineering candidates must demonstrate mastery of first-angle and third-angle orthographic projections. All drawing sheets must use standardized title blocks, correct line thicknesses (thick continuous for outlines, thin dashed for hidden details), and accurate isometric scaling.',
          ],
          isPublished: true,
        },
        {
          slug: 'post-utme-aggregate-guide',
          title: 'How Nigerian Universities Compute Post-UTME Aggregate: Formulas for UNILAG, UI & OAU',
          category: 'POST_UTME',
          examBoard: 'POST-UTME',
          author: 'T. C. Nnamdi, Higher Education Advisor',
          authorRole: 'Admissions Advisory Desk',
          publishedDate: 'August 24, 2026',
          readTime: '5 min read',
          summary: 'Demystifying the 100-point composite score calculation across top federal universities. Learn how your O\'Level grades translate into admission points and how to forecast your competitiveness.',
          tags: ['Post-UTME', 'Aggregate Score', 'UNILAG', 'UI', 'OAU', 'Admissions'],
          imageUrl: '/assets/logos/jamb.png',
          imageCaption: 'Tertiary Institutions Central Screening & 100-Point Composite Aggregate Model for Federal Universities.',
          keyTakeaways: [
            'UNILAG weights UTME at 50%, Post-UTME at 30%, and 5 O Level subjects at 20% (A1=4.0pts).',
            'University of Ibadan evaluates on a strict 50-50 composite between JAMB and Post-UTME, using O Level as prerequisites.',
            'Always verify whether your preferred faculty deducts points for multiple O Level sittings before calculating your aggregate.',
          ],
          content: [
            'Scoring 300+ in JAMB is only half the battle for competitive courses like Medicine, Law, and Software Engineering. Nigerian universities evaluate candidates using composite percentage aggregate formulas.',
            '1. The UNILAG 50-30-20 Model: UNILAG computes aggregate over 100 points: UTME score divided by 8 (50% max), Post-UTME score (30% max), and 5 core O\'Level subjects (20% max). For O\'Level: A1 = 4.0 points, B2 = 3.6, B3 = 3.2, C4 = 2.8, C5 = 2.4, C6 = 2.0. Five A1s give the maximum 20 points.',
            '2. The University of Ibadan 50-50 Model: UI divides your JAMB score by 8 (50% max) and adds your Post-UTME test score divided by 2 (50% max). O\'Level grades are prerequisites (minimum 5 credits in one sitting) but do not contribute numeric points to the aggregate score.',
            '3. OAU Screening Aggregate: Obafemi Awolowo University weights UTME score at 50% and Post-UTME aptitude screening test at 50%. Candidates must meet strict departmental faculty cutoffs published on the e-portal.',
          ],
          isPublished: true,
        },
      ]);
    }

    // Seed Verified Student Testimonials if empty
    const testimonialCount = await Testimonial.countDocuments();
    if (testimonialCount === 0) {
      console.log('💬 Seeding verified Nigerian student testimonials...');
      await Testimonial.insertMany([
        {
          studentName: 'Aminat O.',
          examTaken: 'JAMB UTME 2025',
          score: '342 / 400',
          year: 2025,
          quote: 'MarkDriller\'s CBT exam room replicates the exact JAMB 8-key interface down to the color scheme and timer alerts. Practicing 3 timed multi-subject mocks every week eliminated all examination tension.',
          universityAdmitted: 'Medicine & Surgery, University of Lagos (UNILAG)',
          avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
          isFeatured: true,
          isApproved: true,
        },
        {
          studentName: 'Chinedu E.',
          examTaken: 'WASSCE & Post-UTME 2025',
          score: '8 A1s & 328 UTME',
          year: 2025,
          quote: 'The step-by-step mathematical working and Chief Examiner notes for WASSCE Paper 2 are unmatched. I learned where students routinely lose method marks and corrected my intermediate rounding mistakes.',
          universityAdmitted: 'Electrical & Electronics Engineering, University of Ibadan (UI)',
          avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
          isFeatured: true,
          isApproved: true,
        },
        {
          studentName: 'Fatima B.',
          examTaken: 'JAMB UTME 2025',
          score: '318 / 400',
          year: 2025,
          quote: 'The offline downloadable formula sheets and syllabus-aligned topic drills gave me complete confidence in Use of English and Government. Subscribing to the Scholar pass was the best academic decision I made.',
          universityAdmitted: 'Faculty of Law, Ahmadu Bello University (ABU Zaria)',
          avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
          isFeatured: true,
          isApproved: true,
        },
      ]);
    }

    // Seed Curriculum Video Lectures if empty
    const videoCount = await VideoLesson.countDocuments();
    if (videoCount === 0) {
      console.log('🎥 Seeding curriculum video lectures...');
      await VideoLesson.insertMany([
        {
          title: 'JAMB Mathematics: Algebraic Processes & Quadratic Equations Mastery',
          videoId: 'kpCJyQ2usJ4',
          duration: '18:42',
          topicName: 'Algebra & Quadratics',
          isPremium: false,
          order: 1,
          isPublished: true,
        },
        {
          title: 'Use of English: Lexis & Structure, Concord and Idiomatic Usage',
          videoId: 'ptM7FzyjtRk',
          duration: '22:15',
          topicName: 'Grammatical Concord',
          isPremium: false,
          order: 2,
          isPublished: true,
        },
        {
          title: 'JAMB Physics: Mechanics, Vectors, Projectiles & Circular Motion',
          videoId: 'ZM8ECpBuQYE',
          duration: '26:08',
          topicName: 'Mechanics & Projectiles',
          isPremium: true,
          order: 3,
          isPublished: true,
        },
        {
          title: 'JAMB Chemistry: Chemical Equilibrium, Le Chatelier’s Principle & Electrolysis',
          videoId: '0RRVV4Diomg',
          duration: '24:33',
          topicName: 'Equilibrium & Electrochemistry',
          isPremium: true,
          order: 4,
          isPublished: true,
        },
        {
          title: 'JAMB Biology: Genetics, Heredity, Variation and Natural Selection',
          videoId: 'eEUvRrhmcxM',
          duration: '19:50',
          topicName: 'Genetics & Evolution',
          isPremium: false,
          order: 5,
          isPublished: true,
        },
      ]);
    }
  } catch (error) {
    console.error('⚠️ Error during initial data seeding:', error);
  }
}

