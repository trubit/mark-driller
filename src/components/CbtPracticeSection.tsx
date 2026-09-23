import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { useAuthStore } from '../store/useAuthStore';

export const CbtPracticeSection: React.FC = () => {
  const navigate = useNavigate();
  const { openAuthModal } = useAppStore();
  const { isAuthenticated } = useAuthStore();

  // Interactive Live CBT Demo State
  const [selectedSubject, setSelectedSubject] = useState<'English' | 'Math' | 'Physics' | 'Chemistry'>('English');
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState<Record<number, string>>({
    0: 'B',
  });
  const [calculatorOpen, setCalculatorOpen] = useState(false);
  const [calcDisplay, setCalcDisplay] = useState('0');

  const demoQuestions = [
    {
      num: 1,
      subject: 'English',
      instruction: 'Choose the word that is nearest in meaning to the underlined word.',
      passage: 'The Vice Chancellor delivered an <u>ephemeral</u> address during the matriculation ceremony.',
      options: [
        { label: 'A', text: 'Lengthy and inspiring' },
        { label: 'B', text: 'Short-lived and transient' },
        { label: 'C', text: 'Puzzling and confusing' },
        { label: 'D', text: 'Audacious and bold' },
      ],
      correct: 'B',
      explanation: "'Ephemeral' denotes lasting for a very short time. Hence, 'short-lived and transient' is the exact synonym.",
    },
    {
      num: 2,
      subject: 'English',
      instruction: 'From the words lettered A to D, choose the option that best completes the sentence.',
      passage: 'Neither the Principal nor the senior teachers ______ at the PTA congress yesterday.',
      options: [
        { label: 'A', text: 'was present' },
        { label: 'B', text: 'were present' },
        { label: 'C', text: 'has been present' },
        { label: 'D', text: 'is present' },
      ],
      correct: 'B',
      explanation: "By the rule of proximity with correlative conjunctions ('Neither... nor'), the verb agrees with the closer subject ('senior teachers' - plural). Therefore, 'were present' is correct.",
    },
    {
      num: 3,
      subject: 'English',
      instruction: 'From the words lettered A to D, choose the interpretation that is most appropriate.',
      passage: 'Emeka decided to <u>burn the midnight oil</u> to secure admission into UNILAG.',
      options: [
        { label: 'A', text: 'Waste expensive kerosene lamps at night' },
        { label: 'B', text: 'Work or study late into the night' },
        { label: 'C', text: 'Cause a fire outbreak in his dormitory' },
        { label: 'D', text: 'Disturb his roommates with noise' },
      ],
      correct: 'B',
      explanation: "The idiom 'to burn the midnight oil' means to work or study late into the night.",
    },
    {
      num: 4,
      subject: 'English',
      instruction: 'Identify the word with a different vowel sound from the others.',
      passage: 'Select the odd vowel pronunciation among the options below:',
      options: [
        { label: 'A', text: 'Blood' },
        { label: 'B', text: 'Flood' },
        { label: 'C', text: 'Good' },
        { label: 'D', text: 'Mud' },
      ],
      correct: 'C',
      explanation: "'Blood', 'Flood', and 'Mud' are pronounced with the short /ʌ/ sound, whereas 'Good' has the /ʊ/ sound.",
    },
  ];

  const currentQ = demoQuestions[activeQuestionIndex];

  // 8-key shortcut keyboard listener for the demo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if typing in an input
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) {
        return;
      }
      const key = e.key.toUpperCase();
      if (['A', 'B', 'C', 'D'].includes(key)) {
        setSelectedOptions((prev) => ({ ...prev, [activeQuestionIndex]: key }));
      } else if (key === 'N') {
        setActiveQuestionIndex((prev) => Math.min(demoQuestions.length - 1, prev + 1));
      } else if (key === 'P') {
        setActiveQuestionIndex((prev) => Math.max(0, prev - 1));
      } else if (key === 'R') {
        setSelectedOptions((prev) => {
          const next = { ...prev };
          delete next[activeQuestionIndex];
          return next;
        });
      } else if (key === 'S') {
        // Submit prompt
        openAuthModal('login');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeQuestionIndex, openAuthModal]);

  const handleCalcClick = (val: string) => {
    if (val === 'C') {
      setCalcDisplay('0');
    } else if (val === '=') {
      try {
        // Safe evaluation for basic arithmetic
        const sanitized = calcDisplay.replace(/[^0-9+\-*/.]/g, '');
        const res = Function(`'use strict'; return (${sanitized})`)();
        setCalcDisplay(String(res));
      } catch {
        setCalcDisplay('Error');
      }
    } else {
      setCalcDisplay((prev) => (prev === '0' || prev === 'Error' ? val : prev + val));
    }
  };

  return (
    <section className="section" id="cbt" aria-label="Authentic Nigerian CBT Simulator">
      <div className="wrap">
        <div className="section-head" style={{ marginBottom: '28px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span className="eyebrow">Full-Fidelity Exam Terminal</span>
            <span
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: '11px',
                padding: '2px 8px',
                borderRadius: '4px',
                background: 'rgba(34, 197, 94, 0.12)',
                color: '#16a34a',
                fontWeight: 600,
              }}
            >
              8-Key Keyboard Shortcuts Active
            </span>
          </div>
          <h2>Experience the Real CBT Screen Before Exam Day</h2>
          <p style={{ maxWidth: '660px', margin: '0 auto', color: 'var(--ink-soft)', fontSize: '15px' }}>
            No surprises at the accredited CBT centre. MarkDriller replicates the exact JAMB 8-key interface, countdown timer clock, on-screen calculator, and review palette used in nationwide examinations.
          </p>
        </div>

        {/* Live Interactive CBT Screen Container */}
        <div
          style={{
            background: 'var(--white)',
            border: '2px solid var(--paper-line)',
            borderRadius: '10px',
            overflow: 'hidden',
            boxShadow: 'var(--card-shadow, 0 10px 30px rgba(0,0,0,0.08))',
          }}
        >
          {/* CBT Terminal Header Bar */}
          <div
            style={{
              backgroundColor: '#0b1120',
              color: '#ffffff',
              padding: '12px 20px',
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '12px',
              borderBottom: '2px solid var(--rust)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  backgroundColor: '#22c55e',
                  boxShadow: '0 0 8px #22c55e',
                }}
              />
              <span
                style={{
                  fontFamily: "var(--font-sans)",
                  fontWeight: 700,
                  fontSize: '14.5px',
                  letterSpacing: '0.02em',
                }}
              >
                MARKDRILLER CBT SIMULATOR — UTME 2026
              </span>
            </div>

            {/* Live Countdown Clock & Calculator Trigger */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <button
                type="button"
                onClick={() => setCalculatorOpen(!calculatorOpen)}
                style={{
                  background: calculatorOpen ? 'var(--rust)' : 'rgba(255,255,255,0.12)',
                  color: '#ffffff',
                  border: '1px solid rgba(255,255,255,0.2)',
                  padding: '4px 10px',
                  borderRadius: '4px',
                  fontSize: '11.5px',
                  fontFamily: "var(--font-sans)",
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span>🧮</span>
                <span>{calculatorOpen ? 'Close Calc' : 'e-Calculator'}</span>
              </button>

              <div
                style={{
                  backgroundColor: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  padding: '4px 12px',
                  borderRadius: '4px',
                  fontFamily: "var(--font-sans)",
                  fontSize: '13px',
                  fontWeight: 700,
                  color: '#f87171',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span>⏱️</span>
                <span>01:52:48 REMAINING</span>
              </div>
            </div>
          </div>

          {/* Subject Navigation Tabs */}
          <div
            style={{
              backgroundColor: 'var(--paper)',
              padding: '8px 16px',
              borderBottom: '1px solid var(--paper-line)',
              display: 'flex',
              gap: '6px',
              overflowX: 'auto',
            }}
          >
            {(['English', 'Math', 'Physics', 'Chemistry'] as const).map((subj) => (
              <button
                key={subj}
                type="button"
                onClick={() => setSelectedSubject(subj)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '4px',
                  border: selectedSubject === subj ? '1.5px solid var(--rust)' : '1px solid var(--paper-line)',
                  background: selectedSubject === subj ? 'var(--white)' : 'transparent',
                  color: selectedSubject === subj ? 'var(--rust)' : 'var(--ink)',
                  fontWeight: 700,
                  fontFamily: "var(--font-sans)",
                  fontSize: '12.5px',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                {subj === 'English' ? 'Use of English (60 Qs)' : `${subj} (40 Qs)`}
              </button>
            ))}
          </div>

          {/* CBT Main Interactive Body: Question Area + Question Palette */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '0',
            }}
          >
            {/* Left: Active Question and Options */}
            <div
              style={{
                padding: 'clamp(18px, 3vw, 28px)',
                borderRight: '1px solid var(--paper-line)',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderBottom: '1px dashed var(--paper-line)',
                  paddingBottom: '10px',
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--font-sans)",
                    fontSize: '12px',
                    color: 'var(--rust)',
                    fontWeight: 700,
                  }}
                >
                  QUESTION {currentQ.num} OF 60 · {currentQ.subject.toUpperCase()}
                </span>
                <span
                  style={{
                    fontFamily: "var(--font-sans)",
                    fontSize: '11px',
                    color: 'var(--ink-soft)',
                  }}
                >
                  UTME 2026 SYLLABUS
                </span>
              </div>

              {/* Instructions and Passage */}
              <div style={{ fontSize: '13px', color: 'var(--ink-soft)', fontStyle: 'italic' }}>
                {currentQ.instruction}
              </div>

              <div
                style={{
                  fontSize: '16px',
                  lineHeight: 1.6,
                  color: 'var(--ink)',
                  fontFamily: "var(--font-sans)",
                  fontWeight: 500,
                }}
                dangerouslySetInnerHTML={{ __html: currentQ.passage }}
              />

              {/* Option Selector List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
                {currentQ.options.map((opt) => {
                  const isChecked = selectedOptions[activeQuestionIndex] === opt.label;
                  return (
                    <button
                      key={opt.label}
                      type="button"
                      onClick={() =>
                        setSelectedOptions((prev) => ({
                          ...prev,
                          [activeQuestionIndex]: opt.label,
                        }))
                      }
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '12px',
                        padding: '12px 14px',
                        borderRadius: '6px',
                        border: isChecked ? '2px solid var(--rust)' : '1px solid var(--paper-line)',
                        background: isChecked ? 'rgba(168, 86, 47, 0.06)' : 'var(--white)',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div
                        style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          border: isChecked ? '6px solid var(--rust)' : '2px solid var(--ink-soft)',
                          background: '#ffffff',
                          flexShrink: 0,
                          marginTop: '1px',
                        }}
                      />
                      <span
                        style={{
                          fontFamily: "var(--font-sans)",
                          fontSize: '14.5px',
                          color: 'var(--ink)',
                          lineHeight: 1.4,
                        }}
                      >
                        <strong style={{ fontFamily: "var(--font-sans)", marginRight: '6px' }}>
                          {opt.label}.
                        </strong>
                        {opt.text}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Explanation Reveal */}
              <div
                style={{
                  marginTop: '8px',
                  padding: '12px 14px',
                  backgroundColor: 'var(--paper)',
                  borderRadius: '6px',
                  border: '1px solid var(--paper-line)',
                  fontSize: '12.5px',
                  lineHeight: 1.5,
                  color: 'var(--ink-soft)',
                }}
              >
                <strong style={{ color: 'var(--ink)', display: 'block', marginBottom: '2px' }}>
                  ✓ Step-by-Step Worked Explanation:
                </strong>
                {currentQ.explanation}
              </div>
            </div>

            {/* Right: Question Navigation Palette & JAMB 8-Key Guidance */}
            <div
              style={{
                padding: 'clamp(16px, 2.5vw, 24px)',
                backgroundColor: 'var(--paper-soft, #fcfcfb)',
                display: 'flex',
                flexDirection: 'column',
                gap: '18px',
              }}
            >
              {/* Calculator Panel (if toggled) */}
              {calculatorOpen && (
                <div
                  style={{
                    backgroundColor: 'var(--white)',
                    border: '1.5px solid var(--paper-line)',
                    borderRadius: '6px',
                    padding: '12px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  }}
                >
                  <div
                    style={{
                      fontFamily: "var(--font-sans)",
                      fontSize: '10.5px',
                      color: 'var(--ink-soft)',
                      marginBottom: '6px',
                      display: 'flex',
                      justifyContent: 'space-between',
                    }}
                  >
                    <span>OFFICIAL CBT CALCULATOR</span>
                    <button
                      type="button"
                      onClick={() => setCalculatorOpen(false)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px' }}
                    >
                      ✕
                    </button>
                  </div>
                  <div
                    style={{
                      backgroundColor: 'var(--paper)',
                      border: '1px solid var(--paper-line)',
                      borderRadius: '4px',
                      padding: '8px',
                      textAlign: 'right',
                      fontFamily: "var(--font-sans)",
                      fontSize: '18px',
                      fontWeight: 700,
                      marginBottom: '8px',
                      color: 'var(--ink)',
                    }}
                  >
                    {calcDisplay}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px' }}>
                    {['7', '8', '9', '/', '4', '5', '6', '*', '1', '2', '3', '-', 'C', '0', '=', '+'].map((btn) => (
                      <button
                        key={btn}
                        type="button"
                        onClick={() => handleCalcClick(btn)}
                        style={{
                          padding: '8px',
                          borderRadius: '4px',
                          border: '1px solid var(--paper-line)',
                          background: btn === '=' ? 'var(--rust)' : 'var(--white)',
                          color: btn === '=' ? '#ffffff' : 'var(--ink)',
                          fontFamily: "var(--font-sans)",
                          fontSize: '12px',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        {btn}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Question Grid Numbers */}
              <div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '10px',
                  }}
                >
                  <span
                    style={{
                      fontFamily: "var(--font-sans)",
                      fontSize: '11.5px',
                      fontWeight: 700,
                      color: 'var(--ink)',
                      textTransform: 'uppercase',
                    }}
                  >
                    Question Palette ({Object.keys(selectedOptions).length}/4 Answered)
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: '6px' }}>
                  {demoQuestions.map((q, idx) => {
                    const isAnswered = selectedOptions[idx] !== undefined;
                    const isActive = activeQuestionIndex === idx;
                    return (
                      <button
                        key={q.num}
                        type="button"
                        onClick={() => setActiveQuestionIndex(idx)}
                        style={{
                          aspectRatio: '1',
                          borderRadius: '4px',
                          border: isActive ? '2px solid var(--rust)' : '1px solid var(--paper-line)',
                          backgroundColor: isAnswered
                            ? '#22c55e'
                            : isActive
                            ? 'var(--white)'
                            : 'var(--paper)',
                          color: isAnswered ? '#ffffff' : 'var(--ink)',
                          fontFamily: "var(--font-sans)",
                          fontWeight: 700,
                          fontSize: '12px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {q.num}
                      </button>
                    );
                  })}
                  {/* Additional placeholder visual slots up to 16 */}
                  {Array.from({ length: 12 }).map((_, i) => (
                    <div
                      key={i + 5}
                      style={{
                        aspectRatio: '1',
                        borderRadius: '4px',
                        border: '1px solid var(--paper-line)',
                        backgroundColor: 'var(--paper)',
                        color: 'var(--ink-soft)',
                        fontFamily: "var(--font-sans)",
                        fontSize: '11px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: 0.6,
                      }}
                    >
                      {i + 5}
                    </div>
                  ))}
                </div>
              </div>

              {/* Legend Strip */}
              <div
                style={{
                  display: 'flex',
                  gap: '12px',
                  fontFamily: "var(--font-sans)",
                  fontSize: '10.5px',
                  color: 'var(--ink-soft)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '2px', backgroundColor: '#22c55e' }} />
                  <span>Answered</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '2px', backgroundColor: 'var(--paper)', border: '1px solid var(--paper-line)' }} />
                  <span>Unattempted</span>
                </div>
              </div>

              {/* JAMB 8-Key Shortcut Cheatsheet */}
              <div
                style={{
                  backgroundColor: 'var(--white)',
                  border: '1px solid var(--paper-line)',
                  borderRadius: '6px',
                  padding: '14px',
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--font-sans)",
                    fontSize: '11px',
                    fontWeight: 700,
                    color: 'var(--ink)',
                    display: 'block',
                    marginBottom: '8px',
                  }}
                >
                  ⚡ OFFICIAL JAMB 8-KEY KEYBOARD CONTROLS
                </span>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '6px',
                    fontFamily: "var(--font-sans)",
                    fontSize: '11px',
                    color: 'var(--ink-soft)',
                  }}
                >
                  <div>
                    <strong style={{ color: 'var(--rust)' }}>[A] [B] [C] [D]</strong> Select
                  </div>
                  <div>
                    <strong style={{ color: 'var(--ink)' }}>[N]</strong> Next Question
                  </div>
                  <div>
                    <strong style={{ color: 'var(--ink)' }}>[P]</strong> Previous Question
                  </div>
                  <div>
                    <strong style={{ color: 'var(--amber)' }}>[R]</strong> Reverse / Clear
                  </div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <strong style={{ color: '#22c55e' }}>[S]</strong> Submit Exam Session
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Action Footer Bar */}
          <div
            style={{
              padding: '14px 20px',
              backgroundColor: 'var(--paper)',
              borderTop: '1px solid var(--paper-line)',
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setActiveQuestionIndex((prev) => Math.max(0, prev - 1))}
                disabled={activeQuestionIndex === 0}
                className="btn-custom btn-custom-ghost"
                style={{ fontSize: '12.5px', padding: '6px 14px' }}
              >
                ◀ [P] Previous
              </button>
              <button
                type="button"
                onClick={() => setActiveQuestionIndex((prev) => Math.min(demoQuestions.length - 1, prev + 1))}
                disabled={activeQuestionIndex === demoQuestions.length - 1}
                className="btn-custom btn-custom-ghost"
                style={{ fontSize: '12.5px', padding: '6px 14px' }}
              >
                [N] Next ▶
              </button>
              <button
                type="button"
                onClick={() =>
                  setSelectedOptions((prev) => {
                    const next = { ...prev };
                    delete next[activeQuestionIndex];
                    return next;
                  })
                }
                className="btn-custom btn-custom-ghost"
                style={{ fontSize: '12.5px', padding: '6px 12px', color: 'var(--ink-soft)' }}
              >
                [R] Clear
              </button>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={() => (!isAuthenticated ? openAuthModal('login') : navigate('/questions'))}
                className="btn-custom btn-custom-ghost"
                style={{ fontSize: '13px', padding: '8px 16px' }}
              >
                {!isAuthenticated ? 'Log in to Question Bank' : 'Explore Full Question Bank'}
              </button>
              <button
                type="button"
                onClick={() => (!isAuthenticated ? openAuthModal('login') : navigate('/dashboard'))}
                className="btn-custom btn-custom-primary"
                style={{ fontSize: '13px', padding: '8px 18px' }}
              >
                {!isAuthenticated ? 'Log in to Mock Exam →' : 'Start Official CBT Mock Exam →'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

