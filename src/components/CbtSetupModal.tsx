import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useExamsQuery, useExamSubjectsQuery, useSubjectTopicsQuery } from '../api/exams.js';
import { useStartCbtMutation, useCbtTrialStatusQuery } from '../api/cbt.js';
import { useMySubscriptionQuery } from '../api/subscriptions.js';
import { useTermsStatusQuery } from '../api/terms.js';
import { useAuthStore } from '../store/useAuthStore.js';

interface CbtSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultExamId?: string;
  defaultSubjectId?: string;
  defaultTopicId?: string;
}

type DrillScope = 'SINGLE' | 'MULTI' | 'BOOKMARKS';

const AVAILABLE_YEARS = [2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018, 2017, 2016, 2015];

export const CbtSetupModal: React.FC<CbtSetupModalProps> = ({
  isOpen,
  onClose,
  defaultExamId,
  defaultSubjectId,
  defaultTopicId,
}) => {
  const navigate = useNavigate();
  const { user: authUser } = useAuthStore();
  const { data: currentSub } = useMySubscriptionQuery();
  const { data: trialStatus } = useCbtTrialStatusQuery();
  const { data: exams } = useExamsQuery();

  const isPro = Boolean(currentSub?.isPro || authUser?.role === 'ADMIN');
  const freeTrial = trialStatus || currentSub?.freeTrial;
  const trialsAllowed = 3;
  const trialsUsed = freeTrial?.used ?? 0;
  const trialsRemaining = isPro ? 3 : Math.max(0, trialsAllowed - trialsUsed);
  const isTrialExhausted = !isPro && (freeTrial?.isExhausted || trialsUsed >= trialsAllowed);

  const [drillScope, setDrillScope] = useState<DrillScope>(defaultTopicId ? 'SINGLE' : 'SINGLE');
  const [selectedExamId, setSelectedExamId] = useState(defaultExamId || '');
  const [selectedSubjectId, setSelectedSubjectId] = useState(defaultSubjectId || '');
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>([]);
  const [selectedTopicId, setSelectedTopicId] = useState(defaultTopicId || '');
  
  // Year Selection: Single, Multiple, or All
  const [selectedYears, setSelectedYears] = useState<number[]>([2024]);
  const [allYears, setAllYears] = useState(false);
  const [shuffleOptions, setShuffleOptions] = useState(true);

  // Difficulty & Ordering
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('ALL');
  const [questionOrder, setQuestionOrder] = useState<'NORMAL' | 'SHUFFLE' | 'RANDOM'>('NORMAL');

  const [durationMinutes, setDurationMinutes] = useState(30);
  const [questionCount, setQuestionCount] = useState(20);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Student Terms & Conditions Declaration State
  const { data: termsStatus } = useTermsStatusQuery();

  const [declaration, setDeclaration] = useState({
    readAndUnderstood: false,
    followInstructions: false,
    antiCheating: false,
    understandConsequences: false,
    accurateInformation: false,
    lawfulUse: false,
  });

  const isTermsAlreadyAccepted = Boolean(termsStatus?.hasAccepted);
  const isAllDeclarationChecked =
    declaration.readAndUnderstood &&
    declaration.followInstructions &&
    declaration.antiCheating &&
    declaration.understandConsequences &&
    declaration.accurateInformation &&
    declaration.lawfulUse;

  const handleToggleDeclarationItem = (key: keyof typeof declaration) => {
    setDeclaration((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSelectAllDeclaration = () => {
    const nextVal = !isAllDeclarationChecked;
    setDeclaration({
      readAndUnderstood: nextVal,
      followInstructions: nextVal,
      antiCheating: nextVal,
      understandConsequences: nextVal,
      accurateInformation: nextVal,
      lawfulUse: nextVal,
    });
  };

  // Sync default props when modal opens
  useEffect(() => {
    if (isOpen) {
      if (defaultExamId) setSelectedExamId(defaultExamId);
      if (defaultSubjectId) setSelectedSubjectId(defaultSubjectId);
      if (defaultTopicId) {
        setSelectedTopicId(defaultTopicId);
        setDrillScope('SINGLE');
      }
      setErrorMessage(null);
    }
  }, [isOpen, defaultExamId, defaultSubjectId, defaultTopicId]);

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
    if (!isPro && year !== 2024) {
      setErrorMessage(`Year ${year} is locked. Free Trial currently includes questions from 2024 only. Upgrade to Pro to unlock additional years (2015–2025).`);
      return;
    }
    setAllYears(false);
    if (!isPro) {
      setSelectedYears([2024]);
      return;
    }
    if (selectedYears.includes(year)) {
      if (selectedYears.length > 1) {
        setSelectedYears((prev) => prev.filter((y) => y !== year));
      }
    } else {
      setSelectedYears((prev) => [...prev, year]);
    }
  };

  const handleSelectAllYears = () => {
    if (!isPro) {
      setErrorMessage('Selecting all archive years requires MarkDriller Pro. Free accounts include 2024 past questions. Upgrade to Pro to pool all archive years (2015–2025).');
      return;
    }
    setAllYears((prev) => !prev);
    if (!allYears) {
      setSelectedYears(AVAILABLE_YEARS);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (isTrialExhausted) {
      setErrorMessage('Your 3 free trials have been used. Upgrade to MarkDriller Pro to continue.');
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

    if (!isTermsAlreadyAccepted && !isAllDeclarationChecked) {
      setErrorMessage('Please review and check all items of the Student Declaration to agree to the Terms & Conditions before starting your test.');
      return;
    }

    try {
      const payload: any = {
        examId: selectedExamId,
        durationMinutes,
        questionCount,
        questionOrder,
        shuffleOptions,
      };

      if (!isTermsAlreadyAccepted) {
        payload.declarationAccepted = true;
        payload.declarationChecklist = declaration;
      }

      if (drillScope === 'BOOKMARKS') {
        payload.onlyBookmarked = true;
      } else if (drillScope === 'MULTI') {
        payload.subjectIds = selectedSubjectIds;
      } else {
        payload.subjectId = selectedSubjectId;
        if (selectedTopicId) payload.topicId = selectedTopicId;

        if (!isPro) {
          payload.year = 2024;
        } else if (allYears) {
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
          Official Computer-Based Testing simulation for Nigerian examinations (JAMB UTME, WAEC, NECO).
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

        {/* Free Trial / Pro Subscription Status Banner */}
        {!isPro ? (
          isTrialExhausted ? (
            <div
              style={{
                padding: '16px 18px',
                backgroundColor: 'var(--rust-soft, rgba(168, 86, 47, 0.12))',
                border: '1.5px solid var(--rust, #a8562f)',
                borderRadius: '8px',
                marginBottom: '18px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ fontSize: '16px' }}>🔒</span>
                    <strong style={{ color: 'var(--rust)', fontSize: '14px', fontFamily: 'var(--font-sans)', letterSpacing: '0.04em' }}>
                      FREE TRIAL ENDED (3 OF 3 TRIALS USED)
                    </strong>
                  </div>
                  <p style={{ margin: '0 0 6px', fontSize: '13.5px', color: 'var(--ink)', fontWeight: 600 }}>
                    Your 3 free trials have been used. Upgrade to Pro to continue.
                  </p>
                  <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12px', color: 'var(--ink-soft)', lineHeight: 1.5 }}>
                    <li>Unlimited CBT examinations across JAMB, WAEC, NECO &amp; Post-UTME</li>
                    <li>Full question archive across all years (2015–2025) fully unlocked</li>
                    <li>Detailed step-by-step worked solutions on result slip</li>
                  </ul>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    navigate('/portal/pricing');
                  }}
                  className="btn-custom btn-custom-primary"
                  style={{ padding: '10px 18px', fontSize: '13px', fontWeight: 700 }}
                >
                  Upgrade to Pro Now ➔
                </button>
              </div>
            </div>
          ) : (
            <div
              style={{
                padding: '14px 18px',
                backgroundColor: 'var(--paper)',
                border: '1.5px solid var(--paper-line)',
                borderRadius: '8px',
                marginBottom: '18px',
                boxShadow: 'var(--shadow)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span
                      style={{
                        fontSize: '11px',
                        fontFamily: 'var(--font-sans)',
                        fontWeight: 800,
                        backgroundColor: 'var(--rust-soft)',
                        color: 'var(--rust)',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        letterSpacing: '0.05em',
                      }}
                    >
                      FREE TRIAL
                    </span>
                    <strong style={{ fontSize: '13px', color: 'var(--ink)' }}>
                      {trialsRemaining === 1 ? '1 trial remaining' : `${trialsRemaining} of ${trialsAllowed} trials remaining`}
                    </strong>
                  </div>
                  <p style={{ margin: 0, fontSize: '12px', color: 'var(--ink-soft)', lineHeight: 1.4 }}>
                    Free Trial currently includes questions from 2024 only. Upgrade to Pro to unlock additional years and unlimited tests.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    navigate('/portal/pricing');
                  }}
                  className="btn-custom btn-custom-ghost"
                  style={{ fontSize: '12px', padding: '6px 12px', color: 'var(--rust)', borderColor: 'var(--rust)' }}
                >
                  Upgrade to Pro →
                </button>
              </div>
            </div>
          )
        ) : (
          <div
            style={{
              padding: '10px 14px',
              backgroundColor: 'var(--forest-soft, rgba(34, 90, 56, 0.12))',
              border: '1px solid var(--forest, #225a38)',
              borderRadius: '6px',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '10px',
            }}
          >
            <span style={{ fontSize: '12.5px', color: 'var(--forest)', fontWeight: 600 }}>
              ★ MarkDriller Pro Active: Unlimited examinations and all past question years (2015–2025) unlocked.
            </span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>


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

              {/* Past Question Year Selection (Requirements 6 & 7) */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '11px', fontFamily: 'var(--font-sans)', color: 'var(--ink)', fontWeight: 700 }}>
                    EXAMINATION YEAR *
                  </span>
                  {isPro && (
                    <button
                      type="button"
                      onClick={handleSelectAllYears}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: allYears ? 'var(--rust)' : 'var(--forest)',
                        fontSize: '11px',
                        fontWeight: 700,
                        fontFamily: 'var(--font-sans)',
                        cursor: 'pointer',
                        textDecoration: 'underline',
                      }}
                    >
                      {allYears ? '✓ All Archive Years Selected' : 'Select All Years'}
                    </button>
                  )}
                </div>

                {!isPro ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
                      {/* Available Year 2024 */}
                      <div
                        style={{
                          padding: '6px 14px',
                          borderRadius: '20px',
                          fontSize: '12.5px',
                          fontWeight: 700,
                          backgroundColor: 'var(--rust)',
                          color: '#ffffff',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
                        }}
                      >
                        <span>2024</span>
                        <span style={{ fontSize: '10.5px', backgroundColor: 'rgba(255,255,255,0.22)', padding: '1px 6px', borderRadius: '10px' }}>
                          Available for Free Trial
                        </span>
                      </div>

                      {/* Locked Years */}
                      {AVAILABLE_YEARS.filter((yr) => yr !== 2024).map((yr) => (
                        <button
                          key={yr}
                          type="button"
                          onClick={() => handleToggleYear(yr)}
                          title={`Year ${yr} is locked. Free Trial currently includes questions from 2024 only. Upgrade to Pro to unlock.`}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '20px',
                            fontSize: '12px',
                            fontFamily: 'var(--font-sans)',
                            fontWeight: 500,
                            backgroundColor: 'var(--paper)',
                            color: 'var(--ink-soft)',
                            border: '1px solid var(--paper-line)',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            opacity: 0.75,
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <span>{yr}</span>
                          <span style={{ fontSize: '11px' }}>🔒</span>
                        </button>
                      ))}
                    </div>
                    <span style={{ display: 'block', fontSize: '11.5px', color: 'var(--rust)', marginTop: '2px', lineHeight: 1.4 }}>
                      Free Trial currently includes questions from 2024 only. Upgrade to Pro to unlock additional years (2015–2025).
                    </span>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {AVAILABLE_YEARS.map((yr) => {
                      const isSelected = allYears || selectedYears.includes(yr);
                      return (
                        <button
                          key={yr}
                          type="button"
                          onClick={() => handleToggleYear(yr)}
                          style={{
                            padding: '5px 12px',
                            borderRadius: '16px',
                            fontSize: '12px',
                            fontFamily: 'var(--font-sans)',
                            fontWeight: isSelected ? 700 : 500,
                            backgroundColor: isSelected ? 'var(--rust)' : 'var(--paper)',
                            color: isSelected ? '#ffffff' : 'var(--ink)',
                            border: isSelected ? '1px solid var(--rust)' : '1px solid var(--paper-line)',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <span>{yr}</span>
                        </button>
                      );
                    })}
                  </div>
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

            {/* Shuffling Options Toggle */}
            <div style={{ gridColumn: 'span 2', display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: 'var(--paper)', borderRadius: '4px', border: '1px solid var(--paper-line)' }}>
              <input
                type="checkbox"
                id="modalShuffleOptions"
                checked={shuffleOptions}
                onChange={(e) => setShuffleOptions(e.target.checked)}
                style={{ width: '16px', height: '16px', cursor: 'pointer' }}
              />
              <label htmlFor="modalShuffleOptions" style={{ fontSize: '12px', color: 'var(--ink)', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontWeight: 600 }}>
                🔀 Shuffle Options (Randomizes answer choices A, B, C, D order without changing correctness)
              </label>
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
              {currentExamObj?.shortCode || 'JAMB / UTME'}
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
              <strong style={{ color: 'var(--ink)', display: 'block' }}>Format:</strong>
              Official CBT Simulation
            </div>
            <div>
              <strong style={{ color: 'var(--ink)', display: 'block' }}>Order / Count:</strong>
              {questionOrder === 'NORMAL' ? 'Normal' : questionOrder === 'SHUFFLE' ? 'Shuffle' : 'Random'} · {questionCount} Qs
            </div>
          </div>

          {/* Section: Student Terms & Conditions Declaration */}
          {!isTermsAlreadyAccepted ? (
            <div
              style={{
                padding: '16px',
                backgroundColor: 'var(--paper)',
                border: '1.5px solid var(--forest)',
                borderRadius: '6px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '16px' }}>📋</span>
                  <strong style={{ fontSize: '13.5px', color: 'var(--ink)' }}>
                    Student Terms &amp; Conditions Declaration (v1.0)
                  </strong>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <a
                    href="/terms"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontSize: '12px', color: 'var(--forest)', textDecoration: 'underline', fontWeight: 600 }}
                  >
                    Read Full Terms ↗
                  </a>
                  <button
                    type="button"
                    onClick={handleSelectAllDeclaration}
                    style={{
                      background: 'none',
                      border: '1px solid var(--paper-line)',
                      borderRadius: '4px',
                      padding: '3px 8px',
                      fontSize: '11px',
                      color: 'var(--ink)',
                      cursor: 'pointer',
                      fontWeight: 600,
                    }}
                  >
                    {isAllDeclarationChecked ? 'Deselect All' : 'Select All'}
                  </button>
                </div>
              </div>

              <p style={{ margin: 0, fontSize: '12px', color: 'var(--ink-soft)', lineHeight: 1.5 }}>
                Before starting a Computer-Based Test, every student must agree to follow the examination rules and platform terms:
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {[
                  {
                    key: 'readAndUnderstood' as const,
                    text: 'I have read and understood the Mark Driller CBT Terms & Conditions.',
                  },
                  {
                    key: 'followInstructions' as const,
                    text: 'I agree to follow all examination instructions and rules.',
                  },
                  {
                    key: 'antiCheating' as const,
                    text: 'I understand that cheating, impersonation, unauthorized assistance, and attempts to manipulate the CBT system are prohibited.',
                  },
                  {
                    key: 'understandConsequences' as const,
                    text: 'I understand that violation of these rules may result in cancellation of my test, withholding of my result, suspension of my account, or other appropriate action.',
                  },
                  {
                    key: 'accurateInformation' as const,
                    text: 'I confirm that the information provided by me is accurate.',
                  },
                  {
                    key: 'lawfulUse' as const,
                    text: 'I agree to use the Mark Driller CBT platform responsibly and lawfully.',
                  },
                ].map((item) => (
                  <label
                    key={item.key}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '10px',
                      cursor: 'pointer',
                      fontSize: '12.5px',
                      color: 'var(--ink)',
                      lineHeight: 1.45,
                      padding: '6px 10px',
                      borderRadius: '4px',
                      backgroundColor: declaration[item.key] ? 'var(--forest-soft, rgba(34, 197, 94, 0.08))' : 'var(--white)',
                      border: declaration[item.key] ? '1px solid var(--forest)' : '1px solid var(--paper-line)',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={declaration[item.key]}
                      onChange={() => handleToggleDeclarationItem(item.key)}
                      style={{ marginTop: '2px', accentColor: 'var(--forest)' }}
                    />
                    <span>{item.text}</span>
                  </label>
                ))}
              </div>
            </div>
          ) : (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 14px',
                backgroundColor: 'var(--forest-soft, rgba(34, 197, 94, 0.08))',
                border: '1px solid var(--forest)',
                borderRadius: '4px',
                fontSize: '12px',
                color: 'var(--forest)',
              }}
            >
              <span>✓ Student Terms &amp; Conditions (v1.0) accepted</span>
              <a
                href="/terms"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: 'var(--forest)', textDecoration: 'underline', fontSize: '11.5px' }}
              >
                Review Terms ↗
              </a>
            </div>
          )}

          <div style={{ marginTop: '8px', display: 'flex', gap: '12px', justifyContent: 'flex-end', alignItems: 'center' }}>
            <button type="button" onClick={onClose} className="btn-custom btn-custom-ghost">
              Cancel
            </button>
            {isTrialExhausted ? (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  navigate('/portal/pricing');
                }}
                className="btn-custom btn-custom-primary"
                style={{ padding: '10px 24px', fontSize: '13.5px', fontWeight: 700 }}
              >
                Upgrade to Pro to Continue ➔
              </button>
            ) : (
              <button
                type="submit"
                disabled={
                  startCbt.isPending ||
                  subjectsLoading ||
                  (!isTermsAlreadyAccepted && !isAllDeclarationChecked)
                }
                className="btn-custom btn-custom-primary"
                style={{ padding: '10px 24px', fontSize: '13.5px' }}
              >
                {startCbt.isPending
                  ? 'Preparing Examination Room...'
                  : !isTermsAlreadyAccepted && !isAllDeclarationChecked
                  ? 'Accept Declaration to Start →'
                  : !isPro
                  ? `Start Free Trial (${trialsRemaining} of ${trialsAllowed} Left) →`
                  : 'Start Examination →'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
