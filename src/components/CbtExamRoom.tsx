import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  useCbtAttemptQuery,
  useSaveCbtAnswerMutation,
  useSubmitCbtMutation,
} from '../api/cbt.js';
import { useMyBookmarksQuery, useToggleBookmarkMutation } from '../api/questions.js';
import { useNotificationStore } from '../store/useNotificationStore.js';
import { BrandLogo } from './BrandLogo.js';
import { BrandLoader } from './BrandLoader.js';
import { CbtCalculatorModal } from './CbtCalculatorModal.js';

export const CbtExamRoom: React.FC = () => {
  const { attemptId } = useParams<{ attemptId: string }>();
  const navigate = useNavigate();
  const { notifySuccess, notifyError, notifyWarning } = useNotificationStore();

  const { data: attemptData, isLoading, isError } = useCbtAttemptQuery(attemptId);
  const saveAnswer = useSaveCbtAnswerMutation(attemptId);
  const submitCbt = useSubmitCbtMutation(attemptId);
  const { data: bookmarksData } = useMyBookmarksQuery();
  const toggleBookmark = useToggleBookmarkMutation();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answersMap, setAnswersMap] = useState<Record<string, { selectedOption: 'A' | 'B' | 'C' | 'D' | null; isSkipped?: boolean; markedForReview: boolean }>>({});
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [autoSubmitting, setAutoSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Sync initial state from server
  useEffect(() => {
    if (attemptData) {
      if (attemptData.status === 'COMPLETED' || attemptData.status === 'EXPIRED') {
        navigate(`/cbt/${attemptId}/result`, { replace: true });
        return;
      }

      setRemainingSeconds(attemptData.remainingSeconds);

      const map: Record<string, { selectedOption: 'A' | 'B' | 'C' | 'D' | null; isSkipped?: boolean; markedForReview: boolean }> = {};
      attemptData.answers.forEach((ans) => {
        map[ans.questionId] = {
          selectedOption: ans.selectedOption,
          isSkipped: !!ans.isSkipped,
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

  // Safe memoized questions array
  const questions = useMemo(() => attemptData?.questions || [], [attemptData?.questions]);

  // Multi-subject grouping calculation
  const subjectGroups = useMemo(() => {
    if (!questions || questions.length === 0) return [];
    const groups: Array<{
      id: string;
      name: string;
      code: string;
      startIndex: number;
      count: number;
    }> = [];
    const map = new Map<string, number>();

    questions.forEach((q, idx) => {
      const sId = q.subjectId || attemptData?.subjectId || 'default';
      const sName = q.subjectName || attemptData?.subjectName || 'Subject';
      const sCode = q.subjectCode || attemptData?.subjectCode || 'SUB';

      if (!map.has(sId)) {
        map.set(sId, groups.length);
        groups.push({
          id: sId,
          name: sName,
          code: sCode,
          startIndex: idx,
          count: 1,
        });
      } else {
        const gIdx = map.get(sId)!;
        groups[gIdx].count += 1;
      }
    });

    return groups;
  }, [questions, attemptData]);

  const currentSubjectGroup = useMemo(() => {
    if (!subjectGroups.length) return null;
    for (let i = subjectGroups.length - 1; i >= 0; i--) {
      if (currentIndex >= subjectGroups[i].startIndex) {
        return subjectGroups[i];
      }
    }
    return subjectGroups[0];
  }, [subjectGroups, currentIndex]);

  const currentQuestion = questions[currentIndex] ?? null;

  const isCurrentBookmarked = useMemo(() => {
    if (!bookmarksData || !currentQuestion) return false;
    return bookmarksData.some(
      (b) => b.question?._id === currentQuestion._id || b.bookmarkId === currentQuestion._id
    );
  }, [bookmarksData, currentQuestion]);

  // Stop audio whenever question changes or on unmount
  useEffect(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  }, [currentIndex]);

  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  if (isLoading) {
    return <BrandLoader message="Loading examination room and synchronizing timer with server..." mode="fullscreen" />;
  }

  if (isError || !attemptData) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: 'var(--paper)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
        <h2 style={{ fontFamily: "var(--font-sans)" }}>Unable to load examination</h2>
        <p style={{ color: 'var(--ink-soft)' }}>The examination attempt may have expired or does not exist.</p>
        <Link to="/dashboard" className="btn-custom btn-custom-primary">
          ← Return to Dashboard
        </Link>
      </div>
    );
  }

  if (!currentQuestion) return null;

  const currentAnswer = answersMap[currentQuestion._id] || { selectedOption: null, markedForReview: false };

  const handleBookmarkToggle = () => {
    if (!currentQuestion) return;
    toggleBookmark.mutate(currentQuestion._id, {
      onSuccess: (res) => {
        if (res.isBookmarked) {
          notifySuccess('Question saved to bookmarks.');
        } else {
          notifySuccess('Question removed from bookmarks.');
        }
      },
      onError: () => {
        notifyError('Unable to update bookmark status.');
      },
    });
  };

  const handleToggleAudio = () => {
    if (!('speechSynthesis' in window)) {
      notifyWarning('Audio text-to-speech is not supported by your current browser.');
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel();
    const cleanStem = currentQuestion.questionText.replace(/[\n\r]+/g, ' ');
    const optA = (currentQuestion as any).optionA || '';
    const optB = (currentQuestion as any).optionB || '';
    const optC = (currentQuestion as any).optionC || '';
    const optD = (currentQuestion as any).optionD || '';

    const speechText = `Question ${currentIndex + 1}. ${cleanStem}. Option A: ${optA}. Option B: ${optB}. Option C: ${optC}. Option D: ${optD}.`;

    const utterance = new SpeechSynthesisUtterance(speechText);
    utterance.rate = 0.95;
    utterance.pitch = 1.0;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const handleSelectOption = (opt: 'A' | 'B' | 'C' | 'D') => {
    const updated = { ...currentAnswer, selectedOption: opt, isSkipped: false };
    setAnswersMap((prev) => ({ ...prev, [currentQuestion._id]: updated }));

    saveAnswer.mutate({
      questionId: currentQuestion._id,
      selectedOption: opt,
      isSkipped: false,
      markedForReview: updated.markedForReview,
    });
  };

  const handleSkipQuestion = () => {
    if (!currentQuestion) return;
    const updated = { ...currentAnswer, selectedOption: null, isSkipped: true };
    setAnswersMap((prev) => ({ ...prev, [currentQuestion._id]: updated }));

    saveAnswer.mutate({
      questionId: currentQuestion._id,
      selectedOption: null,
      isSkipped: true,
      markedForReview: updated.markedForReview,
    });

    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handleToggleReview = () => {
    const updated = { ...currentAnswer, markedForReview: !currentAnswer.markedForReview };
    setAnswersMap((prev) => ({ ...prev, [currentQuestion._id]: updated }));

    saveAnswer.mutate({
      questionId: currentQuestion._id,
      selectedOption: currentAnswer.selectedOption,
      isSkipped: !!currentAnswer.isSkipped,
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
                fontFamily: "var(--font-sans)",
                fontWeight: 700,
                fontSize: '18px',
                color: 'var(--amber)',
              }}
            >
              {attemptData.examShortCode}
            </span>
            <span style={{ color: 'rgba(255,255,255,0.4)' }}>|</span>
            <span style={{ fontSize: '15px', color: 'var(--white)', fontWeight: 600, fontFamily: "var(--font-sans)" }}>
              {subjectGroups.length > 1
                ? `Combined Mock (${subjectGroups.length} Subjects)`
                : `${attemptData.subjectName} (${attemptData.subjectCode})`}
            </span>
            <span
              style={{
                fontSize: '10px',
                fontFamily: "var(--font-sans)",
                backgroundColor: 'rgba(255,255,255,0.12)',
                padding: '2px 6px',
                borderRadius: '2px',
                color: 'var(--white)',
              }}
            >
              {attemptData.mode}
            </span>
          </div>

          {/* Countdown Clock & Tools */}
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
                  fontFamily: "var(--font-sans)",
                  fontSize: '18px',
                  fontWeight: 700,
                  letterSpacing: '0.05em',
                  color: isUrgentTimer ? '#fecaca' : 'var(--white)',
                }}
              >
                {timerDisplay}
              </span>
            </div>

            {/* On-Screen Scientific Calculator Toggle */}
            <button
              type="button"
              onClick={() => setIsCalculatorOpen((prev) => !prev)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: isCalculatorOpen ? 'var(--rust)' : 'rgba(255,255,255,0.08)',
                border: isCalculatorOpen ? '1px solid var(--rust)' : '1px solid rgba(255,255,255,0.2)',
                padding: '6px 12px',
                borderRadius: '3px',
                color: 'var(--white)',
                fontSize: '12px',
                fontFamily: "var(--font-sans)",
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              title="Toggle On-Screen Scientific Calculator"
            >
              <span>🖩</span>
              <span>Calculator</span>
            </button>

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

      {/* Floating CBT On-Screen Scientific Calculator */}
      <CbtCalculatorModal isOpen={isCalculatorOpen} onClose={() => setIsCalculatorOpen(false)} />

      {/* Multi-Subject Selection Tab Bar (When multiple subjects are selected) */}
      {subjectGroups.length > 1 && (
        <div
          style={{
            backgroundColor: 'var(--white)',
            borderBottom: '1.5px solid var(--paper-line)',
            padding: '10px clamp(12px, 3vw, 24px)',
            boxShadow: '0 2px 4px rgba(0,0,0,0.03)',
          }}
        >
          <div
            className="wrap"
            style={{
              padding: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              overflowX: 'auto',
            }}
          >
            <span
              style={{
                fontSize: '12px',
                fontWeight: 700,
                fontFamily: "var(--font-sans)",
                color: 'var(--ink-soft)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginRight: '6px',
                whiteSpace: 'nowrap',
              }}
            >
              Subjects:
            </span>
            {subjectGroups.map((g) => {
              const isActive = currentSubjectGroup?.id === g.id;
              const subQuestions = questions.slice(g.startIndex, g.startIndex + g.count);
              const subAnswered = subQuestions.filter((q) => answersMap[q._id]?.selectedOption !== null).length;

              return (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => setCurrentIndex(g.startIndex)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '4px',
                    border: isActive ? '2px solid var(--rust)' : '1px solid var(--paper-line)',
                    backgroundColor: isActive ? 'var(--rust)' : 'var(--paper)',
                    color: isActive ? 'var(--white)' : 'var(--ink)',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '13px',
                    fontFamily: "var(--font-sans)",
                    whiteSpace: 'nowrap',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <span>{g.name}</span>
                  <span
                    style={{
                      fontSize: '11px',
                      fontFamily: "var(--font-sans)",
                      padding: '1px 6px',
                      borderRadius: '10px',
                      backgroundColor: isActive ? 'rgba(255,255,255,0.25)' : 'var(--white)',
                      color: isActive ? 'var(--white)' : 'var(--ink-soft)',
                      border: isActive ? 'none' : '1px solid var(--paper-line)',
                    }}
                  >
                    {subAnswered}/{g.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Main CBT Workspace Layout */}
      <div className="wrap cbt-exam-grid" style={{ flex: 1, padding: 'clamp(16px, 3vw, 24px) clamp(12px, 3vw, 24px)', boxSizing: 'border-box', width: '100%', maxWidth: '1200px', margin: '0 auto' }}>
        {/* Left Column: Active Question */}
        <div
          style={{
            backgroundColor: 'var(--white)',
            border: '1.5px solid var(--paper-line)',
            borderRadius: '4px',
            padding: 'clamp(14px, 3.5vw, 28px)',
            boxShadow: 'var(--shadow)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'clamp(14px, 3vw, 24px)',
          }}
        >
          {/* Question Sub-Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--paper-line)', paddingBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span
                style={{
                  fontFamily: "var(--font-sans)",
                  fontWeight: 700,
                  fontSize: '16px',
                  color: 'var(--ink)',
                }}
              >
                Question {currentIndex + 1} of {totalQuestions}
              </span>

              {currentQuestion.subjectName && subjectGroups.length > 1 && (
                <span
                  style={{
                    fontSize: '11px',
                    fontFamily: "var(--font-sans)",
                    fontWeight: 700,
                    backgroundColor: 'rgba(194, 65, 12, 0.1)',
                    color: 'var(--rust)',
                    padding: '2px 8px',
                    borderRadius: '2px',
                    border: '1px solid rgba(194, 65, 12, 0.2)',
                  }}
                >
                  {currentQuestion.subjectName}
                </span>
              )}

              {currentQuestion.topicName && (
                <span
                  style={{
                    fontSize: '11px',
                    fontFamily: "var(--font-sans)",
                    backgroundColor: 'var(--paper)',
                    color: 'var(--ink-soft)',
                    padding: '2px 8px',
                    borderRadius: '2px',
                    border: '1px solid var(--paper-line)',
                  }}
                >
                  {currentQuestion.topicName}
                </span>
              )}
            </div>

            {/* Action Buttons: Read Aloud + Bookmark + Flag for Review */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              {/* Native Speech Synthesis Button */}
              <button
                type="button"
                onClick={handleToggleAudio}
                style={{
                  background: isSpeaking ? '#e0f2fe' : 'var(--paper)',
                  border: isSpeaking ? '1px solid #0284c7' : '1px solid var(--paper-line)',
                  color: isSpeaking ? '#0369a1' : 'var(--ink)',
                  padding: '5px 11px',
                  borderRadius: '3px',
                  fontSize: '12px',
                  fontFamily: "var(--font-sans)",
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease',
                }}
                title="Read question and options aloud using browser speech"
              >
                <span>{isSpeaking ? '⏹' : '🔊'}</span>
                <span>{isSpeaking ? 'Stop Audio' : 'Read Aloud'}</span>
              </button>

              {/* Bookmark Question Button */}
              <button
                type="button"
                onClick={handleBookmarkToggle}
                disabled={toggleBookmark.isPending}
                style={{
                  background: isCurrentBookmarked ? '#fef3c7' : 'var(--paper)',
                  border: isCurrentBookmarked ? '1px solid #d97706' : '1px solid var(--paper-line)',
                  color: isCurrentBookmarked ? '#b45309' : 'var(--ink)',
                  padding: '5px 11px',
                  borderRadius: '3px',
                  fontSize: '12px',
                  fontFamily: "var(--font-sans)",
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease',
                }}
                title={isCurrentBookmarked ? 'Remove question from bookmarks' : 'Save question to bookmarks'}
              >
                <span>{isCurrentBookmarked ? '★' : '☆'}</span>
                <span>{isCurrentBookmarked ? 'Bookmarked' : 'Bookmark'}</span>
              </button>

              {/* Flag for Review */}
              <button
                type="button"
                onClick={handleToggleReview}
                style={{
                  background: currentAnswer.markedForReview ? '#fef3e2' : 'var(--paper)',
                  border: currentAnswer.markedForReview ? '1px solid var(--amber)' : '1px solid var(--paper-line)',
                  color: currentAnswer.markedForReview ? 'var(--amber-deep)' : 'var(--ink-soft)',
                  padding: '5px 11px',
                  borderRadius: '3px',
                  fontSize: '12px',
                  fontFamily: "var(--font-sans)",
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                🚩 {currentAnswer.markedForReview ? 'Flagged' : 'Flag'}
              </button>
            </div>
          </div>

          {/* Question Diagram / Image (if available) */}
          {currentQuestion.imageUrl && (
            <div style={{ textAlign: 'center', margin: '4px 0 12px', backgroundColor: 'var(--paper)', padding: '12px', borderRadius: '4px', border: '1px solid var(--paper-line)' }}>
              <img
                src={currentQuestion.imageUrl}
                alt={`Figure for question ${currentIndex + 1}`}
                style={{ maxWidth: '100%', maxHeight: '340px', objectFit: 'contain', borderRadius: '3px' }}
              />
            </div>
          )}

          {/* Question Stem */}
          <div
            style={{
              fontSize: '18px',
              lineHeight: '1.65',
              color: 'var(--ink)',
              fontFamily: "var(--font-sans)",
              whiteSpace: 'pre-wrap',
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
                    backgroundColor: isSelected ? 'var(--rust-soft)' : 'var(--paper)',
                    border: isSelected ? '2px solid var(--rust)' : '1px solid var(--paper-line)',
                    color: 'var(--ink)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    fontSize: '15px',
                    fontFamily: "var(--font-sans)",
                    transition: 'all 0.15s ease',
                  }}
                >
                  <span
                    style={{
                      fontFamily: "var(--font-sans)",
                      fontWeight: 700,
                      fontSize: '13px',
                      backgroundColor: isSelected ? 'var(--rust)' : 'var(--surface-hover)',
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

          {/* Practice and Study mode hint/explanation (Req 8) */}
          {(attemptData.mode === 'PRACTICE' || attemptData.mode === 'STUDY') && (
            <div style={{ padding: '14px 18px', backgroundColor: 'var(--paper)', borderRadius: '3px', borderLeft: '4px solid var(--steel)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <strong style={{ fontSize: '13px', fontFamily: "var(--font-sans)", color: 'var(--steel-deep)' }}>
                  {attemptData.mode === 'STUDY' ? '💡 STUDY MODE LEARNING FEEDBACK' : 'CORRECT ANSWER'}: {currentQuestion.correctAnswer || 'Displayed upon submission'}
                </strong>
                {attemptData.mode === 'STUDY' && currentAnswer.selectedOption && (
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '12px',
                      backgroundColor: currentAnswer.selectedOption === currentQuestion.correctAnswer ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                      color: currentAnswer.selectedOption === currentQuestion.correctAnswer ? '#16a34a' : '#dc2626',
                    }}
                  >
                    {currentAnswer.selectedOption === currentQuestion.correctAnswer ? '✓ Correct Choice' : '✗ Incorrect Choice'}
                  </span>
                )}
              </div>
              {currentQuestion.explanation && (
                <p style={{ margin: '6px 0 0', fontSize: '14px', color: 'var(--ink)', lineHeight: 1.5 }}>
                  {currentQuestion.explanation}
                </p>
              )}
            </div>
          )}

          {/* Bottom Navigation Buttons */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: '1px solid var(--paper-line)', flexWrap: 'wrap', gap: '10px' }}>
            <button
              type="button"
              disabled={currentIndex === 0}
              onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
              className="btn-custom btn-custom-ghost"
              style={{ opacity: currentIndex === 0 ? 0.4 : 1 }}
            >
              ← Previous Question
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button
                type="button"
                onClick={handleSkipQuestion}
                className="btn-custom btn-custom-ghost"
                style={{
                  color: 'var(--rust)',
                  borderColor: 'rgba(194, 65, 12, 0.3)',
                  backgroundColor: currentAnswer.isSkipped ? 'var(--rust-soft)' : 'transparent',
                  fontWeight: 600,
                }}
                title="Skip this question without answering. It will be recorded as Skipped."
              >
                ⏭ Skip Question
              </button>

              <span style={{ fontSize: '12px', fontFamily: "var(--font-sans)", color: 'var(--ink-soft)' }}>
                {saveAnswer.isPending ? 'Autosaving answer...' : 'Answer saved to server ✓'}
              </span>
            </div>

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
            border: '1.5px solid var(--paper-line)',
            borderRadius: '4px',
            padding: '20px',
            boxShadow: 'var(--shadow)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h3 style={{ fontSize: '15px', margin: 0, fontFamily: "var(--font-sans)" }}>
              Question Palette
            </h3>
            <span style={{ fontSize: '11px', fontFamily: "var(--font-sans)", color: 'var(--ink-soft)' }}>
              {answeredCount}/{totalQuestions} Answered
            </span>
          </div>

          {/* Legend */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '16px', fontSize: '11px', fontFamily: "var(--font-sans)" }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '12px', height: '12px', borderRadius: '2px', backgroundColor: '#e4f5ea', border: '1px solid #217844' }} />
              <span>Answered</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '12px', height: '12px', borderRadius: '2px', backgroundColor: '#fee2e2', border: '1px solid #ef4444' }} />
              <span>Skipped</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '12px', height: '12px', borderRadius: '2px', backgroundColor: 'var(--paper)', border: '1px solid var(--paper-line)' }} />
              <span>Unanswered</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '12px', height: '12px', borderRadius: '2px', backgroundColor: '#fef3e2', border: '1px solid var(--amber)' }} />
              <span>Flagged</span>
            </div>
          </div>

          {/* Palette Grid */}
          <div className="cbt-qnav-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(38px, 1fr))', gap: '6px', marginBottom: '20px' }}>
            {questions.map((q, idx) => {
              const ans = answersMap[q._id];
              const isCurrent = idx === currentIndex;
              const hasAnswered = ans && ans.selectedOption !== null;
              const isSkipped = ans && ans.isSkipped && ans.selectedOption === null;
              const isFlagged = ans && ans.markedForReview;

              let bg = 'var(--paper)';
              let border = '1px solid var(--paper-line)';
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
              } else if (isSkipped) {
                bg = '#fee2e2';
                border = '1.5px solid #ef4444';
                color = '#b91c1c';
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
                    fontFamily: "var(--font-sans)",
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
            <h2 style={{ fontSize: '22px', fontFamily: "var(--font-sans)", margin: '0 0 12px', color: 'var(--ink)' }}>
              Submit Examination?
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--ink-soft)', margin: '0 0 20px' }}>
              Please review your attempt summary before concluding this test session:
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '20px' }}>
              <div style={{ padding: '12px', backgroundColor: '#e4f5ea', borderRadius: '3px', textAlign: 'center' }}>
                <div style={{ fontSize: '20px', fontWeight: 700, fontFamily: "var(--font-sans)", color: '#11532c' }}>
                  {answeredCount}
                </div>
                <div style={{ fontSize: '11px', fontFamily: "var(--font-sans)", color: '#217844' }}>
                  Answered
                </div>
              </div>

              <div style={{ padding: '12px', backgroundColor: '#fde8e8', borderRadius: '3px', textAlign: 'center' }}>
                <div style={{ fontSize: '20px', fontWeight: 700, fontFamily: "var(--font-sans)", color: '#991b1b' }}>
                  {unansweredCount}
                </div>
                <div style={{ fontSize: '11px', fontFamily: "var(--font-sans)", color: '#b91c1c' }}>
                  Unanswered
                </div>
              </div>

              <div style={{ padding: '12px', backgroundColor: '#fef3e2', borderRadius: '3px', textAlign: 'center' }}>
                <div style={{ fontSize: '20px', fontWeight: 700, fontFamily: "var(--font-sans)", color: '#a16207' }}>
                  {flaggedCount}
                </div>
                <div style={{ fontSize: '11px', fontFamily: "var(--font-sans)", color: '#a16207' }}>
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

