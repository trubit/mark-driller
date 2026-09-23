import React, { useState, useMemo } from 'react';
import { useQuestionsQuery, QuestionItem } from '../api/questions.js';
import { BrandLoader } from './BrandLoader.js';

interface FlashcardItem {
  id: string;
  subject: string;
  topic: string;
  front: string;
  back: string;
  keyFact: string;
  examRelevance: string;
  isDynamicQuestion?: boolean;
}

const SYLLABUS_FLASHCARDS: Record<string, FlashcardItem[]> = {
  'English Language': [
    {
      id: 'eng-1',
      subject: 'English Language',
      topic: 'Lexis & Structure — Concord',
      front: 'What is the Rule of Proximity in English Concord, and how is it tested in UTME?',
      back: 'When two subjects are joined by "either... or", "neither... nor", or "not only... but also", the verb agrees with the subject NEAREST to it.\n\nExample: "Neither the principal nor the teachers were present."',
      keyFact: '"Teachers" is plural and nearest to the verb, taking plural "were".',
      examRelevance: 'JAMB UTME Lexis & Structure (Tested annually)',
    },
    {
      id: 'eng-2',
      subject: 'English Language',
      topic: 'Oral Forms — Vowel Contrasts',
      front: 'Differentiate between the short monophthong /ɪ/ and the long vowel /iː/ with exam word pairs.',
      back: '/ɪ/ is short, lax, and unrounded (e.g. ship, sit, live, bit).\n/iː/ is long, tense, with lips spread (e.g. sheep, seat, leave, beat).\n\nKey test word: "quay" is pronounced /kiː/ (homophone with "key"), NOT /kweɪ/.',
      keyFact: '"Quay", "people", and "suite" (/swiːt/) frequently appear in WAEC Orals Section 1.',
      examRelevance: 'WAEC Paper 3 Test of Orals / JAMB Oral English',
    },
    {
      id: 'eng-3',
      subject: 'English Language',
      topic: 'Figures of Speech',
      front: 'What is an Oxymoron versus a Paradox in literary devices?',
      back: 'An Oxymoron places two contradictory words side by side (e.g. "deafening silence", "open secret").\n\nA Paradox is a seemingly contradictory statement that contains a deeper underlying truth (e.g. "The child is father of the man").',
      keyFact: 'Oxymoron = adjacent words. Paradox = full statement or thematic premise.',
      examRelevance: 'Literature in English & WAEC Prose Comprehension',
    },
    {
      id: 'eng-4',
      subject: 'English Language',
      topic: 'Subject-Verb Agreement — Pluralia Tantum',
      front: 'Explain Pluralia Tantum nouns and their verb agreement rules in WAEC/UTME.',
      back: 'Pluralia Tantum are nouns that exist only in plural form and have no singular variant (e.g. scissors, trousers, pliers, binoculars, police, acoustics, cattle). They strictly require plural verbs.\n\nException: If preceded by "a pair of", the singular verb is used: "A pair of scissors IS on the table."',
      keyFact: '"The police ARE investigating" (plural verb), but "A police officer IS" (singular).',
      examRelevance: 'High-frequency JAMB Concord module',
    },
    {
      id: 'eng-5',
      subject: 'English Language',
      topic: 'Mood & Modals — Subjunctive Mood',
      front: 'How does the Subjunctive Mood function after verbs of command, recommendation, or urgency?',
      back: 'In the mandative subjunctive (after verbs like insist, recommend, suggest, demand, decree), the base form of the verb is used regardless of subject person or number.\n\nExample: "The doctor recommended that he BE placed on bed rest" (NOT "is" or "was").\n"The chairman demanded that she RESIGN" (NOT "resigns").',
      keyFact: 'Base form of verb (infinitive without "to") is mandatory in formal subjunctive clauses.',
      examRelevance: 'JAMB UTME Advanced Sentence Structure',
    },
    {
      id: 'eng-6',
      subject: 'English Language',
      topic: 'Oral Forms — Syllabic Stress Patterns',
      front: 'What is the penultimate stress rule for English words with specific grammatical suffixes?',
      back: 'Words ending in -tion, -sion, -ic, -ical, and -ity always place primary stress on the penultimate (second to the last) syllable.\n\nExamples:\n• EduCAtion (/ˌedʒ.ʊˈkeɪ.ʃən/)\n• DeCIsion (/dɪˈsɪʒ.ən/)\n• PhoTOgraphic (/ˌfəʊ.təˈɡræf.ɪk/)\n• ECOL-ogy / ElecTRIcity',
      keyFact: 'Count syllables from the end: penultimate is always syllable number 2 counting backwards.',
      examRelevance: 'WAEC Paper 3 Section 4 Stress Placement',
    },
    {
      id: 'eng-7',
      subject: 'English Language',
      topic: 'Grammar — Question Tags',
      front: 'State the 3 core rules governing Question Tags, including exceptional cases.',
      back: '1. Positive statement takes a negative tag ("She is smart, isn\'t she?").\n2. Negative statement takes a positive tag ("He doesn\'t know, does he?").\n3. Exceptional Cases:\n• "I am" takes "aren\'t I?" (NOT "amn\'t I").\n• Imperatives: "Come here, will you?" or "won\'t you?".\n• "Let\'s" takes "shall we?" ("Let\'s study, shall we?").',
      keyFact: '"Neither" or "rarely" makes a statement negative: "He rarely visits, DOES he?"',
      examRelevance: 'UTME Lexis Section (Appears every exam year)',
    },
    {
      id: 'eng-8',
      subject: 'English Language',
      topic: 'Phonology — Silent Consonants',
      front: 'Identify the silent letters in the following exam words: "receipt", "subtle", "phlegm", "indict", and "sword".',
      back: '• receipt: silent "p" (/rɪˈsiːt/)\n• subtle: silent "b" (/ˈsʌt.əl/)\n• phlegm: silent "g" (/flem/)\n• indict: silent "c" (/ɪnˈdaɪt/)\n• sword: silent "w" (/sɔːd/)\n• debris: silent "s" (/ˈdeɪ.briː/)',
      keyFact: '"Subtle", "doubt", "debt" contain silent "b" before "t".',
      examRelevance: 'JAMB UTME Test of Orals Rhyme & Silent Letters',
    },
    {
      id: 'eng-9',
      subject: 'English Language',
      topic: 'Idiomatic Expressions & Nuances',
      front: 'What is the precise exam meaning of: (1) "burn the candle at both ends", (2) "pass muster", (3) "at loggerheads"?',
      back: '1. "Burn the candle at both ends": Overworking oneself by going to bed late and waking early.\n2. "Pass muster": To satisfy required standards or pass inspection.\n3. "At loggerheads": In strong, stubborn disagreement or dispute.',
      keyFact: 'Examiners test these idioms to contrast with literal distractor options.',
      examRelevance: 'JAMB UTME Idioms and Interpretations',
    },
    {
      id: 'eng-10',
      subject: 'English Language',
      topic: 'Reported Speech — Sequence of Tenses',
      front: 'How do time expressions and modal auxiliaries shift when reporting past speech?',
      back: '• "now" → "then"\n• "today" → "that day"\n• "tomorrow" → "the following/next day"\n• "yesterday" → "the previous day/the day before"\n• "will" → "would"\n• "shall" → "should"\n• "can" → "could"\n• "may" → "might"\n• "must" → "had to"',
      keyFact: 'Universal scientific truths do not shift tenses: "He stated that water boils at 100°C."',
      examRelevance: 'WAEC English Paper 2 Continuous Writing & Grammar',
    },
  ],

  'Mathematics': [
    {
      id: 'mth-1',
      subject: 'Mathematics',
      topic: 'Algebra — Quadratic Equations',
      front: 'State the relationships between the roots (α, β) of ax² + bx + c = 0 and its coefficients, and form the quadratic equation.',
      back: 'Sum of roots: α + β = -b/a\nProduct of roots: αβ = c/a\n\nQuadratic equation form:\nx² - (Sum of roots)x + (Product of roots) = 0\nx² - (α + β)x + αβ = 0',
      keyFact: 'Useful identity: α² + β² = (α + β)² - 2αβ.',
      examRelevance: 'WAEC Mathematics Paper 2 Section A & JAMB UTME',
    },
    {
      id: 'mth-2',
      subject: 'Mathematics',
      topic: 'Trigonometry — Double Angle & Compound Formulas',
      front: 'Write the double angle formulas for sin(2θ), cos(2θ) (all 3 forms), and tan(2θ).',
      back: '• sin(2θ) = 2sinθ·cosθ\n• cos(2θ) = cos²θ - sin²θ = 2cos²θ - 1 = 1 - 2sin²θ\n• tan(2θ) = 2tanθ / (1 - tan²θ)',
      keyFact: 'To evaluate cos²θ in calculus integration: cos²θ = ½(1 + cos(2θ)).',
      examRelevance: 'JAMB UTME Advanced Trigonometry & Further Math',
    },
    {
      id: 'mth-3',
      subject: 'Mathematics',
      topic: 'Calculus — Differentiation Rules',
      front: 'State the Product Rule, Quotient Rule, and Chain Rule for differentiation.',
      back: '• Product Rule: d/dx[u·v] = u(dv/dx) + v(du/dx)\n• Quotient Rule: d/dx[u/v] = [v(du/dx) - u(dv/dx)] / v²\n• Chain Rule: dy/dx = (dy/du) · (du/dx)',
      keyFact: 'Remember the quotient rule order: denominator (v) comes first in numerator: v·u\' - u·v\'.',
      examRelevance: 'JAMB Calculus Questions (Typically 5 questions per exam)',
    },
    {
      id: 'mth-4',
      subject: 'Mathematics',
      topic: 'Sequences & Series — AP & GP',
      front: 'State the formulas for the nth term and sum of n terms for Arithmetic (AP) and Geometric Progressions (GP), plus sum to infinity.',
      back: 'AP:\n• nth term: Tₙ = a + (n - 1)d\n• Sum: Sₙ = n/2 [2a + (n - 1)d] = n/2 (a + l)\n\nGP:\n• nth term: Tₙ = a·rⁿ⁻¹\n• Sum: Sₙ = a(1 - rⁿ) / (1 - r) for |r| < 1\n• Sum to infinity: S_∞ = a / (1 - r) (valid only when |r| < 1)',
      keyFact: 'If S_∞ exists, the common ratio r must satisfy -1 < r < 1.',
      examRelevance: 'Annual WAEC Paper 2 Compulsory Question',
    },
    {
      id: 'mth-5',
      subject: 'Mathematics',
      topic: 'Geometry — Alternate Segment Theorem',
      front: 'State the Alternate Segment Theorem and explain how to apply it in circle theorems.',
      back: 'The Alternate Segment Theorem states that the angle between a tangent and a chord through the point of contact equals the angle subtended by the chord in the alternate segment.\n\nExample: If tangent TAB touches circle at A, and chord AC is drawn, then ∠TAC = ∠ABC (where B is any point on the opposite circumference).',
      keyFact: 'Always identify the chord and look directly across to the inscribed angle.',
      examRelevance: 'WAEC Circle Geometry Paper 2',
    },
    {
      id: 'mth-6',
      subject: 'Mathematics',
      topic: 'Logarithms — Laws & Change of Base',
      front: 'State the Change of Base Rule and the 4 fundamental laws of logarithms.',
      back: '• Product: log_a(xy) = log_a(x) + log_a(y)\n• Quotient: log_a(x/y) = log_a(x) - log_a(y)\n• Power: log_a(xᵏ) = k·log_a(x)\n• Identity: log_a(a) = 1 and log_a(1) = 0\n• Change of Base: log_b(a) = log_c(a) / log_c(b) = 1 / log_a(b)',
      keyFact: 'log(x + y) does NOT equal log(x) + log(y). A common examination trap.',
      examRelevance: 'JAMB UTME Logarithmic Indices Section',
    },
    {
      id: 'mth-7',
      subject: 'Mathematics',
      topic: 'Mensuration — Frustum of a Cone',
      front: 'What is the formula for the Volume and Total Surface Area of a Frustum of a cone?',
      back: 'Given top radius r, base radius R, height h, slant height l:\n• Volume: V = ⅓πh (R² + r² + R·r)\n• Curved Surface Area: CSA = πl(R + r)\n• Total Surface Area: TSA = πl(R + r) + πR² + πr²',
      keyFact: 'Slant height l = √[h² + (R - r)²].',
      examRelevance: 'WAEC Mathematics Section B Mensuration Problem',
    },
    {
      id: 'mth-8',
      subject: 'Mathematics',
      topic: 'Permutations & Combinations',
      front: 'Distinguish between Permutations and Combinations with their formulas and circular permutations rule.',
      back: '• Permutation (Order matters): ⁿPᵣ = n! / (n - r)!\n• Combination (Order does not matter): ⁿCᵣ = n! / [r!·(n - r)!]\n• Circular Permutations: (n - 1)! for distinct objects seated around a round table.',
      keyFact: 'If seated at a table where clockwise/anti-clockwise are indistinguishable: ½(n - 1)!',
      examRelevance: 'JAMB UTME Probability & Counting Module',
    },
    {
      id: 'mth-9',
      subject: 'Mathematics',
      topic: 'Coordinate Geometry — Slopes & Perpendicularity',
      front: 'State the conditions for two lines to be parallel, perpendicular, and the distance formula between points (x₁, y₁) and (x₂, y₂).',
      back: '• Distance: d = √[(x₂ - x₁)² + (y₂ - y₁)²]\n• Midpoint: ((x₁ + x₂)/2, (y₁ + y₂)/2)\n• Parallel lines: m₁ = m₂ (equal gradients)\n• Perpendicular lines: m₁ · m₂ = -1, or m₂ = -1/m₁',
      keyFact: 'The gradient of a line ax + by + c = 0 is m = -a/b.',
      examRelevance: 'JAMB & WAEC Coordinate Geometry questions',
    },
    {
      id: 'mth-10',
      subject: 'Mathematics',
      topic: 'Matrices — Determinant & Inverse of 2x2 Matrix',
      front: 'For matrix A = [[a, b], [c, d]], state the condition for singularity, the determinant formula, and the inverse matrix A⁻¹.',
      back: '• Determinant: det(A) = |A| = ad - bc\n• Singular Matrix: A is singular if det(A) = 0 (has NO inverse)\n• Non-singular inverse: A⁻¹ = (1 / |A|) · [[d, -b], [-c, a]]',
      keyFact: 'Swap the principal diagonal elements (a and d), negate the other two (b and c).',
      examRelevance: 'JAMB UTME Matrices and Linear Systems',
    },
  ],

  'Biology': [
    {
      id: 'bio-1',
      subject: 'Biology',
      topic: 'Cell Biology & Transport Mechanisms',
      front: 'What is the exact distinction between Osmosis, Active Transport, and Facilitated Diffusion?',
      back: '• Osmosis: Passive movement of water molecules from higher water potential to lower across a selectively permeable membrane (no ATP).\n• Active Transport: Movement of solute particles AGAINST a concentration gradient requiring ATP and membrane carrier proteins.\n• Facilitated Diffusion: Passive movement of molecules with concentration gradient via protein channels (no ATP).',
      keyFact: 'Root hair water uptake = Osmosis. Root mineral ion uptake = Active Transport.',
      examRelevance: 'JAMB Biology & WAEC Section A Core',
    },
    {
      id: 'bio-2',
      subject: 'Biology',
      topic: 'Genetics — Mendelian Ratios',
      front: 'State the expected phenotypic and genotypic ratios of a monohybrid cross (Tt × Tt) and a dihybrid cross (AaBb × AaBb).',
      back: 'Monohybrid (Tt × Tt):\n• Phenotype: 3 Dominant : 1 Recessive (75% tall, 25% dwarf)\n• Genotype: 1 TT : 2 Tt : 1 tt (1:2:1)\n\nDihybrid (AaBb × AaBb):\n• Phenotype: 9:3:3:1 (9 Dominant-Dominant, 3 Dom-Rec, 3 Rec-Dom, 1 Rec-Rec)',
      keyFact: 'Test cross (backcross with homozygous recessive tt) yields 1:1 if parent was heterozygous.',
      examRelevance: 'Tested in every WAEC Theory Section B & UTME genetics module',
    },
    {
      id: 'bio-3',
      subject: 'Biology',
      topic: 'Ecology — Nitrogen Cycle Microorganisms',
      front: 'Name the specific bacteria responsible for: (1) Nitrogen fixation, (2) Nitrification, (3) Denitrification.',
      back: '1. Nitrogen Fixation:\n• Symbiotic: Rhizobium (in root nodules of legumes)\n• Free-living: Azotobacter (aerobic), Clostridium (anaerobic)\n2. Nitrification (two steps):\n• Step 1: Nitrosomonas (converts ammonia NH₃ to nitrites NO₂⁻)\n• Step 2: Nitrobacter (converts nitrites NO₂⁻ to nitrates NO₃⁻)\n3. Denitrification: Pseudomonas denitrificans & Thiobacillus (nitrates to atmospheric N₂)',
      keyFact: 'Nitrobacter produces nitrates (NO₃⁻), the exact form plant root hairs absorb.',
      examRelevance: 'High-frequency JAMB UTME Ecology question',
    },
    {
      id: 'bio-4',
      subject: 'Biology',
      topic: 'Circulatory System — Heart Valves & Circulation',
      front: 'Describe the path of blood through double circulation and name the valves preventing backflow.',
      back: 'Pulmonary Circulation: Right ventricle → Pulmonary artery → Lungs → Pulmonary vein → Left atrium.\nSystemic Circulation: Left ventricle → Aorta → Body organs → Vena cava → Right atrium.\n\nValves:\n• Tricuspid valve: between Right Atrium and Right Ventricle\n• Bicuspid (Mitral) valve: between Left Atrium and Left Ventricle\n• Semi-lunar valves: at the exits of Aorta and Pulmonary Artery',
      keyFact: 'Left ventricle wall is thickest because it pumps blood against systemic resistance.',
      examRelevance: 'WAEC Biology Paper 2 Heart Anatomy',
    },
    {
      id: 'bio-5',
      subject: 'Biology',
      topic: 'Photosynthesis — Light vs Dark Reactions',
      front: 'Differentiate between the Light Reaction and the Dark Reaction (Calvin Cycle) of photosynthesis.',
      back: 'Light Reaction (in Thylakoid membranes/Grana):\n• Requires light\n• Photolysis of water: 2H₂O → 4H⁺ + 4e⁻ + O₂\n• Generates ATP and NADPH, releases oxygen gas\n\nDark Reaction (in Stroma):\n• Light-independent\n• CO₂ fixation with RuBP catalyzed by RuBisCO\n• Consumes ATP and NADPH from light stage to produce glucose (C₆H₁₂O₆)',
      keyFact: 'Oxygen released during photosynthesis comes strictly from WATER, not CO₂.',
      examRelevance: 'JAMB Plant Physiology Section',
    },
    {
      id: 'bio-6',
      subject: 'Biology',
      topic: 'Excretion — Nephron Function in Kidney',
      front: 'Name the 3 key processes in urine formation in the nephron and where each occurs.',
      back: '1. Ultrafiltration (Glomerulus & Bowman\'s Capsule): High hydrostatic pressure filters small molecules (glucose, urea, salts, water) into lumen; blood cells and plasma proteins remain.\n2. Selective Reabsorption (Proximal Convoluted Tubule): 100% of glucose and amino acids, plus water and salts, reabsorbed into capillaries.\n3. Tubular Secretion (Distal Convoluted Tubule & Collecting Duct): Active secretion of H⁺, K⁺, drugs; ADH regulates final water reabsorption.',
      keyFact: 'Presence of protein or glucose in final urine indicates kidney pathology or diabetes.',
      examRelevance: 'WAEC Biology Section B Kidney Diagrams',
    },
    {
      id: 'bio-7',
      subject: 'Biology',
      topic: 'Endocrine System — Blood Sugar Regulation',
      front: 'Explain the antagonistic actions of Insulin and Glucagon produced by the Islets of Langerhans.',
      back: '• High blood glucose: Beta cells secrete INSULIN, which stimulates liver and muscle cells to convert excess glucose into glycogen (glycogenesis) and increases cell uptake.\n• Low blood glucose: Alpha cells secrete GLUCAGON, which stimulates the liver to break down stored glycogen into glucose (glycogenolysis) and release it into the bloodstream.',
      keyFact: 'Failure of beta cells to produce adequate insulin results in Diabetes Mellitus.',
      examRelevance: 'JAMB Hormonal Regulation module',
    },
    {
      id: 'bio-8',
      subject: 'Biology',
      topic: 'Plant Physiology — Phytohormones',
      front: 'State the functions of: (1) Auxins, (2) Gibberellins, (3) Cytokinins, (4) Abscisic Acid, (5) Ethylene gas.',
      back: '1. Auxins (IAA): Apical dominance, cell elongation, phototropism.\n2. Gibberellins: Stem elongation, breaking seed dormancy, bolting.\n3. Cytokinins: Promotes cell division (cytokinesis), delays leaf senescence.\n4. Abscisic Acid (ABA): Stress hormone, induces stomatal closure during drought, seed dormancy.\n5. Ethylene (Ethene): Ripening of fruits, leaf abscission.',
      keyFact: 'Auxins accumulate on the SHADED side of shoots, stimulating faster growth towards light.',
      examRelevance: 'WAEC Paper 1 & UTME Plant Tropisms',
    },
    {
      id: 'bio-9',
      subject: 'Biology',
      topic: 'Ecology — Energy Flow & 10% Law',
      front: 'State Lindeman\'s 10% Energy Transfer Law and explain why food chains rarely exceed 4 or 5 trophic levels.',
      back: 'Lindeman\'s Law: Only approximately 10% of energy at one trophic level is transferred to the next higher level. 90% is lost via cellular respiration, heat dissipation, locomotion, and excretion.\n\nBecause energy decreases exponentially at each step (e.g. 10,000 kJ → 1,000 kJ → 100 kJ → 10 kJ), there is insufficient energy to sustain a viable population beyond quaternary consumers.',
      keyFact: 'Pyramids of energy are ALWAYS upright; they can never be inverted.',
      examRelevance: 'JAMB UTME Ecosystem Energetics',
    },
    {
      id: 'bio-10',
      subject: 'Biology',
      topic: 'Skeletal System — Joint Classifications',
      front: 'Classify the main types of movable (synovial) joints in humans and provide anatomic examples.',
      back: '1. Ball and Socket: Movement in all planes (360°). Examples: Shoulder joint (scapula & humerus), Hip joint (pelvis & femur).\n2. Hinge Joint: Movement in one plane (180°). Examples: Elbow joint, Knee joint, Phalanges.\n3. Pivot Joint: Rotational movement. Example: Atlas and Axis vertebrae (neck turning), Radioulnar joint.\n4. Gliding/Plane Joint: Bones slide over one another. Example: Carpals (wrist), Tarsals (ankle).',
      keyFact: 'Synovial fluid lubricates joints and reduces friction during movement.',
      examRelevance: 'WAEC Practical Biology Bone Identification',
    },
  ],

  'Physics': [
    {
      id: 'phy-1',
      subject: 'Physics',
      topic: 'Optics — Refraction & Critical Angle',
      front: 'Define Critical Angle (c) and state the formula linking it to Refractive Index (n).',
      back: 'The Critical Angle is the angle of incidence in an optically denser medium for which the angle of refraction in the less dense medium is exactly 90°.\n\nFormula: n = 1 / sin(c) (where light travels from dense medium into air).\n\nWhen the angle of incidence exceeds critical angle, Total Internal Reflection occurs.',
      keyFact: 'Total Internal Reflection requires: (1) Light must travel from denser to rarer medium, (2) Angle of incidence > critical angle.',
      examRelevance: 'WAEC Physics Paper 2 & JAMB UTME Optics',
    },
    {
      id: 'phy-2',
      subject: 'Physics',
      topic: 'Modern Physics — Photoelectric Effect',
      front: 'State Einstein\'s Photoelectric Equation and define Work Function (W₀).',
      back: 'E = h·f = W₀ + ½m·v²_max = h·f₀ + K.E._max\n\nThe Work Function (W₀ = h·f₀) is the minimum energy required to liberate an electron from the metal surface without imparting kinetic energy.\n\n• If hf < W₀: No emission occurs regardless of intensity.\n• Increasing light intensity increases emission rate, but NOT maximum kinetic energy.',
      keyFact: 'Maximum kinetic energy of photoelectrons depends strictly on FREQUENCY of incident photon.',
      examRelevance: 'Tested annually in JAMB UTME Modern Physics',
    },
    {
      id: 'phy-3',
      subject: 'Physics',
      topic: 'Mechanics — Newton\'s Laws & Momentum',
      front: 'State Newton\'s Second Law of Motion in terms of momentum and state the Principle of Conservation of Linear Momentum.',
      back: 'Newton\'s 2nd Law: The rate of change of linear momentum is directly proportional to the applied external force and takes place in the direction of the force: F = dp/dt = m(v - u)/t = ma.\n\nConservation of Momentum: In a closed system of colliding bodies, total momentum before collision equals total momentum after collision, provided no external resultant force acts:\nm₁u₁ + m₂u₂ = m₁v₁ + m₂v₂',
      keyFact: 'In an elastic collision, BOTH momentum and kinetic energy are conserved. In inelastic, only momentum is conserved.',
      examRelevance: 'WAEC Physics Paper 2 Section A Mechanics',
    },
    {
      id: 'phy-4',
      subject: 'Physics',
      topic: 'Current Electricity — Ohm\'s Law & Internal Resistance',
      front: 'State Ohm\'s Law and write the relationship between EMF (E), terminal p.d. (V), internal resistance (r), and load (R).',
      back: 'Ohm\'s Law: Current flowing through a metallic conductor is directly proportional to the potential difference across its ends, provided temperature and other physical conditions remain constant: V = I·R.\n\nInternal Resistance equation:\nE = I(R + r) = V + I·r\nTerminal p.d.: V = E - I·r',
      keyFact: 'Lost volts = I·r (voltage dropped internally across the cell electrolyte).',
      examRelevance: 'Annual WAEC & JAMB Circuit Problems',
    },
    {
      id: 'phy-5',
      subject: 'Physics',
      topic: 'Electromagnetism — Faraday\'s & Lenz\'s Laws',
      front: 'State Faraday\'s Law of Electromagnetic Induction and Lenz\'s Law.',
      back: 'Faraday\'s Law: The magnitude of the induced electromotive force (EMF) is directly proportional to the rate of change of magnetic flux linkage: ε = -N(ΔΦ/Δt).\n\nLenz\'s Law: The direction of the induced current is always such that it opposes the change or motion producing it (indicated by the negative sign in Faraday\'s equation).',
      keyFact: 'Lenz\'s Law is a direct consequence of the Law of Conservation of Energy.',
      examRelevance: 'WAEC Physics Paper 2 Section B Electromagnetism',
    },
    {
      id: 'phy-6',
      subject: 'Physics',
      topic: 'Waves & Oscillations — Simple Harmonic Motion',
      front: 'Define Simple Harmonic Motion (SHM) and write the period formulas for a simple pendulum and a mass on a spring.',
      back: 'SHM is periodic motion where acceleration is directly proportional to displacement from the equilibrium position and directed towards that fixed point: a = -ω²x.\n\nFormulas:\n• Simple pendulum: T = 2π√(L/g)\n• Mass on helical spring: T = 2π√(m/k)',
      keyFact: 'Period of a simple pendulum is independent of mass of bob and angular amplitude (for small angles < 10°).',
      examRelevance: 'JAMB UTME SHM Calculations',
    },
    {
      id: 'phy-7',
      subject: 'Physics',
      topic: 'Acoustics — Resonance & Organ Pipes',
      front: 'State the fundamental frequencies and harmonics for an Open Pipe versus a Closed Pipe of length L.',
      back: 'Open Pipe (open at both ends):\n• Fundamental frequency: f₀ = v / (2L)\n• Harmonics: Produces ALL harmonics (f₀, 2f₀, 3f₀, 4f₀...)\n\nClosed Pipe (closed at one end):\n• Fundamental frequency: f₀ = v / (4L)\n• Harmonics: Produces ODD harmonics only (f₀, 3f₀, 5f₀...)',
      keyFact: 'An open pipe produces richer musical notes because it supports both odd and even harmonics.',
      examRelevance: 'WAEC Physics Acoustics Section',
    },
    {
      id: 'phy-8',
      subject: 'Physics',
      topic: 'Thermal Physics — Heat Capacity & Latent Heat',
      front: 'Define Specific Heat Capacity (c) versus Specific Latent Heat (L) and state their formulas.',
      back: '• Specific Heat Capacity (c): Heat energy required to raise the temperature of unit mass (1 kg) of a substance by 1 Kelvin (or 1°C): Q = m·c·Δθ. Units: J·kg⁻¹·K⁻¹.\n\n• Specific Latent Heat (L): Heat energy required to change the state of unit mass of a substance at constant temperature: Q = m·L. Units: J·kg⁻¹.\n  - Latent Heat of Fusion (solid ↔ liquid)\n  - Latent Heat of Vaporization (liquid ↔ gas)',
      keyFact: 'During a phase change, temperature remains strictly constant while latent heat is absorbed or released.',
      examRelevance: 'Annual WAEC Paper 2 Thermal Calculations',
    },
    {
      id: 'phy-9',
      subject: 'Physics',
      topic: 'Nuclear Physics — Radioactivity & Half-Life',
      front: 'Define Half-Life (T_½) and state the radioactive decay law linking it to decay constant (λ).',
      back: 'Half-life is the time taken for half the radioactive nuclei in a sample to disintegrate (or activity to halve).\n\nDecay Law:\n• N = N₀·(½)^(t / T_½) = N₀·e^(-λt)\n• Decay constant relationship: T_½ = ln(2) / λ ≈ 0.693 / λ\n• Activity: A = λN = -dN/dt',
      keyFact: 'After n half-lives, fraction remaining = (½)ⁿ. After 3 half-lives, ⅛ remains (⅞ has decayed).',
      examRelevance: 'JAMB UTME Atomic and Nuclear Physics',
    },
    {
      id: 'phy-10',
      subject: 'Physics',
      topic: 'Gravitational Fields — Kepler\'s Laws & Escape Velocity',
      front: 'State Kepler\'s 3rd Law of Planetary Motion and write the formula for Escape Velocity from Earth.',
      back: 'Kepler\'s 3rd Law: The square of the orbital period (T) of a planet is directly proportional to the cube of the semi-major axis (r) of its orbit: T² ∝ r³, or T²/r³ = constant.\n\nEscape Velocity (v_e):\nThe minimum speed required for a projectile to overcome a planet\'s gravitational pull without further propulsion:\nv_e = √(2gR) = √(2GM / R)\n(For Earth, v_e ≈ 11.2 km/s)',
      keyFact: 'Escape velocity is independent of the mass of the escaping body.',
      examRelevance: 'JAMB UTME Gravitational Fields Section',
    },
  ],

  'Chemistry': [
    {
      id: 'chem-1',
      subject: 'Chemistry',
      topic: 'Periodic Table & Periodicity Trends',
      front: 'Explain the periodic trends of First Ionisation Energy and Electronegativity across periods and down groups.',
      back: 'Across a Period (left to right):\n• Ionisation Energy & Electronegativity INCREASE due to increasing effective nuclear charge and decreasing atomic radius.\n• Exceptions: Be > B (full 2s² vs 2p¹) and N > O (half-filled stable 2p³ vs 2p⁴).\n\nDown a Group (top to bottom):\n• Ionisation Energy & Electronegativity DECREASE due to addition of electron shells and increased screening/shielding effect.',
      keyFact: 'Fluorine is the most electronegative element (4.0 on Pauling scale).',
      examRelevance: 'WAEC Chemistry Paper 2 Section A',
    },
    {
      id: 'chem-2',
      subject: 'Chemistry',
      topic: 'Organic Chemistry — Distinguishing Hydrocarbons',
      front: 'How do you chemically distinguish between Ethene (alkene) and Ethyne (terminal alkyne) in the laboratory?',
      back: 'Pass each gas through Ammoniacal Silver Trioxonitrate(V) [Tollens\' Reagent] or Ammoniacal Copper(I) Chloride:\n• Ethyne: Contains acidic terminal ≡C-H hydrogen. Reacts to form a precipitate (white precipitate of silver dicarbide Ag₂C₂, or reddish-brown copper dicarbide Cu₂C₂).\n• Ethene: No reaction (no terminal acidic hydrogen).',
      keyFact: 'Only alk-1-ynes with terminal ≡C-H bonds react to form insoluble metallic acetylides.',
      examRelevance: 'WAEC Practical Chemistry & UTME Organic Mechanisms',
    },
    {
      id: 'chem-3',
      subject: 'Chemistry',
      topic: 'Electrochemistry — Faraday\'s Laws',
      front: 'State Faraday\'s 1st and 2nd Laws of Electrolysis and write the combined mathematical expression.',
      back: '1st Law: The mass (m) of a substance liberated at an electrode during electrolysis is directly proportional to quantity of electricity (Q = I·t) passed: m ∝ Q.\n2nd Law: When the same quantity of electricity is passed through different electrolytes, masses liberated are proportional to their chemical equivalent weights (M / n).\n\nCombined formula:\nm = (M · I · t) / (n · F)\nwhere F = 96,500 C·mol⁻¹ (Faraday\'s constant), n = valence charge.',
      keyFact: 'To deposit 1 mole of Al (Al³⁺ + 3e⁻ → Al) requires 3 Faradays (3 × 96,500 C).',
      examRelevance: 'WAEC Chemistry Paper 2 Compulsory Calculation',
    },
    {
      id: 'chem-4',
      subject: 'Chemistry',
      topic: 'Chemical Equilibrium — Le Chatelier\'s Principle',
      front: 'State Le Chatelier\'s Principle and predict the effect of increasing pressure and temperature on the Haber process: N₂(g) + 3H₂(g) ⇌ 2NH₃(g), ΔH = -92 kJ/mol.',
      back: 'Le Chatelier\'s Principle: If an external stress (change in temperature, pressure, or concentration) is applied to a system in dynamic equilibrium, the system shifts in the direction that counteracts the stress.\n\nFor N₂(g) + 3H₂(g) ⇌ 2NH₃(g) [Exothermic, 4 moles gas → 2 moles gas]:\n• Increasing Pressure: Shifts to the side with fewer gas moles (RIGHT / Forward reaction), increasing NH₃ yield.\n• Increasing Temperature: Shifts in the endothermic direction (LEFT / Backward reaction), reducing NH₃ yield.',
      keyFact: 'Catalyst speeds up both forward and backward rates equally; it does NOT alter equilibrium position or yield.',
      examRelevance: 'High-frequency JAMB Equilibrium module',
    },
    {
      id: 'chem-5',
      subject: 'Chemistry',
      topic: 'Acids, Bases & Salts — Volumetric Titration',
      front: 'State the standard volumetric titration formula and define a Primary Standard substance.',
      back: 'Titration formula:\n(C_A · V_A) / (C_B · V_B) = n_A / n_B\nwhere C_A, C_B = molar concentrations; V_A, V_B = volumes; n_A, n_B = stoichiometric coefficients from balanced equation.\n\nA Primary Standard is a substance obtainable in pure, stable form with high molar mass, non-hygroscopic, and whose solution concentration remains constant (e.g. anhydrous Na₂CO₃, oxalic acid H₂C₂O₄·2H₂O).',
      keyFact: 'NaOH and H₂SO₄ are NOT primary standards because NaOH is deliquescent and absorbs CO₂, while conc H₂SO₄ is hygroscopic.',
      examRelevance: 'WAEC Chemistry Practical Paper 3 Section 1',
    },
    {
      id: 'chem-6',
      subject: 'Chemistry',
      topic: 'Redox Reactions — Oxidation Numbers & Rules',
      front: 'What are the oxidation states of Manganese in KMnO₄, MnO₂, and MnSO₄, and state the rules for balancing redox in acid.',
      back: 'Oxidation numbers:\n• KMnO₄: +1 + Mn + 4(-2) = 0 → Mn = +7\n• MnO₂: Mn + 2(-2) = 0 → Mn = +4\n• MnSO₄: Mn + (-2) = 0 → Mn = +2\n\nBalancing in acid:\n1. Balance elements other than H and O\n2. Balance O by adding H₂O molecules\n3. Balance H by adding H⁺ ions\n4. Balance charge by adding electrons (e⁻)',
      keyFact: 'In acid medium, purple MnO₄⁻ is reduced to nearly colorless Mn²⁺ (5 electrons gained).',
      examRelevance: 'JAMB UTME Redox balancing questions',
    },
    {
      id: 'chem-7',
      subject: 'Chemistry',
      topic: 'Physical Chemistry — Gas Laws & Graham\'s Law',
      front: 'State Graham\'s Law of Diffusion and write the Ideal Gas Equation with correct SI units.',
      back: 'Graham\'s Law: Under identical temperature and pressure, the rate of diffusion (R) of a gas is inversely proportional to the square root of its molar mass (M) or vapor density (d):\nR₁ / R₂ = √(M₂ / M₁) = √(d₂ / d₁) = t₂ / t₁\n\nIdeal Gas Equation:\nP·V = n·R·T = (m / M)·R·T\nwhere P = pressure (Pa or atm), V = volume (m³ or dm³), n = moles, R = 8.314 J·K⁻¹·mol⁻¹ (or 0.0821 atm·dm³·mol⁻¹·K⁻¹), T = absolute temp (K).',
      keyFact: 'Lighter gases diffuse faster. NH₃ (17 g/mol) diffuses faster than HCl (36.5 g/mol).',
      examRelevance: 'WAEC Paper 2 Section A Calculations',
    },
    {
      id: 'chem-8',
      subject: 'Chemistry',
      topic: 'Organic Chemistry — Isomerism Types',
      front: 'Distinguish between Structural Isomerism (Chain, Positional, Functional) and Geometric (Cis-Trans) Isomerism.',
      back: 'Structural Isomerism: Same molecular formula, different structural connectivity.\n• Chain: butane vs 2-methylpropane\n• Positional: propan-1-ol vs propan-2-ol\n• Functional: ethanol (alcohol) vs methoxymethane (ether)\n\nGeometric (Stereo) Isomerism: Same connectivity, different spatial arrangement around a restricted double bond (C=C):\n• Cis-isomer: Similar groups on SAME side\n• Trans-isomer: Similar groups on OPPOSITE sides',
      keyFact: 'Geometric isomerism requires: (1) Restricted rotation (C=C double bond or ring), (2) Each carbon must have two different groups.',
      examRelevance: 'JAMB UTME Organic Chemistry Module',
    },
    {
      id: 'chem-9',
      subject: 'Chemistry',
      topic: 'Thermochemistry — Hess\'s Law of Constant Heat',
      front: 'State Hess\'s Law of Constant Heat Summation and write the enthalpy formula from heats of formation.',
      back: 'Hess\'s Law: The total enthalpy change for a chemical reaction is independent of the pathway taken, provided the initial reactants and final products are in the same state.\n\nEnthalpy of reaction from heats of formation:\nΔH°_reaction = Σ ΔH°_f(products) - Σ ΔH°_f(reactants)\n\nFrom bond energies:\nΔH° = Σ (Bonds broken in reactants) - Σ (Bonds formed in products)',
      keyFact: 'By definition, the standard enthalpy of formation (ΔH°_f) of any element in its standard state is ZERO (e.g. O₂(g), C(graphite)).',
      examRelevance: 'WAEC Chemistry Paper 2 Energetics Question',
    },
    {
      id: 'chem-10',
      subject: 'Chemistry',
      topic: 'Chemical Equilibrium — Solubility Product (Ksp)',
      front: 'Define Solubility Product (Ksp) and state the precipitation condition using Ionic Product.',
      back: 'Solubility Product (K_sp) is the equilibrium constant for the dissolution of a sparingly soluble ionic compound in a saturated solution at a specified temperature.\nFor salt A_x B_y ⇌ xAʸ⁺ + yBˣ⁻: K_sp = [Aʸ⁺]ˣ · [Bˣ⁻]ʸ\n\nPrecipitation rules:\n• Ionic Product < K_sp: Unsaturated solution (no precipitation)\n• Ionic Product = K_sp: Saturated solution at equilibrium\n• Ionic Product > K_sp: Supersaturated solution (PRECIPITATE FORMS)',
      keyFact: 'Common Ion Effect: Adding an ion already present in solution decreases solubility and promotes precipitation.',
      examRelevance: 'JAMB UTME Solution Chemistry Section',
    },
  ],

  'Government & Civic': [
    {
      id: 'gov-1',
      subject: 'Government & Civic',
      topic: 'Constitutional Development — 1922 Clifford Constitution',
      front: 'What was the historical significance of the 1922 Clifford Constitution in Nigeria?',
      back: 'The Clifford Constitution introduced the ELECTIVE PRINCIPLE for the first time in Nigerian history, allowing democratic elections for 4 legislative seats (3 for Lagos, 1 for Calabar).\n\nThis paved the way for Nigeria\'s first political party, the Nigerian National Democratic Party (NNDP), founded by Herbert Macaulay in 1923.',
      keyFact: 'The Legislative Council had jurisdiction only over Southern Nigeria; the North was ruled by proclamation.',
      examRelevance: 'JAMB Government (Tested almost every exam year)',
    },
    {
      id: 'gov-2',
      subject: 'Government & Civic',
      topic: 'Constitutional Development — 1946 Richards Constitution',
      front: 'What was the major constitutional innovation and defect of the 1946 Richards Constitution?',
      back: 'Innovation:\n• Introduced REGIONALISM by dividing Nigeria into 3 regions (Northern, Western, and Eastern).\n• Brought Northern and Southern Nigeria under a single central legislative council for the first time.\n\nMajor Defect:\n• Drafted without consulting Nigerians ("constitution without the people"), triggering national protests and leading to the 1950 Ibadan Constitutional Conference.',
      keyFact: 'Regional Houses of Assembly had advisory/deliberative powers only; no full legislative autonomy.',
      examRelevance: 'WAEC Government Section B Nigerian History',
    },
    {
      id: 'gov-3',
      subject: 'Government & Civic',
      topic: 'Constitutional Development — 1954 Lyttelton Constitution',
      front: 'Why is the 1954 Lyttelton Constitution considered the cornerstone of Nigerian Federalism?',
      back: 'The Lyttelton Constitution formally established GENUINE FEDERALISM in Nigeria:\n1. Created distinct legislative lists: Exclusive (Federal), Concurrent (Federal + Regional), and Residual (Regions only).\n2. Regionalized the civil service, judiciary, and marketing boards.\n3. Established the office of Regional Premier.\n4. Made Lagos the Federal Capital Territory detached from the Western Region.',
      keyFact: 'Lyttelton constitution made residual powers belong exclusively to the REGIONS.',
      examRelevance: 'JAMB Government Federalism Section',
    },
    {
      id: 'gov-4',
      subject: 'Government & Civic',
      topic: 'Constitutional Development — 1963 Republican Constitution',
      front: 'What constitutional changes occurred when Nigeria became a Federal Republic in 1963?',
      back: '1. Completely severed constitutional ties with the British Crown: Queen Elizabeth II ceased to be Head of State.\n2. Dr. Nnamdi Azikiwe became the first ceremonial President (Head of State), while Sir Abubakar Tafawa Balewa remained Prime Minister (Head of Government).\n3. Supreme Court of Nigeria became the highest court of appeal, terminating appeals to the Privy Council in London.\n4. Mid-Western Region was created (the only region created by constitutional process).',
      keyFact: 'The 1963 constitution retained the British parliamentary cabinet system of government.',
      examRelevance: 'High-yield WAEC & UTME Nigerian Politics module',
    },
    {
      id: 'gov-5',
      subject: 'Government & Civic',
      topic: 'Political Theory — Rule of Law & Dicey\'s Principles',
      front: 'State A.V. Dicey\'s 3 fundamental postulates of the Rule of Law.',
      back: '1. Absolute Supremacy of Regular Law: No person can be punished or deprived of property except by distinct breach of regular law established in ordinary legal manner (absence of arbitrary power).\n2. Equality Before the Law: Equal subjection of all classes and individuals to ordinary law administered by ordinary courts.\n3. Constitution as Consequence of Individual Rights: Fundamental human rights are inherent and guaranteed by judicial decisions rather than royal decree.',
      keyFact: 'Exceptions to equality: Diplomatic immunity, presidential immunity during tenure, and judicial immunity.',
      examRelevance: 'WAEC Civic Education & Government Section A',
    },
    {
      id: 'gov-6',
      subject: 'Government & Civic',
      topic: 'Systems of Government — Federal vs Unitary',
      front: 'Contrast a Federal System of Government with a Unitary System.',
      back: '• Federal System: Constitutional division of powers between a central government and federating units (states/regions), each constitutionally sovereign in its assigned sphere (e.g. Nigeria, USA). Requires a rigid, written constitution and supreme judiciary.\n\n• Unitary System: All constitutional powers are concentrated in one central government; regional/local bodies exist merely as administrative delegates with powers revocable by parliament (e.g. United Kingdom, Ghana, France).',
      keyFact: 'Federalism is optimal for heterogeneous, multi-ethnic nations with diverse cultures.',
      examRelevance: 'JAMB Political Concepts & Theory',
    },
    {
      id: 'gov-7',
      subject: 'Government & Civic',
      topic: 'Public Administration — Civil Service Characteristics',
      front: 'Name and explain the 4 classic characteristics of the Civil Service.',
      back: '1. Permanence: Civil servants enjoy security of tenure; they do not lose office when government or political parties change.\n2. Political Neutrality: Civil servants must remain non-partisan and avoid public political affiliations or campaigns.\n3. Anonymity: Civil servants work behind the scenes; the political Minister takes praise or blame for ministry actions.\n4. Meritocracy & Impartiality: Recruitment and promotion are based on qualifications, competitive exams, and non-discriminatory standards.',
      keyFact: 'Minister = political temporary head. Permanent Secretary = administrative accounting head.',
      examRelevance: 'WAEC Government Paper 2 Public Administration',
    },
    {
      id: 'gov-8',
      subject: 'Government & Civic',
      topic: 'Law & Governance — Delegated Legislation',
      front: 'What is Delegated Legislation and how is it controlled by the Judiciary and Legislature?',
      back: 'Delegated Legislation is law made by bodies or authorities (Ministers, Local Councils, Statutory Corporations) under powers granted by an Act of Parliament.\n\nControl Mechanisms:\n• Judicial Control: The Doctrine of Ultra Vires—courts can declare delegated legislation null and void if it exceeds the parent Act\'s statutory authority or violates constitutional rights.\n• Parliamentary Control: Scrutiny committees, affirmative/negative resolution procedures.\n• Ombudsman: Investigation by Public Complaints Commission.',
      keyFact: '"Ultra Vires" literally means "beyond the powers".',
      examRelevance: 'JAMB Government Legislation Section',
    },
    {
      id: 'gov-9',
      subject: 'Government & Civic',
      topic: 'International Relations — ECOWAS & Treaty of Lagos',
      front: 'When was the Economic Community of West African States (ECOWAS) established and what are its key organs?',
      back: 'Established: May 28, 1975 via the Treaty of Lagos, spearheaded by General Yakubu Gowon of Nigeria and President Gnassingbé Eyadéma of Togo.\n\nKey Organs:\n1. Authority of Heads of State and Government (supreme decision-making body)\n2. Council of Ministers\n3. ECOWAS Commission (Headquarters in Abuja, Nigeria)\n4. Community Court of Justice\n5. ECOWAS Parliament\n6. ECOMOG (peacekeeping cease-fire monitoring group)',
      keyFact: 'ECOWAS Headquarters is located in Asokoro, Abuja, Nigeria.',
      examRelevance: 'WAEC & JAMB International Organizations module',
    },
    {
      id: 'gov-10',
      subject: 'Government & Civic',
      topic: 'Electoral Systems — Plurality vs Proportional Representation',
      front: 'Differentiate between the First-Past-The-Post (Simple Majority) and Proportional Representation electoral systems.',
      back: '• First-Past-The-Post (Single-Member Plurality): The candidate with the highest number of votes in a constituency wins, even without an absolute majority (50% + 1). Winner-takes-all (used in Nigeria and UK).\n\n• Proportional Representation (PR): Seats in parliament are awarded to political parties in direct proportion to the total percentage of popular votes they win nationally (e.g. party with 30% of votes receives 30% of parliamentary seats).',
      keyFact: 'PR ensures minority representation and prevents "wasted votes", but often leads to coalition governments.',
      examRelevance: 'JAMB UTME Electoral Systems and Suffrage',
    },
  ],

  'Economics': [
    {
      id: 'ecn-1',
      subject: 'Economics',
      topic: 'Price Theory — Price Elasticity of Demand (PED)',
      front: 'Define Price Elasticity of Demand, state the percentage formula, and explain the 5 degrees of elasticity.',
      back: 'PED measures the responsiveness of quantity demanded to a change in price.\nFormula: PED = (% change in Quantity Demanded) / (% change in Price)\n\n5 Degrees:\n• |PED| > 1: Elastic (luxuries, many substitutes)\n• |PED| < 1: Inelastic (necessities, few substitutes)\n• |PED| = 1: Unitary elastic\n• |PED| = 0: Perfectly inelastic (vertical demand curve)\n• |PED| = ∞: Perfectly elastic (horizontal demand curve)',
      keyFact: 'For inelastic goods, raising price INCREASES total revenue for the firm.',
      examRelevance: 'WAEC & JAMB Economics Core Calculation',
    },
    {
      id: 'ecn-2',
      subject: 'Economics',
      topic: 'National Income Accounting — Aggregates',
      front: 'Distinguish between Gross Domestic Product (GDP), Gross National Product (GNP), and Net National Product (NNP).',
      back: '• GDP: Total market value of all final goods and services produced WITHIN the geographical borders of a country in a year, regardless of who produces them.\n\n• GNP: GDP + Net Factor Income from Abroad (earnings of citizens abroad MINUS earnings of foreigners domestically): GNP = GDP + NFIA.\n\n• NNP: GNP - Depreciation (Capital Consumption Allowance): NNP = GNP - Depreciation.',
      keyFact: 'National Income at factor cost = NNP - Indirect Taxes + Subsidies.',
      examRelevance: 'Annual WAEC Economics Section B Question',
    },
    {
      id: 'ecn-3',
      subject: 'Economics',
      topic: 'Theory of Production — Law of Diminishing Returns',
      front: 'State the Law of Diminishing Marginal Returns and explain the relationship between Marginal Product (MP) and Average Product (AP).',
      back: 'The Law states that as successive units of a variable factor (e.g. labor) are added to fixed factors (e.g. land, capital), a point is reached where the addition to total output (Marginal Product) begins to decrease.\n\nRelationship between MP and AP:\n• When MP > AP: Average Product is RISING\n• When MP = AP: Average Product is at its MAXIMUM\n• When MP < AP: Average Product is FALLING\n• When MP = 0: Total Product (TP) is at its MAXIMUM',
      keyFact: 'Rational producers always operate in STAGE II (between maximum AP and MP = 0).',
      examRelevance: 'WAEC Economics Theory of Production Curves',
    },
    {
      id: 'ecn-4',
      subject: 'Economics',
      topic: 'Market Structures — Perfect Competition vs Monopoly',
      front: 'Contrast the profit-maximization conditions and revenue curves for a firm in Perfect Competition versus Monopoly.',
      back: 'Profit Maximization Rule: For ALL firms, profit is maximized where MR = MC (and MC cuts MR from below).\n\n• Perfect Competition:\n  - Firm is a price taker; horizontal demand curve\n  - P = AR = MR\n  - Long-run equilibrium yields normal profit only (P = AR = MR = MC = AC)\n\n• Monopoly:\n  - Firm is a price maker; downward-sloping demand curve\n  - P = AR > MR\n  - Can earn supernormal (abnormal) profits in both short and long run due to barriers to entry',
      keyFact: 'In monopoly, Marginal Revenue (MR) curve lies BELOW the Average Revenue (Demand) curve.',
      examRelevance: 'JAMB UTME Market Structures module',
    },
    {
      id: 'ecn-5',
      subject: 'Economics',
      topic: 'Inflation — Causes & Cost-Push vs Demand-Pull',
      front: 'Differentiate between Demand-Pull Inflation and Cost-Push Inflation with their root causes.',
      back: '• Demand-Pull Inflation: Occurs when aggregate demand exceeds aggregate supply at full employment ("too much money chasing too few goods"). Caused by excessive money supply expansion, government deficit financing, or consumer credit booms.\n\n• Cost-Push Inflation: Occurs when aggregate supply decreases due to rising production costs, independent of demand. Caused by rising wage rates, currency devaluation making imported raw materials expensive, fuel/energy price hikes, or crop failures.',
      keyFact: 'Cost-push inflation causes both higher inflation and lower output (stagflation).',
      examRelevance: 'High-frequency WAEC & JAMB Macroeconomics module',
    },
    {
      id: 'ecn-6',
      subject: 'Economics',
      topic: 'Central Banking — Monetary Policy Instruments',
      front: 'How does the Central Bank use (1) Open Market Operations (OMO), (2) Cash Reserve Ratio (CRR), and (3) Monetary Policy Rate (MPR) to control inflation?',
      back: 'To curb inflation (Contractionary Monetary Policy):\n1. Open Market Operations (OMO): Central Bank SELLS treasury bills and government securities to commercial banks and the public, mopping up excess liquidity.\n2. Cash Reserve Ratio (CRR): Central Bank RAISES the minimum percentage of deposits commercial banks must keep in reserve, reducing lending power.\n3. Monetary Policy Rate (MPR): Central Bank RAISES its benchmark discount lending rate, making commercial bank borrowing expensive and driving up interest rates.',
      keyFact: 'To expand the economy during recession, the Central Bank reverses all three (buys bonds, lowers CRR, cuts MPR).',
      examRelevance: 'JAMB UTME Financial Institutions Section',
    },
    {
      id: 'ecn-7',
      subject: 'Economics',
      topic: 'International Trade — Comparative Advantage',
      front: 'State David Ricardo\'s Principle of Comparative Advantage and explain how it differs from Adam Smith\'s Absolute Advantage.',
      back: '• Adam Smith\'s Absolute Advantage: A country should specialize in producing a commodity that it can produce using fewer real resources than any other nation.\n\n• David Ricardo\'s Comparative Advantage: Even if one nation holds an absolute advantage in producing all goods, mutually beneficial trade is still possible if each specializes in the good where it has the LOWER OPPORTUNITY COST.\n\nOpportunity Cost Rule: Specialize where the sacrifice of alternative goods is smallest.',
      keyFact: 'Trade gains are determined by differences in relative opportunity cost ratios, NOT absolute costs.',
      examRelevance: 'WAEC Economics Paper 2 International Trade',
    },
    {
      id: 'ecn-8',
      subject: 'Economics',
      topic: 'Balance of Payments (BOP) — Structure & Equilibrium',
      front: 'What are the 3 main accounts that constitute the Balance of Payments (BOP) and how is a deficit corrected?',
      back: 'BOP Accounts:\n1. Current Account: Visible trade (merchandise exports/imports), invisible trade (services like shipping, insurance), and net unilateral transfers/remittances.\n2. Capital Account: Migrants\' transfers, debt forgiveness, capital acquisitions.\n3. Financial Account: Direct investment (FDI), portfolio investment (stocks/bonds), and foreign exchange reserves.\n\nCorrecting Deficits:\n• Currency devaluation/depreciation (makes exports cheaper, imports dearer)\n• Import tariffs, quotas, and exchange control regulations\n• Export promotion subsidies and fiscal austerity',
      keyFact: 'Current Account Balance = (Visible Exports - Visible Imports) + (Invisible Exports - Invisible Imports) + Net Transfers.',
      examRelevance: 'JAMB UTME External Trade and BOP',
    },
    {
      id: 'ecn-9',
      subject: 'Economics',
      topic: 'Fiscal Policy — Taxation & Budget Deficits',
      front: 'Distinguish between Progressive, Regressive, and Proportional taxes, and define Fiscal Policy.',
      back: 'Fiscal Policy is the manipulation of government revenue (taxation) and expenditure to achieve macroeconomic objectives (price stability, full employment, growth).\n\nTax Types:\n• Progressive Tax: Tax rate increases as income increases (e.g. PAYE income tax); places higher burden on the rich.\n• Regressive Tax: Tax rate effectively decreases as income rises (e.g. Value Added Tax (VAT), sales tax on food); burdens low-income earners disproportionately.\n• Proportional (Flat) Tax: Constant percentage charged across all income levels.',
      keyFact: 'A budget deficit occurs when government expenditure exceeds total tax revenues.',
      examRelevance: 'WAEC Economics Section A Public Finance',
    },
    {
      id: 'ecn-10',
      subject: 'Economics',
      topic: 'Money & Banking — Credit Creation by Commercial Banks',
      front: 'What is the Credit Multiplier formula and how do commercial banks create credit from a primary cash deposit?',
      back: 'Credit Multiplier = 1 / Cash Reserve Ratio (CRR)\nTotal Credit Created = Primary Deposit × (1 / CRR)\n\nExample: If a customer deposits ₦100,000 and CRR is 20% (0.2):\n• Multiplier = 1 / 0.2 = 5\n• Total Deposit Expansion = ₦100,000 × 5 = ₦500,000\n• Net Credit Created = ₦500,000 - ₦100,000 = ₦400,000\n\nBanks keep the statutory 20% in reserve and lend out the remaining 80%, which gets re-deposited across the banking system.',
      keyFact: 'The higher the Cash Reserve Ratio set by the Central Bank, the LOWER the credit creation capacity.',
      examRelevance: 'JAMB & WAEC Money and Banking Calculations',
    },
  ],
};

export const FlashcardsView: React.FC = () => {
  const subjects = Object.keys(SYLLABUS_FLASHCARDS);
  const [activeSubject, setActiveSubject] = useState<string>(subjects[0]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [masteredIds, setMasteredIds] = useState<string[]>([]);
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([]);
  const [mode, setMode] = useState<'SYLLABUS' | 'LIVE_EXAM'>('SYLLABUS');
  const [dynamicPage, setDynamicPage] = useState<number>(1);
  const [shuffledSeed, setShuffledSeed] = useState<number>(0);

  // Query live database past questions if candidate chooses live mode
  const { data: liveQuestionsData, isLoading: liveQuestionsLoading, refetch: refetchLiveQuestions } = useQuestionsQuery({
    page: dynamicPage,
    limit: 15,
  });

  // Map live past questions into flashcard items
  const liveDeck: FlashcardItem[] = useMemo(() => {
    if (!liveQuestionsData?.questions || liveQuestionsData.questions.length === 0) {
      return [];
    }
    return liveQuestionsData.questions.map((q: QuestionItem) => ({
      id: `live-${q._id}`,
      subject: q.subjectId?.name || 'Curriculum Examination',
      topic: `${q.examId?.shortCode || 'National Exam'} • Series ${q.year}`,
      front: `[Question ${q.questionNumber || '—'}]\n${q.questionText}\n\nA. ${q.optionA}\nB. ${q.optionB}\nC. ${q.optionC}\nD. ${q.optionD}`,
      back: `CORRECT ANSWER: [ Option ${q.correctAnswer} ]\n\nEXAMINER'S SOLUTION & EXPLANATION:\n${q.explanation || 'Refer to the curriculum blueprint for verified mathematical working.'}`,
      keyFact: `Official Past Question (${q.examId?.shortCode || 'Examination'} ${q.year})`,
      examRelevance: `${q.examId?.shortCode || 'Accredited Board'} — Question ${q.questionNumber}`,
      isDynamicQuestion: true,
    }));
  }, [liveQuestionsData]);

  // Current active deck based on mode
  const baseDeck = mode === 'LIVE_EXAM' ? liveDeck : (SYLLABUS_FLASHCARDS[activeSubject] || []);

  // Optional shuffle permutation
  const deck = useMemo(() => {
    if (shuffledSeed === 0) return baseDeck;
    const arr = [...baseDeck];
    // Deterministic or pseudorandom shuffle with seed
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }, [baseDeck, shuffledSeed]);

  const currentCard = deck[currentIndex] || deck[0];

  const handleNext = () => {
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev + 1 < deck.length ? prev + 1 : 0));
  };

  const handlePrev = () => {
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : deck.length - 1));
  };

  const handleShuffle = () => {
    setIsFlipped(false);
    setCurrentIndex(0);
    setShuffledSeed(Date.now());
  };

  const handleLoadNextBatch = () => {
    setIsFlipped(false);
    setCurrentIndex(0);
    setDynamicPage((prev) => (prev >= 10 ? 1 : prev + 1));
    refetchLiveQuestions();
  };

  const toggleMastered = (id: string) => {
    setMasteredIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleBookmark = (id: string) => {
    setBookmarkedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const masteredCount = deck.filter((c) => masteredIds.includes(c.id)).length;
  const progressPercent = Math.round((masteredCount / Math.max(1, deck.length)) * 100);

  return (
    <div className="portal-layout premium-portal-page premium-learning-page flashcards-page" style={{ minHeight: '100vh', background: 'var(--paper)' }}>
      <div className="wrap" style={{ padding: '32px 24px 60px', maxWidth: '900px', margin: '0 auto' }}>
        <div style={{ marginBottom: '24px' }}>
          <span className="eyebrow" style={{ margin: 0, color: 'var(--rust)' }}>High-Yield Active Recall System</span>
          <h1 style={{ fontSize: '28px', color: 'var(--ink)', margin: '6px 0', fontFamily: "var(--font-sans)" }}>
            Interactive Flashcard Decks
          </h1>
          <p style={{ color: 'var(--ink-soft)', fontSize: '15px', margin: 0 }}>
            Master core syllabus definitions, grammar concord rules, science formulas, and live WAEC/JAMB past questions.
          </p>
        </div>

        {/* Mode Selector & Dynamic Controls */}
        <div
          className="flashcards-toolbar"
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '16px',
            padding: '12px 16px',
            background: 'var(--white)',
            borderRadius: '6px',
            border: '1px solid var(--paper-line)',
          }}
        >
          <div className="flashcards-toolbar-group" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', fontFamily: "var(--font-sans)", fontWeight: 700, color: 'var(--ink)' }}>
              MODE:
            </span>
            <button
              type="button"
              onClick={() => {
                setMode('SYLLABUS');
                setCurrentIndex(0);
                setIsFlipped(false);
              }}
              style={{
                padding: '6px 14px',
                borderRadius: '4px',
                fontSize: '12.5px',
                fontFamily: "var(--font-sans)",
                fontWeight: 600,
                border: mode === 'SYLLABUS' ? '1.5px solid var(--rust)' : '1px solid var(--paper-line)',
                background: mode === 'SYLLABUS' ? 'var(--rust)' : 'var(--paper)',
                color: mode === 'SYLLABUS' ? '#ffffff' : 'var(--ink)',
                cursor: 'pointer',
              }}
            >
              Core Syllabus Decks (10+ Each)
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('LIVE_EXAM');
                setCurrentIndex(0);
                setIsFlipped(false);
              }}
              style={{
                padding: '6px 14px',
                borderRadius: '4px',
                fontSize: '12.5px',
                fontFamily: "var(--font-sans)",
                fontWeight: 600,
                border: mode === 'LIVE_EXAM' ? '1.5px solid var(--forest)' : '1px solid var(--paper-line)',
                background: mode === 'LIVE_EXAM' ? 'var(--forest)' : 'var(--paper)',
                color: mode === 'LIVE_EXAM' ? '#ffffff' : 'var(--ink)',
                cursor: 'pointer',
              }}
            >
              Live Exam Questions Bank (Dynamic)
            </button>
          </div>

          <div className="flashcards-toolbar-actions" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button
              type="button"
              onClick={handleShuffle}
              className="btn-custom btn-custom-ghost"
              style={{ padding: '6px 12px', fontSize: '12px', fontFamily: "var(--font-sans)" }}
              title="Shuffle card order"
            >
              Shuffle Cards
            </button>
            {mode === 'LIVE_EXAM' && (
              <button
                type="button"
                onClick={handleLoadNextBatch}
                className="btn-custom btn-custom-primary"
                style={{ padding: '6px 14px', fontSize: '12px', fontFamily: "var(--font-sans)" }}
                title="Fetch next 15 past questions from database"
              >
                Next 15 Questions
              </button>
            )}
          </div>
        </div>

        {/* Subject Deck Selector (Visible in Syllabus Mode) */}
        {mode === 'SYLLABUS' && (
          <div
            className="flashcards-subjects"
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '8px',
              marginBottom: '24px',
              background: 'var(--white)',
              padding: '12px 16px',
              borderRadius: '6px',
              border: '1px solid var(--paper-line)',
            }}
          >
            {subjects.map((subj) => (
              <button
                key={subj}
                type="button"
                onClick={() => {
                  setActiveSubject(subj);
                  setCurrentIndex(0);
                  setIsFlipped(false);
                  setShuffledSeed(0);
                }}
                style={{
                  padding: '7px 14px',
                  borderRadius: '4px',
                  fontSize: '13px',
                  fontFamily: "var(--font-sans)",
                  fontWeight: 600,
                  border: activeSubject === subj ? '1.5px solid var(--rust)' : '1px solid var(--paper-line)',
                  background: activeSubject === subj ? 'var(--rust)' : 'var(--paper)',
                  color: activeSubject === subj ? '#ffffff' : 'var(--ink)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {subj} ({SYLLABUS_FLASHCARDS[subj]?.length || 0})
              </button>
            ))}
          </div>
        )}

        {/* Deck Progress Bar */}
        <div
          className="flashcards-progress"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '18px',
            fontFamily: "var(--font-sans)",
            fontSize: '12.5px',
            color: 'var(--ink-soft)',
          }}
        >
          <span>
            {mode === 'LIVE_EXAM'
              ? `Live Exam Question ${currentIndex + 1} of ${deck.length} (Batch ${dynamicPage})`
              : `Card ${currentIndex + 1} of ${deck.length} - ${activeSubject}`}
          </span>
          <div className="flashcards-progress-meter" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>Mastery: {progressPercent}%</span>
            <div
              style={{
                width: '120px',
                height: '6px',
                background: 'var(--paper-dim, #e6e3da)',
                borderRadius: '3px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${progressPercent}%`,
                  height: '100%',
                  background: mode === 'LIVE_EXAM' ? 'var(--forest)' : 'var(--rust)',
                  transition: 'width 0.2s ease',
                }}
              />
            </div>
          </div>
        </div>

        {/* Loading state for Live Mode */}
        {mode === 'LIVE_EXAM' && liveQuestionsLoading ? (
          <BrandLoader mode="contained" message="Streaming dynamic past questions from question bank..." />
        ) : !currentCard ? (
          <div style={{ padding: '60px 24px', background: 'var(--white)', border: '1px solid var(--ink)', textAlign: 'center' }}>
            <h3>No flashcards available in this selection</h3>
            <button
              onClick={() => {
                setMode('SYLLABUS');
                setCurrentIndex(0);
              }}
              className="btn-custom btn-custom-primary"
              style={{ marginTop: '16px' }}
            >
              Return to Core Syllabus Decks
            </button>
          </div>
        ) : (
          /* 3D Flip Card Container */
          <div
            className="flashcard-flip-shell"
            onClick={() => setIsFlipped(!isFlipped)}
            style={{
              perspective: '1000px',
              cursor: 'pointer',
              minHeight: '360px',
              marginBottom: '24px',
            }}
          >
            <div
              className="flashcard-flip-inner"
              style={{
                position: 'relative',
                width: '100%',
                minHeight: '360px',
                transition: 'transform 0.45s ease',
                transformStyle: 'preserve-3d',
                transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
              }}
            >
              {/* FRONT FACE */}
              <div
                className="flashcard-face flashcard-face-front"
                style={{
                  position: 'absolute',
                  width: '100%',
                  height: '100%',
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden',
                  background: 'var(--white)',
                  border: '2px solid var(--paper-line)',
                  borderRadius: '8px',
                  padding: '32px 28px',
                  boxShadow: 'var(--card-shadow)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxSizing: 'border-box',
                }}
              >
                <div>
                  <div className="flashcard-face-meta" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <span
                      style={{
                        fontFamily: "var(--font-sans)",
                        fontSize: '11px',
                        color: mode === 'LIVE_EXAM' ? 'var(--forest)' : 'var(--rust)',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                      }}
                    >
                      {mode === 'LIVE_EXAM' ? 'LIVE QUESTION' : 'SYLLABUS CONCEPT'} - {currentCard?.topic}
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--ink-soft)', fontFamily: "var(--font-sans)" }}>
                      Click card to reveal answer
                    </span>
                  </div>
                  <h3
                    style={{
                      fontSize: '18px',
                      lineHeight: 1.6,
                      color: 'var(--ink)',
                      fontWeight: 600,
                      marginTop: '16px',
                      whiteSpace: 'pre-line',
                      fontFamily: "var(--font-sans)",
                    }}
                  >
                    {currentCard?.front}
                  </h3>
                </div>
                <div
                  style={{
                    fontSize: '12px',
                    fontFamily: "var(--font-sans)",
                    color: 'var(--ink-soft)',
                    borderTop: '1px dashed var(--paper-line)',
                    paddingTop: '12px',
                    marginTop: '20px',
                  }}
                >
                  Targeted for: <strong>{currentCard?.examRelevance}</strong>
                </div>
              </div>

              {/* BACK FACE */}
              <div
                className="flashcard-face flashcard-face-back"
                style={{
                  position: 'absolute',
                  width: '100%',
                  height: '100%',
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden',
                  background: mode === 'LIVE_EXAM' ? 'var(--white)' : 'var(--white)',
                  border: mode === 'LIVE_EXAM' ? '2px solid var(--forest)' : '2px solid var(--rust)',
                  borderRadius: '8px',
                  padding: '32px 28px',
                  boxShadow: 'var(--card-shadow)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  transform: 'rotateY(180deg)',
                  boxSizing: 'border-box',
                }}
              >
                <div>
                  <div className="flashcard-face-meta" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <span
                      style={{
                        fontFamily: "var(--font-sans)",
                        fontSize: '11px',
                        color: mode === 'LIVE_EXAM' ? 'var(--forest)' : 'var(--rust)',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                      }}
                    >
                      OFFICIAL SOLUTION &amp; EXAMINER WORKING - {currentCard?.topic}
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--ink-soft)', fontFamily: "var(--font-sans)" }}>
                      Click to flip back
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: '15.5px',
                      lineHeight: 1.6,
                      color: 'var(--ink)',
                      whiteSpace: 'pre-line',
                      marginTop: '10px',
                    }}
                  >
                    {currentCard?.back}
                  </div>
                  {currentCard?.keyFact && (
                    <div
                      className="flashcard-key-fact"
                      style={{
                        marginTop: '16px',
                        background: mode === 'LIVE_EXAM' ? 'rgba(34, 90, 56, 0.08)' : 'rgba(168, 86, 47, 0.08)',
                        padding: '10px 14px',
                        borderRadius: '4px',
                        fontSize: '12.5px',
                        fontFamily: "var(--font-sans)",
                        color: 'var(--ink)',
                        borderLeft: mode === 'LIVE_EXAM' ? '3px solid var(--forest)' : '3px solid var(--rust)',
                      }}
                    >
                      <strong>Key Exam Rule:</strong> {currentCard.keyFact}
                    </div>
                  )}
                </div>
                <div
                  style={{
                    fontSize: '12px',
                    fontFamily: "var(--font-sans)",
                    color: 'var(--ink-soft)',
                    borderTop: '1px dashed var(--paper-line)',
                    paddingTop: '10px',
                    marginTop: '20px',
                  }}
                >
                  Accredited Curriculum Standard - Verified Examiner Working
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Deck Navigation Controls */}
        <div
          className="flashcards-controls"
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <div className="flashcards-controls-group" style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              className="btn-custom btn-custom-ghost"
              onClick={handlePrev}
              style={{ padding: '8px 16px', fontSize: '13px' }}
            >
              Previous Card
            </button>
            <button
              type="button"
              className="btn-custom btn-custom-primary"
              onClick={handleNext}
              style={{ padding: '8px 18px', fontSize: '13px' }}
            >
              Next Card
            </button>
          </div>

          <div className="flashcards-controls-group" style={{ display: 'flex', gap: '8px' }}>
            {currentCard && (
              <>
                <button
                  type="button"
                  onClick={() => toggleMastered(currentCard.id)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontFamily: "var(--font-sans)",
                    fontWeight: 600,
                    border: '1px solid var(--paper-line)',
                    background: masteredIds.includes(currentCard.id) ? '#225a38' : 'var(--white)',
                    color: masteredIds.includes(currentCard.id) ? '#ffffff' : 'var(--ink)',
                    cursor: 'pointer',
                  }}
                >
                  {masteredIds.includes(currentCard.id) ? 'Mastered' : 'Mark as Mastered'}
                </button>

                <button
                  type="button"
                  onClick={() => toggleBookmark(currentCard.id)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontFamily: "var(--font-sans)",
                    border: '1px solid var(--paper-line)',
                    background: bookmarkedIds.includes(currentCard.id) ? 'var(--rust)' : 'var(--white)',
                    color: bookmarkedIds.includes(currentCard.id) ? '#ffffff' : 'var(--ink)',
                    cursor: 'pointer',
                  }}
                >
                  {bookmarkedIds.includes(currentCard.id) ? 'Saved' : 'Save'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

