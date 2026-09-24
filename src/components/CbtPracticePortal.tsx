import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { CbtSetupModal } from './CbtSetupModal.js';
import { useAuthStore } from '../store/useAuthStore.js';
import { useAppStore } from '../store/useAppStore.js';
import { useExamsQuery } from '../api/exams.js';
import { useResultsHistoryQuery } from '../api/results.js';
import { useMySubscriptionQuery } from '../api/subscriptions.js';

interface ExamBoardCard {
  id: string;
  name: string;
  shortCode: string;
  badge: string;
  description: string;
  duration: string;
  subjectsSummary: string;
  popular?: boolean;
}

const FALLBACK_BOARDS: ExamBoardCard[] = [
  {
    id: 'jamb',
    name: 'Joint Admissions and Matriculation Board',
    shortCode: 'JAMB UTME',
    badge: 'UTME 2026 Ready',
    description: 'Simulate the exact computer-based UTME testing environment with 4 subject combinations and true 8-key navigation.',
    duration: '120 Mins (Full Mock)',
    subjectsSummary: 'Use of English, Mathematics, Physics, Chemistry, Biology, Government & more',
    popular: true,
  },
  {
    id: 'waec',
    name: 'West African Senior School Certificate',
    shortCode: 'WAEC SSCE',
    badge: 'May/June & GCE',
    description: 'Comprehensive multiple-choice objective drills aligned with the latest WAEC syllabus and Chief Examiner reports.',
    duration: '60 - 90 Mins per subject',
    subjectsSummary: 'Core General Subjects & Departmental Specializations',
  },
  {
    id: 'neco',
    name: 'National Examinations Council',
    shortCode: 'NECO SSCE',
    badge: 'June/July & External',
    description: 'Detailed curriculum-based drills reflecting NECO standard question patterns with complete rationales.',
    duration: '60 Mins per paper',
    subjectsSummary: 'Science, Arts, Social Sciences & Commercial tracks',
  },
  {
    id: 'post-utme',
    name: 'University Screening Examination',
    shortCode: 'POST-UTME',
    badge: 'Top Universities',
    description: 'Rigorous aptitude and screening test simulations for UNILAG, UI, OAU, UNIBEN, UNN, ABU, and other federal institutions.',
    duration: '30 - 60 Mins',
    subjectsSummary: 'General Knowledge, Current Affairs, Verbal & Quantitative Aptitude',
  },
];

export const CbtPracticePortal: React.FC = () => {
  const { isAuthenticated, user } = useAuthStore();
  const { openAuthModal } = useAppStore();

  // Queries
  const { data: exams } = useExamsQuery();
  const { data: subscription } = useMySubscriptionQuery();
  const { data: historyData } = useResultsHistoryQuery(1, 4);

  // Setup modal state
  const [isSetupOpen, setIsSetupOpen] = useState(false);
  const [selectedExamId, setSelectedExamId] = useState<string>('');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | undefined>(undefined);
  const [selectedMode, setSelectedMode] = useState<'TIMED_MOCK' | 'PRACTICE'>('TIMED_MOCK');

  // Map server exams or fallback
  const resolvedExams = useMemo(() => {
    if (exams && exams.length > 0) {
      return exams;
    }
    return [];
  }, [exams]);

  const isPro = Boolean(subscription?.isPro || user?.role === 'ADMIN');

  const handleLaunchMock = (examId?: string, mode: 'TIMED_MOCK' | 'PRACTICE' = 'TIMED_MOCK') => {
    if (!isAuthenticated) {
      openAuthModal('login');
      return;
    }
    const targetExamId = examId || (resolvedExams.length > 0 ? resolvedExams[0]._id : '');
    setSelectedExamId(targetExamId);
    setSelectedMode(mode);
    setSelectedSubjectId(undefined);
    setIsSetupOpen(true);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--paper, #eceee6)' }}>
      <main style={{ flex: 1, padding: 'clamp(16px, 2.5vw, 36px) clamp(12px, 2vw, 28px)' }}>
        <div style={{ maxWidth: '1440px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '28px' }}>
          
          {/* ======================================================== */}
          {/* 1. HERO BANNER: CBT SIMULATOR LAUNCHPAD                 */}
          {/* ======================================================== */}
          <section
            style={{
              background: 'linear-gradient(135deg, #14181c 0%, #1e282d 60%, #1a3328 100%)',
              borderRadius: '16px',
              padding: 'clamp(24px, 3.5vw, 44px)',
              color: '#ffffff',
              boxShadow: '0 12px 36px rgba(0, 0, 0, 0.18)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Background geometric accents */}
            <div
              style={{
                position: 'absolute',
                top: '-40px',
                right: '-40px',
                width: '280px',
                height: '280px',
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(34, 90, 56, 0.35) 0%, transparent 70%)',
                pointerEvents: 'none',
              }}
            />
            <div
              style={{
                position: 'absolute',
                bottom: '-60px',
                left: '20%',
                width: '320px',
                height: '320px',
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(168, 86, 47, 0.2) 0%, transparent 70%)',
                pointerEvents: 'none',
              }}
            />

            <div style={{ position: 'relative', zIndex: 2, maxWidth: '880px' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                <span
                  style={{
                    backgroundColor: 'rgba(34, 90, 56, 0.45)',
                    border: '1px solid rgba(74, 222, 128, 0.35)',
                    color: '#4ade80',
                    fontSize: '11px',
                    fontFamily: "var(--font-sans)",
                    fontWeight: 700,
                    padding: '4px 10px',
                    borderRadius: '999px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  ● Real Exam Simulator
                </span>
                <span
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    color: 'rgba(255, 255, 255, 0.8)',
                    fontSize: '11px',
                    fontFamily: "var(--font-sans)",
                    padding: '4px 10px',
                    borderRadius: '999px',
                  }}
                >
                  8-Key Shortcut System
                </span>
              </div>

              <h1
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: 'clamp(24px, 3.2vw, 38px)',
                  fontWeight: 800,
                  lineHeight: 1.18,
                  marginBottom: '14px',
                  color: '#ffffff',
                }}
              >
                Computer-Based Test (CBT) Practice Hub
              </h1>

              <p
                style={{
                  fontSize: 'clamp(14px, 1.1vw, 16px)',
                  lineHeight: 1.6,
                  color: 'rgba(255, 255, 255, 0.82)',
                  marginBottom: '26px',
                  maxWidth: '720px',
                }}
              >
                Train under true computerized examination conditions. Master the official 8-key keyboard controls (A, B, C, D, P, N, S, R), simulate full 4-subject JAMB combinations with live countdown timers, and review instant score analytics with step-by-step rationales.
              </p>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={() => handleLaunchMock(undefined, 'TIMED_MOCK')}
                  className="btn-custom btn-custom-primary"
                  style={{
                    backgroundColor: 'var(--rust, #a8562f)',
                    color: '#ffffff',
                    border: 'none',
                    padding: '12px 24px',
                    fontSize: '14px',
                    fontWeight: 700,
                    borderRadius: '8px',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 16px rgba(168, 86, 47, 0.4)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <span>⚡ Launch Quick Mock Exam</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleLaunchMock(undefined, 'PRACTICE')}
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    color: '#ffffff',
                    border: '1.5px solid rgba(255, 255, 255, 0.25)',
                    padding: '12px 22px',
                    fontSize: '14px',
                    fontWeight: 600,
                    borderRadius: '8px',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    backdropFilter: 'blur(8px)',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.18)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                  }}
                >
                  <span>⚙️ Configure Custom Drill</span>
                </button>

                {isAuthenticated && (
                  <Link
                    to="/history"
                    style={{
                      color: 'rgba(255, 255, 255, 0.75)',
                      textDecoration: 'none',
                      fontSize: '13px',
                      marginLeft: '8px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <span>View Result History ➔</span>
                  </Link>
                )}
              </div>
            </div>
          </section>

          {/* ======================================================== */}
          {/* 2. PRACTICE MODES: 4 TAILORED LEARNING PATHWAYS          */}
          {/* ======================================================== */}
          <section>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div>
                <h2
                  style={{
                    fontFamily: "var(--font-sans)",
                    fontSize: '20px',
                    fontWeight: 700,
                    color: 'var(--ink, #14181c)',
                    margin: 0,
                  }}
                >
                  Select Your Examination Practice Mode
                </h2>
                <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--ink-soft)' }}>
                  Tailor your session according to your revision goals and available time.
                </p>
              </div>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '16px',
              }}
            >
              {/* Mode Card 1: Full Standard Mock */}
              <div
                style={{
                  backgroundColor: 'var(--white, #ffffff)',
                  border: '1.5px solid var(--paper-line)',
                  borderRadius: '12px',
                  padding: '20px',
                  boxShadow: 'var(--shadow)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <span style={{ fontSize: '28px' }}>🎯</span>
                    <span
                      style={{
                        fontSize: '10.5px',
                        fontFamily: "var(--font-sans)",
                        fontWeight: 700,
                        backgroundColor: 'var(--rust-soft, rgba(168, 86, 47, 0.12))',
                        color: 'var(--rust, #a8562f)',
                        padding: '3px 8px',
                        borderRadius: '4px',
                      }}
                    >
                      RECOMMENDED
                    </span>
                  </div>
                  <h3 style={{ fontFamily: "var(--font-sans)", fontSize: '17px', fontWeight: 700, margin: '0 0 8px 0', color: 'var(--ink)' }}>
                    Full Standard Mock Exam
                  </h3>
                  <p style={{ fontSize: '13px', lineHeight: 1.5, color: 'var(--ink-soft)', margin: '0 0 16px 0' }}>
                    Simulates official examination conditions. 4-subject combination, 180 questions, 120-minute countdown timer, and true JAMB 8-key controls.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleLaunchMock(undefined, 'TIMED_MOCK')}
                  className="btn-custom btn-custom-primary"
                  style={{
                    width: '100%',
                    padding: '10px',
                    fontSize: '13px',
                    fontWeight: 700,
                    borderRadius: '6px',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  Start Full Mock ➔
                </button>
              </div>

              {/* Mode Card 2: Single Subject Topic Drill */}
              <div
                style={{
                  backgroundColor: 'var(--white, #ffffff)',
                  border: '1.5px solid var(--paper-line)',
                  borderRadius: '12px',
                  padding: '20px',
                  boxShadow: 'var(--shadow)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <span style={{ fontSize: '28px' }}>🔬</span>
                    <span
                      style={{
                        fontSize: '10.5px',
                        fontFamily: "var(--font-sans)",
                        fontWeight: 700,
                        backgroundColor: 'var(--forest-soft, rgba(34, 90, 56, 0.12))',
                        color: 'var(--forest, #225a38)',
                        padding: '3px 8px',
                        borderRadius: '4px',
                      }}
                    >
                      TOPICAL MASTERY
                    </span>
                  </div>
                  <h3 style={{ fontFamily: "var(--font-sans)", fontSize: '17px', fontWeight: 700, margin: '0 0 8px 0', color: 'var(--ink)' }}>
                    Single Subject Drill
                  </h3>
                  <p style={{ fontSize: '13px', lineHeight: 1.5, color: 'var(--ink-soft)', margin: '0 0 16px 0' }}>
                    Focus on one subject or specific syllabus topic to eliminate weak points. Customize question count (10 to 60) and practice untimed or timed.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleLaunchMock(undefined, 'PRACTICE')}
                  style={{
                    width: '100%',
                    padding: '10px',
                    fontSize: '13px',
                    fontWeight: 700,
                    borderRadius: '6px',
                    cursor: 'pointer',
                    backgroundColor: 'var(--forest, #225a38)',
                    color: '#ffffff',
                    border: 'none',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.15s ease',
                  }}
                >
                  Start Subject Drill ➔
                </button>
              </div>

              {/* Mode Card 3: Speed & Reflex Drill */}
              <div
                style={{
                  backgroundColor: 'var(--white, #ffffff)',
                  border: '1.5px solid var(--paper-line)',
                  borderRadius: '12px',
                  padding: '20px',
                  boxShadow: 'var(--shadow)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <span style={{ fontSize: '28px' }}>⏱️</span>
                    <span
                      style={{
                        fontSize: '10.5px',
                        fontFamily: "var(--font-sans)",
                        fontWeight: 700,
                        backgroundColor: 'var(--amber-soft, rgba(226, 154, 60, 0.15))',
                        color: 'var(--amber-deep, #c17d24)',
                        padding: '3px 8px',
                        borderRadius: '4px',
                      }}
                    >
                      SPEED TEST
                    </span>
                  </div>
                  <h3 style={{ fontFamily: "var(--font-sans)", fontSize: '17px', fontWeight: 700, margin: '0 0 8px 0', color: 'var(--ink)' }}>
                    Speed &amp; Reflex Sprint
                  </h3>
                  <p style={{ fontSize: '13px', lineHeight: 1.5, color: 'var(--ink-soft)', margin: '0 0 16px 0' }}>
                    20 rapid-fire questions in 10 minutes. Builds speed reading, rapid calculations, and instantaneous question comprehension under pressure.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleLaunchMock(undefined, 'TIMED_MOCK')}
                  style={{
                    width: '100%',
                    padding: '10px',
                    fontSize: '13px',
                    fontWeight: 700,
                    borderRadius: '6px',
                    cursor: 'pointer',
                    backgroundColor: 'var(--paper)',
                    color: 'var(--ink)',
                    border: '1px solid var(--paper-line)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--ink)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--paper-line)';
                  }}
                >
                  Launch Speed Sprint ➔
                </button>
              </div>

              {/* Mode Card 4: Bookmarks Revision */}
              <div
                style={{
                  backgroundColor: 'var(--white, #ffffff)',
                  border: '1.5px solid var(--paper-line)',
                  borderRadius: '12px',
                  padding: '20px',
                  boxShadow: 'var(--shadow)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <span style={{ fontSize: '28px' }}>🔖</span>
                    <span
                      style={{
                        fontSize: '10.5px',
                        fontFamily: "var(--font-sans)",
                        fontWeight: 700,
                        backgroundColor: 'rgba(99, 102, 241, 0.12)',
                        color: '#6366f1',
                        padding: '3px 8px',
                        borderRadius: '4px',
                      }}
                    >
                      SAVED DRILL
                    </span>
                  </div>
                  <h3 style={{ fontFamily: "var(--font-sans)", fontSize: '17px', fontWeight: 700, margin: '0 0 8px 0', color: 'var(--ink)' }}>
                    Bookmarked Questions Drill
                  </h3>
                  <p style={{ fontSize: '13px', lineHeight: 1.5, color: 'var(--ink-soft)', margin: '0 0 16px 0' }}>
                    Generate a personalized exam constructed solely from tricky questions you have bookmarked during past drills and catalog explorations.
                  </p>
                </div>
                <Link
                  to="/bookmarks"
                  style={{
                    width: '100%',
                    padding: '10px',
                    fontSize: '13px',
                    fontWeight: 700,
                    borderRadius: '6px',
                    textDecoration: 'none',
                    backgroundColor: 'var(--paper)',
                    color: 'var(--ink)',
                    border: '1px solid var(--paper-line)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: '6px',
                    boxSizing: 'border-box',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--ink)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--paper-line)';
                  }}
                >
                  Open Bookmarks ➔
                </Link>
              </div>
            </div>
          </section>

          {/* ======================================================== */}
          {/* 3. EXAMINATION BOARDS SHOWCASE                           */}
          {/* ======================================================== */}
          <section>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div>
                <h2
                  style={{
                    fontFamily: "var(--font-sans)",
                    fontSize: '20px',
                    fontWeight: 700,
                    color: 'var(--ink, #14181c)',
                    margin: 0,
                  }}
                >
                  Choose Your Target Examination
                </h2>
                <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--ink-soft)' }}>
                  MarkDriller holds curated, verified past questions with detailed solutions from 1980 to 2025.
                </p>
              </div>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                gap: '16px',
              }}
            >
              {FALLBACK_BOARDS.map((board) => {
                // Find matching server exam if available
                const matchingExam = resolvedExams.find(
                  (e) => e.shortCode?.toUpperCase() === board.shortCode.toUpperCase() || e.slug === board.id
                );
                const targetExamId = matchingExam?._id || board.id;

                return (
                  <div
                    key={board.id}
                    style={{
                      backgroundColor: 'var(--white, #ffffff)',
                      border: '1.5px solid var(--paper-line)',
                      borderRadius: '12px',
                      padding: '22px',
                      boxShadow: 'var(--shadow)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      position: 'relative',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                        <div>
                          <span
                            style={{
                              fontSize: '11px',
                              fontFamily: "var(--font-sans)",
                              fontWeight: 700,
                              backgroundColor: board.popular
                                ? 'var(--rust-soft, rgba(168, 86, 47, 0.12))'
                                : 'var(--forest-soft, rgba(34, 90, 56, 0.12))',
                              color: board.popular ? 'var(--rust, #a8562f)' : 'var(--forest, #225a38)',
                              padding: '3px 8px',
                              borderRadius: '4px',
                              display: 'inline-block',
                              marginBottom: '6px',
                            }}
                          >
                            {board.badge}
                          </span>
                          <h3
                            style={{
                              fontFamily: "var(--font-sans)",
                              fontSize: '18px',
                              fontWeight: 700,
                              color: 'var(--ink)',
                              margin: 0,
                            }}
                          >
                            {board.shortCode}
                          </h3>
                        </div>
                        <span style={{ fontSize: '12px', color: 'var(--ink-soft)', fontFamily: "var(--font-sans)" }}>
                          {board.duration}
                        </span>
                      </div>

                      <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--ink-soft)', marginBottom: '8px' }}>
                        {board.name}
                      </div>

                      <p style={{ fontSize: '13px', lineHeight: 1.5, color: 'var(--ink-soft)', margin: '0 0 14px 0' }}>
                        {board.description}
                      </p>

                      <div
                        style={{
                          backgroundColor: 'var(--paper)',
                          border: '1px solid var(--paper-line)',
                          borderRadius: '8px',
                          padding: '10px 12px',
                          marginBottom: '16px',
                          fontSize: '12px',
                          color: 'var(--ink)',
                        }}
                      >
                        <span style={{ fontWeight: 700 }}>Curriculum Coverage: </span>
                        {board.subjectsSummary}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={() => handleLaunchMock(targetExamId, 'TIMED_MOCK')}
                        className="btn-custom btn-custom-primary"
                        style={{
                          flex: 1,
                          padding: '9px 12px',
                          fontSize: '13px',
                          fontWeight: 700,
                          borderRadius: '6px',
                          cursor: 'pointer',
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        Start Mock
                      </button>

                      <button
                        type="button"
                        onClick={() => handleLaunchMock(targetExamId, 'PRACTICE')}
                        style={{
                          flex: 1,
                          padding: '9px 12px',
                          fontSize: '13px',
                          fontWeight: 600,
                          borderRadius: '6px',
                          cursor: 'pointer',
                          backgroundColor: 'var(--paper)',
                          color: 'var(--ink)',
                          border: '1px solid var(--paper-line)',
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center',
                        }}
                      >
                        Custom Setup
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* ======================================================== */}
          {/* 4. OFFICIAL JAMB 8-KEY SHORTCUT SYSTEM GUIDE            */}
          {/* ======================================================== */}
          <section
            style={{
              backgroundColor: 'var(--white, #ffffff)',
              border: '1.5px solid var(--paper-line)',
              borderRadius: '16px',
              padding: 'clamp(20px, 2.5vw, 32px)',
              boxShadow: 'var(--shadow)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <span style={{ fontSize: '24px' }}>⌨️</span>
              <h2
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: '19px',
                  fontWeight: 700,
                  color: 'var(--ink, #14181c)',
                  margin: 0,
                }}
              >
                Official JAMB 8-Key Computer Navigation Standard
              </h2>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--ink-soft)', margin: '0 0 20px 0', maxWidth: '800px', lineHeight: 1.5 }}>
              In the actual JAMB UTME exam, using keyboard shortcuts is 300% faster than moving and clicking the mouse. MarkDriller’s simulator faithfully replicates this exact 8-key shortcut engine:
            </p>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '12px',
              }}
            >
              {[
                { key: 'A', action: 'Select Option A', desc: 'Instantly pick answer choice A' },
                { key: 'B', action: 'Select Option B', desc: 'Instantly pick answer choice B' },
                { key: 'C', action: 'Select Option C', desc: 'Instantly pick answer choice C' },
                { key: 'D', action: 'Select Option D', desc: 'Instantly pick answer choice D' },
                { key: 'P', action: 'Previous Question', desc: 'Jump back to preceding problem' },
                { key: 'N', action: 'Next Question', desc: 'Advance to subsequent problem' },
                { key: 'S', action: 'Submit Examination', desc: 'Triggers review modal & final submission' },
                { key: 'R', action: 'Reverse / Clear Choice', desc: 'Clears the chosen option on current question' },
              ].map((item) => (
                <div
                  key={item.key}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 14px',
                    backgroundColor: 'var(--paper)',
                    borderRadius: '8px',
                    border: '1px solid var(--paper-line)',
                  }}
                >
                  <span
                    style={{
                      fontFamily: "var(--font-sans)",
                      fontSize: '16px',
                      fontWeight: 800,
                      backgroundColor: 'var(--white)',
                      color: 'var(--rust, #a8562f)',
                      border: '1.5px solid var(--paper-line)',
                      borderRadius: '6px',
                      width: '38px',
                      height: '38px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.06)',
                      flexShrink: 0,
                    }}
                  >
                    {item.key}
                  </span>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ink)' }}>{item.action}</div>
                    <div style={{ fontSize: '11px', color: 'var(--ink-soft)' }}>{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ======================================================== */}
          {/* 5. RECENT CBT ATTEMPTS (IF AUTHENTICATED)                */}
          {/* ======================================================== */}
          {isAuthenticated && historyData?.results && historyData.results.length > 0 && (
            <section
              style={{
                backgroundColor: 'var(--white, #ffffff)',
                border: '1.5px solid var(--paper-line)',
                borderRadius: '16px',
                padding: '24px',
                boxShadow: 'var(--shadow)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '20px' }}>📊</span>
                  <h2
                    style={{
                      fontFamily: "var(--font-sans)",
                      fontSize: '18px',
                      fontWeight: 700,
                      color: 'var(--ink)',
                      margin: 0,
                    }}
                  >
                    Your Recent CBT Examinations
                  </h2>
                </div>
                <Link
                  to="/history"
                  style={{
                    color: 'var(--rust, #a8562f)',
                    fontSize: '12.5px',
                    fontWeight: 600,
                    textDecoration: 'none',
                  }}
                >
                  Full History ➔
                </Link>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
                {historyData.results.slice(0, 4).map((attempt: any) => {
                  const scorePercent = attempt.totalQuestions > 0
                    ? Math.round((attempt.score / attempt.totalQuestions) * 100)
                    : 0;
                  const isPass = scorePercent >= 50;

                  return (
                    <div
                      key={attempt._id}
                      style={{
                        padding: '16px',
                        borderRadius: '10px',
                        border: '1px solid var(--paper-line)',
                        backgroundColor: 'var(--paper)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: '12px',
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                          <span
                            style={{
                              fontSize: '11px',
                              fontFamily: "var(--font-sans)",
                              fontWeight: 700,
                              color: isPass ? 'var(--forest, #225a38)' : 'var(--rust, #a8562f)',
                              backgroundColor: isPass ? 'var(--forest-soft)' : 'var(--rust-soft)',
                              padding: '2px 6px',
                              borderRadius: '4px',
                            }}
                          >
                            {scorePercent}% SCORE
                          </span>
                          <span style={{ fontSize: '11px', color: 'var(--ink-soft)' }}>
                            {new Date(attempt.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <div style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--ink)', marginBottom: '4px' }}>
                          {attempt.examTitle || 'CBT Practice Session'}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--ink-soft)' }}>
                          Score: {attempt.score} / {attempt.totalQuestions} Questions
                        </div>
                      </div>

                      <Link
                        to={`/cbt/${attempt._id}/result`}
                        style={{
                          textDecoration: 'none',
                          fontSize: '12px',
                          fontWeight: 700,
                          color: 'var(--forest, #225a38)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        Review Detailed Solutions ➔
                      </Link>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* ======================================================== */}
          {/* 6. PRO SUBSCRIPTION UPGRADE TEASER                       */}
          {/* ======================================================== */}
          {!isPro && (
            <section
              style={{
                backgroundColor: 'var(--white, #ffffff)',
                border: '1.5px solid rgba(168, 86, 47, 0.25)',
                borderRadius: '16px',
                padding: '24px 30px',
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '20px',
                boxShadow: 'var(--shadow)',
              }}
            >
              <div style={{ maxWidth: '680px' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                  <span style={{ fontSize: '16px' }}>★</span>
                  <span
                    style={{
                      fontSize: '11px',
                      fontFamily: "var(--font-sans)",
                      fontWeight: 700,
                      color: 'var(--rust, #a8562f)',
                      textTransform: 'uppercase',
                    }}
                  >
                    Unlock Pro Examination Access
                  </span>
                </div>
                <h3
                  style={{
                    fontFamily: "var(--font-sans)",
                    fontSize: '18px',
                    fontWeight: 700,
                    margin: '0 0 6px 0',
                    color: 'var(--ink)',
                  }}
                >
                  Unlimited Mock Examinations &amp; AI Explanations
                </h3>
                <p style={{ margin: 0, fontSize: '13px', color: 'var(--ink-soft)', lineHeight: 1.5 }}>
                  Upgrade to MarkDriller Pro or redeem an offline scratch card PIN to unlock full unlimited JAMB/WAEC/NECO simulation tests, downloadable PDF revision summaries, and psychometric weak-topic diagnostics.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <Link
                  to="/portal/pricing"
                  className="btn-custom btn-custom-primary"
                  style={{
                    textDecoration: 'none',
                    padding: '10px 18px',
                    fontSize: '13px',
                    fontWeight: 700,
                    borderRadius: '6px',
                  }}
                >
                  View Pro Plans ➔
                </Link>
              </div>
            </section>
          )}

        </div>
      </main>

      {/* CBT Configuration Modal */}
      <CbtSetupModal
        isOpen={isSetupOpen}
        onClose={() => {
          setIsSetupOpen(false);
          setSelectedSubjectId(undefined);
        }}
        defaultExamId={selectedExamId}
        defaultSubjectId={selectedSubjectId}
        defaultMode={selectedMode}
      />
    </div>
  );
};

