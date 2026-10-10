import React, { useState, useEffect, useMemo } from 'react';
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

// Safe string extraction utility to prevent 'Objects are not valid as a React child' errors
const toText = (val: unknown, fallback = ''): string => {
  if (val === null || val === undefined) return fallback;
  if (typeof val === 'string') return val;
  if (typeof val === 'number') return String(val);
  if (typeof val === 'object') {
    const obj = val as Record<string, any>;
    if (typeof obj.name === 'string') return obj.name;
    if (typeof obj.title === 'string') return obj.title;
    if (typeof obj.shortCode === 'string') return obj.shortCode;
    if (typeof obj.code === 'string') return obj.code;
    if (typeof obj._id === 'string') return obj._id;
    if (typeof obj.id === 'string') return obj.id;
    try {
      return JSON.stringify(val);
    } catch {
      return fallback;
    }
  }
  return String(val);
};

// Safe formatted text renderer that preserves HTML markup (underline, super/sub, math, breaks) while preventing XSS
const renderRichText = (val: unknown): React.ReactNode => {
  const content = toText(val);
  if (!content) return null;

  // Check if content contains HTML tags or HTML character entities
  const hasHtml = /<\/?([a-z][a-z0-9]*)\b[^>]*>/i.test(content) || /&[a-z0-9#]+;/i.test(content);
  if (hasHtml) {
    const sanitized = content
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/\s*on\w+="[^"]*"/gi, '')
      .replace(/\s*on\w+='[^']*'/gi, '');
    return <span dangerouslySetInnerHTML={{ __html: sanitized }} />;
  }

  return <span>{content}</span>;
};


export const CbtExamRoom: React.FC = () => {
  const { attemptId } = useParams<{ attemptId: string }>();
  const navigate = useNavigate();
  const { notifySuccess, notifyError, notifyWarning } = useNotificationStore();

  const { data: attemptData, isLoading, isError, refetch } = useCbtAttemptQuery(attemptId);
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
      const safeAnswers = Array.isArray(attemptData.answers) ? attemptData.answers : [];
      safeAnswers.forEach((ans) => {
        const qId = toText(ans?.questionId);
        if (qId) {
          map[qId] = {
            selectedOption: ans?.selectedOption ?? null,
            isSkipped: Boolean(ans?.isSkipped),
            markedForReview: Boolean(ans?.markedForReview),
          };
        }
      });
      setAnswersMap(map);
    }
  }, [attemptData, attemptId, navigate]);

  // Authoritative server timer synchronization
  useEffect(() => {
    if (!attemptData?.endTime || attemptData.status !== 'IN_PROGRESS') return;

    const calculateRemaining = () => {
      const endMs = new Date(attemptData.endTime).getTime();
      return Math.max(0, Math.floor((endMs - Date.now()) / 1000));
    };

    setRemainingSeconds(calculateRemaining());

    const timer = setInterval(() => {
      const diff = calculateRemaining();
      setRemainingSeconds(diff);
      if (diff <= 0) {
        clearInterval(timer);
      }
    }, 1000);

    const handleSync = () => {
      setRemainingSeconds(calculateRemaining());
    };

    window.addEventListener('focus', handleSync);
    document.addEventListener('visibilitychange', handleSync);

    return () => {
      clearInterval(timer);
      window.removeEventListener('focus', handleSync);
      document.removeEventListener('visibilitychange', handleSync);
    };
  }, [attemptData?.endTime, attemptData?.status]);

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
      const sId = toText(q.subjectId || attemptData?.subjectId, 'default');
      const sName = toText(q.subjectName || attemptData?.subjectName, 'Subject');
      const sCode = toText(q.subjectCode || attemptData?.subjectCode, 'SUB');

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
  const currentQId = currentQuestion ? toText(currentQuestion._id) : '';

  const isCurrentBookmarked = useMemo(() => {
    if (!bookmarksData || !currentQuestion) return false;
    return bookmarksData.some(
      (b) => toText(b.question?._id || b.bookmarkId) === currentQId
    );
  }, [bookmarksData, currentQuestion, currentQId]);

  // Stop audio whenever question changes or on unmount
  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    } catch {
      // Ignore mobile WebKit audio policy errors
    }
    setIsSpeaking(false);
  }, [currentIndex]);

  useEffect(() => {
    return () => {
      try {
        if (typeof window !== 'undefined' && 'speechSynthesis' in window && window.speechSynthesis) {
          window.speechSynthesis.cancel();
        }
      } catch {
        // Ignore mobile WebKit audio policy errors
      }
    };
  }, []);

  const currentAnswer = (currentQId && answersMap[currentQId])
    ? answersMap[currentQId]
    : { selectedOption: null, markedForReview: false };

  const handleBookmarkToggle = () => {
    if (!currentQuestion || !currentQId) return;
    toggleBookmark.mutate(currentQId, {
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
    try {
      if (typeof window === 'undefined' || !('speechSynthesis' in window) || !window.speechSynthesis) {
        notifyWarning('Audio text-to-speech is not supported by your current browser.');
        return;
      }

      if (isSpeaking) {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
        return;
      }

      window.speechSynthesis.cancel();
      const cleanStem = toText(currentQuestion?.questionText).replace(/<[^>]*>/g, '').replace(/[\n\r]+/g, ' ');
      const optA = toText((currentQuestion as any)?.optionA).replace(/<[^>]*>/g, '');
      const optB = toText((currentQuestion as any)?.optionB).replace(/<[^>]*>/g, '');
      const optC = toText((currentQuestion as any)?.optionC).replace(/<[^>]*>/g, '');
      const optD = toText((currentQuestion as any)?.optionD).replace(/<[^>]*>/g, '');

      const speechText = `Question ${currentIndex + 1}. ${cleanStem}. Option A: ${optA}. Option B: ${optB}. Option C: ${optC}. Option D: ${optD}.`;

      const utterance = new SpeechSynthesisUtterance(speechText);
      utterance.rate = 0.95;
      utterance.pitch = 1.0;
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      setIsSpeaking(true);
      window.speechSynthesis.speak(utterance);
    } catch (audioErr) {
      console.warn('SpeechSynthesis error:', audioErr);
      setIsSpeaking(false);
      notifyWarning('Audio playback is restricted by your current device settings.');
    }
  };

  const handleSelectOption = (opt: 'A' | 'B' | 'C' | 'D') => {
    if (!currentQId) return;
    const updated = { ...currentAnswer, selectedOption: opt, isSkipped: false };
    setAnswersMap((prev) => ({ ...prev, [currentQId]: updated }));

    saveAnswer.mutate({
      questionId: currentQId,
      selectedOption: opt,
      isSkipped: false,
      markedForReview: updated.markedForReview,
    });
  };

  const handleSkipQuestion = () => {
    if (!currentQuestion || !currentQId) return;
    const updated = { ...currentAnswer, selectedOption: null, isSkipped: true };
    setAnswersMap((prev) => ({ ...prev, [currentQId]: updated }));

    saveAnswer.mutate({
      questionId: currentQId,
      selectedOption: null,
      isSkipped: true,
      markedForReview: updated.markedForReview,
    });

    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handleToggleReview = () => {
    if (!currentQId) return;
    const updated = { ...currentAnswer, markedForReview: !currentAnswer.markedForReview };
    setAnswersMap((prev) => ({ ...prev, [currentQId]: updated }));

    saveAnswer.mutate({
      questionId: currentQId,
      selectedOption: currentAnswer.selectedOption,
      isSkipped: !!currentAnswer.isSkipped,
      markedForReview: updated.markedForReview,
    });
  };

  // JAMB Standard 8-Key Keyboard Shortcuts (A, B, C, D to answer; P for Previous; N for Next; S for Skip; R for Review)
  // Must execute unconditionally at top level to strictly satisfy React Rules of Hooks
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isLoading || isError || !attemptData || questions.length === 0 || !currentQuestion) return;
      if (showSubmitModal || isCalculatorOpen) return;
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }

      const key = e.key.toUpperCase();
      if (['A', 'B', 'C', 'D'].includes(key)) {
        e.preventDefault();
        handleSelectOption(key as 'A' | 'B' | 'C' | 'D');
      } else if (key === 'S') {
        e.preventDefault();
        handleSkipQuestion();
      } else if (key === 'P') {
        e.preventDefault();
        setCurrentIndex((prev) => Math.max(0, prev - 1));
      } else if (key === 'N') {
        e.preventDefault();
        setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1));
      } else if (key === 'R') {
        e.preventDefault();
        handleToggleReview();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLoading, isError, attemptData, showSubmitModal, isCalculatorOpen, currentQuestion, currentAnswer, questions.length]);

  const handleFinalSubmit = async () => {
    setSubmitError(null);
    try {
      await submitCbt.mutateAsync();
      notifySuccess('Your examination has been submitted successfully. Your result is now available.');
      navigate(`/cbt/${attemptId}/result`, { replace: true });
    } catch (err: any) {
      const msg = err.message || 'We encountered an issue submitting your examination to the server. Please check your network and try submitting again.';
      setSubmitError(msg);
      notifyError(msg);
    }
  };

  if (isLoading) {
    return <BrandLoader message="Loading examination room and synchronizing timer with server..." mode="fullscreen" />;
  }

  if (isError || !attemptData) {
    return (
      <div
        role="alert"
        style={{
          minHeight: '100dvh',
          backgroundColor: 'var(--paper, #fdfbf7)',
          color: 'var(--ink, #14181c)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            maxWidth: '520px',
            width: '100%',
            backgroundColor: 'var(--white, #ffffff)',
            border: '2px solid var(--paper-line, #e2ded5)',
            borderRadius: '8px',
            padding: 'clamp(24px, 5vw, 40px)',
            boxShadow: '0 12px 32px rgba(0, 0, 0, 0.12)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: 'rgba(194, 65, 12, 0.12)',
              color: 'var(--rust, #c2410c)',
              fontSize: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ✕
          </div>
          <h2 style={{ fontFamily: 'var(--font-sans)', fontSize: '22px', fontWeight: 700, margin: 0, color: 'var(--ink, #14181c)' }}>
            Unable to Load Examination
          </h2>
          <p style={{ color: 'var(--ink-soft, #5a6472)', fontSize: '14.5px', lineHeight: 1.6, margin: 0 }}>
            This examination session could not be retrieved. It may have expired, belonged to another account session, or does not exist.
          </p>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center', width: '100%', marginTop: '8px' }}>
            <button
              type="button"
              onClick={() => refetch()}
              className="btn-custom btn-custom-primary"
              style={{ cursor: 'pointer' }}
            >
              🔄 Refresh Session
            </button>
            <Link to="/portal/cbt" className="btn-custom btn-custom-secondary" style={{ textDecoration: 'none' }}>
              Launch New Exam
            </Link>
            <Link to="/dashboard" className="btn-custom btn-custom-ghost" style={{ textDecoration: 'none' }}>
              ← Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Fail-safe protection: Never render a silent blank screen if question pool is empty
  if (questions.length === 0 || !currentQuestion) {
    return (
      <div
        role="alert"
        style={{
          minHeight: '100dvh',
          backgroundColor: 'var(--paper, #fdfbf7)',
          color: 'var(--ink, #14181c)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            maxWidth: '520px',
            width: '100%',
            backgroundColor: 'var(--white, #ffffff)',
            border: '2px solid var(--paper-line, #e2ded5)',
            borderRadius: '8px',
            padding: 'clamp(24px, 5vw, 40px)',
            boxShadow: '0 12px 32px rgba(0, 0, 0, 0.12)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: 'rgba(217, 119, 6, 0.15)',
              color: 'var(--amber, #d97706)',
              fontSize: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            📋
          </div>
          <h2 style={{ fontFamily: 'var(--font-sans)', fontSize: '22px', fontWeight: 700, margin: 0, color: 'var(--ink, #14181c)' }}>
            No Questions Found for this Session
          </h2>
          <p style={{ color: 'var(--ink-soft, #5a6472)', fontSize: '14.5px', lineHeight: 1.6, margin: 0 }}>
            This examination session was created without matching questions or has already been concluded. You can return to your portal or configure a new CBT mock test.
          </p>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center', width: '100%', marginTop: '8px' }}>
            <Link to="/portal/cbt" className="btn-custom btn-custom-primary" style={{ textDecoration: 'none' }}>
              Launch New CBT Mock
            </Link>
            <Link to="/dashboard" className="btn-custom btn-custom-secondary" style={{ textDecoration: 'none' }}>
              ← Return to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }


  // Format timer MM:SS
  const mins = Math.floor((remainingSeconds || 0) / 60);
  const secs = (remainingSeconds || 0) % 60;
  const timerDisplay = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  const isUrgentTimer = (remainingSeconds || 0) < 300; // < 5 mins

  // Tally answered questions
  const totalQuestions = questions.length;
  const answeredCount = Object.values(answersMap).filter((a) => Boolean(a?.selectedOption)).length;
  const flaggedCount = Object.values(answersMap).filter((a) => Boolean(a?.markedForReview)).length;
  const unansweredCount = Math.max(0, totalQuestions - answeredCount);

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
              <BrandLogo size="sm" theme="dark" />
            </div>
            <span
              style={{
                fontFamily: "var(--font-sans)",
                fontWeight: 700,
                fontSize: '18px',
                color: 'var(--amber)',
              }}
            >
              {toText(attemptData?.examShortCode || attemptData?.examName, 'EXAM')}
            </span>
            <span style={{ color: 'rgba(255,255,255,0.4)' }}>|</span>
            <span style={{ fontSize: '15px', color: 'var(--white)', fontWeight: 600, fontFamily: "var(--font-sans)" }}>
              {subjectGroups.length > 1
                ? `Combined Mock (${subjectGroups.length} Subjects)`
                : `${toText(attemptData?.subjectName, 'Subject')} (${toText(attemptData?.subjectCode, 'SUB')})`}
            </span>
            <span
              style={{
                fontSize: '10.5px',
                fontFamily: "var(--font-sans)",
                fontWeight: 700,
                backgroundColor: 'rgba(255,255,255,0.15)',
                padding: '2px 8px',
                borderRadius: '3px',
                color: 'var(--white)',
                letterSpacing: '0.04em',
              }}
            >
              CBT SIMULATION
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
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
                style={{ flexShrink: 0, color: isUrgentTimer ? '#fecaca' : 'var(--amber)' }}
              >
                <circle cx="12" cy="14" r="8" />
                <line x1="12" y1="2" x2="12" y2="5" />
                <line x1="12" y1="14" x2="15" y2="11" />
              </svg>
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
                gap: '7px',
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
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
                style={{ flexShrink: 0 }}
              >
                <rect x="4" y="2" width="16" height="20" rx="2" />
                <line x1="8" y1="6" x2="16" y2="6" />
                <line x1="16" y1="14" x2="16" y2="14.01" />
                <line x1="16" y1="18" x2="16" y2="18.01" />
                <line x1="12" y1="14" x2="12" y2="14.01" />
                <line x1="12" y1="18" x2="12" y2="18.01" />
                <line x1="8" y1="14" x2="8" y2="14.01" />
                <line x1="8" y1="18" x2="8" y2="18.01" />
                <line x1="8" y1="10" x2="8" y2="10.01" />
                <line x1="12" y1="10" x2="12" y2="10.01" />
                <line x1="16" y1="10" x2="16" y2="10.01" />
              </svg>
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
              const subAnswered = subQuestions.filter((q) => Boolean(answersMap[q._id]?.selectedOption)).length;

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
                  <span>{toText(g.name, 'Subject')}</span>
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
                  {toText(currentQuestion.subjectName)}
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
                  {toText(currentQuestion.topicName)}
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
                {isSpeaking ? (
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" stroke="none" aria-hidden="true">
                    <rect x="5" y="5" width="14" height="14" rx="2" />
                  </svg>
                ) : (
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                    <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                  </svg>
                )}
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
                <svg width="13" height="13" viewBox="0 0 24 24" fill={isCurrentBookmarked ? '#d97706' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
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
                <svg width="13" height="13" viewBox="0 0 24 24" fill={currentAnswer.markedForReview ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
                  <line x1="4" y1="22" x2="4" y2="15" />
                </svg>
                <span>{currentAnswer.markedForReview ? 'Flagged' : 'Flag'}</span>
              </button>
            </div>
          </div>

          {/* Section Instruction if present */}
          {Boolean((currentQuestion as any).instruction || (currentQuestion as any).instructions) && (
            <div
              style={{
                fontSize: '13.5px',
                color: 'var(--ink-soft)',
                fontStyle: 'italic',
                backgroundColor: 'var(--paper)',
                padding: '8px 12px',
                borderRadius: '3px',
                borderLeft: '3px solid var(--rust)',
                lineHeight: 1.5,
              }}
            >
              {renderRichText((currentQuestion as any).instruction || (currentQuestion as any).instructions)}
            </div>
          )}

          {/* Reading Comprehension Passage if present */}
          {Boolean((currentQuestion as any).passage || (currentQuestion as any).context) && (
            <div
              style={{
                backgroundColor: 'var(--paper)',
                border: '1px solid var(--paper-line)',
                borderLeft: '4px solid var(--rust)',
                padding: '14px 18px',
                borderRadius: '4px',
                fontSize: '15px',
                lineHeight: 1.7,
                color: 'var(--ink)',
                fontFamily: "var(--font-serif, Georgia, serif)",
              }}
            >
              {renderRichText((currentQuestion as any).passage || (currentQuestion as any).context)}
            </div>
          )}

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
              fontWeight: 500,
            }}
          >
            {renderRichText(currentQuestion.questionText)}
          </div>

          {/* Options List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {(['A', 'B', 'C', 'D'] as const).map((opt) => {
              const optionValue = (currentQuestion as any)[`option${opt}`];
              const isSelected = currentAnswer.selectedOption === opt;

              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => handleSelectOption(opt)}
                  style={{
                    textAlign: 'left',
                    padding: '14px 18px',
                    borderRadius: '4px',
                    backgroundColor: isSelected ? 'var(--rust-soft)' : 'var(--paper)',
                    border: isSelected ? '2px solid var(--rust)' : '1px solid var(--paper-line)',
                    color: 'var(--ink)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    fontSize: '15.5px',
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
                      flexShrink: 0,
                    }}
                  >
                    {opt}
                  </span>
                  <span style={{ flex: 1, whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                    {renderRichText(optionValue)}
                  </span>
                  {isSelected && (
                    <span style={{ color: 'var(--rust)', fontSize: '16px', fontWeight: 700, flexShrink: 0 }}>✓</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Bottom Action Bar: Previous, Skip, Save Status, Next */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingTop: '16px',
              borderTop: '1px solid var(--paper-line)',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <button
              type="button"
              disabled={currentIndex === 0}
              onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
              className="btn-custom btn-custom-ghost"
              style={{
                opacity: currentIndex === 0 ? 0.35 : 1,
                fontSize: '13px',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
              title="Previous Question (Keyboard: P)"
            >
              <span>← Previous</span>
              <kbd style={{ fontSize: '10px', backgroundColor: 'var(--paper)', border: '1px solid var(--paper-line)', padding: '1px 5px', borderRadius: '3px' }}>P</kbd>
            </button>

            {/* MANDATORY SKIP BUTTON & STATUS (Requirement 9) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
              <button
                type="button"
                id="skip-question-button"
                onClick={handleSkipQuestion}
                className="btn-custom"
                style={{
                  color: currentAnswer.isSkipped ? '#ffffff' : 'var(--rust)',
                  backgroundColor: currentAnswer.isSkipped ? 'var(--rust)' : 'var(--rust-soft)',
                  border: '1.5px solid var(--rust)',
                  padding: '9px 18px',
                  borderRadius: '6px',
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.15s ease',
                  boxShadow: currentAnswer.isSkipped ? '0 1px 3px rgba(0,0,0,0.15)' : 'none',
                }}
                title="Skip this question without answering. It will be recorded as Skipped. (Keyboard: S)"
              >
                <span>⏭ Skip</span>
                <kbd style={{ fontSize: '10.5px', backgroundColor: currentAnswer.isSkipped ? 'rgba(255,255,255,0.25)' : 'var(--white)', color: currentAnswer.isSkipped ? '#ffffff' : 'var(--rust)', border: '1px solid rgba(0,0,0,0.1)', padding: '1px 5px', borderRadius: '3px' }}>S</kbd>
                {currentAnswer.isSkipped && <span style={{ fontSize: '11px', fontWeight: 600 }}>[Skipped]</span>}
              </button>

              <span style={{ fontSize: '12px', fontFamily: "var(--font-sans)", color: 'var(--ink-soft)' }}>
                {saveAnswer.isPending
                  ? 'Saving to server...'
                  : saveAnswer.isError
                  ? '⚠️ Network issue. Option re-selection will retry.'
                  : currentAnswer.selectedOption || currentAnswer.isSkipped
                  ? 'Answer synced with server ✓'
                  : ''}
              </span>
            </div>

            <button
              type="button"
              disabled={currentIndex === totalQuestions - 1}
              onClick={() => setCurrentIndex((prev) => Math.min(totalQuestions - 1, prev + 1))}
              className="btn-custom btn-custom-ghost"
              style={{
                opacity: currentIndex === totalQuestions - 1 ? 0.35 : 1,
                fontSize: '13px',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
              title="Next Question (Keyboard: N)"
            >
              <span>Next →</span>
              <kbd style={{ fontSize: '10px', backgroundColor: 'var(--paper)', border: '1px solid var(--paper-line)', padding: '1px 5px', borderRadius: '3px' }}>N</kbd>
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
              const qPaletteId = toText(q._id);
              const ans = answersMap[qPaletteId];
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
                  key={qPaletteId || idx}
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

