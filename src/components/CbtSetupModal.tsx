import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useExamsQuery, useExamSubjectsQuery, useSubjectTopicsQuery } from '../api/exams.js';
import { useStartCbtMutation } from '../api/cbt.js';
import { useMySubscriptionQuery } from '../api/subscriptions.js';
import { useAuthStore } from '../store/useAuthStore.js';

interface CbtSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultExamId?: string;
  defaultSubjectId?: string;
  defaultTopicId?: string;
  defaultMode?: 'TIMED_MOCK' | 'PRACTICE';
}

type DrillScope = 'SINGLE' | 'MULTI' | 'BOOKMARKS';

export const CbtSetupModal: React.FC<CbtSetupModalProps> = ({
  isOpen,
  onClose,
  defaultExamId,
  defaultSubjectId,
  defaultTopicId,
  defaultMode = 'TIMED_MOCK',
}) => {
  const navigate = useNavigate();
  const { user: authUser } = useAuthStore();
  const { data: currentSub } = useMySubscriptionQuery();
  const { data: exams } = useExamsQuery();

  const isPro = Boolean(currentSub?.isPro || authUser?.role === 'ADMIN');

  const [drillScope, setDrillScope] = useState<DrillScope>(defaultTopicId ? 'SINGLE' : 'SINGLE');
  const [selectedExamId, setSelectedExamId] = useState(defaultExamId || '');
  const [selectedSubjectId, setSelectedSubjectId] = useState(defaultSubjectId || '');
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>([]);
  const [selectedTopicId, setSelectedTopicId] = useState(defaultTopicId || '');
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('ALL');
  const [mode, setMode] = useState<'TIMED_MOCK' | 'PRACTICE'>(defaultMode);
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [questionCount, setQuestionCount] = useState(20);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync default props when modal opens
  useEffect(() => {
    if (isOpen) {
      if (defaultExamId) setSelectedExamId(defaultExamId);
      if (defaultSubjectId) setSelectedSubjectId(defaultSubjectId);
      if (defaultTopicId) {
        setSelectedTopicId(defaultTopicId);
        setDrillScope('SINGLE');
      }
      if (defaultMode) setMode(defaultMode);
      setErrorMessage(null);
    }
  }, [isOpen, defaultExamId, defaultSubjectId, defaultTopicId, defaultMode]);

  // Keep selected exam valid
  useEffect(() => {
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

  const { data: topics, isLoading: topicsLoading } = useSubjectTopicsQuery(
    selectedSubjectId || undefined
  );

  // Auto-select initial subject when list loads
  useEffect(() => {
    if (subjects && subjects.length > 0) {
      const exists = subjects.some((s) => s._id === selectedSubjectId);
      if (!exists && !defaultSubjectId) {
        setSelectedSubjectId(subjects[0]._id);
      }
      if (selectedSubjectIds.length === 0) {
        // Pre-select up to 4 subjects for multi-subject simulation
        setSelectedSubjectIds(subjects.slice(0, Math.min(4, subjects.length)).map((s) => s._id));
      }
    }
  }, [subjects, selectedSubjectId, defaultSubjectId, selectedSubjectIds.length]);

  const startCbt = useStartCbtMutation();

  if (!isOpen) return null;

  const handleToggleMultiSubject = (subjectId: string) => {
    if (selectedSubjectIds.includes(subjectId)) {
      if (selectedSubjectIds.length > 1) {
        setSelectedSubjectIds((prev) => prev.filter((id) => id !== subjectId));
      }
    } else {
      if (selectedSubjectIds.length < 5) {
        setSelectedSubjectIds((prev) => [...prev, subjectId]);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!isPro) {
      setErrorMessage('An active Pro subscription is required to launch CBT examinations.');
      return;
    }

    if (!selectedExamId) {
      setErrorMessage('Please select an active examination board.');
      return;
    }

    if (drillScope === 'SINGLE' && !selectedSubjectId) {
      setErrorMessage('Please select a subject to drill.');
      return;
    }

    if (drillScope === 'MULTI' && selectedSubjectIds.length < 2) {
      setErrorMessage('Please select at least 2 subjects for a multi-subject simulation.');
      return;
    }

    try {
      const payload: any = {
        examId: selectedExamId,
        mode,
        durationMinutes,
        questionCount,
      };

      if (drillScope === 'BOOKMARKS') {
        payload.onlyBookmarked = true;
      } else if (drillScope === 'MULTI') {
        payload.subjectIds = selectedSubjectIds;
      } else {
        payload.subjectId = selectedSubjectId;
        if (selectedTopicId) payload.topicId = selectedTopicId;
        if (selectedYear) payload.year = parseInt(selectedYear, 10);
        if (selectedDifficulty !== 'ALL') payload.difficulty = selectedDifficulty;
      }

      const response = await startCbt.mutateAsync(payload);

      onClose();
      navigate(`/cbt/${response.attemptId}`);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to initialize examination. Please try another selection.');
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(11, 17, 32, 0.8)',
        backdropFilter: 'blur(4px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        overflowY: 'auto',
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: 'var(--white)',
          border: '1.5px solid var(--paper-line)',
          borderRadius: '6px',
          width: '100%',
          maxWidth: '560px',
          padding: 'clamp(20px, 4vw, 32px)',
          boxShadow: '0 20px 48px rgba(0,0,0,0.3)',
          position: 'relative',
          maxHeight: 'min(90vh, 90dvh)',
          overflowY: 'auto',
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
          title="Close dialog"
        >
          ✕
        </button>

        <span className="eyebrow" style={{ color: 'var(--rust)', marginBottom: '4px', display: 'block' }}>
          Examination Drill &amp; Mock Engine
        </span>
        <h2 style={{ fontSize: '22px', fontFamily: "var(--font-sans)", margin: '0 0 6px', color: 'var(--ink)' }}>
          Configure Examination Session
        </h2>
        <p style={{ fontSize: '13.5px', color: 'var(--ink-soft)', margin: '0 0 20px', lineHeight: 1.5 }}>
          Launch a targeted topic drill, multi-subject simulation, or practice your saved bookmarks. All sessions enforce server-authoritative scoring.
        </p>

        {!isPro ? (
          <div>
            <div
              style={{
                padding: '24px',
                backgroundColor: 'var(--rust-soft)',
                border: '1.5px solid var(--rust)',
                borderRadius: '6px',
                marginBottom: '20px',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>🔒</div>
              <h3 style={{ fontFamily: "var(--font-sans)", fontSize: '18px', color: 'var(--rust)', margin: '0 0 8px' }}>
                Pro Subscription Required
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--ink)', lineHeight: 1.6, margin: '0 0 16px' }}>
                Official Computer-Based Test (CBT) mock simulations enforce server-validated countdown timers, multi-subject navigation, and syllabus performance breakdowns.
              </p>
              <button
                type="button"
                className="btn-custom btn-custom-primary"
                style={{ backgroundColor: 'var(--rust)', borderColor: 'var(--rust)', padding: '10px 24px', fontSize: '13.5px', width: '100%' }}
                onClick={() => {
                  onClose();
                  navigate('/portal/pricing');
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
                  padding: '10px 14px',
                  backgroundColor: 'var(--rust-soft)',
                  color: 'var(--rust)',
                  border: '1px solid var(--rust)',
                  borderRadius: '4px',
                  fontSize: '13px',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <span>⚠</span>
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Scope Tabs: Single Subject vs Multi-Subject vs Bookmarks */}
              <div>
                <span style={{ display: 'block', fontSize: '11px', fontFamily: "var(--font-sans)", color: 'var(--ink-soft)', fontWeight: 700, marginBottom: '6px' }}>
                  SESSION CONFIGURATION TYPE
                </span>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setDrillScope('SINGLE')}
                    style={{
                      padding: '8px 10px',
                      borderRadius: '4px',
                      fontSize: '12.5px',
                      fontFamily: "var(--font-sans)",
                      fontWeight: 600,
                      border: drillScope === 'SINGLE' ? '2px solid var(--rust)' : '1px solid var(--paper-line)',
                      background: drillScope === 'SINGLE' ? 'var(--rust-soft)' : 'var(--paper)',
                      color: drillScope === 'SINGLE' ? 'var(--rust)' : 'var(--ink)',
                      cursor: 'pointer',
                    }}
                  >
                    🎯 Single Subject
                  </button>
                  <button
                    type="button"
                    onClick={() => setDrillScope('MULTI')}
                    style={{
                      padding: '8px 10px',
                      borderRadius: '4px',
                      fontSize: '12.5px',
                      fontFamily: "var(--font-sans)",
                      fontWeight: 600,
                      border: drillScope === 'MULTI' ? '2px solid var(--forest)' : '1px solid var(--paper-line)',
                      background: drillScope === 'MULTI' ? 'var(--forest-soft)' : 'var(--paper)',
                      color: drillScope === 'MULTI' ? 'var(--forest)' : 'var(--ink)',
                      cursor: 'pointer',
                    }}
                  >
                    📚 Multi-Subject
                  </button>
                  <button
                    type="button"
                    onClick={() => setDrillScope('BOOKMARKS')}
                    style={{
                      padding: '8px 10px',
                      borderRadius: '4px',
                      fontSize: '12.5px',
                      fontFamily: "var(--font-sans)",
                      fontWeight: 600,
                      border: drillScope === 'BOOKMARKS' ? '2px solid var(--amber)' : '1px solid var(--paper-line)',
                      background: drillScope === 'BOOKMARKS' ? 'var(--amber-soft)' : 'var(--paper)',
                      color: drillScope === 'BOOKMARKS' ? 'var(--amber)' : 'var(--ink)',
                      cursor: 'pointer',
                    }}
                  >
                    ★ Saved Bookmarks
                  </button>
                </div>
              </div>

              {/* Exam Board */}
              <div>
                <label
                  htmlFor="modalExamSelect"
                  style={{
                    display: 'block',
                    fontSize: '11px',
                    fontFamily: "var(--font-sans)",
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
                    setSelectedSubjectIds([]);
                    setSelectedTopicId('');
                  }}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '4px',
                    border: '1px solid var(--paper-line)',
                    backgroundColor: 'var(--paper)',
                    color: 'var(--ink)',
                    fontSize: '13.5px',
                    fontFamily: "var(--font-sans)",
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

              {/* SCOPE 1: Single Subject + Optional Topic Drill */}
              {drillScope === 'SINGLE' && (
                <>
                  <div>
                    <label
                      htmlFor="modalSubjectSelect"
                      style={{
                        display: 'block',
                        fontSize: '11px',
                        fontFamily: "var(--font-sans)",
                        color: 'var(--ink)',
                        fontWeight: 700,
                        marginBottom: '4px',
                      }}
                    >
                      SUBJECT
                    </label>
                    <select
                      id="modalSubjectSelect"
                      value={selectedSubjectId}
                      onChange={(e) => {
                        setSelectedSubjectId(e.target.value);
                        setSelectedTopicId('');
                      }}
                      disabled={subjectsLoading || !subjects || subjects.length === 0}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: '4px',
                        border: '1px solid var(--paper-line)',
                        backgroundColor: 'var(--paper)',
                        color: 'var(--ink)',
                        fontSize: '13.5px',
                        fontFamily: "var(--font-sans)",
                        fontWeight: 600,
                      }}
                    >
                      {subjectsLoading ? (
                        <option value="">Loading subjects...</option>
                      ) : subjects && subjects.length > 0 ? (
                        subjects.map((sub) => (
                          <option key={sub._id} value={sub._id}>
                            {sub.name} ({sub.code})
                          </option>
                        ))
                      ) : (
                        <option value="">No subjects currently available</option>
                      )}
                    </select>
                  </div>

                  {/* Practice by Topic Selector */}
                  <div>
                    <label
                      htmlFor="modalTopicSelect"
                      style={{
                        display: 'block',
                        fontSize: '11px',
                        fontFamily: "var(--font-sans)",
                        color: 'var(--ink)',
                        fontWeight: 700,
                        marginBottom: '4px',
                      }}
                    >
                      TOPIC DRILL (OPTIONAL)
                    </label>
                    <select
                      id="modalTopicSelect"
                      value={selectedTopicId}
                      onChange={(e) => setSelectedTopicId(e.target.value)}
                      disabled={topicsLoading || !topics || topics.length === 0}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: '4px',
                        border: '1px solid var(--paper-line)',
                        backgroundColor: 'var(--paper)',
                        color: 'var(--ink)',
                        fontSize: '13.5px',
                        fontFamily: "var(--font-sans)",
                      }}
                    >
                      <option value="">All Syllabus Topics (Full Coverage)</option>
                      {topics?.map((top) => (
                        <option key={top._id} value={top._id}>
                          {top.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Year & Difficulty Filters */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label
                        htmlFor="modalYearSelect"
                        style={{
                          display: 'block',
                          fontSize: '11px',
                          fontFamily: "var(--font-sans)",
                          color: 'var(--ink)',
                          fontWeight: 700,
                          marginBottom: '4px',
                        }}
                      >
                        PAST EXAM YEAR
                      </label>
                      <select
                        id="modalYearSelect"
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '8px 10px',
                          borderRadius: '4px',
                          border: '1px solid var(--paper-line)',
                          backgroundColor: 'var(--paper)',
                          color: 'var(--ink)',
                          fontSize: '13px',
                          fontFamily: "var(--font-sans)",
                        }}
                      >
                        <option value="">All Past Years</option>
                        <option value="2025">2025</option>
                        <option value="2024">2024</option>
                        <option value="2023">2023</option>
                        <option value="2022">2022</option>
                        <option value="2021">2021</option>
                        <option value="2020">2020</option>
                      </select>
                    </div>

                    <div>
                      <label
                        htmlFor="modalDifficultySelect"
                        style={{
                          display: 'block',
                          fontSize: '11px',
                          fontFamily: "var(--font-sans)",
                          color: 'var(--ink)',
                          fontWeight: 700,
                          marginBottom: '4px',
                        }}
                      >
                        DIFFICULTY
                      </label>
                      <select
                        id="modalDifficultySelect"
                        value={selectedDifficulty}
                        onChange={(e) => setSelectedDifficulty(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '8px 10px',
                          borderRadius: '4px',
                          border: '1px solid var(--paper-line)',
                          backgroundColor: 'var(--paper)',
                          color: 'var(--ink)',
                          fontSize: '13px',
                          fontFamily: "var(--font-sans)",
                        }}
                      >
                        <option value="ALL">Standard Mix</option>
                        <option value="EASY">Easy Foundation</option>
                        <option value="MEDIUM">Medium Examination</option>
                        <option value="HARD">Hard Challenge</option>
                      </select>
                    </div>
                  </div>
                </>
              )}

              {/* SCOPE 2: Multi-Subject Selection */}
              {drillScope === 'MULTI' && (
                <div>
                  <span style={{ display: 'block', fontSize: '11px', fontFamily: "var(--font-sans)", color: 'var(--ink)', fontWeight: 700, marginBottom: '6px' }}>
                    SELECT SUBJECT COMBINATION ({selectedSubjectIds.length} Selected · Max 5)
                  </span>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '8px', maxHeight: '160px', overflowY: 'auto', padding: '4px' }}>
                    {subjects?.map((sub) => {
                      const isChecked = selectedSubjectIds.includes(sub._id);
                      return (
                        <button
                          key={sub._id}
                          type="button"
                          onClick={() => handleToggleMultiSubject(sub._id)}
                          style={{
                            padding: '8px 10px',
                            borderRadius: '4px',
                            textAlign: 'left',
                            fontSize: '12px',
                            fontFamily: "var(--font-sans)",
                            fontWeight: isChecked ? 700 : 500,
                            border: isChecked ? '1.5px solid var(--forest)' : '1px solid var(--paper-line)',
                            background: isChecked ? 'var(--forest-soft)' : 'var(--paper)',
                            color: isChecked ? 'var(--forest)' : 'var(--ink)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                          }}
                        >
                          <span>{isChecked ? '☑' : '☐'}</span>
                          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {sub.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* SCOPE 3: Saved Bookmarks Notice */}
              {drillScope === 'BOOKMARKS' && (
                <div style={{ padding: '12px 14px', background: 'var(--amber-soft)', border: '1px solid var(--amber)', borderRadius: '4px', fontSize: '13px', color: 'var(--ink)' }}>
                  ★ <strong>Saved Bookmarks Drill</strong> will construct an interactive session composed exclusively of questions you flagged in the question bank or during prior examinations.
                </div>
              )}

              {/* Mode Selection */}
              <div>
                <span style={{ display: 'block', fontSize: '11px', fontFamily: "var(--font-sans)", color: 'var(--ink)', fontWeight: 700, marginBottom: '6px' }}>
                  SIMULATION MODE
                </span>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setMode('TIMED_MOCK')}
                    style={{
                      padding: '10px 12px',
                      borderRadius: '4px',
                      border: mode === 'TIMED_MOCK' ? '2px solid var(--rust)' : '1px solid var(--paper-line)',
                      backgroundColor: mode === 'TIMED_MOCK' ? 'var(--rust-soft)' : 'var(--paper)',
                      color: mode === 'TIMED_MOCK' ? 'var(--rust)' : 'var(--ink)',
                      fontSize: '13px',
                      fontWeight: 600,
                      fontFamily: "var(--font-sans)",
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    <div>⏱️ Timed Mock Exam</div>
                    <div style={{ fontSize: '11px', color: 'var(--ink-soft)', fontWeight: 400, marginTop: '2px' }}>
                      Server countdown &amp; locked solutions
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMode('PRACTICE')}
                    style={{
                      padding: '10px 12px',
                      borderRadius: '4px',
                      border: mode === 'PRACTICE' ? '2px solid var(--steel)' : '1px solid var(--paper-line)',
                      backgroundColor: mode === 'PRACTICE' ? 'var(--paper-dim)' : 'var(--paper)',
                      color: mode === 'PRACTICE' ? 'var(--steel)' : 'var(--ink)',
                      fontSize: '13px',
                      fontWeight: 600,
                      fontFamily: "var(--font-sans)",
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    <div>📖 Practice Mode</div>
                    <div style={{ fontSize: '11px', color: 'var(--ink-soft)', fontWeight: 400, marginTop: '2px' }}>
                      Instant step-by-step solutions
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
                      fontFamily: "var(--font-sans)",
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
                      borderRadius: '4px',
                      border: '1px solid var(--paper-line)',
                      backgroundColor: 'var(--paper)',
                      color: 'var(--ink)',
                      fontSize: '13px',
                      fontFamily: "var(--font-sans)",
                    }}
                  >
                    <option value={15}>15 Minutes (Sprint)</option>
                    <option value={30}>30 Minutes (Standard)</option>
                    <option value={45}>45 Minutes (Extended)</option>
                    <option value={60}>60 Minutes (1 Hour)</option>
                    <option value={90}>90 Minutes (1.5 Hours)</option>
                    <option value={120}>120 Minutes (2 Hours — Full UTME)</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="modalQuestionCountSelect"
                    style={{
                      display: 'block',
                      fontSize: '11px',
                      fontFamily: "var(--font-sans)",
                      color: 'var(--ink)',
                      fontWeight: 700,
                      marginBottom: '4px',
                    }}
                  >
                    TOTAL QUESTIONS
                  </label>
                  <select
                    id="modalQuestionCountSelect"
                    value={questionCount}
                    onChange={(e) => setQuestionCount(parseInt(e.target.value, 10))}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: '4px',
                      border: '1px solid var(--paper-line)',
                      backgroundColor: 'var(--paper)',
                      color: 'var(--ink)',
                      fontSize: '13px',
                      fontFamily: "var(--font-sans)",
                    }}
                  >
                    <option value={10}>10 Questions</option>
                    <option value={20}>20 Questions</option>
                    <option value={40}>40 Questions (Standard Subject)</option>
                    <option value={60}>60 Questions (Comprehensive)</option>
                    <option value={100}>100 Questions (Mastery Drill)</option>
                  </select>
                </div>
              </div>

              <div style={{ marginTop: '12px', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={onClose} className="btn-custom btn-custom-ghost">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={startCbt.isPending || subjectsLoading}
                  className="btn-custom btn-custom-primary"
                  style={{ padding: '10px 24px', fontSize: '13.5px' }}
                >
                  {startCbt.isPending ? 'Preparing Session...' : 'Launch Examination →'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

