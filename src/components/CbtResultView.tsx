import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useCbtResultQuery } from '../api/cbt.js';
import { PortalHeader } from './PortalHeader.js';
import { BrandLoader } from './BrandLoader.js';

export const CbtResultView: React.FC = () => {
  const { attemptId } = useParams<{ attemptId: string }>();
  const { data, isLoading, isError } = useCbtResultQuery(attemptId);

  if (isLoading) {
    return <BrandLoader message="Calculating server-authoritative score and topic breakdown..." mode="fullscreen" />;
  }

  if (isError || !data) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: 'var(--paper)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
        <h2 style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Result Not Found</h2>
        <p style={{ color: 'var(--ink-soft)' }}>We could not find the result for this examination attempt.</p>
        <Link to="/dashboard" className="btn-custom btn-custom-primary">
          ← Return to Dashboard
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

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--paper)', display: 'flex', flexDirection: 'column' }}>
      {/* Responsive Unified Header */}
      <PortalHeader badge="RESULT" badgeColor="forest" />

      {/* Main Content */}
      <main className="wrap" style={{ flex: 1, padding: 'clamp(20px, 4vw, 36px) clamp(16px, 3vw, 32px)', boxSizing: 'border-box', width: '100%', maxWidth: '1200px', margin: '0 auto' }}>
        {/* Score Card Banner */}
        <div
          style={{
            backgroundColor: 'var(--ink)',
            color: 'var(--white)',
            padding: '36px',
            borderRadius: '4px',
            marginBottom: '36px',
            border: '1.5px solid var(--ink)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '24px',
          }}
        >
          <div>
            <span className="eyebrow" style={{ color: 'var(--amber)', marginBottom: '8px', display: 'block' }}>
              Official Simulation Result
            </span>
            <h1 style={{ fontSize: 'clamp(28px, 4vw, 36px)', color: 'var(--white)', margin: '0 0 10px' }}>
              {attempt.examShortCode} · {attempt.subjectName}
            </h1>
            <p style={{ color: 'rgba(248,247,242,0.75)', fontSize: '15px', maxWidth: '54ch', margin: 0 }}>
              Submitted on {new Date(attempt.submittedAt).toLocaleDateString()} at{' '}
              {new Date(attempt.submittedAt).toLocaleTimeString()}. Total time taken: <strong>{timeSpentDisplay}</strong>.
            </p>
          </div>

          {/* Performance Circle / Badge */}
          <div
            style={{
              backgroundColor: 'rgba(255,255,255,0.06)',
              border: isHighScorer ? '2px solid #22c55e' : isPass ? '2px solid var(--amber)' : '2px solid #ef4444',
              borderRadius: '4px',
              padding: '20px 32px',
              textAlign: 'center',
              minWidth: '180px',
            }}
          >
            <div style={{ fontSize: '42px', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, color: 'var(--white)' }}>
              {result.percentage}%
            </div>
            <div
              style={{
                fontSize: '11px',
                fontFamily: "'JetBrains Mono', monospace",
                fontWeight: 700,
                color: isHighScorer ? '#4ade80' : isPass ? 'var(--amber)' : '#f87171',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              {isHighScorer ? '★ EXCELLENT GRADE' : isPass ? '✓ PASS GRADE' : 'NEEDS PRACTICE'}
            </div>
          </div>
        </div>

        {/* Detailed Breakdown Strip */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '40px' }}>
          <div style={{ backgroundColor: 'var(--white)', padding: '20px', borderRadius: '3px', border: '1.5px solid rgba(20,24,28,0.14)' }}>
            <span className="eyebrow" style={{ color: '#217844' }}>Correct Answers</span>
            <div style={{ fontSize: '28px', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, margin: '6px 0 2px' }}>
              {result.correctCount} / {result.maxScore}
            </div>
            <span style={{ fontSize: '12px', fontFamily: "'JetBrains Mono', monospace", color: 'var(--ink-soft)' }}>
              Earned mark points
            </span>
          </div>

          <div style={{ backgroundColor: 'var(--white)', padding: '20px', borderRadius: '3px', border: '1.5px solid rgba(20,24,28,0.14)' }}>
            <span className="eyebrow" style={{ color: '#b91c1c' }}>Incorrect Answers</span>
            <div style={{ fontSize: '28px', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, margin: '6px 0 2px' }}>
              {result.incorrectCount}
            </div>
            <span style={{ fontSize: '12px', fontFamily: "'JetBrains Mono', monospace", color: 'var(--ink-soft)' }}>
              Mistakes identified
            </span>
          </div>

          <div style={{ backgroundColor: 'var(--white)', padding: '20px', borderRadius: '3px', border: '1.5px solid rgba(20,24,28,0.14)' }}>
            <span className="eyebrow" style={{ color: 'var(--ink-soft)' }}>Unanswered</span>
            <div style={{ fontSize: '28px', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, margin: '6px 0 2px' }}>
              {result.unansweredCount}
            </div>
            <span style={{ fontSize: '12px', fontFamily: "'JetBrains Mono', monospace", color: 'var(--ink-soft)' }}>
              Skipped questions
            </span>
          </div>

          <div style={{ backgroundColor: 'var(--white)', padding: '20px', borderRadius: '3px', border: '1.5px solid rgba(20,24,28,0.14)' }}>
            <span className="eyebrow" style={{ color: 'var(--steel)' }}>Pacing &amp; Speed</span>
            <div style={{ fontSize: '28px', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, margin: '6px 0 2px' }}>
              {result.maxScore > 0 ? Math.round(result.timeSpentSeconds / result.maxScore) : 0}s
            </div>
            <span style={{ fontSize: '12px', fontFamily: "'JetBrains Mono', monospace", color: 'var(--ink-soft)' }}>
              Average per question
            </span>
          </div>
        </div>

        {/* Topic Breakdown Section */}
        {result.topicBreakdown && result.topicBreakdown.length > 0 && (
          <div style={{ marginBottom: '40px' }}>
            <div className="section-head" style={{ marginBottom: '20px' }}>
              <span className="eyebrow">Curriculum Mastery Breakdown</span>
              <h2>Performance by Syllabus Topic</h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {result.topicBreakdown.map((t, idx) => (
                <div
                  key={idx}
                  style={{
                    backgroundColor: 'var(--white)',
                    padding: '16px 20px',
                    borderRadius: '3px',
                    border: '1px solid rgba(20,24,28,0.12)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '12px',
                  }}
                >
                  <div style={{ flex: 1, minWidth: '220px' }}>
                    <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: '15px' }}>
                      {t.topicName}
                    </div>
                    <div style={{ fontSize: '12px', fontFamily: "'JetBrains Mono', monospace", color: 'var(--ink-soft)' }}>
                      {t.correctAnswers} of {t.totalQuestions} questions answered correctly
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{ width: '120px', height: '8px', backgroundColor: 'var(--paper)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div
                        style={{
                          height: '100%',
                          width: `${t.accuracyPercentage}%`,
                          backgroundColor: t.accuracyPercentage >= 70 ? '#22c55e' : t.accuracyPercentage >= 50 ? 'var(--amber)' : '#ef4444',
                        }}
                      />
                    </div>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: '14px', minWidth: '42px', textAlign: 'right' }}>
                      {t.accuracyPercentage}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Worked Explanations Review */}
        <div style={{ marginBottom: '48px' }}>
          <div className="section-head" style={{ marginBottom: '24px' }}>
            <span className="eyebrow">Comprehensive Review</span>
            <h2>Worked Solutions &amp; Step-by-Step Analysis</h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {reviewedQuestions.map((q, idx) => {
              const isCorrect = q.isCorrect;
              const hasAnswered = q.studentChoice !== null;

              return (
                <div
                  key={q._id}
                  style={{
                    backgroundColor: 'var(--white)',
                    border: isCorrect
                      ? '1.5px solid #22c55e'
                      : hasAnswered
                      ? '1.5px solid #ef4444'
                      : '1.5px solid rgba(20,24,28,0.2)',
                    borderRadius: '4px',
                    padding: '24px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '15px' }}>
                        Question {idx + 1}
                      </span>
                      {q.topicName && (
                        <span style={{ fontSize: '11px', fontFamily: "'JetBrains Mono', monospace", backgroundColor: 'var(--paper)', padding: '2px 6px', borderRadius: '2px' }}>
                          {q.topicName}
                        </span>
                      )}
                    </div>

                    <span
                      style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: '12px',
                        fontWeight: 700,
                        padding: '3px 8px',
                        borderRadius: '2px',
                        backgroundColor: isCorrect ? '#e4f5ea' : hasAnswered ? '#fde8e8' : '#fef3e2',
                        color: isCorrect ? '#217844' : hasAnswered ? '#b91c1c' : '#a16207',
                      }}
                    >
                      {isCorrect
                        ? '✓ Correct (+1 Mark)'
                        : hasAnswered
                        ? `✗ Incorrect (You selected: Option ${q.studentChoice})`
                        : '○ Unanswered (0 Marks)'}
                    </span>
                  </div>

                  <p style={{ fontSize: '16px', lineHeight: '1.6', fontFamily: "'Source Serif 4', Georgia, serif", margin: '0 0 16px' }}>
                    {q.questionText}
                  </p>

                  {/* Options List */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '8px', marginBottom: '16px' }}>
                    {(['A', 'B', 'C', 'D'] as const).map((opt) => {
                      const optionText = (q as any)[`option${opt}`];
                      const isOptionCorrect = opt === q.correctAnswer;
                      const isOptionStudentChoice = opt === q.studentChoice;

                      let bg = 'var(--paper)';
                      let border = '1px solid rgba(20,24,28,0.1)';

                      if (isOptionCorrect) {
                        bg = '#e4f5ea';
                        border = '1.5px solid #217844';
                      } else if (isOptionStudentChoice && !isOptionCorrect) {
                        bg = '#fde8e8';
                        border = '1.5px solid #b91c1c';
                      }

                      return (
                        <div
                          key={opt}
                          style={{
                            padding: '10px 12px',
                            backgroundColor: bg,
                            border,
                            borderRadius: '2px',
                            fontSize: '13.5px',
                            fontFamily: "'Space Grotesk', sans-serif",
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                          }}
                        >
                          <strong style={{ fontFamily: "'JetBrains Mono', monospace" }}>{opt}.</strong>
                          <span>{optionText}</span>
                          {isOptionCorrect && <span style={{ color: '#217844', marginLeft: 'auto' }}>✓</span>}
                          {isOptionStudentChoice && !isOptionCorrect && <span style={{ color: '#b91c1c', marginLeft: 'auto' }}>✗</span>}
                        </div>
                      );
                    })}
                  </div>

                  {/* Worked Explanation */}
                  <div style={{ backgroundColor: 'var(--paper)', padding: '14px 18px', borderRadius: '3px', borderLeft: '4px solid var(--rust)' }}>
                    <div style={{ fontSize: '11px', fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: 'var(--rust)', marginBottom: '4px' }}>
                      WORKED SOLUTION &amp; REASONING:
                    </div>
                    <p style={{ margin: 0, fontSize: '14.5px', lineHeight: '1.6', fontFamily: "'Source Serif 4', Georgia, serif" }}>
                      {q.explanation}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
          <Link to="/dashboard" className="btn-custom btn-custom-primary" style={{ padding: '12px 28px', textDecoration: 'none' }}>
            ← Return to Dashboard
          </Link>
          <Link to="/questions" className="btn-custom btn-custom-ghost" style={{ padding: '12px 28px', textDecoration: 'none' }}>
            Practice Question Bank
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="site-footer" style={{ padding: '24px 0' }}>
        <div className="wrap" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontFamily: "'JetBrains Mono', monospace", color: 'rgba(248,247,242,0.5)' }}>
          <span>© 2026 MARK DRILLER PLATFORM · SERVER-TIMED EXAMINATION ENGINE</span>
          <span>RESULT ID: {result._id}</span>
        </div>
      </footer>
    </div>
  );
};
