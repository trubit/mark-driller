import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useExamsQuery, useExamSubjectsQuery } from '../api/exams.js';
import { useStartCbtMutation } from '../api/cbt.js';
import { useMySubscriptionQuery } from '../api/subscriptions.js';
import { useAuthStore } from '../store/useAuthStore.js';

interface CbtSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultExamId?: string;
}

export const CbtSetupModal: React.FC<CbtSetupModalProps> = ({ isOpen, onClose, defaultExamId }) => {
  const navigate = useNavigate();
  const { user: authUser } = useAuthStore();
  const { data: currentSub } = useMySubscriptionQuery();
  const { data: exams } = useExamsQuery();

  const isPro = Boolean(currentSub?.isPro || authUser?.role === 'ADMIN');

  const [selectedExamId, setSelectedExamId] = useState(defaultExamId || '');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [mode, setMode] = useState<'TIMED_MOCK' | 'PRACTICE'>('TIMED_MOCK');
  const [durationMinutes, setDurationMinutes] = useState(15);
  const [questionCount, setQuestionCount] = useState(10);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Keep selected exam initialized and validated against available exams
  React.useEffect(() => {
    if (exams && exams.length > 0) {
      const isSelectedValid = exams.some((e) => e._id === selectedExamId);
      const isDefaultValid = defaultExamId && exams.some((e) => e._id === defaultExamId);
      if (!isSelectedValid) {
        setSelectedExamId(isDefaultValid ? defaultExamId : exams[0]._id);
      }
    }
  }, [exams, defaultExamId, selectedExamId]);

  const { data: subjects, isLoading: subjectsLoading } = useExamSubjectsQuery(
    selectedExamId || undefined
  );

  // Auto-select first valid subject whenever subjects list loads or updates
  React.useEffect(() => {
    if (subjects && subjects.length > 0) {
      const exists = subjects.some((s) => s._id === selectedSubjectId);
      if (!exists) {
        setSelectedSubjectId(subjects[0]._id);
      }
    }
  }, [subjects, selectedSubjectId]);

  const startCbt = useStartCbtMutation();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!isPro) {
      setErrorMessage('An active Pro subscription is required to launch CBT examinations.');
      return;
    }

    if (!selectedExamId || !selectedSubjectId) {
      setErrorMessage('Please select both an examination board and an active subject.');
      return;
    }

    try {
      const response = await startCbt.mutateAsync({
        examId: selectedExamId,
        subjectId: selectedSubjectId,
        mode,
        durationMinutes,
        questionCount,
      });

      onClose();
      navigate(`/cbt/${response.attemptId}`);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to start examination. Please try another subject.');
    }
  };

  return (
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
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: 'var(--white)',
          border: '2px solid var(--ink)',
          borderRadius: '4px',
          width: '100%',
          maxWidth: '520px',
          padding: '32px',
          boxShadow: '0 12px 36px rgba(0,0,0,0.25)',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'none',
            border: 'none',
            fontSize: '20px',
            cursor: 'pointer',
            color: 'var(--ink-soft)',
          }}
        >
          ✕
        </button>

        <span className="eyebrow" style={{ color: 'var(--rust)', marginBottom: '6px', display: 'block' }}>
          Computer-Based Test Setup
        </span>
        <h2 style={{ fontSize: '24px', fontFamily: "'Space Grotesk', sans-serif", margin: '0 0 8px', color: 'var(--ink)' }}>
          Configure Exam Simulation
        </h2>
        <p style={{ fontSize: '14px', color: 'var(--ink-soft)', margin: '0 0 24px' }}>
          Set your examination parameters. All timed mock attempts enforce server-calculated countdowns and official auto-submission rules.
        </p>

        {!isPro ? (
          <div>
            <div
              style={{
                padding: '24px',
                backgroundColor: '#fffaf8',
                border: '1.5px solid var(--rust)',
                borderRadius: '4px',
                marginBottom: '24px',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '32px', marginBottom: '10px' }}>🔒</div>
              <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '20px', color: 'var(--rust)', margin: '0 0 8px' }}>
                Pro Subscription Required
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--ink-soft)', lineHeight: 1.6, margin: '0 0 18px' }}>
                Official Computer-Based Test (CBT) mock simulations enforce server-validated countdown timers, automatic grading, topic diagnostics, and syllabus randomisation. These testing features are reserved for Pro Pass members.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxWidth: '360px', margin: '0 auto 20px', textAlign: 'left' }}>
                <div style={{ fontSize: '13px', color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: 'var(--rust)', fontWeight: 700 }}>✓</span> Unlimited Timed Mocks across all 6 Boards
                </div>
                <div style={{ fontSize: '13px', color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: 'var(--rust)', fontWeight: 700 }}>✓</span> Instant step-by-step worked explanations
                </div>
                <div style={{ fontSize: '13px', color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: 'var(--rust)', fontWeight: 700 }}>✓</span> Complete curriculum readiness diagnostics
                </div>
              </div>
              <button
                type="button"
                className="btn-custom btn-custom-primary"
                style={{ backgroundColor: 'var(--rust)', borderColor: 'var(--rust)', padding: '12px 24px', fontSize: '14px', fontWeight: 700, width: '100%' }}
                onClick={() => {
                  onClose();
                  navigate('/pricing');
                }}
              >
                Upgrade to Pro Pass (₦3,500/mo) ★
              </button>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button type="button" onClick={onClose} className="btn-custom btn-custom-ghost">
                Close
              </button>
            </div>
          </div>
        ) : (
          <div>
            {errorMessage && (
              <div
                style={{
                  padding: '12px 14px',
                  backgroundColor: '#fde8e8',
                  color: '#991b1b',
                  border: '1px solid #f8b4b4',
                  borderRadius: '2px',
                  fontSize: '13px',
                  marginBottom: '20px',
                }}
              >
                ⚠ {errorMessage}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Exam Board */}
              <div>
                <label
                  htmlFor="modalExamSelect"
                  style={{
                    display: 'block',
                    fontSize: '11px',
                    fontFamily: "'JetBrains Mono', monospace",
                    color: 'var(--ink)',
                    fontWeight: 700,
                    marginBottom: '4px',
                  }}
                >
                  EXAMINATION BOARD
                </label>
                <select
                  id="modalExamSelect"
                  value={selectedExamId}
                  onChange={(e) => {
                    setSelectedExamId(e.target.value);
                    setSelectedSubjectId('');
                  }}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '2px',
                    border: '1px solid rgba(20,24,28,0.2)',
                    backgroundColor: 'var(--paper)',
                    fontSize: '14px',
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontWeight: 600,
                  }}
                >
                  {exams?.map((exam) => (
                    <option key={exam._id} value={exam._id}>
                      {exam.shortCode} — {exam.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Subject */}
              <div>
                <label
                  htmlFor="modalSubjectSelect"
                  style={{
                    display: 'block',
                    fontSize: '11px',
                    fontFamily: "'JetBrains Mono', monospace",
                    color: 'var(--ink)',
                    fontWeight: 700,
                    marginBottom: '4px',
                  }}
                >
                  EXAMINATION SUBJECT
                </label>
                <select
                  id="modalSubjectSelect"
                  value={selectedSubjectId}
                  onChange={(e) => setSelectedSubjectId(e.target.value)}
                  disabled={subjectsLoading || !subjects || subjects.length === 0}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '2px',
                    border: '1px solid rgba(20,24,28,0.2)',
                    backgroundColor: 'var(--paper)',
                    fontSize: '14px',
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontWeight: 600,
                  }}
                >
                  {subjectsLoading ? (
                    <option value="">Loading subjects...</option>
                  ) : subjects && subjects.length > 0 ? (
                    subjects.map((sub) => (
                      <option key={sub._id} value={sub._id}>
                        {sub.name} ({sub.code}) — {sub.questionCount || 100} Questions
                      </option>
                    ))
                  ) : (
                    <option value="">No subjects currently available</option>
                  )}
                </select>
              </div>

              {/* Simulation Mode */}
              <div>
                <span
                  style={{
                    display: 'block',
                    fontSize: '11px',
                    fontFamily: "'JetBrains Mono', monospace",
                    color: 'var(--ink)',
                    fontWeight: 700,
                    marginBottom: '6px',
                  }}
                >
                  EXAMINATION MODE
                </span>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setMode('TIMED_MOCK')}
                    style={{
                      padding: '10px',
                      borderRadius: '2px',
                      border: mode === 'TIMED_MOCK' ? '2px solid var(--rust)' : '1px solid rgba(20,24,28,0.2)',
                      backgroundColor: mode === 'TIMED_MOCK' ? '#faede7' : 'var(--paper)',
                      color: mode === 'TIMED_MOCK' ? 'var(--rust)' : 'var(--ink)',
                      fontSize: '13px',
                      fontWeight: 600,
                      fontFamily: "'Space Grotesk', sans-serif",
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    <div>⏱️ Timed Mock</div>
                    <div style={{ fontSize: '11px', color: 'var(--ink-soft)', fontWeight: 400, marginTop: '2px' }}>
                      Official rules &amp; countdown
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMode('PRACTICE')}
                    style={{
                      padding: '10px',
                      borderRadius: '2px',
                      border: mode === 'PRACTICE' ? '2px solid var(--steel)' : '1px solid rgba(20,24,28,0.2)',
                      backgroundColor: mode === 'PRACTICE' ? '#e7edf3' : 'var(--paper)',
                      color: mode === 'PRACTICE' ? 'var(--steel)' : 'var(--ink)',
                      fontSize: '13px',
                      fontWeight: 600,
                      fontFamily: "'Space Grotesk', sans-serif",
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    <div>📖 Practice Mode</div>
                    <div style={{ fontSize: '11px', color: 'var(--ink-soft)', fontWeight: 400, marginTop: '2px' }}>
                      Untimed with hints
                    </div>
                  </button>
                </div>
              </div>

              {/* Duration & Question Count */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label
                    htmlFor="modalDurationSelect"
                    style={{
                      display: 'block',
                      fontSize: '11px',
                      fontFamily: "'JetBrains Mono', monospace",
                      color: 'var(--ink)',
                      fontWeight: 700,
                      marginBottom: '4px',
                    }}
                  >
                    DURATION
                  </label>
                  <select
                    id="modalDurationSelect"
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(parseInt(e.target.value, 10))}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: '2px',
                      border: '1px solid rgba(20,24,28,0.2)',
                      backgroundColor: 'var(--paper)',
                      fontSize: '13px',
                      fontFamily: "'Space Grotesk', sans-serif",
                    }}
                  >
                    <option value={10}>10 Minutes</option>
                    <option value={15}>15 Minutes</option>
                    <option value={20}>20 Minutes</option>
                    <option value={30}>30 Minutes</option>
                    <option value={45}>45 Minutes</option>
                    <option value={60}>60 Minutes</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="modalQuestionCountSelect"
                    style={{
                      display: 'block',
                      fontSize: '11px',
                      fontFamily: "'JetBrains Mono', monospace",
                      color: 'var(--ink)',
                      fontWeight: 700,
                      marginBottom: '4px',
                    }}
                  >
                    QUESTIONS
                  </label>
                  <select
                    id="modalQuestionCountSelect"
                    value={questionCount}
                    onChange={(e) => setQuestionCount(parseInt(e.target.value, 10))}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: '2px',
                      border: '1px solid rgba(20,24,28,0.2)',
                      backgroundColor: 'var(--paper)',
                      fontSize: '13px',
                      fontFamily: "'Space Grotesk', sans-serif",
                    }}
                  >
                    <option value={5}>5 Questions (Quick)</option>
                    <option value={10}>10 Questions (Standard)</option>
                    <option value={20}>20 Questions (Full)</option>
                  </select>
                </div>
              </div>

              <div style={{ marginTop: '12px', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={onClose} className="btn-custom btn-custom-ghost">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={startCbt.isPending || subjectsLoading || !selectedSubjectId}
                  className="btn-custom btn-custom-primary"
                >
                  {startCbt.isPending ? 'Preparing Exam...' : 'Start Examination →'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
