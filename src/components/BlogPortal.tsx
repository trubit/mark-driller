import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useNotificationStore } from '../store/useNotificationStore.js';
import { apiClient } from '../api/client.js';

export type BlogCategory =
  | 'ALL'
  | 'JAMB_GUIDES'
  | 'WAEC_INSIGHTS'
  | 'NECO_EXCELLENCE'
  | 'GCE_PREP'
  | 'NABTEB_STRATEGY'
  | 'POST_UTME'
  | 'STUDY_TECHNIQUES';

export type ExamBoard = 'JAMB' | 'WAEC' | 'NECO' | 'GCE' | 'NABTEB' | 'POST-UTME' | 'GENERAL';

export interface BlogPostItem {
  _id?: string;
  slug: string;
  title: string;
  category:
    | 'JAMB_GUIDES'
    | 'WAEC_INSIGHTS'
    | 'NECO_EXCELLENCE'
    | 'GCE_PREP'
    | 'NABTEB_STRATEGY'
    | 'POST_UTME'
    | 'STUDY_TECHNIQUES';
  examBoard?: ExamBoard;
  author?: string;
  authorRole?: string;
  publishedDate?: string;
  readTime?: string;
  summary: string;
  content: string[];
  tags: string[];
  imageUrl?: string;
  imageCaption?: string;
  keyTakeaways?: string[];
  isPublished?: boolean;
}

const CATEGORY_LABELS: Record<BlogCategory, string> = {
  ALL: 'All Guides',
  JAMB_GUIDES: 'JAMB UTME',
  WAEC_INSIGHTS: 'WAEC / WASSCE',
  NECO_EXCELLENCE: 'NECO SSCE',
  GCE_PREP: 'GCE Series',
  NABTEB_STRATEGY: 'NABTEB Technical',
  POST_UTME: 'Post-UTME',
  STUDY_TECHNIQUES: 'Study Skills',
};

interface BoardVisualConfig {
  name: string;
  logo: string;
  accent: string;
  bgGradient: string;
  badge: string;
  paperType: string;
}

const BOARD_CONFIGS: Record<ExamBoard, BoardVisualConfig> = {
  JAMB: {
    name: 'Joint Admissions & Matriculation Board',
    logo: '/assets/logos/jamb.png',
    accent: '#0d6832',
    bgGradient: 'linear-gradient(135deg, #064e3b 0%, #065f46 50%, #047857 100%)',
    badge: 'JAMB OFFICIAL CBT',
    paperType: '180Q / 120M CBT Interface',
  },
  WAEC: {
    name: 'West African Examinations Council',
    logo: '/assets/logos/waec.png',
    accent: '#1e3a8a',
    bgGradient: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 60%, #1d4ed8 100%)',
    badge: 'WAEC CHIEF EXAMINERS',
    paperType: 'Paper 2 Theory Rubric',
  },
  NECO: {
    name: 'National Examinations Council',
    logo: '/assets/logos/neco.png',
    accent: '#047857',
    bgGradient: 'linear-gradient(135deg, #022c22 0%, #064e3b 50%, #059669 100%)',
    badge: 'NECO NATIONAL STANDARD',
    paperType: '9-Point Stanine Matrix',
  },
  GCE: {
    name: 'General Certificate Examination',
    logo: '/assets/logos/waec.png',
    accent: '#b91c1c',
    bgGradient: 'linear-gradient(135deg, #450a0a 0%, #881337 50%, #991b1b 100%)',
    badge: 'GCE PRIVATE SERIES',
    paperType: 'Nov/Dec Two-Sitting Guide',
  },
  NABTEB: {
    name: 'National Business & Technical Examinations Board',
    logo: '/assets/logos/nabteb.png',
    accent: '#1d4ed8',
    bgGradient: 'linear-gradient(135deg, #172554 0%, #1e40af 50%, #2563eb 100%)',
    badge: 'NABTEB MODULAR TRADE',
    paperType: 'NBC / NTC Workshop Standard',
  },
  'POST-UTME': {
    name: 'Tertiary Screening Council',
    logo: '/assets/logos/jamb.png',
    accent: '#0f766e',
    bgGradient: 'linear-gradient(135deg, #134e4a 0%, #0f766e 50%, #115e59 100%)',
    badge: 'POST-UTME SCREENING',
    paperType: '100-Point Composite Model',
  },
  GENERAL: {
    name: 'West African Academic Science',
    logo: '/assets/logos/jamb.png',
    accent: '#b45309',
    bgGradient: 'linear-gradient(135deg, #451a03 0%, #78350f 50%, #92400e 100%)',
    badge: 'COGNITIVE SCIENCE',
    paperType: 'Spaced Retrieval System',
  },
};

const resolveBoard = (article: BlogPostItem): ExamBoard => {
  if (article.examBoard && BOARD_CONFIGS[article.examBoard]) {
    return article.examBoard;
  }
  if (article.category === 'JAMB_GUIDES') return 'JAMB';
  if (article.category === 'WAEC_INSIGHTS') return 'WAEC';
  if (article.category === 'NECO_EXCELLENCE') return 'NECO';
  if (article.category === 'GCE_PREP') return 'GCE';
  if (article.category === 'NABTEB_STRATEGY') return 'NABTEB';
  if (article.category === 'POST_UTME') return 'POST-UTME';
  return 'GENERAL';
};

const DEFAULT_ARTICLES: BlogPostItem[] = [
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
  },
  {
    slug: 'active-recall-spaced-repetition-study-guide',
    title: 'Active Recall and Spaced Repetition for West African Exam Syllabuses',
    category: 'STUDY_TECHNIQUES',
    examBoard: 'GENERAL',
    author: 'MarkDriller Study Skills Team',
    publishedDate: 'August 10, 2026',
    readTime: '7 min read',
    summary: 'A simple revision system for moving from passive reading to durable recall across broad exam syllabuses.',
    tags: ['Study Techniques', 'Memory', 'Revision', 'Cognitive Science'],
    imageUrl: '/assets/logos/jamb.png',
    imageCaption: 'Cognitive Psychometrics & Active Recall Retrieval Intervals for High-Stakes Standardized Testing.',
    keyTakeaways: [
      'Passive rereading creates illusions of competence; active retrieval practice produces 3x better recall during exam pressure.',
      'Space your revision cycles across 1-day, 3-day, 7-day, and 14-day intervals to lock multi-chapter syllabuses into permanent memory.',
      'Simulate actual examination constraints: timed tests without notes train retrieval speed and combat examination fatigue.',
    ],
    content: [
      'Passive rereading can feel productive while leaving students unable to retrieve answers under pressure.',
      '1. Retrieval Over Recognition: Convert syllabus objectives directly into self-quiz flashcards. When you force your brain to generate an answer from scratch, synaptic pathways solidify far faster than simply reading over highlighted paragraphs.',
      '2. The Leitner Interval Matrix: Revisit difficult formulas and terminology at 1-day, 3-day, and 7-day intervals. Mastered cards should only be tested once every 2 to 3 weeks, maximizing daily study efficiency.',
      '3. Timed Stress-Testing: The human brain retrieves knowledge differently under clock pressure. Always integrate timed question sets into weekly schedules to eliminate exam room anxiety.',
    ],
  },
];

const ExamBoardVisualCard: React.FC<{
  article: BlogPostItem;
  height?: number;
  className?: string;
  isFeatured?: boolean;
}> = ({ article, height = 150, className = '', isFeatured = false }) => {
  const board = resolveBoard(article);
  const cfg = BOARD_CONFIGS[board];
  const cardHeight = isFeatured ? 140 : height;

  return (
    <div
      className={`exam-board-visual-card ${className}`}
      style={{
        position: 'relative',
        width: '100%',
        height: `${cardHeight}px`,
        maxHeight: `${cardHeight}px`,
        minHeight: `${cardHeight}px`,
        background: cfg.bgGradient,
        borderRadius: isFeatured ? '0' : '8px 8px 0 0',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '10px 14px',
        color: '#ffffff',
        boxSizing: 'border-box',
        margin: 0,
      }}
    >
      {/* Top Bar: Official Badge + Exam Paper Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          zIndex: 1,
          gap: '8px',
          margin: 0,
          padding: 0,
        }}
      >
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            backdropFilter: 'blur(6px)',
            border: '1px solid rgba(255, 255, 255, 0.35)',
            borderRadius: '20px',
            padding: '2px 8px',
            fontSize: '10px',
            fontWeight: 800,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            color: '#ffffff',
            margin: '0 !important',
            marginTop: '0 !important',
            flexShrink: 0,
            whiteSpace: 'nowrap',
          }}
        >
          <span
            style={{
              width: '5px',
              height: '5px',
              borderRadius: '50%',
              backgroundColor: '#4ade80',
              display: 'inline-block',
              margin: '0 !important',
              marginTop: '0 !important',
            }}
          />
          {cfg.badge}
        </span>

        <span
          style={{
            fontSize: '10.5px',
            fontWeight: 700,
            color: 'rgba(255, 255, 255, 0.9)',
            letterSpacing: '0.02em',
            margin: '0 !important',
            marginTop: '0 !important',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            minWidth: 0,
            textAlign: 'right',
          }}
        >
          {cfg.paperType}
        </span>
      </div>

      {/* Center: Official Exam Board Logo & Board Identification */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          zIndex: 1,
          margin: 'auto 0',
          padding: 0,
          minWidth: 0,
        }}
      >
        <div
          style={{
            width: '38px',
            height: '38px',
            minWidth: '38px',
            maxWidth: '38px',
            borderRadius: '8px',
            backgroundColor: '#ffffff',
            boxShadow: '0 2px 6px rgba(0, 0, 0, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '3px',
            boxSizing: 'border-box',
            flexShrink: 0,
            margin: 0,
          }}
        >
          <img
            src={cfg.logo}
            alt={`${board} Logo`}
            style={{
              width: '28px',
              height: '28px',
              maxWidth: '28px',
              maxHeight: '28px',
              objectFit: 'contain',
              display: 'block',
              margin: 'auto',
              opacity: 1,
              visibility: 'visible',
            }}
            loading="eager"
          />
        </div>

        <div style={{ minWidth: 0, flex: 1, overflow: 'hidden', margin: 0, padding: 0 }}>
          <div
            style={{
              fontSize: '12px',
              fontWeight: 800,
              letterSpacing: '0.01em',
              color: '#ffffff',
              lineHeight: 1.25,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              margin: 0,
            }}
          >
            {board === 'POST-UTME' ? 'Post-UTME Tertiary Screening' : cfg.name}
          </div>
          <div
            style={{
              fontSize: '10px',
              color: 'rgba(255, 255, 255, 0.8)',
              marginTop: '1px',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            Official Curriculum &amp; Assessment Guide
          </div>
        </div>
      </div>

      {/* Bottom: Visual Caption Micro-Bar */}
      <div
        style={{
          zIndex: 1,
          fontSize: '9.5px',
          color: 'rgba(255, 255, 255, 0.92)',
          backgroundColor: 'rgba(0, 0, 0, 0.28)',
          borderRadius: '4px',
          padding: '2px 6px',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          backdropFilter: 'blur(4px)',
          margin: 0,
        }}
        title={article.imageCaption || cfg.name}
      >
        📌 {article.imageCaption || `${board} Assessment Blueprint`}
      </div>
    </div>
  );
};

export const BlogPortal: React.FC = () => {
  const { notifySuccess } = useNotificationStore();
  const [selectedCategory, setSelectedCategory] = useState<BlogCategory>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedArticle, setSelectedArticle] = useState<BlogPostItem | null>(null);
  const [bookmarkedSlugs, setBookmarkedSlugs] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('md_bookmarked_articles');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const { data: remoteData, isLoading } = useQuery({
    queryKey: ['blog-articles', selectedCategory, searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedCategory !== 'ALL') params.set('category', selectedCategory);
      if (searchQuery.trim()) params.set('search', searchQuery.trim());
      params.set('limit', '50');
      try {
        return await apiClient<{ articles: BlogPostItem[] }>(`/api/content/blog?${params.toString()}`);
      } catch {
        return { articles: DEFAULT_ARTICLES };
      }
    },
    staleTime: 60000,
  });

  const allArticles = useMemo(
    () => (remoteData?.articles?.length ? remoteData.articles : DEFAULT_ARTICLES),
    [remoteData]
  );

  const filteredArticles = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    return allArticles.filter((article) => {
      const matchesCategory = selectedCategory === 'ALL' || article.category === selectedCategory;
      const matchesQuery =
        !query ||
        article.title.toLowerCase().includes(query) ||
        article.summary.toLowerCase().includes(query) ||
        article.tags.some((tag) => tag.toLowerCase().includes(query)) ||
        (article.author || '').toLowerCase().includes(query) ||
        (article.examBoard || '').toLowerCase().includes(query);
      return matchesCategory && matchesQuery;
    });
  }, [allArticles, searchQuery, selectedCategory]);

  const featuredArticle = filteredArticles[0] || allArticles[0];

  const toggleBookmark = (slug: string, event?: React.MouseEvent) => {
    event?.stopPropagation();
    const updated = bookmarkedSlugs.includes(slug)
      ? bookmarkedSlugs.filter((savedSlug) => savedSlug !== slug)
      : [...bookmarkedSlugs, slug];
    setBookmarkedSlugs(updated);
    localStorage.setItem('md_bookmarked_articles', JSON.stringify(updated));
    notifySuccess(updated.includes(slug) ? 'Guide saved to your reading list.' : 'Guide removed from your reading list.');
  };

  const handleShare = async (article: BlogPostItem, event?: React.MouseEvent) => {
    event?.stopPropagation();
    const shareUrl = `${window.location.origin}/blog#${article.slug}`;
    await navigator.clipboard?.writeText(shareUrl);
    notifySuccess('Article link copied.');
  };

  return (
    <div className="blog-page premium-portal-page premium-more-page">
      <main className="blog-wrap">
        <section className="blog-hero">
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <span
              className="eyebrow"
              style={{
                fontSize: '11px',
                fontWeight: 800,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: 'var(--rust)',
                marginBottom: '4px',
              }}
            >
              Academic Editorial
            </span>
            <h1
              style={{
                fontSize: 'clamp(20px, 2.5vw, 30px)',
                fontWeight: 800,
                letterSpacing: '-0.02em',
                lineHeight: 1.25,
                margin: '4px 0 10px',
                color: 'var(--ink)',
              }}
            >
              Official Exam Board Strategy &amp; Assessment Guides
            </h1>
            <p
              style={{
                fontSize: '14px',
                lineHeight: 1.5,
                color: 'var(--ink-soft)',
                margin: 0,
                maxWidth: '56ch',
              }}
            >
              Forensic breakdowns of JAMB 8-key CBT pacing, WAEC Chief Examiners' theory mark deductions, NECO stanine grading, GCE private series combination rules, NABTEB modular trades, and Post-UTME composite models.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '12px' }}>
              {['JAMB UTME', 'WAEC WASSCE', 'NECO SSCE', 'GCE Series', 'NABTEB', 'Post-UTME'].map((b) => (
                <span
                  key={b}
                  style={{
                    fontSize: '10.5px',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '10px',
                    backgroundColor: 'var(--paper-dim, #f1f5f9)',
                    color: 'var(--ink-soft)',
                    border: '1px solid var(--paper-line)',
                  }}
                >
                  {b}
                </span>
              ))}
            </div>
          </div>
          {featuredArticle && (
            <button
              type="button"
              className="blog-featured"
              onClick={() => setSelectedArticle(featuredArticle)}
            >
              <ExamBoardVisualCard article={featuredArticle} isFeatured height={140} />
              <div className="blog-featured-body">
                <span>Featured • {CATEGORY_LABELS[featuredArticle.category] || featuredArticle.category}</span>
                <strong>{featuredArticle.title}</strong>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginTop: '6px',
                    fontSize: '11.5px',
                    color: 'var(--ink-soft)',
                  }}
                >
                  {featuredArticle.readTime && <span>{featuredArticle.readTime}</span>}
                  {featuredArticle.publishedDate && (
                    <>
                      <span>•</span>
                      <span>{featuredArticle.publishedDate}</span>
                    </>
                  )}
                </div>
              </div>
            </button>
          )}
        </section>

        <section className="blog-toolbar" aria-label="Blog filters">
          <label>
            <span>Search publication</span>
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search by topic, exam board (JAMB, WAEC, NECO, GCE, NABTEB)..."
            />
          </label>
          <div className="blog-tabs" role="tablist" aria-label="Blog categories">
            {(Object.keys(CATEGORY_LABELS) as BlogCategory[]).map((category) => (
              <button
                key={category}
                type="button"
                className={selectedCategory === category ? 'active' : ''}
                onClick={() => setSelectedCategory(category)}
              >
                {CATEGORY_LABELS[category]}
              </button>
            ))}
          </div>
        </section>

        <div className="blog-results-head">
          <h2>{CATEGORY_LABELS[selectedCategory]} ({filteredArticles.length})</h2>
          {isLoading && <span>Checking for new articles...</span>}
        </div>

        {filteredArticles.length === 0 ? (
          <section className="empty-state">
            <h3>No articles match this search</h3>
            <p>Try searching for exam boards like JAMB, WAEC, NECO, GCE, NABTEB, or topics like admission, CBT, or theory.</p>
            <button
              type="button"
              className="btn-custom btn-custom-primary"
              onClick={() => {
                setSelectedCategory('ALL');
                setSearchQuery('');
              }}
            >
              Reset filters
            </button>
          </section>
        ) : (
          <section className="blog-grid" aria-label="Educational articles">
            {filteredArticles.map((article) => {
              const isBookmarked = bookmarkedSlugs.includes(article.slug);
              return (
                <article
                  className="blog-card"
                  key={article.slug}
                  onClick={() => setSelectedArticle(article)}
                  style={{ cursor: 'pointer' }}
                >
                  <ExamBoardVisualCard article={article} height={180} />
                  <div className="blog-card-body">
                    <div className="blog-card-meta">
                      <span>{CATEGORY_LABELS[article.category] || article.category}</span>
                      {article.readTime && <span>{article.readTime}</span>}
                    </div>
                    <h3>{article.title}</h3>
                    <p>{article.summary}</p>
                    <div className="blog-tags">
                      {article.tags.slice(0, 3).map((tag) => (
                        <span key={tag}>{tag}</span>
                      ))}
                    </div>
                    <footer>
                      <div>
                        {article.author && <strong>{article.author}</strong>}
                        {article.publishedDate && <span>{article.publishedDate}</span>}
                      </div>
                      <div className="blog-card-actions">
                        <button
                          type="button"
                          onClick={(event) => toggleBookmark(article.slug, event)}
                          aria-label={isBookmarked ? 'Remove saved article' : 'Save article'}
                        >
                          {isBookmarked ? 'Saved' : 'Save'}
                        </button>
                        <button type="button" onClick={(event) => handleShare(article, event)}>
                          Share
                        </button>
                      </div>
                    </footer>
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </main>

      {/* Expanded Modal Article Reader */}
      {selectedArticle && (
        <div className="blog-reader" role="dialog" aria-modal="true" aria-labelledby="blog-reader-title">
          <button
            type="button"
            className="blog-reader-backdrop"
            aria-label="Close article"
            onClick={() => setSelectedArticle(null)}
          />
          <article className="blog-reader-panel" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
            <button
              type="button"
              className="blog-reader-close"
              onClick={() => setSelectedArticle(null)}
              aria-label="Close article"
            >
              ✕
            </button>

            {/* Exam Board Visual Header */}
            <div style={{ borderRadius: '10px', overflow: 'hidden', marginBottom: '20px' }}>
              <ExamBoardVisualCard article={selectedArticle} height={200} />
            </div>

            {/* Visual Analysis Caption Box */}
            {selectedArticle.imageCaption && (
              <div
                style={{
                  padding: '10px 14px',
                  backgroundColor: 'var(--paper-dim, #f1f5f9)',
                  borderLeft: '4px solid var(--rust, #a8562f)',
                  borderRadius: '0 8px 8px 0',
                  fontSize: '12px',
                  color: 'var(--ink-soft)',
                  marginBottom: '18px',
                  lineHeight: 1.5,
                }}
              >
                <strong style={{ color: 'var(--ink)' }}>Visual Assessment Analysis: </strong>
                {selectedArticle.imageCaption}
              </div>
            )}

            <span className="eyebrow">{CATEGORY_LABELS[selectedArticle.category] || selectedArticle.category}</span>
            <h2 id="blog-reader-title" style={{ marginTop: '6px', marginBottom: '10px' }}>
              {selectedArticle.title}
            </h2>

            <div className="blog-reader-meta">
              {selectedArticle.author && <span>By {selectedArticle.author}</span>}
              {selectedArticle.authorRole && <span>• {selectedArticle.authorRole}</span>}
              {selectedArticle.publishedDate && <span>• {selectedArticle.publishedDate}</span>}
              {selectedArticle.readTime && <span>• {selectedArticle.readTime}</span>}
            </div>

            <p className="blog-reader-summary" style={{ fontStyle: 'italic', fontWeight: 500, margin: '16px 0' }}>
              {selectedArticle.summary}
            </p>

            {/* Key Assessment Takeaways Box */}
            {selectedArticle.keyTakeaways && selectedArticle.keyTakeaways.length > 0 && (
              <div
                style={{
                  backgroundColor: 'var(--paper, #fdfbf7)',
                  border: '1.5px solid var(--paper-line)',
                  borderRadius: '10px',
                  padding: '16px 20px',
                  margin: '20px 0',
                }}
              >
                <h4
                  style={{
                    margin: '0 0 10px 0',
                    fontSize: '13px',
                    fontFamily: 'var(--font-sans)',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    color: 'var(--rust, #a8562f)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <span>⚡</span> Key Examination Rules &amp; Takeaways
                </h4>
                <ul
                  style={{
                    margin: 0,
                    paddingLeft: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    fontSize: '13px',
                    lineHeight: 1.5,
                    color: 'var(--ink)',
                  }}
                >
                  {selectedArticle.keyTakeaways.map((takeaway, idx) => (
                    <li key={idx}>
                      <strong>Rule {idx + 1}: </strong>
                      {takeaway}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Main Article Body */}
            <div className="blog-reader-content">
              {selectedArticle.content.map((paragraph, index) => (
                <p key={index} style={{ marginBottom: '14px', lineHeight: 1.65 }}>
                  {paragraph}
                </p>
              ))}
            </div>

            {/* Tags */}
            <div className="blog-tags" style={{ marginTop: '20px', marginBottom: '20px' }}>
              {selectedArticle.tags.map((tag) => (
                <span key={tag}>{tag}</span>
              ))}
            </div>

            <div className="blog-reader-actions">
              <button
                type="button"
                className="btn-custom btn-custom-ghost"
                onClick={(event) => toggleBookmark(selectedArticle.slug, event)}
              >
                {bookmarkedSlugs.includes(selectedArticle.slug) ? 'Saved to Reading List' : 'Save Guide'}
              </button>
              <Link
                to="/portal/questions"
                className="btn-custom btn-custom-primary"
                onClick={() => setSelectedArticle(null)}
              >
                Practice Past Questions
              </Link>
            </div>
          </article>
        </div>
      )}
    </div>
  );
};

export default BlogPortal;
