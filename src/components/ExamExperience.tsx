import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore.js';
import { useAuthStore } from '../store/useAuthStore.js';

interface DemoQuestion {
  id: number;
  subject: string;
  question: string;
  options: { label: string; text: string }[];
  correct: string;
  explanation: string;
}

const DEMO_QUESTIONS: DemoQuestion[] = [
  {
    id: 1,
    subject: 'Use of English',
    question: 'Choose the word that is NEAREST IN MEANING to the underlined word: The Vice Chancellor delivered an ephemeral address during the matriculation ceremony.',
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
    id: 2,
    subject: 'Mathematics',
    question: 'Find the derivative dy/dx of y = 3x³ - 5x² + 7x - 4 with respect to x.',
    options: [
      { label: 'A', text: '9x² - 10x + 7' },
      { label: 'B', text: '9x³ - 10x² + 7' },
      { label: 'C', text: '6x² - 5x + 7' },
      { label: 'D', text: '3x² - 10x + 4' },
    ],
    correct: 'A',
    explanation: 'Differentiating term by term: d/dx(3x³) = 9x², d/dx(-5x²) = -10x, d/dx(7x) = 7, d/dx(-4) = 0. Total = 9x² - 10x + 7.',
  },
  {
    id: 3,
    subject: 'Physics',
    question: 'A car accelerates uniformly from rest to a speed of 20 m/s in 5 seconds. Calculate the distance covered.',
    options: [
      { label: 'A', text: '100 m' },
      { label: 'B', text: '50 m' },
      { label: 'C', text: '25 m' },
      { label: 'D', text: '200 m' },
    ],
    correct: 'B',
    explanation: 'Using s = ((u + v) / 2) * t: s = ((0 + 20) / 2) * 5 = 10 * 5 = 50 metres.',
  },
  {
    id: 4,
    subject: 'Chemistry',
    question: 'What is the oxidation number of sulfur in the sulfate ion (SO₄²⁻)?',
    options: [
      { label: 'A', text: '+4' },
      { label: 'B', text: '+6' },
      { label: 'C', text: '-2' },
      { label: 'D', text: '+2' },
    ],
    correct: 'B',
    explanation: 'Let oxidation state of S be x. Oxygen is -2: x + 4(-2) = -2 => x - 8 = -2 => x = +6.',
  },
];

export const ExamExperience: React.FC = () => {
  const navigate = useNavigate();
  const { openAuthModal } = useAppStore();
  const { isAuthenticated } = useAuthStore();

  const [activeIdx, setActiveIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [showExplanation, setShowExplanation] = useState(false);
  const [calcOpen, setCalcOpen] = useState(false);
  const [calcValue, setCalcValue] = useState('0');

  const currentQ = DEMO_QUESTIONS[activeIdx];
  const selectedOption = selectedAnswers[currentQ.id];

  const handleSelectOption = (optLabel: string) => {
    setSelectedAnswers((prev) => ({ ...prev, [currentQ.id]: optLabel }));
  };

  const handleClear = () => {
    setSelectedAnswers((prev) => {
      const copy = { ...prev };
      delete copy[currentQ.id];
      return copy;
    });
  };

  const handleStartExam = () => {
    if (!isAuthenticated) {
      openAuthModal('signup');
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <section className="section" id="experience" aria-label="CBT Examination Experience">
      <div className="wrap">
        <div className="section-head">
          <span className="eyebrow">Exam Simulator</span>
          <h2>Authentic CBT Test-Room Experience</h2>
          <p style={{ maxWidth: '640px', margin: '0 auto', color: 'var(--ink-soft)', fontSize: '15.5px' }}>
            Replicating the official Nigerian computer-based test environment down to keyboard shortcuts, on-screen arithmetic tools, and timed discipline.
          </p>
        </div>

        {/* Live Interactive Terminal Simulation */}
        <div
          style={{
            marginTop: '36px',
            backgroundColor: 'var(--white)',
            border: '2px solid var(--paper-line)',
            borderRadius: '12px',
            boxShadow: 'var(--card-shadow)',
            overflow: 'hidden',
          }}
        >
          {/* Header Bar */}
          <div
            style={{
              backgroundColor: 'var(--dark-panel, #080d1b)',
              color: '#ffffff',
              padding: '12px 20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span
                style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  backgroundColor: '#22c55e',
                  boxShadow: '0 0 6px #22c55e',
                  display: 'inline-block',
                }}
              />
              <span style={{ fontFamily: 'var(--font-sans)', fontSize: '12px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                LIVE TERMINAL · JAMB UTME SIMULATION
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <button
                type="button"
                onClick={() => setCalcOpen((prev) => !prev)}
                style={{
                  background: calcOpen ? 'var(--amber)' : 'rgba(255, 255, 255, 0.1)',
                  color: calcOpen ? '#000000' : '#ffffff',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '4px',
                  padding: '4px 10px',
                  fontSize: '11.5px',
                  fontFamily: 'var(--font-sans)',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                🧮 Calculator {calcOpen ? 'ON' : 'OFF'}
              </button>

              <div
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: '13px',
                  fontWeight: 800,
                  color: 'var(--amber)',
                  backgroundColor: 'rgba(245, 158, 11, 0.15)',
                  padding: '4px 12px',
                  borderRadius: '4px',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                }}
              >
                ⏱️ TIME LEFT: 01:54:20
              </div>
            </div>
          </div>

          {/* Subject Tabs */}
          <div
            style={{
              display: 'flex',
              backgroundColor: 'var(--paper)',
              borderBottom: '1px solid var(--paper-line)',
              overflowX: 'auto',
            }}
          >
            {DEMO_QUESTIONS.map((q, idx) => (
              <button
                key={q.id}
                type="button"
                onClick={() => {
                  setActiveIdx(idx);
                  setShowExplanation(false);
                }}
                style={{
                  padding: '10px 18px',
                  background: activeIdx === idx ? 'var(--white)' : 'transparent',
                  color: activeIdx === idx ? 'var(--rust)' : 'var(--ink-soft)',
                  fontWeight: activeIdx === idx ? 700 : 500,
                  fontFamily: 'var(--font-sans)',
                  fontSize: '12.5px',
                  border: 'none',
                  borderBottom: activeIdx === idx ? '2.5px solid var(--rust)' : '2.5px solid transparent',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                Q{idx + 1}: {q.subject}
              </button>
            ))}
          </div>

          {/* Calculator Floating Drawer if active */}
          {calcOpen && (
            <div
              style={{
                backgroundColor: 'var(--dark-panel, #080d1b)',
                color: '#ffffff',
                padding: '12px 20px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                flexWrap: 'wrap',
              }}
            >
              <span style={{ fontSize: '11.5px', fontFamily: 'var(--font-sans)', color: '#94a3b8' }}>
                On-Screen Calculator:
              </span>
              <span
                style={{
                  fontFamily: 'monospace',
                  fontSize: '14px',
                  fontWeight: 700,
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  padding: '4px 12px',
                  borderRadius: '4px',
                  minWidth: '80px',
                  textAlign: 'right',
                }}
              >
                {calcValue}
              </span>
              <div style={{ display: 'flex', gap: '6px' }}>
                {['7', '8', '9', '+', '4', '5', '6', '-', '1', '2', '3', '*', 'C', '0', '='].map((k) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => {
                      if (k === 'C') setCalcValue('0');
                      else if (k === '=') {
                        try {
                          const sanitized = calcValue.replace(/[^0-9+\-*/.]/g, '');
                          const res = Function(`'use strict'; return (${sanitized})`)();
                          setCalcValue(String(res));
                        } catch {
                          setCalcValue('Error');
                        }
                      } else {
                        setCalcValue((prev) => (prev === '0' || prev === 'Error' ? k : prev + k));
                      }
                    }}
                    style={{
                      padding: '4px 8px',
                      background: 'rgba(255, 255, 255, 0.15)',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '3px',
                      fontSize: '12px',
                      cursor: 'pointer',
                    }}
                  >
                    {k}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Question Body */}
          <div style={{ padding: '24px 28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <span style={{ fontFamily: 'var(--font-sans)', fontSize: '12px', fontWeight: 700, color: 'var(--rust)', textTransform: 'uppercase' }}>
                Question {activeIdx + 1} of {DEMO_QUESTIONS.length} · {currentQ.subject}
              </span>
              <span style={{ fontSize: '12px', color: 'var(--ink-soft)' }}>
                Mark: 1.00
              </span>
            </div>

            <p style={{ fontSize: '15.5px', fontWeight: 600, color: 'var(--ink)', lineHeight: 1.6, marginBottom: '20px' }}>
              {currentQ.question}
            </p>

            {/* Options List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
              {currentQ.options.map((opt) => {
                const isChosen = selectedOption === opt.label;
                return (
                  <button
                    key={opt.label}
                    type="button"
                    onClick={() => handleSelectOption(opt.label)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '14px',
                      padding: '12px 18px',
                      borderRadius: '8px',
                      border: isChosen ? '2px solid var(--rust)' : '1.5px solid var(--paper-line)',
                      backgroundColor: isChosen ? 'var(--rust-soft)' : 'var(--white)',
                      textAlign: 'left',
                      cursor: 'pointer',
                      transition: 'border-color 0.15s ease, background 0.15s ease',
                      width: '100%',
                    }}
                  >
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '26px',
                        height: '26px',
                        borderRadius: '50%',
                        backgroundColor: isChosen ? 'var(--rust)' : 'var(--paper)',
                        color: isChosen ? '#ffffff' : 'var(--ink)',
                        fontSize: '12px',
                        fontWeight: 700,
                        fontFamily: 'var(--font-sans)',
                        flexShrink: 0,
                      }}
                    >
                      {opt.label}
                    </span>
                    <span style={{ fontSize: '14px', color: 'var(--ink)', lineHeight: 1.5 }}>
                      {opt.text}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Navigation & Controls Bar */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '12px',
                paddingTop: '16px',
                borderTop: '1px solid var(--paper-line)',
              }}
            >
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  disabled={activeIdx === 0}
                  onClick={() => {
                    setActiveIdx((prev) => Math.max(0, prev - 1));
                    setShowExplanation(false);
                  }}
                  className="btn-custom btn-custom-ghost"
                  style={{ fontSize: '12.5px', padding: '7px 14px', opacity: activeIdx === 0 ? 0.4 : 1 }}
                >
                  [P] Previous
                </button>
                <button
                  type="button"
                  disabled={activeIdx === DEMO_QUESTIONS.length - 1}
                  onClick={() => {
                    setActiveIdx((prev) => Math.min(DEMO_QUESTIONS.length - 1, prev + 1));
                    setShowExplanation(false);
                  }}
                  className="btn-custom btn-custom-ghost"
                  style={{ fontSize: '12.5px', padding: '7px 14px', opacity: activeIdx === DEMO_QUESTIONS.length - 1 ? 0.4 : 1 }}
                >
                  [N] Next
                </button>
                <button
                  type="button"
                  onClick={handleClear}
                  className="btn-custom btn-custom-ghost"
                  style={{ fontSize: '12.5px', padding: '7px 14px' }}
                >
                  [R] Clear
                </button>
              </div>

              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={() => setShowExplanation((prev) => !prev)}
                  className="btn-custom btn-custom-ghost"
                  style={{ fontSize: '12.5px', padding: '7px 14px', color: 'var(--rust)', borderColor: 'var(--rust)' }}
                >
                  {showExplanation ? 'Hide Solution ▲' : 'Reveal Worked Solution ▼'}
                </button>

                <button
                  type="button"
                  onClick={handleStartExam}
                  className="btn-custom btn-custom-primary"
                  style={{ fontSize: '12.5px', padding: '7px 16px' }}
                >
                  [S] Full Mock Test →
                </button>
              </div>
            </div>

            {/* Solution Explanation Box */}
            {showExplanation && (
              <div
                style={{
                  marginTop: '18px',
                  padding: '16px 20px',
                  backgroundColor: 'var(--paper)',
                  borderRadius: '6px',
                  borderLeft: '4px solid var(--rust)',
                }}
              >
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--rust)', marginBottom: '4px', fontFamily: 'var(--font-sans)' }}>
                  CORRECT ANSWER: OPTION {currentQ.correct}
                </div>
                <p style={{ fontSize: '13.5px', color: 'var(--ink)', margin: 0, lineHeight: 1.6 }}>
                  {currentQ.explanation}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* 4 Grouped Technological Highlights */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '20px',
            marginTop: '32px',
          }}
        >
          <div style={{ padding: '20px', backgroundColor: 'var(--white)', border: '1px solid var(--paper-line)', borderRadius: '8px' }}>
            <div style={{ fontSize: '18px', marginBottom: '8px' }}>⌨️</div>
            <h4 style={{ fontSize: '14px', margin: '0 0 6px 0', color: 'var(--ink)' }}>8-Key Keyboard Navigation</h4>
            <p style={{ fontSize: '12.5px', color: 'var(--ink-soft)', margin: 0, lineHeight: 1.5 }}>
              Use official keys A, B, C, D to answer, P for previous, N for next, S to submit, and R to reverse.
            </p>
          </div>

          <div style={{ padding: '20px', backgroundColor: 'var(--white)', border: '1px solid var(--paper-line)', borderRadius: '8px' }}>
            <div style={{ fontSize: '18px', marginBottom: '8px' }}>⏱️</div>
            <h4 style={{ fontSize: '14px', margin: '0 0 6px 0', color: 'var(--ink)' }}>Countdown Clock &amp; Auto-Submit</h4>
            <p style={{ fontSize: '12.5px', color: 'var(--ink-soft)', margin: 0, lineHeight: 1.5 }}>
              Simulates real hall pacing so candidates learn time budgeting across 4 UTME subjects.
            </p>
          </div>

          <div style={{ padding: '20px', backgroundColor: 'var(--white)', border: '1px solid var(--paper-line)', borderRadius: '8px' }}>
            <div style={{ fontSize: '18px', marginBottom: '8px' }}>🧮</div>
            <h4 style={{ fontSize: '14px', margin: '0 0 6px 0', color: 'var(--ink)' }}>On-Screen Calculator</h4>
            <p style={{ fontSize: '12.5px', color: 'var(--ink-soft)', margin: 0, lineHeight: 1.5 }}>
              Integrated standard arithmetic calculator replicating the official JAMB on-screen utility.
            </p>
          </div>

          <div style={{ padding: '20px', backgroundColor: 'var(--white)', border: '1px solid var(--paper-line)', borderRadius: '8px' }}>
            <div style={{ fontSize: '18px', marginBottom: '8px' }}>💡</div>
            <h4 style={{ fontSize: '14px', margin: '0 0 6px 0', color: 'var(--ink)' }}>Instant Worked Solutions</h4>
            <p style={{ fontSize: '12.5px', color: 'var(--ink-soft)', margin: 0, lineHeight: 1.5 }}>
              Immediately see where mistakes were made with step-by-step working and syllabus references.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
