import React, { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useCbtResultQuery, type SubjectBreakdownItem } from '../api/cbt.js';
import { useAuthStore } from '../store/useAuthStore.js';
import { BrandLoader } from './BrandLoader.js';

type QuestionFilter = 'ALL' | 'INCORRECT' | 'CORRECT' | 'UNANSWERED';

export const CbtResultView: React.FC = () => {
  const { attemptId } = useParams<{ attemptId: string }>();
  const { data, isLoading, isError } = useCbtResultQuery(attemptId);
  const { user } = useAuthStore();

  const [activeFilter, setActiveFilter] = useState<QuestionFilter>('ALL');
  const [showJumpMatrix, setShowJumpMatrix] = useState(false);
  const [imageError, setImageError] = useState(false);

  const candidatePhotoUrl = useMemo(() => {
    if (imageError) {
      return '/assets/images/verified-candidate-passport.jpg';
    }
    return (user as any)?.avatar || '/assets/images/verified-candidate-passport.jpg';
  }, [(user as any)?.avatar, imageError]);

  // Declared before any conditional returns to strictly satisfy React Rules of Hooks
  const filteredQuestions = useMemo(() => {
    if (!data?.reviewedQuestions) return [];
    switch (activeFilter) {
      case 'CORRECT':
        return data.reviewedQuestions.filter((q) => q.isCorrect);
      case 'INCORRECT':
        return data.reviewedQuestions.filter((q) => !q.isCorrect && q.studentChoice !== null);
      case 'UNANSWERED':
        return data.reviewedQuestions.filter((q) => q.studentChoice === null);
      case 'ALL':
      default:
        return data.reviewedQuestions;
    }
  }, [data?.reviewedQuestions, activeFilter]);

  if (isLoading) {
    return <BrandLoader message="Authenticating server-authoritative score and syllabus breakdown..." mode="fullscreen" />;
  }

  if (isError || !data) {
    return (
      <div
        style={{
          minHeight: '100vh',
          backgroundColor: 'var(--color-bg)',
          color: 'var(--color-text)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          textAlign: 'center',
          gap: '16px',
        }}
      >
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: 'rgba(180, 35, 24, 0.1)',
            color: 'var(--color-error)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '28px',
          }}
        >
          ✕
        </div>
        <h2 style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, margin: 0 }}>Result Slip Not Found</h2>
        <p style={{ color: 'var(--color-text-muted)', maxWidth: '440px', lineHeight: 1.6, margin: 0 }}>
          We could not locate this CBT examination attempt. It may have expired, or the simulation ID is invalid.
        </p>
        <Link
          to="/dashboard"
          className="btn-custom btn-custom-primary"
          style={{
            marginTop: '8px',
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          ← Return to Student Portal
        </Link>
      </div>
    );
  }

  const { result, attempt, reviewedQuestions } = data;

  const scorePercentage = result.percentage;
  const isPass = scorePercentage >= 50;
  const isHighScorer = scorePercentage >= 75;

  const formattedMins = Math.floor(result.timeSpentSeconds / 60);
  const formattedSecs = result.timeSpentSeconds % 60;
  const timeSpentDisplay = `${formattedMins}m ${formattedSecs}s`;
  const paceSecondsPerQuestion = result.maxScore > 0 ? Math.round(result.timeSpentSeconds / result.maxScore) : 0;

  const candidateFullName = user?.fullName || 'Verified Examination Candidate';
  const candidateRegNumber = `MD-${attempt._id ? attempt._id.slice(-8).toUpperCase() : '2026-CBT'}`;
  const submissionDate = new Date(attempt.submittedAt).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  const submissionTime = new Date(attempt.submittedAt).toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const scrollToQuestion = (index: number) => {
    const el = document.getElementById(`question-card-${index}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--color-bg)',
        color: 'var(--color-text)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <main
        className="wrap"
        style={{
          flex: 1,
          padding: 'clamp(20px, 3vw, 40px) clamp(16px, 2.5vw, 32px)',
          boxSizing: 'border-box',
          width: '100%',
          maxWidth: '1240px',
          margin: '0 auto',
        }}
      >
        {/* Breadcrumb / Portal Return */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '20px',
            flexWrap: 'wrap',
            gap: '12px',
          }}
          className="no-print"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--color-text-muted)' }}>
            <Link to="/dashboard" style={{ color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 600 }}>
              Portal
            </Link>
            <span>/</span>
            <Link to="/portal/cbt" style={{ color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 600 }}>
              CBT Practice
            </Link>
            <span>/</span>
            <span>Official Result Slip</span>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button
              type="button"
              onClick={() => window.print()}
              className="btn-custom btn-custom-ghost"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                fontSize: '13px',
                fontWeight: 600,
              }}
            >
              <span>🖨️</span>
              <span>Print Official Slip</span>
            </button>
            <Link
              to="/portal/cbt"
              className="btn-custom btn-custom-primary"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 18px',
                fontSize: '13px',
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              <span>+ Start New Mock</span>
            </Link>
          </div>
        </div>

        {/* ======================================================== */}
        {/* OFFICIAL CANDIDATE EXAMINATION SLIP (HERO CARD)        */}
        {/* Works in both light & dark mode using design tokens      */}
        {/* ======================================================== */}
        <section
          style={{
            backgroundColor: 'var(--color-surface)',
            border: '1.5px solid var(--color-border)',
            borderRadius: '12px',
            boxShadow: 'var(--card-shadow)',
            padding: 'clamp(20px, 3vw, 36px)',
            marginBottom: '32px',
            position: 'relative',
            overflow: 'hidden',
          }}
          aria-label="Official Candidate Performance Certificate"
        >
          {/* Subtle Security Accent Bar */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '5px',
              background: 'linear-gradient(90deg, var(--color-primary) 0%, var(--color-secondary) 50%, var(--color-accent) 100%)',
            }}
          />

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '28px',
            }}
          >
            {/* Header Eyebrow & Official Security Watermark */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '12px',
                borderBottom: '1px dashed var(--color-border)',
                paddingBottom: '18px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span
                  style={{
                    backgroundColor: 'rgba(32, 47, 128, 0.08)',
                    color: 'var(--color-primary)',
                    padding: '4px 10px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontFamily: 'var(--font-sans)',
                    fontWeight: 700,
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                    border: '1px solid rgba(32, 47, 128, 0.16)',
                  }}
                >
                  MarkDriller Official Assessment
                </span>
                <span
                  style={{
                    backgroundColor: 'rgba(15, 143, 95, 0.09)',
                    color: 'var(--color-success)',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: 600,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  ✓ Biometrically Authenticated
                </span>
              </div>

              <div
                style={{
                  fontSize: '12px',
                  color: 'var(--color-text-muted)',
                  fontFamily: 'var(--font-sans)',
                  fontWeight: 500,
                }}
              >
                Simulation Reference: <strong style={{ color: 'var(--color-text)', fontFamily: 'monospace' }}>{candidateRegNumber}</strong>
              </div>
            </div>

            {/* Candidate Identity + Grade Dial Layout */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                gap: '28px',
                alignItems: 'center',
              }}
            >
              {/* Left Column: Candidate Human Portrait & Credentials */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '20px', flexWrap: 'wrap' }}>
                {/* Verified Candidate Portrait Frame */}
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <div
                    style={{
                      width: '108px',
                      height: '118px',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      border: '2.5px solid var(--color-primary)',
                      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
                      backgroundColor: 'var(--color-bg-muted)',
                      position: 'relative',
                    }}
                  >
                    <img
                      src={candidatePhotoUrl}
                      alt={`Verified Candidate ${candidateFullName}`}
                      onError={() => setImageError(true)}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        display: 'block',
                      }}
                    />
                  </div>

                  {/* Candidate Verification Stamp Overlay */}
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '-8px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      whiteSpace: 'nowrap',
                      backgroundColor: 'var(--color-primary)',
                      color: '#ffffff',
                      fontSize: '9.5px',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '10px',
                      boxShadow: '0 2px 6px rgba(0, 0, 0, 0.25)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                    }}
                  >
                    VERIFIED SLIP
                  </div>
                </div>

                {/* Candidate Info Details */}
                <div style={{ flex: 1, minWidth: '220px' }}>
                  <div
                    style={{
                      fontSize: '11px',
                      color: 'var(--color-accent)',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      marginBottom: '4px',
                    }}
                  >
                    Registered Candidate
                  </div>
                  <h1
                    style={{
                      fontSize: 'clamp(20px, 2.5vw, 26px)',
                      fontWeight: 700,
                      color: 'var(--color-text)',
                      margin: '0 0 6px',
                      lineHeight: 1.25,
                    }}
                  >
                    {candidateFullName}
                  </h1>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '13.5px', color: 'var(--color-text-muted)' }}>
                    <div>
                      <strong style={{ color: 'var(--color-text)' }}>Exam Board:</strong> {attempt.examShortCode} ({attempt.examName || 'National Examination'})
                    </div>
                    <div>
                      <strong style={{ color: 'var(--color-text)' }}>Curriculum Subject:</strong> {attempt.subjectName}
                    </div>
                    <div>
                      <strong style={{ color: 'var(--color-text)' }}>Test Sitting Date:</strong> {submissionDate} at {submissionTime} ({timeSpentDisplay})
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Server-Authoritative Grade Dial & Readiness Status */}
              <div
                style={{
                  backgroundColor: 'var(--color-bg-muted)',
                  border: isHighScorer
                    ? '2px solid var(--color-success)'
                    : isPass
                    ? '2px solid var(--color-warning)'
                    : '2px solid var(--color-error)',
                  borderRadius: '10px',
                  padding: '24px 28px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '20px',
                  position: 'relative',
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      color: isHighScorer
                        ? 'var(--color-success)'
                        : isPass
                        ? 'var(--color-warning)'
                        : 'var(--color-error)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      marginBottom: '4px',
                    }}
                  >
                    {isHighScorer ? '★ Distinction Level' : isPass ? '✓ Satisfactory Pass' : '⚠ Action Required'}
                  </div>

                  <div
                    style={{
                      fontSize: 'clamp(42px, 5vw, 54px)',
                      fontFamily: 'var(--font-sans)',
                      fontWeight: 800,
                      lineHeight: 1,
                      color: isHighScorer
                        ? 'var(--color-success)'
                        : isPass
                        ? 'var(--color-warning)'
                        : 'var(--color-error)',
                      margin: '2px 0 6px',
                    }}
                  >
                    {result.percentage}%
                  </div>

                  <div style={{ fontSize: '13px', color: 'var(--color-text)', fontWeight: 600 }}>
                    Score Points: {result.correctCount} / {result.maxScore} marks
                  </div>
                </div>

                {/* Readiness Rating Card */}
                <div style={{ textAlign: 'right', minWidth: '150px' }}>
                  <div
                    style={{
                      display: 'inline-block',
                      padding: '6px 12px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: 700,
                      backgroundColor: isHighScorer
                        ? 'rgba(15, 143, 95, 0.12)'
                        : isPass
                        ? 'rgba(199, 119, 0, 0.12)'
                        : 'rgba(180, 35, 24, 0.12)',
                      color: isHighScorer
                        ? 'var(--color-success)'
                        : isPass
                        ? 'var(--color-warning)'
                        : 'var(--color-error)',
                      marginBottom: '8px',
                    }}
                  >
                    {isHighScorer ? 'ADMISSION READY' : isPass ? 'COMPETITIVE STANDING' : 'REVISION NEEDED'}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                    Avg. Pacing: <strong>{paceSecondsPerQuestion}s</strong> / question
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                    Target Pacing: ~45–60s
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ======================================================== */}
        {/* STAT METRICS STRIP                                       */}
        {/* ======================================================== */}
        <section
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px',
            marginBottom: '36px',
          }}
          aria-label="Examination Performance Breakdown"
        >
          {/* Correct Answers */}
          <div
            style={{
              backgroundColor: 'var(--color-surface)',
              border: '1.5px solid var(--color-border)',
              borderRadius: '8px',
              padding: '20px',
              boxShadow: 'var(--card-shadow)',
              borderTop: '4px solid var(--color-success)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-success)', textTransform: 'uppercase' }}>
                Correct Answers
              </span>
              <span style={{ fontSize: '16px', color: 'var(--color-success)' }}>✓</span>
            </div>
            <div style={{ fontSize: '30px', fontWeight: 800, margin: '8px 0 2px', color: 'var(--color-text)' }}>
              {result.correctCount}
              <span style={{ fontSize: '15px', fontWeight: 500, color: 'var(--color-text-muted)' }}> / {result.maxScore}</span>
            </div>
            <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Marks awarded</span>
          </div>

          {/* Incorrect Answers - Correctly Tinted With Error State */}
          <div
            style={{
              backgroundColor: 'var(--color-surface)',
              border: '1.5px solid var(--color-border)',
              borderRadius: '8px',
              padding: '20px',
              boxShadow: 'var(--card-shadow)',
              borderTop: '4px solid var(--color-error)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-error)', textTransform: 'uppercase' }}>
                Incorrect Choices
              </span>
              <span style={{ fontSize: '16px', color: 'var(--color-error)' }}>✗</span>
            </div>
            <div style={{ fontSize: '30px', fontWeight: 800, margin: '8px 0 2px', color: 'var(--color-text)' }}>
              {result.incorrectCount}
            </div>
            <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Identified gaps to study</span>
          </div>

          {/* Unanswered / Skipped */}
          <div
            style={{
              backgroundColor: 'var(--color-surface)',
              border: '1.5px solid var(--color-border)',
              borderRadius: '8px',
              padding: '20px',
              boxShadow: 'var(--card-shadow)',
              borderTop: '4px solid var(--color-warning)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-warning)', textTransform: 'uppercase' }}>
                Skipped / Unanswered
              </span>
              <span style={{ fontSize: '16px', color: 'var(--color-warning)' }}>○</span>
            </div>
            <div style={{ fontSize: '30px', fontWeight: 800, margin: '8px 0 2px', color: 'var(--color-text)' }}>
              {result.unansweredCount}
            </div>
            <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Zero penalty items</span>
          </div>

          {/* Total Speed & Pacing */}
          <div
            style={{
              backgroundColor: 'var(--color-surface)',
              border: '1.5px solid var(--color-border)',
              borderRadius: '8px',
              padding: '20px',
              boxShadow: 'var(--card-shadow)',
              borderTop: '4px solid var(--color-primary)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-primary)', textTransform: 'uppercase' }}>
                Speed &amp; Duration
              </span>
              <span style={{ fontSize: '16px', color: 'var(--color-primary)' }}>⏱</span>
            </div>
            <div style={{ fontSize: '26px', fontWeight: 800, margin: '8px 0 2px', color: 'var(--color-text)' }}>
              {timeSpentDisplay}
            </div>
            <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>~{paceSecondsPerQuestion}s average per question</span>
          </div>
        </section>

        {/* ======================================================== */}
        {/* COMBINED SUBJECT BREAKDOWN (Multi-Subject JAMB mocks)    */}
        {/* ======================================================== */}
        {result.subjectBreakdown && result.subjectBreakdown.length > 1 && (
          <section style={{ marginBottom: '36px' }}>
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-primary)', textTransform: 'uppercase' }}>
                Multi-Subject Simulation
              </div>
              <h2 style={{ fontSize: '20px', fontWeight: 700, margin: '4px 0 0', color: 'var(--color-text)' }}>
                Combined Subject Performance
              </h2>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
              {result.subjectBreakdown.map((s: SubjectBreakdownItem, idx: number) => (
                <div
                  key={s.subjectId || idx}
                  style={{
                    backgroundColor: 'var(--color-surface)',
                    padding: '20px',
                    borderRadius: '8px',
                    border: '1.5px solid var(--color-border)',
                    boxShadow: 'var(--card-shadow)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '16px', color: 'var(--color-text)' }}>{s.subjectName}</div>
                      <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Code: {s.subjectCode}</div>
                    </div>
                    <span
                      style={{
                        fontWeight: 800,
                        fontSize: '20px',
                        color:
                          s.accuracyPercentage >= 70
                            ? 'var(--color-success)'
                            : s.accuracyPercentage >= 50
                            ? 'var(--color-warning)'
                            : 'var(--color-error)',
                      }}
                    >
                      {s.accuracyPercentage}%
                    </span>
                  </div>

                  <div
                    style={{
                      width: '100%',
                      height: '8px',
                      backgroundColor: 'var(--color-bg-muted)',
                      borderRadius: '4px',
                      overflow: 'hidden',
                      marginBottom: '10px',
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${s.accuracyPercentage}%`,
                        backgroundColor:
                          s.accuracyPercentage >= 70
                            ? 'var(--color-success)'
                            : s.accuracyPercentage >= 50
                            ? 'var(--color-warning)'
                            : 'var(--color-error)',
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', color: 'var(--color-text-muted)' }}>
                    <span>
                      Score: <strong style={{ color: 'var(--color-text)' }}>{s.correctAnswers}</strong> / {s.totalQuestions}
                    </span>
                    <span style={{ fontWeight: 600, color: s.accuracyPercentage >= 50 ? 'var(--color-success)' : 'var(--color-error)' }}>
                      {s.accuracyPercentage >= 50 ? '✓ Passing Standing' : '⚠ Priority Revision'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ======================================================== */}
        {/* SYLLABUS TOPIC BREAKDOWN                                 */}
        {/* ======================================================== */}
        {result.topicBreakdown && result.topicBreakdown.length > 0 && (
          <section style={{ marginBottom: '36px' }}>
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-primary)', textTransform: 'uppercase' }}>
                Curriculum Mastery Breakdown
              </div>
              <h2 style={{ fontSize: '20px', fontWeight: 700, margin: '4px 0 0', color: 'var(--color-text)' }}>
                Performance by Syllabus Topic
              </h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {result.topicBreakdown.map((t, idx) => (
                <div
                  key={idx}
                  style={{
                    backgroundColor: 'var(--color-surface)',
                    padding: '16px 20px',
                    borderRadius: '8px',
                    border: '1.5px solid var(--color-border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '12px',
                    boxShadow: 'var(--card-shadow)',
                  }}
                >
                  <div style={{ flex: 1, minWidth: '220px' }}>
                    <div style={{ fontWeight: 600, fontSize: '15px', color: 'var(--color-text)' }}>{t.topicName}</div>
                    <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                      {t.correctAnswers} of {t.totalQuestions} questions answered correctly
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div
                      style={{
                        width: '130px',
                        height: '8px',
                        backgroundColor: 'var(--color-bg-muted)',
                        borderRadius: '4px',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          height: '100%',
                          width: `${t.accuracyPercentage}%`,
                          backgroundColor:
                            t.accuracyPercentage >= 70
                              ? 'var(--color-success)'
                              : t.accuracyPercentage >= 50
                              ? 'var(--color-warning)'
                              : 'var(--color-error)',
                        }}
                      />
                    </div>
                    <span
                      style={{
                        fontWeight: 700,
                        fontSize: '14px',
                        minWidth: '46px',
                        textAlign: 'right',
                        color:
                          t.accuracyPercentage >= 70
                            ? 'var(--color-success)'
                            : t.accuracyPercentage >= 50
                            ? 'var(--color-warning)'
                            : 'var(--color-error)',
                      }}
                    >
                      {t.accuracyPercentage}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ======================================================== */}
        {/* INTERACTIVE WORKED SOLUTION & STEP-BY-STEP REVIEWER      */}
        {/* ======================================================== */}
        <section style={{ marginBottom: '48px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '16px',
              marginBottom: '20px',
            }}
          >
            <div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-primary)', textTransform: 'uppercase' }}>
                Interactive Worked Solutions
              </div>
              <h2 style={{ fontSize: '20px', fontWeight: 700, margin: '4px 0 0', color: 'var(--color-text)' }}>
                Step-by-Step Question Review &amp; Analysis
              </h2>
            </div>

            {/* Quick-Jump Matrix Toggle */}
            <button
              type="button"
              onClick={() => setShowJumpMatrix(!showJumpMatrix)}
              className="btn-custom btn-custom-ghost no-print"
              style={{
                fontSize: '13px',
                padding: '8px 16px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                fontWeight: 600,
              }}
            >
              <span>{showJumpMatrix ? '▲ Hide Jump Grid' : '▼ Jump to Question Matrix'}</span>
            </button>
          </div>

          {/* Quick-Jump Question Navigation Matrix */}
          {showJumpMatrix && (
            <div
              className="no-print"
              style={{
                backgroundColor: 'var(--color-surface)',
                border: '1.5px solid var(--color-border)',
                borderRadius: '8px',
                padding: '18px',
                marginBottom: '24px',
                boxShadow: 'var(--card-shadow)',
              }}
            >
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-text-muted)', marginBottom: '12px' }}>
                CLICK ANY QUESTION TO JUMP DIRECTLY:
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(40px, 1fr))',
                  gap: '8px',
                }}
              >
                {reviewedQuestions.map((q, idx) => {
                  const isCorrect = q.isCorrect;
                  const hasAnswered = q.studentChoice !== null;
                  const bg = isCorrect
                    ? 'var(--color-success)'
                    : hasAnswered
                    ? 'var(--color-error)'
                    : 'var(--color-border)';

                  return (
                    <button
                      key={q._id}
                      type="button"
                      onClick={() => scrollToQuestion(idx)}
                      style={{
                        backgroundColor: bg,
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '8px 0',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        transition: 'transform 0.15s ease',
                      }}
                      title={`Question ${idx + 1}: ${isCorrect ? 'Correct' : hasAnswered ? 'Incorrect' : 'Unanswered'}`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Review Filter Navigation Tabs */}
          <div
            className="no-print"
            style={{
              display: 'flex',
              gap: '8px',
              flexWrap: 'wrap',
              marginBottom: '24px',
              borderBottom: '1px solid var(--color-border)',
              paddingBottom: '12px',
            }}
          >
            <button
              type="button"
              onClick={() => setActiveFilter('ALL')}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: 600,
                border: activeFilter === 'ALL' ? '1.5px solid var(--color-primary)' : '1px solid var(--color-border)',
                backgroundColor: activeFilter === 'ALL' ? 'var(--color-primary)' : 'var(--color-surface)',
                color: activeFilter === 'ALL' ? '#ffffff' : 'var(--color-text)',
                cursor: 'pointer',
              }}
            >
              All Questions ({reviewedQuestions.length})
            </button>

            <button
              type="button"
              onClick={() => setActiveFilter('INCORRECT')}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: 600,
                border: activeFilter === 'INCORRECT' ? '1.5px solid var(--color-error)' : '1px solid var(--color-border)',
                backgroundColor: activeFilter === 'INCORRECT' ? 'var(--color-error)' : 'var(--color-surface)',
                color: activeFilter === 'INCORRECT' ? '#ffffff' : 'var(--color-text)',
                cursor: 'pointer',
              }}
            >
              ✗ Incorrect ({result.incorrectCount})
            </button>

            <button
              type="button"
              onClick={() => setActiveFilter('CORRECT')}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: 600,
                border: activeFilter === 'CORRECT' ? '1.5px solid var(--color-success)' : '1px solid var(--color-border)',
                backgroundColor: activeFilter === 'CORRECT' ? 'var(--color-success)' : 'var(--color-surface)',
                color: activeFilter === 'CORRECT' ? '#ffffff' : 'var(--color-text)',
                cursor: 'pointer',
              }}
            >
              ✓ Correct ({result.correctCount})
            </button>

            <button
              type="button"
              onClick={() => setActiveFilter('UNANSWERED')}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: 600,
                border: activeFilter === 'UNANSWERED' ? '1.5px solid var(--color-warning)' : '1px solid var(--color-border)',
                backgroundColor: activeFilter === 'UNANSWERED' ? 'var(--color-warning)' : 'var(--color-surface)',
                color: activeFilter === 'UNANSWERED' ? '#ffffff' : 'var(--color-text)',
                cursor: 'pointer',
              }}
            >
              ○ Skipped ({result.unansweredCount})
            </button>
          </div>

          {/* Questions Cards List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
            {filteredQuestions.length === 0 ? (
              <div
                style={{
                  backgroundColor: 'var(--color-surface)',
                  padding: '40px 20px',
                  borderRadius: '8px',
                  border: '1.5px solid var(--color-border)',
                  textAlign: 'center',
                  color: 'var(--color-text-muted)',
                }}
              >
                No questions found under the selected filter ({activeFilter.toLowerCase()}).
              </div>
            ) : (
              filteredQuestions.map((q) => {
                const originalIndex = reviewedQuestions.findIndex((item) => item._id === q._id);
                const isCorrect = q.isCorrect;
                const hasAnswered = q.studentChoice !== null;

                const borderColor = isCorrect
                  ? 'var(--color-success)'
                  : hasAnswered
                  ? 'var(--color-error)'
                  : 'var(--color-border)';

                return (
                  <article
                    key={q._id}
                    id={`question-card-${originalIndex}`}
                    style={{
                      backgroundColor: 'var(--color-surface)',
                      border: `1.5px solid ${borderColor}`,
                      borderRadius: '8px',
                      padding: 'clamp(18px, 2.5vw, 26px)',
                      boxShadow: 'var(--card-shadow)',
                    }}
                  >
                    {/* Question Header & Status Pill */}
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '14px',
                        flexWrap: 'wrap',
                        gap: '8px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 800, fontSize: '16px', color: 'var(--color-text)' }}>
                          Question {originalIndex + 1}
                        </span>
                        {q.topicName && (
                          <span
                            style={{
                              fontSize: '11.5px',
                              backgroundColor: 'var(--color-bg-muted)',
                              color: 'var(--color-text-muted)',
                              padding: '3px 8px',
                              borderRadius: '4px',
                              fontWeight: 500,
                            }}
                          >
                            {q.topicName}
                          </span>
                        )}
                      </div>

                      <span
                        style={{
                          fontSize: '12px',
                          fontWeight: 700,
                          padding: '4px 10px',
                          borderRadius: '4px',
                          backgroundColor: isCorrect
                            ? 'rgba(15, 143, 95, 0.12)'
                            : hasAnswered
                            ? 'rgba(180, 35, 24, 0.12)'
                            : 'rgba(199, 119, 0, 0.12)',
                          color: isCorrect
                            ? 'var(--color-success)'
                            : hasAnswered
                            ? 'var(--color-error)'
                            : 'var(--color-warning)',
                        }}
                      >
                        {isCorrect
                          ? '✓ Correct (+1 Mark)'
                          : hasAnswered
                          ? `✗ Incorrect (Selected: Option ${q.studentChoice})`
                          : '○ Unanswered (0 Marks)'}
                      </span>
                    </div>

                    {/* Question Image Diagram (if present) */}
                    {(q as any).imageUrl && (
                      <div
                        style={{
                          textAlign: 'center',
                          margin: '8px 0 16px',
                          backgroundColor: 'var(--color-bg)',
                          padding: '12px',
                          borderRadius: '6px',
                          border: '1px solid var(--color-border)',
                        }}
                      >
                        <img
                          src={(q as any).imageUrl}
                          alt={`Figure diagram for Question ${originalIndex + 1}`}
                          style={{ maxWidth: '100%', maxHeight: '280px', objectFit: 'contain', borderRadius: '4px' }}
                        />
                      </div>
                    )}

                    {/* Question Text */}
                    <p
                      style={{
                        fontSize: '16px',
                        lineHeight: '1.65',
                        color: 'var(--color-text)',
                        margin: '0 0 18px',
                        whiteSpace: 'pre-wrap',
                      }}
                    >
                      {q.questionText}
                    </p>

                    {/* Options (A, B, C, D) List */}
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                        gap: '10px',
                        marginBottom: '18px',
                      }}
                    >
                      {(['A', 'B', 'C', 'D'] as const).map((opt) => {
                        const optionText = (q as any)[`option${opt}`];
                        const isOptionCorrect = opt === q.correctAnswer;
                        const isOptionStudentChoice = opt === q.studentChoice;

                        let bg = 'var(--color-bg)';
                        let border = '1px solid var(--color-border)';
                        let textColor = 'var(--color-text)';

                        if (isOptionCorrect) {
                          bg = 'rgba(15, 143, 95, 0.1)';
                          border = '1.5px solid var(--color-success)';
                        } else if (isOptionStudentChoice && !isOptionCorrect) {
                          bg = 'rgba(180, 35, 24, 0.1)';
                          border = '1.5px solid var(--color-error)';
                        }

                        return (
                          <div
                            key={opt}
                            style={{
                              padding: '12px 14px',
                              backgroundColor: bg,
                              border,
                              borderRadius: '6px',
                              fontSize: '13.5px',
                              color: textColor,
                              display: 'flex',
                              alignItems: 'center',
                              gap: '10px',
                            }}
                          >
                            <strong style={{ minWidth: '18px' }}>{opt}.</strong>
                            <span style={{ flex: 1 }}>{optionText}</span>
                            {isOptionCorrect && (
                              <span style={{ color: 'var(--color-success)', fontWeight: 800 }}>✓ Key</span>
                            )}
                            {isOptionStudentChoice && !isOptionCorrect && (
                              <span style={{ color: 'var(--color-error)', fontWeight: 800 }}>✗ Your Choice</span>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Worked Solution & Reasoning */}
                    <div
                      style={{
                        backgroundColor: 'var(--color-bg)',
                        padding: '16px 20px',
                        borderRadius: '6px',
                        borderLeft: '4px solid var(--color-primary)',
                        borderTop: '1px solid var(--color-border)',
                        borderRight: '1px solid var(--color-border)',
                        borderBottom: '1px solid var(--color-border)',
                      }}
                    >
                      <div
                        style={{
                          fontSize: '11.5px',
                          fontWeight: 700,
                          color: 'var(--color-primary)',
                          marginBottom: '6px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        <span>💡</span>
                        <span>OFFICIAL WORKED SOLUTION &amp; REASONING:</span>
                      </div>
                      <p
                        style={{
                          margin: 0,
                          fontSize: '14.5px',
                          lineHeight: '1.65',
                          color: 'var(--color-text)',
                        }}
                      >
                        {q.explanation}
                      </p>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </section>

        {/* ======================================================== */}
        {/* ACTION BUTTONS (Hidden in Print)                         */}
        {/* ======================================================== */}
        <div
          className="no-print"
          style={{
            display: 'flex',
            gap: '16px',
            justifyContent: 'center',
            flexWrap: 'wrap',
            padding: '24px 0 40px',
          }}
        >
          <button
            type="button"
            onClick={() => window.print()}
            className="btn-custom btn-custom-ghost"
            style={{ padding: '12px 24px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}
          >
            <span>🖨️</span>
            <span>Print Official Result Slip</span>
          </button>
          <Link
            to="/dashboard"
            className="btn-custom btn-custom-primary"
            style={{ padding: '12px 28px', textDecoration: 'none', fontWeight: 600 }}
          >
            ← Return to Dashboard
          </Link>
          <Link
            to="/portal/questions"
            className="btn-custom btn-custom-ghost"
            style={{ padding: '12px 28px', textDecoration: 'none', fontWeight: 600 }}
          >
            Practice Question Bank
          </Link>
        </div>
      </main>

      {/* Embedded Clean Print Styles */}
      <style>{`
        @media print {
          .no-print {
            display: none !important;
          }
          body {
            background-color: #ffffff !important;
            color: #000000 !important;
          }
          main {
            padding: 0 !important;
            max-width: 100% !important;
          }
        }
      `}</style>
    </div>
  );
};
