import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  useCbtAttemptQuery,
  useSaveCbtAnswerMutation,
  useSubmitCbtMutation,
} from '../api/cbt.js';
import { useNotificationStore } from '../store/useNotificationStore.js';
import { BrandLogo } from './BrandLogo.js';
import { BrandLoader } from './BrandLoader.js';

export const CbtExamRoom: React.FC = () => {
  const { attemptId } = useParams<{ attemptId: string }>();
  const navigate = useNavigate();
  const { notifySuccess, notifyError, notifyWarning } = useNotificationStore();

  const { data: attemptData, isLoading, isError } = useCbtAttemptQuery(attemptId);
  const saveAnswer = useSaveCbtAnswerMutation(attemptId);
  const submitCbt = useSubmitCbtMutation(attemptId);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answersMap, setAnswersMap] = useState<Record<string, { selectedOption: 'A' | 'B' | 'C' | 'D' | null; markedForReview: boolean }>>({});
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [autoSubmitting, setAutoSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Sync initial state from server
  useEffect(() => {
    if (attemptData) {
      if (attemptData.status === 'COMPLETED' || attemptData.status === 'EXPIRED') {
        navigate(`/cbt/${attemptId}/result`, { replace: true });
        return;
      }

      setRemainingSeconds(attemptData.remainingSeconds);

      const map: Record<string, { selectedOption: 'A' | 'B' | 'C' | 'D' | null; markedForReview: boolean }> = {};
      attemptData.answers.forEach((ans) => {
        map[ans.questionId] = {
          selectedOption: ans.selectedOption,
          markedForReview: !!ans.markedForReview,
        };
      });
      setAnswersMap(map);
    }
  }, [attemptData, attemptId, navigate]);

  // Countdown timer hook
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (remainingSeconds === null || remainingSeconds <= 0) return;

    timerRef.current = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(timerRef.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [remainingSeconds !== null]);

  // Auto-submit when countdown hits zero
  useEffect(() => {
    if (remainingSeconds === 0 && !autoSubmitting && attemptData?.status === 'IN_PROGRESS') {
      setAutoSubmitting(true);
      submitCbt
        .mutateAsync()
        .then(() => {
          notifySuccess('Examination time has expired. Your answers were submitted successfully.');
          navigate(`/cbt/${attemptId}/result`, { replace: true });
        })
        .catch((err) => {
          console.error('Auto-submit error:', err);
          notifyWarning('Examination time expired. Processing final submission with server...');
          navigate(`/cbt/${attemptId}/result`, { replace: true });
        });
    }
  }, [remainingSeconds, autoSubmitting, attemptData, attemptId, navigate, submitCbt, notifySuccess, notifyWarning]);

  if (isLoading) {
    return <BrandLoader message="Loading examination room and synchronizing timer with server..." mode="fullscreen" />;
  }

  if (isError || !attemptData) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: 'var(--paper)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
        <h2 style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Unable to load examination</h2>
        <p style={{ color: 'var(--ink-soft)' }}>The examination attempt may have expired or does not exist.</p>
        <Link to="/dashboard" className="btn-custom btn-custom-primary">
          ← Return to Dashboard
        </Link>
      </div>
    );
  }

  const questions = attemptData.questions || [];
  const currentQuestion = questions[currentIndex];
  if (!currentQuestion) return null;

  const currentAnswer = answersMap[currentQuestion._id] || { selectedOption: null, markedForReview: false };

  const handleSelectOption = (opt: 'A' | 'B' | 'C' | 'D') => {
    const updated = { ...currentAnswer, selectedOption: opt };
    setAnswersMap((prev) => ({ ...prev, [currentQuestion._id]: updated }));

    saveAnswer.mutate({
      questionId: currentQuestion._id,
      selectedOption: opt,
      markedForReview: updated.markedForReview,
    });
  };

  const handleToggleReview = () => {
    const updated = { ...currentAnswer, markedForReview: !currentAnswer.markedForReview };
    setAnswersMap((prev) => ({ ...prev, [currentQuestion._id]: updated }));

    saveAnswer.mutate({
      questionId: currentQuestion._id,
      selectedOption: currentAnswer.selectedOption,
      markedForReview: updated.markedForReview,
    });
  };

  const handleFinalSubmit = async () => {
    setSubmitError(null);
    try {
      await submitCbt.mutateAsync();
      notifySuccess('Your examination has been submitted successfully. Your result is now available.');
      navigate(`/cbt/${attemptId}/result`, { replace: true });
    } catch (err: any) {
      const msg = err.message || 'We encountered an issue submitting your examination. Your answers are saved locally. Please try submitting again.';
      setSubmitError(msg);
      notifyError(msg);
    }
  };

  // Format timer MM:SS
  const mins = Math.floor((remainingSeconds || 0) / 60);
  const secs = (remainingSeconds || 0) % 60;
  const timerDisplay = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  const isUrgentTimer = (remainingSeconds || 0) < 300; // < 5 mins

  // Tally answered questions
  const totalQuestions = questions.length;
  const answeredCount = Object.values(answersMap).filter((a) => a.selectedOption !== null).length;
  const flaggedCount = Object.values(answersMap).filter((a) => a.markedForReview).length;
  const unansweredCount = totalQuestions - answeredCount;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--paper)', display: 'flex', flexDirection: 'column' }}>
      {/* CBT Fixed Header */}
      <header
        style={{
          backgroundColor: 'var(--ink)',
          color: 'var(--white)',
          padding: '10px clamp(12px, 3vw, 24px)',
          borderBottom: '2px solid var(--ink)',
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }}
      >
        <div className="wrap" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', padding: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BrandLogo size="sm" />
            </div>
            <span
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontWeight: 700,
                fontSize: '18px',
                color: 'var(--amber)',
              }}
            >
              {attemptData.examShortCode}
            </span>
            <span style={{ color: 'rgba(255,255,255,0.4)' }}>|</span>
            <span style={{ fontSize: '15px', color: 'var(--white)', fontWeight: 600, fontFamily: "'Space Grotesk', sans-serif" }}>
              {attemptData.subjectName} ({attemptData.subjectCode})
            </span>
            <span
              style={{
                fontSize: '10px',
                fontFamily: "'JetBrains Mono', monospace",
                backgroundColor: 'rgba(255,255,255,0.12)',
                padding: '2px 6px',
                borderRadius: '2px',
                color: 'var(--white)',
              }}
            >
              {attemptData.mode}
            </span>
          </div>

          {/* Countdown Clock */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: isUrgentTimer ? '#7f1d1d' : 'rgba(255,255,255,0.08)',
                border: isUrgentTimer ? '1px solid #ef4444' : '1px solid rgba(255,255,255,0.15)',
                padding: '6px 14px',
                borderRadius: '3px',
                transition: 'background-color 0.3s ease',
              }}
            >
              <span style={{ fontSize: '13px' }}>⏱️</span>
              <span
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '18px',
                  fontWeight: 700,
                  letterSpacing: '0.05em',
                  color: isUrgentTimer ? '#fecaca' : 'var(--white)',
                }}
              >
                {timerDisplay}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setShowSubmitModal(true)}
              className="btn-custom btn-custom-primary"
              style={{ padding: '8px 18px', fontSize: '13px' }}
            >
              Submit Exam
            </button>
          </div>
        </div>
      </header>

      {/* Main CBT Workspace Layout */}
      <div className="wrap cbt-exam-grid" style={{ flex: 1, padding: 'clamp(16px, 3vw, 24px) clamp(12px, 3vw, 24px)', boxSizing: 'border-box', width: '100%', maxWidth: '1200px', margin: '0 auto' }}>
        {/* Left Column: Active Question */}
        <div
          style={{
            backgroundColor: 'var(--white)',
            border: '1.5px solid rgba(20,24,28,0.14)',
            borderRadius: '4px',
            padding: '32px',
            boxShadow: 'var(--shadow)',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
          }}
        >
          {/* Question Sub-Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(20,24,28,0.08)', paddingBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontWeight: 700,
                  fontSize: '16px',
                  color: 'var(--ink)',
                }}
              >
                Question {currentIndex + 1} of {totalQuestions}
              </span>
              {currentQuestion.topicName && (
                <span
                  style={{
                    fontSize: '11px',
                    fontFamily: "'JetBrains Mono', monospace",
                    backgroundColor: 'var(--paper)',
                    color: 'var(--ink-soft)',
                    padding: '2px 8px',
                    borderRadius: '2px',
                  }}
                >
                  {currentQuestion.topicName}
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={handleToggleReview}
              style={{
                background: currentAnswer.markedForReview ? '#fef3e2' : 'transparent',
                border: currentAnswer.markedForReview ? '1px solid var(--amber)' : '1px solid rgba(20,24,28,0.2)',
                color: currentAnswer.markedForReview ? 'var(--amber-deep)' : 'var(--ink-soft)',
                padding: '4px 10px',
                borderRadius: '3px',
                fontSize: '12px',
                fontFamily: "'JetBrains Mono', monospace",
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              🚩 {currentAnswer.markedForReview ? 'Flagged for Review' : 'Flag Question'}
            </button>
          </div>

          {/* Question Stem */}
          <div
            style={{
              fontSize: '18px',
              lineHeight: '1.65',
              color: 'var(--ink)',
              fontFamily: "'Source Serif 4', Georgia, serif",
            }}
          >
            {currentQuestion.questionText}
          </div>

          {/* Options List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {(['A', 'B', 'C', 'D'] as const).map((opt) => {
              const optionText = (currentQuestion as any)[`option${opt}`];
              const isSelected = currentAnswer.selectedOption === opt;

              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => handleSelectOption(opt)}
                  style={{
                    textAlign: 'left',
                    padding: '14px 18px',
                    borderRadius: '3px',
                    backgroundColor: isSelected ? '#faede7' : 'var(--paper)',
                    border: isSelected ? '2px solid var(--rust)' : '1px solid rgba(20,24,28,0.12)',
                    color: 'var(--ink)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    fontSize: '15px',
                    fontFamily: "'Space Grotesk', sans-serif",
                    transition: 'all 0.15s ease',
                  }}
                >
                  <span
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontWeight: 700,
                      fontSize: '13px',
                      backgroundColor: isSelected ? 'var(--rust)' : 'rgba(20,24,28,0.08)',
                      color: isSelected ? 'var(--white)' : 'var(--ink)',
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {opt}
                  </span>
                  <span style={{ flex: 1 }}>{optionText}</span>
                  {isSelected && (
                    <span style={{ color: 'var(--rust)', fontSize: '16px', fontWeight: 700 }}>✓</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Practice mode hint/explanation */}
          {attemptData.mode === 'PRACTICE' && currentQuestion.explanation && (
            <div style={{ padding: '14px 18px', backgroundColor: '#e7edf3', borderRadius: '3px', borderLeft: '4px solid var(--steel)' }}>
              <strong style={{ fontSize: '13px', fontFamily: "'JetBrains Mono', monospace", color: 'var(--steel-deep)' }}>
                CORRECT ANSWER: {currentQuestion.correctAnswer}
              </strong>
              <p style={{ margin: '6px 0 0', fontSize: '14px', color: 'var(--ink)' }}>{currentQuestion.explanation}</p>
            </div>
          )}

          {/* Bottom Navigation Buttons */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: '1px solid rgba(20,24,28,0.08)' }}>
            <button
              type="button"
              disabled={currentIndex === 0}
              onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
              className="btn-custom btn-custom-ghost"
              style={{ opacity: currentIndex === 0 ? 0.4 : 1 }}
            >
              ← Previous Question
            </button>

            <span style={{ fontSize: '12px', fontFamily: "'JetBrains Mono', monospace", color: 'var(--ink-soft)' }}>
              {saveAnswer.isPending ? 'Autosaving answer...' : 'Answer saved to server ✓'}
            </span>

            <button
              type="button"
              disabled={currentIndex === totalQuestions - 1}
              onClick={() => setCurrentIndex((prev) => Math.min(totalQuestions - 1, prev + 1))}
              className="btn-custom btn-custom-ghost"
              style={{ opacity: currentIndex === totalQuestions - 1 ? 0.4 : 1 }}
            >
              Next Question →
            </button>
          </div>
        </div>

        {/* Right Column: Question Navigation Palette */}
        <div
          style={{
            backgroundColor: 'var(--white)',
            border: '1.5px solid rgba(20,24,28,0.14)',
            borderRadius: '4px',
            padding: '20px',
            boxShadow: 'var(--shadow)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h3 style={{ fontSize: '15px', margin: 0, fontFamily: "'Space Grotesk', sans-serif" }}>
              Question Palette
            </h3>
            <span style={{ fontSize: '11px', fontFamily: "'JetBrains Mono', monospace", color: 'var(--ink-soft)' }}>
              {answeredCount}/{totalQuestions} Answered
            </span>
          </div>

          {/* Legend */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '16px', fontSize: '11px', fontFamily: "'JetBrains Mono', monospace" }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '12px', height: '12px', borderRadius: '2px', backgroundColor: '#e4f5ea', border: '1px solid #217844' }} />
              <span>Answered</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '12px', height: '12px', borderRadius: '2px', backgroundColor: 'var(--paper)', border: '1px solid rgba(20,24,28,0.2)' }} />
              <span>Unanswered</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '12px', height: '12px', borderRadius: '2px', backgroundColor: '#fef3e2', border: '1px solid var(--amber)' }} />
              <span>Flagged</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '12px', height: '12px', borderRadius: '2px', backgroundColor: 'var(--ink)' }} />
              <span>Current</span>
            </div>
          </div>

          {/* Palette Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px', marginBottom: '20px' }}>
            {questions.map((q, idx) => {
              const ans = answersMap[q._id];
              const isCurrent = idx === currentIndex;
              const hasAnswered = ans && ans.selectedOption !== null;
              const isFlagged = ans && ans.markedForReview;

              let bg = 'var(--paper)';
              let border = '1px solid rgba(20,24,28,0.18)';
              let color = 'var(--ink)';

              if (isCurrent) {
                bg = 'var(--ink)';
                border = '1px solid var(--ink)';
                color = 'var(--white)';
              } else if (isFlagged) {
                bg = '#fef3e2';
                border = '1.5px solid var(--amber)';
                color = 'var(--amber-deep)';
              } else if (hasAnswered) {
                bg = '#e4f5ea';
                border = '1.5px solid #217844';
                color = '#11532c';
              }

              return (
                <button
                  key={q._id}
                  type="button"
                  onClick={() => setCurrentIndex(idx)}
                  style={{
                    height: '40px',
                    borderRadius: '3px',
                    backgroundColor: bg,
                    border,
                    color,
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => setShowSubmitModal(true)}
            className="btn-custom btn-custom-primary"
            style={{ width: '100%', justifyContent: 'center' }}
          >
            Finish &amp; Submit
          </button>
        </div>
      </div>

      {/* Submission Confirmation Modal */}
      {showSubmitModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(20, 24, 28, 0.75)',
            backdropFilter: 'blur(3px)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
          onClick={() => setShowSubmitModal(false)}
        >
          <div
            style={{
              backgroundColor: 'var(--white)',
              border: '2px solid var(--ink)',
              borderRadius: '4px',
              width: '100%',
              maxWidth: '460px',
              padding: '28px',
              boxShadow: '0 12px 36px rgba(0,0,0,0.25)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <span className="eyebrow" style={{ color: 'var(--rust)', marginBottom: '4px', display: 'block' }}>
              Final Verification
            </span>
            <h2 style={{ fontSize: '22px', fontFamily: "'Space Grotesk', sans-serif", margin: '0 0 12px', color: 'var(--ink)' }}>
              Submit Examination?
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--ink-soft)', margin: '0 0 20px' }}>
              Please review your attempt summary before concluding this test session:
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '20px' }}>
              <div style={{ padding: '12px', backgroundColor: '#e4f5ea', borderRadius: '3px', textAlign: 'center' }}>
                <div style={{ fontSize: '20px', fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif", color: '#11532c' }}>
                  {answeredCount}
                </div>
                <div style={{ fontSize: '11px', fontFamily: "'JetBrains Mono', monospace", color: '#217844' }}>
                  Answered
                </div>
              </div>

              <div style={{ padding: '12px', backgroundColor: '#fde8e8', borderRadius: '3px', textAlign: 'center' }}>
                <div style={{ fontSize: '20px', fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif", color: '#991b1b' }}>
                  {unansweredCount}
                </div>
                <div style={{ fontSize: '11px', fontFamily: "'JetBrains Mono', monospace", color: '#b91c1c' }}>
                  Unanswered
                </div>
              </div>

              <div style={{ padding: '12px', backgroundColor: '#fef3e2', borderRadius: '3px', textAlign: 'center' }}>
                <div style={{ fontSize: '20px', fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif", color: '#a16207' }}>
                  {flaggedCount}
                </div>
                <div style={{ fontSize: '11px', fontFamily: "'JetBrains Mono', monospace", color: '#a16207' }}>
                  Flagged
                </div>
              </div>
            </div>

            {unansweredCount > 0 && (
              <div style={{ padding: '10px 14px', backgroundColor: '#fef3e2', borderRadius: '3px', color: '#a16207', fontSize: '12.5px', marginBottom: '20px' }}>
                ⚠️ You still have {unansweredCount} unanswered questions. Unanswered questions will be scored as 0.
              </div>
            )}

            {submitError && (
              <div style={{ padding: '10px 14px', backgroundColor: '#fde8e8', border: '1px solid #f87171', borderRadius: '3px', color: '#991b1b', fontSize: '13px', marginBottom: '16px' }}>
                {submitError}
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setShowSubmitModal(false)}
                className="btn-custom btn-custom-ghost"
              >
                Return to Exam
              </button>
              <button
                type="button"
                disabled={submitCbt.isPending}
                onClick={handleFinalSubmit}
                className="btn-custom btn-custom-primary"
              >
                {submitCbt.isPending ? 'Calculating Result...' : 'Confirm Submission'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
