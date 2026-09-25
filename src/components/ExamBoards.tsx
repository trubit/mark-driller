import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore.js';
import { useAuthStore } from '../store/useAuthStore.js';
import { useExamBoards } from '../api/useExamBoards.js';
import { ExamBoardLogo } from './ExamBoardLogo.js';
import { SafeImage } from './SafeImage.js';

export interface ExamCardData {
  id: string;
  shortCode: string;
  officialName: string;
  authority: string;
  heroImage: string;
  imageAlt: string;
  description: string;
  examType: string;
  gradingSystem: string;
  sessionDuration: string;
  subjectsSummary: string;
  keySubjects: string[];
  totalSubjects: number;
  yearsAvailable: string;
  disclaimer?: string;
}

export const EXAM_CARDS: ExamCardData[] = [
  {
    id: 'jamb',
    shortCode: 'JAMB / UTME',
    officialName: 'Joint Admissions and Matriculation Board (UTME)',
    authority: 'JAMB National Headquarters, Bwari, Abuja, Nigeria',
    heroImage: '/assets/images/cbt-practice.jpg',
    imageAlt: 'Nigerian students in modern CBT examination terminal practicing for JAMB UTME',
    description: 'Mandatory Computer-Based Test for admission into Nigerian federal, state, and private universities, polytechnics, and colleges. 4 subjects including compulsory Use of English.',
    examType: 'Matriculation CBT',
    gradingSystem: '0 – 400 Marks',
    sessionDuration: '2 Hours (120 Minutes)',
    subjectsSummary: '24 Accredited Subjects',
    keySubjects: ['Use of English', 'Mathematics', 'Physics', 'Chemistry', 'Biology', 'Economics', 'Government', 'Literature in English'],
    totalSubjects: 24,
    yearsAvailable: '1978 – 2026',
    disclaimer: 'Conducted under official JAMB 8-key keyboard shortcut and on-screen calculator guidelines.',
  },
  {
    id: 'waec',
    shortCode: 'WAEC',
    officialName: 'West African Senior School Certificate Examination (WASSCE)',
    authority: 'WAEC Nigeria National Office, Yaba, Lagos',
    heroImage: '/assets/images/classroom-study.jpg',
    imageAlt: 'Nigerian secondary school candidate studying senior secondary syllabus with textbook and laptop',
    description: 'Senior Secondary Certificate Examination conducted across West African member countries. Fundamental for secondary graduation and tertiary admission clearance.',
    examType: 'Senior Secondary Certificate (SSCE)',
    gradingSystem: 'A1 (Distinction) to F9 (Fail)',
    sessionDuration: 'Objective & Theory Papers',
    subjectsSummary: '38 Curriculum Subjects',
    keySubjects: ['General Mathematics', 'English Language', 'Civic Education', 'Biology', 'Chemistry', 'Physics', 'Financial Accounting', 'Commerce'],
    totalSubjects: 38,
    yearsAvailable: '1988 – 2026',
    disclaimer: 'Curriculum-aligned objectives drills with verified chief examiner marks scheme.',
  },
  {
    id: 'neco',
    shortCode: 'NECO',
    officialName: 'National Examinations Council (SSCE Internal / External)',
    authority: 'NECO Headquarters, Minna, Niger State, Nigeria',
    heroImage: '/assets/images/exam-hall.jpg',
    imageAlt: 'Nigerian classroom candidates preparing for National Examinations Council test papers',
    description: "Nigeria's indigenous statutory examination body administering the Senior Secondary Certificate Examination across all 36 Nigerian states and the FCT.",
    examType: 'National SSCE',
    gradingSystem: 'A1 – F9 Standard',
    sessionDuration: 'Objective & Practical Papers',
    subjectsSummary: '36 State & Federal Subjects',
    keySubjects: ['English Language', 'Mathematics', 'Civic Education', 'Agricultural Science', 'Physics', 'Economics', 'CRS / IRS', 'Geography'],
    totalSubjects: 36,
    yearsAvailable: '2000 – 2026',
    disclaimer: 'Full coverage of indigenous Nigerian secondary educational curriculum.',
  },
  {
    id: 'gce',
    shortCode: 'GCE',
    officialName: 'General Certificate of Education (Private Candidate Series)',
    authority: 'WAEC & NECO External Candidate Directorates',
    heroImage: '/assets/images/library-revision.jpg',
    imageAlt: 'Dedicated candidate in study library revising private candidate GCE past question papers',
    description: 'Nov/Dec external series for private and remedial candidates seeking O-Level credit completion or grade enhancement for tertiary institution entry requirements.',
    examType: 'Private Candidate External Series',
    gradingSystem: 'Credit Benchmark (A1 – C6)',
    sessionDuration: 'Standardized External Timing',
    subjectsSummary: '32 Core Curriculum Subjects',
    keySubjects: ['English Language', 'Mathematics', 'Economics', 'Government', 'Biology', 'Chemistry', 'Commerce', 'Literature'],
    totalSubjects: 32,
    yearsAvailable: '1995 – 2026',
    disclaimer: 'Tailored for independent learners and remedial credit completion.',
  },
  {
    id: 'post-utme',
    shortCode: 'POST-UTME',
    officialName: 'Nigerian Universities Screening & Post-UTME CBT',
    authority: 'Accredited Federal, State, and Private Nigerian Universities',
    heroImage: '/assets/images/university-screening.jpg',
    imageAlt: 'Nigerian university undergraduate students on university campus grounds',
    description: 'High-speed computer-based screening tests conducted by UNILAG, UI, OAU, UNIBEN, ABU, UNN, LASU, and top institutions to determine departmental cutoff admission.',
    examType: 'Institutional Screening CBT',
    gradingSystem: '0 – 100% / 0 – 40 Points',
    sessionDuration: '30 – 60 Minutes (High-Speed)',
    subjectsSummary: '18 High-Yield Screening Papers',
    keySubjects: ['General Mathematics', 'English Comprehension', 'Current Affairs', 'General Paper', 'Verbal Reasoning', 'Quantitative Aptitude'],
    totalSubjects: 18,
    yearsAvailable: '2006 – 2026',
    disclaimer: 'Institution-specific speed drills calibrated to top university cutoff benchmarks.',
  },
  {
    id: 'nabteb',
    shortCode: 'NABTEB',
    officialName: 'National Business and Technical Examinations Board (NABTEB)',
    authority: 'National Business and Technical Examinations Board, Ikpoba Hill, Benin City, Edo State',
    heroImage: '/assets/images/technical-workshop.jpg',
    imageAlt: 'Nigerian technical college students working in electrical and mechanical workshop training',
    description: 'Statutory examination body conducting the National Business Certificate (NBC), National Technical Certificate (NTC), and Modular Trade certifications across Nigeria.',
    examType: 'Technical & Business Certification',
    gradingSystem: 'Distinction / Credit / Pass',
    sessionDuration: 'Theory & Trade Practical',
    subjectsSummary: '28 Trade & General Subjects',
    keySubjects: ['Applied Electricity', 'Mechanical Engineering Craft', 'General Metal Work', 'Financial Accounting', 'Secretarial Studies', 'Mathematics', 'English'],
    totalSubjects: 28,
    yearsAvailable: 'May/June & Nov/Dec Series',
    disclaimer: 'Accredited technical trade and vocational examination curricula.',
  },
];

export const ExamBoards: React.FC = () => {
  const navigate = useNavigate();
  const { setSelectedExamBoard, openAuthModal } = useAppStore();
  const { isAuthenticated } = useAuthStore();
  const { data: boardsData } = useExamBoards();
  const [filterMode, setFilterMode] = useState<string>('ALL');

  const filteredCards =
    filterMode === 'ALL'
      ? EXAM_CARDS
      : EXAM_CARDS.filter((c) => c.shortCode === filterMode || c.id === filterMode);

  const handlePracticeOption = (examCode: string) => {
    setSelectedExamBoard(examCode);
    if (!isAuthenticated) {
      openAuthModal('login');
    } else {
      navigate(`/questions?exam=${encodeURIComponent(examCode)}&mode=practice`);
    }
  };

  const handleMockOption = (examCode: string) => {
    setSelectedExamBoard(examCode);
    if (!isAuthenticated) {
      openAuthModal('login');
    } else {
      navigate(`/dashboard?startMock=${encodeURIComponent(examCode)}`);
    }
  };

  const handlePastQuestionOption = (examCode: string) => {
    setSelectedExamBoard(examCode);
    if (!isAuthenticated) {
      openAuthModal('login');
    } else {
      navigate(`/questions?exam=${encodeURIComponent(examCode)}`);
    }
  };

  return (
    <section className="boards section" id="boards" aria-label="Official Nigerian Examination Boards">
      <div className="wrap">
        <div className="section-head" style={{ marginBottom: '32px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span className="eyebrow">Accredited Nigerian Curricula</span>
            <span
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: '11px',
                padding: '2px 8px',
                borderRadius: '4px',
                background: 'rgba(168, 86, 47, 0.12)',
                color: 'var(--rust)',
                fontWeight: 600,
              }}
            >
              6 Statutory Exam Suites
            </span>
          </div>
          <h2>Built for the Exact Examinations You Sit</h2>
          <p style={{ maxWidth: '680px', margin: '0 auto', color: 'var(--ink-soft)', fontSize: '15px' }}>
            Choose your target examination below. Access verified past questions (1978–2026), take full-fidelity timed CBT mocks, and drill topic-by-topic under authentic Nigerian syllabus conditions.
          </p>
        </div>

        {/* Quick Filter Pill Buttons */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: '8px',
            marginBottom: '32px',
          }}
        >
          <button
            type="button"
            onClick={() => setFilterMode('ALL')}
            className={`btn-custom ${filterMode === 'ALL' ? 'btn-custom-primary' : 'btn-custom-ghost'}`}
            style={{ fontSize: '12.5px', padding: '6px 16px' }}
          >
            All 6 Examination Boards
          </button>
          {EXAM_CARDS.map((board) => (
            <button
              key={board.id}
              type="button"
              onClick={() => setFilterMode(board.shortCode)}
              className={`btn-custom ${filterMode === board.shortCode ? 'btn-custom-primary' : 'btn-custom-ghost'}`}
              style={{ fontSize: '12.5px', padding: '6px 14px' }}
            >
              {board.shortCode}
            </button>
          ))}
        </div>

        {/* 6-Card Professional Examination Grid */}
        <div
          className="grid-fluid-cards"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
            gap: 'clamp(16px, 3vw, 24px)',
          }}
        >
          {filteredCards.map((card) => {
            const dbBoard = boardsData?.find(
              (b) => b.shortCode === card.shortCode
            );

            return (
              <div
                key={card.id}
                className="exam-board-suite-card"
                style={{
                  background: 'var(--white)',
                  border: '1.5px solid var(--paper-line)',
                  borderRadius: '10px',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  boxShadow: 'var(--card-shadow, 0 4px 16px rgba(0, 0, 0, 0.05))',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                }}
              >
                {/* Photo Thumbnail Banner */}
                <div style={{ position: 'relative', height: '170px', width: '100%', overflow: 'hidden', backgroundColor: 'var(--paper)' }}>
                  <SafeImage
                    src={card.heroImage}
                    alt={card.imageAlt}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      display: 'block',
                      filter: 'contrast(1.04)',
                    }}
                    loading="lazy"
                  />
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'linear-gradient(to top, rgba(15, 23, 42, 0.85) 0%, rgba(15, 23, 42, 0.2) 60%, transparent 100%)',
                    }}
                  />

                  {/* Logo / Badge in Banner */}
                  <div
                    style={{
                      position: 'absolute',
                      top: '12px',
                      left: '12px',
                      backgroundColor: '#ffffff',
                      borderRadius: '8px',
                      padding: '4px',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.25)',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    <ExamBoardLogo board={card.shortCode} size={42} />
                  </div>

                  {/* Exam Type Tag */}
                  <div
                    style={{
                      position: 'absolute',
                      top: '12px',
                      right: '12px',
                      backgroundColor: 'rgba(15, 23, 42, 0.85)',
                      color: '#ffffff',
                      padding: '4px 10px',
                      borderRadius: '4px',
                      fontFamily: "var(--font-sans)",
                      fontSize: '10.5px',
                      fontWeight: 600,
                      letterSpacing: '0.04em',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                    }}
                  >
                    {card.examType}
                  </div>

                  {/* Bottom Strip in Image */}
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '10px',
                      left: '14px',
                      right: '14px',
                      color: '#ffffff',
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "var(--font-sans)",
                        fontWeight: 800,
                        fontSize: '18px',
                        color: '#ffffff',
                        textShadow: '0 1px 3px rgba(0,0,0,0.6)',
                        display: 'block',
                      }}
                    >
                      {card.shortCode}
                    </span>
                  </div>
                </div>

                {/* Card Body */}
                <div
                  style={{
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    flex: 1,
                    gap: '14px',
                  }}
                >
                  <div>
                    <h3
                      style={{
                        fontSize: '15px',
                        fontWeight: 700,
                        margin: '0 0 4px 0',
                        color: 'var(--ink)',
                        lineHeight: 1.35,
                      }}
                    >
                      {card.officialName}
                    </h3>
                    <span
                      style={{
                        fontFamily: "var(--font-sans)",
                        fontSize: '11px',
                        color: 'var(--ink-soft)',
                        display: 'block',
                      }}
                    >
                      {card.authority}
                    </span>
                  </div>

                  <p
                    style={{
                      fontSize: '13px',
                      color: 'var(--ink)',
                      lineHeight: 1.55,
                      margin: 0,
                    }}
                  >
                    {card.description}
                  </p>

                  {/* Exam Specs Table/Strip */}
                  <div
                    style={{
                      backgroundColor: 'var(--paper)',
                      borderRadius: '6px',
                      padding: '10px 12px',
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '8px',
                      border: '1px solid var(--paper-line)',
                      fontFamily: "var(--font-sans)",
                      fontSize: '11px',
                    }}
                  >
                    <div>
                      <span style={{ color: 'var(--ink-soft)', display: 'block' }}>GRADING:</span>
                      <strong style={{ color: 'var(--ink)' }}>{card.gradingSystem}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--ink-soft)', display: 'block' }}>DURATION:</span>
                      <strong style={{ color: 'var(--ink)' }}>{card.sessionDuration}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--ink-soft)', display: 'block' }}>YEARS:</span>
                      <strong style={{ color: 'var(--rust)' }}>{card.yearsAvailable}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--ink-soft)', display: 'block' }}>DATABASE:</span>
                      <strong style={{ color: 'var(--amber)' }}>
                        {dbBoard ? `${dbBoard.questionCount.toLocaleString()} Questions` : `${card.subjectsSummary}`}
                      </strong>
                    </div>
                  </div>

                  {/* Available Subjects Highlight */}
                  <div>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '6px',
                      }}
                    >
                      <span
                        style={{
                          fontFamily: "var(--font-sans)",
                          fontSize: '10.5px',
                          fontWeight: 700,
                          color: 'var(--ink-soft)',
                          textTransform: 'uppercase',
                        }}
                      >
                        Available Subjects ({card.totalSubjects})
                      </span>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                      {card.keySubjects.map((subj, i) => (
                        <span
                          key={i}
                          style={{
                            fontSize: '10.5px',
                            fontFamily: "var(--font-sans)",
                            backgroundColor: 'var(--paper-soft, rgba(20,24,28,0.04))',
                            color: 'var(--ink)',
                            padding: '3px 8px',
                            borderRadius: '3px',
                            border: '1px solid var(--paper-line)',
                          }}
                        >
                          {subj}
                        </span>
                      ))}
                      <span
                        style={{
                          fontSize: '10.5px',
                          fontFamily: "var(--font-sans)",
                          color: 'var(--rust)',
                          padding: '3px 6px',
                        }}
                      >
                        +{card.totalSubjects - card.keySubjects.length} more
                      </span>
                    </div>
                  </div>

                  {/* 3 Prominent Required Action Buttons */}
                  <div
                    style={{
                      marginTop: 'auto',
                      paddingTop: '14px',
                      borderTop: '1px solid var(--paper-line)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                    }}
                  >
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      {/* 1. Practice Option */}
                      <button
                        type="button"
                        onClick={() => handlePracticeOption(card.shortCode)}
                        className="btn-custom btn-custom-ghost"
                        style={{
                          fontSize: '12px',
                          padding: '8px 10px',
                          textAlign: 'center',
                          justifyContent: 'center',
                        }}
                        title={`Practice ${card.shortCode} questions topic-by-topic`}
                      >
                        🎯 Practice Topics
                      </button>

                      {/* 2. Mock Examination Option */}
                      <button
                        type="button"
                        onClick={() => handleMockOption(card.shortCode)}
                        className="btn-custom btn-custom-primary"
                        style={{
                          fontSize: '12px',
                          padding: '8px 10px',
                          textAlign: 'center',
                          justifyContent: 'center',
                        }}
                        title={`Simulate official ${card.shortCode} timed CBT mock exam`}
                      >
                        ⏱️ Mock Exam
                      </button>
                    </div>

                    {/* 3. Past-Question Option */}
                    <button
                      type="button"
                      onClick={() => handlePastQuestionOption(card.shortCode)}
                      style={{
                        width: '100%',
                        padding: '7px 12px',
                        backgroundColor: 'var(--paper)',
                        border: '1px solid var(--paper-line)',
                        borderRadius: '4px',
                        color: 'var(--ink)',
                        fontSize: '11.5px',
                        fontFamily: "var(--font-sans)",
                        fontWeight: 600,
                        cursor: 'pointer',
                        textAlign: 'center',
                        transition: 'background 0.15s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--paper-soft, #eceee6)')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--paper)')}
                      title={`Browse complete ${card.shortCode} past questions archive`}
                    >
                      📖 Browse Past Questions ({card.yearsAvailable})
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Legal Disclaimer Box */}
        <div
          style={{
            marginTop: '36px',
            padding: '16px 20px',
            backgroundColor: 'var(--white)',
            borderRadius: '6px',
            border: '1px solid var(--paper-line)',
            borderLeft: '4px solid var(--amber)',
            fontSize: '12.5px',
            color: 'var(--ink-soft)',
            lineHeight: 1.5,
          }}
        >
          <strong style={{ color: 'var(--ink)' }}>Statutory Notice &amp; Independent Attribution:</strong>{' '}
          MarkDriller is an independent Nigerian educational CBT preparation platform. Examination names, acronyms, and registered logos (JAMB, WAEC, NECO, NABTEB) are the property of their respective statutory examination bodies and are referenced strictly for syllabus alignment, educational identification, and candidate preparation under fair dealing principles.
        </div>
      </div>
    </section>
  );
};

