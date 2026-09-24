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
  defaultMode?: 'TIMED_MOCK' | 'PRACTICE' | 'STUDY';
}

type DrillScope = 'SINGLE' | 'MULTI' | 'BOOKMARKS';

const AVAILABLE_YEARS = [2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018, 2017, 2016, 2015];

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
  
  // Year Selection: Single, Multiple, or All
  const [selectedYears, setSelectedYears] = useState<number[]>([2025]);
  const [allYears, setAllYears] = useState(false);

  // Difficulty & Ordering
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('ALL');
  const [questionOrder, setQuestionOrder] = useState<'NORMAL' | 'SHUFFLE' | 'RANDOM'>('NORMAL');

  // Mode: Practice, Study, Exam (Timed Mock)
  const [mode, setMode] = useState<'TIMED_MOCK' | 'PRACTICE' | 'STUDY'>(defaultMode);
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

  const handleToggleYear = (year: number) => {
    setAllYears(false);
    if (selectedYears.includes(year)) {
      if (selectedYears.length > 1) {
        setSelectedYears((prev) => prev.filter((y) => y !== year));
      }
    } else {
      setSelectedYears((prev) => [...prev, year]);
    }
  };

  const handleSelectAllYears = () => {
    setAllYears((prev) => !prev);
    if (!allYears) {
      setSelectedYears(AVAILABLE_YEARS);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!authUser?.isVerified && !isPro) {
      setErrorMessage('Please verify your email address to launch practice and mock examinations.');
      return;
    }

    if (!isPro && (allYears || selectedYears.length > 1)) {
      setErrorMessage('Multi-year question pooling and All-Years archive access are exclusive to Pro subscribers. Select a single year or upgrade to Pro.');
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
        questionOrder,
      };

      if (drillScope === 'BOOKMARKS') {
        payload.onlyBookmarked = true;
      } else if (drillScope === 'MULTI') {
        payload.subjectIds = selectedSubjectIds;
      } else {
        payload.subjectId = selectedSubjectId;
        if (selectedTopicId) payload.topicId = selectedTopicId;

        if (allYears) {
          payload.allYears = true;
        } else if (selectedYears.length === 1) {
          payload.year = selectedYears[0];
        } else if (selectedYears.length > 1) {
          payload.years = selectedYears;
        }

        if (selectedDifficulty !== 'ALL') {
          payload.difficulty = selectedDifficulty;
        }
      }

      const response = await startCbt.mutateAsync(payload);

      onClose();
      navigate(`/cbt/${response.attemptId}`);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to initialize examination. Please try another selection.');
    }
  };

  const currentExamObj = exams?.find((e) => e._id === selectedExamId);
  const currentSubjObj = subjects?.find((s) => s._id === selectedSubjectId);

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
          maxWidth: '640px',
          padding: 'clamp(20px, 4vw, 32px)',
          boxShadow: '0 20px 48px rgba(0,0,0,0.3)',
          position: 'relative',
          maxHeight: 'min(92vh, 92dvh)',
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

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <span className="eyebrow" style={{ color: 'var(--rust)', margin: 0 }}>
            Official CBT Examination Engine
          </span>
          {!isPro && (
            <span
              style={{
                fontSize: '11px',
                fontFamily: 'var(--font-sans)',
                fontWeight: 700,
                backgroundColor: 'rgba(34, 197, 94, 0.12)',
                color: '#16a34a',
                border: '1px solid rgba(34, 197, 94, 0.3)',
                padding: '1px 7px',
                borderRadius: '12px',
              }}
            >
              🎁 Free Trial Enabled
            </span>
          )}
        </div>

        <h2 style={{ fontSize: '22px', fontFamily: 'var(--font-sans)', margin: '0 0 6px', color: 'var(--ink)' }}>
          Configure Examination Session
        </h2>
        <p style={{ fontSize: '13.5px', color: 'var(--ink-soft)', margin: '0 0 18px', lineHeight: 1.5 }}>
          Launch a targeted topic drill, study mode with worked solutions, or full timed CBT simulation.
        </p>

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
          {/* 1. Mode Selection: Practice, Study, Exam */}
          <div>
            <span style={{ display: 'block', fontSize: '11px', fontFamily: 'var(--font-sans)', color: 'var(--ink)', fontWeight: 700, marginBottom: '6px' }}>
              LEARNING &amp; EXAMINATION MODE *
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setMode('PRACTICE')}
                style={{
                  padding: '10px 8px',
                  borderRadius: '4px',
                  border: mode === 'PRACTICE' ? '2px solid var(--steel)' : '1px solid var(--paper-line)',
                  backgroundColor: mode === 'PRACTICE' ? 'var(--paper-dim)' : 'var(--paper)',
                  color: mode === 'PRACTICE' ? 'var(--steel)' : 'var(--ink)',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  fontFamily: 'var(--font-sans)',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <div>🎯 Practice Mode</div>
                <div style={{ fontSize: '10.5px', color: 'var(--ink-soft)', fontWeight: 400, marginTop: '2px' }}>
                  Self-paced questions
                </div>
              </button>

              <button
                type="button"
                onClick={() => setMode('STUDY')}
                style={{
                  padding: '10px 8px',
                  borderRadius: '4px',
                  border: mode === 'STUDY' ? '2px solid var(--forest)' : '1px solid var(--paper-line)',
                  backgroundColor: mode === 'STUDY' ? 'var(--forest-soft)' : 'var(--paper)',
                  color: mode === 'STUDY' ? 'var(--forest)' : 'var(--ink)',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  fontFamily: 'var(--font-sans)',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <div>💡 Study Mode</div>
                <div style={{ fontSize: '10.5px', color: 'var(--ink-soft)', fontWeight: 400, marginTop: '2px' }}>
                  Immediate solutions
                </div>
              </button>

              <button
                type="button"
                onClick={() => setMode('TIMED_MOCK')}
                style={{
                  padding: '10px 8px',
                  borderRadius: '4px',
                  border: mode === 'TIMED_MOCK' ? '2px solid var(--rust)' : '1px solid var(--paper-line)',
                  backgroundColor: mode === 'TIMED_MOCK' ? 'var(--rust-soft)' : 'var(--paper)',
                  color: mode === 'TIMED_MOCK' ? 'var(--rust)' : 'var(--ink)',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  fontFamily: 'var(--font-sans)',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <div>⏱️ Exam Mode</div>
                <div style={{ fontSize: '10.5px', color: 'var(--ink-soft)', fontWeight: 400, marginTop: '2px' }}>
                  Official timer &amp; test
                </div>
              </button>
            </div>
          </div>

          {/* 2. Scope Tabs: Single Subject vs Multi-Subject vs Bookmarks */}
          <div>
            <span style={{ display: 'block', fontSize: '11px', fontFamily: 'var(--font-sans)', color: 'var(--ink-soft)', fontWeight: 700, marginBottom: '6px' }}>
              CURRICULUM DRILL SCOPE
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setDrillScope('SINGLE')}
                style={{
                  padding: '8px 10px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontFamily: 'var(--font-sans)',
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
                  fontSize: '12px',
                  fontFamily: 'var(--font-sans)',
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
                  fontSize: '12px',
                  fontFamily: 'var(--font-sans)',
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

          {/* 3. Examination Board Selection */}
          <div>
            <label
              htmlFor="modalExamSelect"
              style={{
                display: 'block',
                fontSize: '11px',
                fontFamily: 'var(--font-sans)',
                color: 'var(--ink)',
                fontWeight: 700,
                marginBottom: '4px',
              }}
            >
              EXAMINATION BOARD *
            </label>
            <select
              id="modalExamSelect"
              value={selectedExamId}
              onChange={(e) => setSelectedExamId(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: '4px',
                border: '1px solid var(--paper-line)',
                backgroundColor: 'var(--paper)',
                color: 'var(--ink)',
                fontSize: '13.5px',
                fontFamily: 'var(--font-sans)',
              }}
            >
              {exams?.map((ex) => (
                <option key={ex._id} value={ex._id}>
                  {ex.name} ({ex.shortCode})
                </option>
              ))}
            </select>
          </div>

          {/* SCOPE 1: Single Subject + Topics */}
          {drillScope === 'SINGLE' && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label
                    htmlFor="modalSubjectSelect"
                    style={{
                      display: 'block',
                      fontSize: '11px',
                      fontFamily: 'var(--font-sans)',
                      color: 'var(--ink)',
                      fontWeight: 700,
                      marginBottom: '4px',
                    }}
                  >
                    SUBJECT *
                  </label>
                  <select
                    id="modalSubjectSelect"
                    value={selectedSubjectId}
                    onChange={(e) => setSelectedSubjectId(e.target.value)}
                    disabled={subjectsLoading}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: '4px',
                      border: '1px solid var(--paper-line)',
                      backgroundColor: 'var(--paper)',
                      color: 'var(--ink)',
                      fontSize: '13px',
                      fontFamily: 'var(--font-sans)',
                    }}
                  >
                    {subjects?.map((sub) => (
                      <option key={sub._id} value={sub._id}>
                        {sub.name} ({sub.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="modalTopicSelect"
                    style={{
                      display: 'block',
                      fontSize: '11px',
                      fontFamily: 'var(--font-sans)',
                      color: 'var(--ink)',
                      fontWeight: 700,
                      marginBottom: '4px',
                    }}
                  >
                    TOPIC FOCUS (OPTIONAL)
                  </label>
                  <select
                    id="modalTopicSelect"
                    value={selectedTopicId}
                    onChange={(e) => setSelectedTopicId(e.target.value)}
                    disabled={topicsLoading}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: '4px',
                      border: '1px solid var(--paper-line)',
                      backgroundColor: 'var(--paper)',
                      color: 'var(--ink)',
                      fontSize: '13px',
                      fontFamily: 'var(--font-sans)',
                    }}
                  >
                    <option value="">All Topics (Full Syllabus)</option>
                    {topics?.map((top) => (
                      <option key={top._id} value={top._id}>
                        {top.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Multi-Year Selection (Section 13 & 14) */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontSize: '11px', fontFamily: 'var(--font-sans)', color: 'var(--ink)', fontWeight: 700 }}>
                    PAST QUESTION YEAR(S) POOL
                  </span>
                  <button
                    type="button"
                    onClick={handleSelectAllYears}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: allYears ? 'var(--rust)' : 'var(--ink-soft)',
                      fontSize: '11px',
                      fontWeight: 700,
                      fontFamily: 'var(--font-sans)',
                      cursor: 'pointer',
                      textDecoration: 'underline',
                    }}
                  >
                    {allYears ? '✓ All Archive Years Selected' : 'Select All Years'}
                  </button>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {AVAILABLE_YEARS.map((yr) => {
                    const isSelected = allYears || selectedYears.includes(yr);
                    return (
                      <button
                        key={yr}
                        type="button"
                        onClick={() => handleToggleYear(yr)}
                        style={{
                          padding: '4px 10px',
                          borderRadius: '14px',
                          fontSize: '12px',
                          fontFamily: 'var(--font-sans)',
                          fontWeight: isSelected ? 700 : 500,
                          backgroundColor: isSelected ? 'var(--rust)' : 'var(--paper)',
                          color: isSelected ? 'var(--white)' : 'var(--ink)',
                          border: isSelected ? '1px solid var(--rust)' : '1px solid var(--paper-line)',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        {yr}
                      </button>
                    );
                  })}
                </div>
                {!isPro && (selectedYears.length > 1 || allYears) && (
                  <span style={{ display: 'block', fontSize: '11px', color: 'var(--rust)', marginTop: '4px' }}>
                    ★ Free Trial is scoped to 1 syllabus year. Upgrade to Pro for multi-year pooling.
                  </span>
                )}
              </div>
            </>
          )}

          {/* SCOPE 2: Multi-Subject Combination */}
          {drillScope === 'MULTI' && (
            <div>
              <span style={{ display: 'block', fontSize: '11px', fontFamily: 'var(--font-sans)', color: 'var(--ink)', fontWeight: 700, marginBottom: '6px' }}>
                SELECT SUBJECT COMBINATION ({selectedSubjectIds.length} Selected · Max 5)
              </span>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '8px', maxHeight: '140px', overflowY: 'auto', padding: '4px' }}>
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
                        fontFamily: 'var(--font-sans)',
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

          {/* SCOPE 3: Bookmarks */}
          {drillScope === 'BOOKMARKS' && (
            <div style={{ padding: '12px 14px', background: 'var(--amber-soft)', border: '1px solid var(--amber)', borderRadius: '4px', fontSize: '13px', color: 'var(--ink)' }}>
              ★ <strong>Saved Bookmarks Drill</strong> will construct an interactive session composed exclusively of questions you flagged in the question bank.
            </div>
          )}

          {/* Difficulty & Question Order */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label
                htmlFor="modalDifficultySelect"
                style={{
                  display: 'block',
                  fontSize: '11px',
                  fontFamily: 'var(--font-sans)',
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
                  fontFamily: 'var(--font-sans)',
                }}
              >
                <option value="ALL">Standard Mix (All Levels)</option>
                <option value="EASY">Easy Foundation</option>
                <option value="MEDIUM">Medium Standard</option>
                <option value="HARD">Hard Challenge</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="modalQuestionOrderSelect"
                style={{
                  display: 'block',
                  fontSize: '11px',
                  fontFamily: 'var(--font-sans)',
                  color: 'var(--ink)',
                  fontWeight: 700,
                  marginBottom: '4px',
                }}
              >
                QUESTION ORDER
              </label>
              <select
                id="modalQuestionOrderSelect"
                value={questionOrder}
                onChange={(e) => setQuestionOrder(e.target.value as any)}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: '4px',
                  border: '1px solid var(--paper-line)',
                  backgroundColor: 'var(--paper)',
                  color: 'var(--ink)',
                  fontSize: '13px',
                  fontFamily: 'var(--font-sans)',
                }}
              >
                <option value="NORMAL">Standard Chronological</option>
                <option value="SHUFFLE">Shuffle Selected Pool</option>
                <option value="RANDOM">Random Pool Distribution</option>
              </select>
            </div>
          </div>

          {/* Duration & Total Questions */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label
                htmlFor="modalDurationSelect"
                style={{
                  display: 'block',
                  fontSize: '11px',
                  fontFamily: 'var(--font-sans)',
                  color: 'var(--ink)',
                  fontWeight: 700,
                  marginBottom: '4px',
                }}
              >
                COUNTDOWN DURATION
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
                  fontFamily: 'var(--font-sans)',
                }}
              >
                <option value={15}>15 Minutes (Sprint)</option>
                <option value={30}>30 Minutes (Standard)</option>
                <option value={45}>45 Minutes (Extended)</option>
                <option value={60}>60 Minutes (1 Hour)</option>
                <option value={90}>90 Minutes (1.5 Hours)</option>
                <option value={120}>120 Minutes (2 Hours — Official UTME)</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="modalQuestionCountSelect"
                style={{
                  display: 'block',
                  fontSize: '11px',
                  fontFamily: 'var(--font-sans)',
                  color: 'var(--ink)',
                  fontWeight: 700,
                  marginBottom: '4px',
                }}
              >
                QUESTION COUNT
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
                  fontFamily: 'var(--font-sans)',
                }}
              >
                <option value={10}>10 Questions</option>
                <option value={20}>20 Questions</option>
                <option value={40}>40 Questions (Standard Examination)</option>
                <option value={60}>60 Questions (Comprehensive)</option>
                <option value={100}>100 Questions (Mastery Drill)</option>
              </select>
            </div>
          </div>

          {/* Section 15: Final Configuration Summary Experience */}
          <div
            style={{
              padding: '12px 16px',
              backgroundColor: 'var(--paper)',
              border: '1px solid var(--paper-line)',
              borderRadius: '4px',
              fontSize: '12px',
              fontFamily: 'var(--font-sans)',
              color: 'var(--ink-soft)',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
              gap: '8px',
            }}
          >
            <div>
              <strong style={{ color: 'var(--ink)', display: 'block' }}>Board:</strong>
              {currentExamObj?.shortCode || 'UTME'}
            </div>
            <div>
              <strong style={{ color: 'var(--ink)', display: 'block' }}>Subject:</strong>
              {drillScope === 'MULTI'
                ? `${selectedSubjectIds.length} Subjects`
                : drillScope === 'BOOKMARKS'
                ? 'Bookmarks'
                : currentSubjObj?.name || 'Selected'}
            </div>
            <div>
              <strong style={{ color: 'var(--ink)', display: 'block' }}>Years:</strong>
              {allYears ? 'All Archive' : selectedYears.join(', ')}
            </div>
            <div>
              <strong style={{ color: 'var(--ink)', display: 'block' }}>Mode:</strong>
              {mode === 'TIMED_MOCK' ? 'Timed Exam' : mode === 'STUDY' ? 'Study Mode' : 'Practice'}
            </div>
            <div>
              <strong style={{ color: 'var(--ink)', display: 'block' }}>Order / Count:</strong>
              {questionOrder === 'NORMAL' ? 'Normal' : questionOrder === 'SHUFFLE' ? 'Shuffle' : 'Random'} · {questionCount} Qs
            </div>
          </div>

          <div style={{ marginTop: '8px', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} className="btn-custom btn-custom-ghost">
              Cancel
            </button>
            <button
              type="submit"
              disabled={startCbt.isPending || subjectsLoading}
              className="btn-custom btn-custom-primary"
              style={{ padding: '10px 24px', fontSize: '13.5px' }}
            >
              {startCbt.isPending ? 'Preparing Session...' : 'Start Session →'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
