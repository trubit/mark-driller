import React, { useState, useEffect } from 'react';
import { ExamBoardLogo } from './ExamBoardLogo';

interface ChallengeQuestion {
  id: number;
  subject: string;
  question: string;
  options: string[];
  correct: number;
  explanation: string;
}

const CHALLENGE_QUESTIONS: ChallengeQuestion[] = [
  {
    id: 1,
    subject: 'Use of English',
    question: 'Choose the word that best completes the sentence: "The vice chancellor, accompanied by three deans, ______ the newly commissioned laboratory."',
    options: ['are inspecting', 'have inspected', 'is inspecting', 'were inspecting'],
    correct: 2,
    explanation: 'When a singular subject (The vice chancellor) is followed by parenthetical phrases like "accompanied by", the verb remains singular ("is inspecting").',
  },
  {
    id: 2,
    subject: 'Mathematics',
    question: 'If log₁₀ 2 = 0.3010 and log₁₀ 3 = 0.4771, calculate the value of log₁₀ 18 without using log tables.',
    options: ['1.2552', '1.0791', '0.7781', '1.5562'],
    correct: 0,
    explanation: 'log₁₀ 18 = log₁₀(2 × 3²) = log₁₀ 2 + 2·log₁₀ 3 = 0.3010 + 2(0.4771) = 0.3010 + 0.9542 = 1.2552.',
  },
  {
    id: 3,
    subject: 'Biology',
    question: 'Which of the following cellular organelles is primarily responsible for the synthesis of adenosine triphosphate (ATP) in eukaryotic organisms?',
    options: ['Ribosome', 'Golgi apparatus', 'Mitochondrion', 'Endoplasmic reticulum'],
    correct: 2,
    explanation: 'The mitochondrion is the powerhouse of the cell, carrying out the Krebs cycle and oxidative phosphorylation to produce ATP.',
  },
  {
    id: 4,
    subject: 'Chemistry',
    question: 'What volume of oxygen at s.t.p. is required for the complete combustion of 5.0 dm³ of methane (CH₄)?',
    options: ['5.0 dm³', '10.0 dm³', '15.0 dm³', '20.0 dm³'],
    correct: 1,
    explanation: 'Equation: CH₄ + 2O₂ -> CO₂ + 2H₂O. 1 volume of methane reacts with 2 volumes of oxygen. 5.0 dm³ requires 5.0 × 2 = 10.0 dm³ of O₂.',
  },
  {
    id: 5,
    subject: 'Physics',
    question: 'A ball of mass 0.5 kg moving at 10 m/s is brought to rest in 0.05 seconds. Calculate the magnitude of the average impulsive force exerted on the ball.',
    options: ['50 N', '100 N', '25 N', '200 N'],
    correct: 1,
    explanation: 'Force = Impulse / time = (m·Δv) / t = (0.5 × 10) / 0.05 = 5 / 0.05 = 100 N.',
  },
];

export const WeeklyChallenge: React.FC = () => {
  const [hasStarted, setHasStarted] = useState<boolean>(false);
  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [secondsRemaining, setSecondsRemaining] = useState<number>(600); // 10 minutes
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);

  useEffect(() => {
    let timer: any;
    if (hasStarted && !isSubmitted && secondsRemaining > 0) {
      timer = setInterval(() => {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            setIsSubmitted(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [hasStarted, isSubmitted, secondsRemaining]);

  const handleSelectAnswer = (qIndex: number, optionIdx: number) => {
    if (isSubmitted) return;
    setSelectedAnswers((prev) => ({ ...prev, [qIndex]: optionIdx }));
  };

  const calculateScore = () => {
    let correctCount = 0;
    CHALLENGE_QUESTIONS.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.correct) {
        correctCount += 1;
      }
    });
    return {
      correctCount,
      total: CHALLENGE_QUESTIONS.length,
      percentage: Math.round((correctCount / CHALLENGE_QUESTIONS.length) * 100),
    };
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    return `${String(mins).padStart(2, '0')}:${String(rem).padStart(2, '0')}`;
  };

  const currentQ = CHALLENGE_QUESTIONS[currentIdx];
  const results = isSubmitted ? calculateScore() : null;

  return (
    <div className="portal-layout premium-portal-page premium-learning-page" style={{ minHeight: '100vh', background: 'var(--paper)' }}>
      <div className="wrap" style={{ padding: '32px 24px', maxWidth: '960px', margin: '0 auto' }}>
        <div style={{ marginBottom: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <ExamBoardLogo board="JAMB / UTME" size={36} />
            <span className="eyebrow" style={{ margin: 0 }}>National CBT Benchmark</span>
          </div>
          <h1 style={{ fontSize: '28px', color: 'var(--ink)', margin: '0 0 8px 0' }}>
            Weekly National UTME Sprint Challenge
          </h1>
          <p style={{ color: 'var(--ink-soft)', fontSize: '15px', maxWidth: '750px', margin: 0 }}>
            Compete in this week\'s standardized multi-disciplinary 10-minute speed trial. Measure your accuracy under pressure against real national curriculum standards.
          </p>
        </div>

        {/* Challenge Overview / Welcome Screen */}
        {!hasStarted && !isSubmitted && (
          <div
            style={{
              background: 'var(--white)',
              border: '1px solid var(--paper-line)',
              borderLeft: '4px solid var(--rust)',
              borderRadius: '6px',
              padding: '28px 24px',
              boxShadow: '0 2px 12px rgba(0,0,0,0.03)',
            }}
          >
            <h3 style={{ fontSize: '20px', margin: '0 0 14px 0', color: 'var(--ink)' }}>
              Week 38: Inter-Disciplinary UTME Mastery Sprint
            </h3>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                gap: '14px',
                background: 'var(--paper)',
                padding: '16px',
                borderRadius: '6px',
                marginBottom: '20px',
              }}
            >
              <div>
                <span style={{ display: 'block', fontSize: '11px', fontFamily: "var(--font-sans)", color: 'var(--ink-soft)' }}>
                  TIME LIMIT
                </span>
                <span style={{ fontSize: '18px', fontWeight: 700, fontFamily: "var(--font-sans)", color: 'var(--ink)' }}>
                  10 Minutes
                </span>
              </div>
              <div>
                <span style={{ display: 'block', fontSize: '11px', fontFamily: "var(--font-sans)", color: 'var(--ink-soft)' }}>
                  TOTAL QUESTIONS
                </span>
                <span style={{ fontSize: '18px', fontWeight: 700, fontFamily: "var(--font-sans)", color: 'var(--ink)' }}>
                  {CHALLENGE_QUESTIONS.length} Questions
                </span>
              </div>
              <div>
                <span style={{ display: 'block', fontSize: '11px', fontFamily: "var(--font-sans)", color: 'var(--ink-soft)' }}>
                  SYLLABUS FOCUS
                </span>
                <span style={{ fontSize: '14px', fontWeight: 600, fontFamily: "var(--font-sans)", color: 'var(--rust)' }}>
                  English, Maths &amp; Sciences
                </span>
              </div>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <h4 style={{ fontSize: '14px', fontFamily: "var(--font-sans)", marginBottom: '8px', color: 'var(--ink)' }}>
                Challenge Rules &amp; Assessment Guidelines
              </h4>
              <ul style={{ paddingLeft: '20px', margin: 0, fontSize: '13px', color: 'var(--ink-soft)', lineHeight: 1.6 }}>
                <li>Timer starts immediately upon clicking the button below and cannot be paused.</li>
                <li>Each question carries equal weighting; there is no negative marking penalty.</li>
                <li>Your performance is benchmarked strictly against authentic Nigerian syllabus marking criteria.</li>
              </ul>
            </div>

            <button
              type="button"
              className="btn-custom btn-custom-primary btn-custom-lg"
              onClick={() => {
                setHasStarted(true);
                setSecondsRemaining(600);
              }}
            >
              Begin Weekly Challenge →
            </button>
          </div>
        )}

        {/* In-Challenge Testing Interface */}
        {hasStarted && !isSubmitted && currentQ && (
          <div
            style={{
              background: 'var(--white)',
              border: '2px solid var(--paper-line)',
              borderRadius: '8px',
              padding: '28px',
              boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
            }}
          >
            {/* Header / Nav */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <span
                  style={{
                    fontFamily: "var(--font-sans)",
                    fontSize: '11px',
                    color: 'var(--rust)',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                  }}
                >
                  {currentQ.subject}
                </span>
                <span style={{ marginLeft: '8px', fontSize: '13px', color: 'var(--ink-soft)' }}>
                  Question {currentIdx + 1} of {CHALLENGE_QUESTIONS.length}
                </span>
              </div>

              <div
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: '16px',
                  fontWeight: 700,
                  color: secondsRemaining <= 60 ? '#b91c1c' : 'var(--rust)',
                  background: 'var(--paper)',
                  padding: '6px 14px',
                  borderRadius: '4px',
                }}
              >
                ⏱ {formatTime(secondsRemaining)}
              </div>
            </div>

            {/* Question Text */}
            <h3 style={{ fontSize: '18px', color: 'var(--ink)', lineHeight: 1.5, marginBottom: '24px' }}>
              {currentQ.question}
            </h3>

            {/* Options */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '28px' }}>
              {currentQ.options.map((opt, optIdx) => {
                const isSelected = selectedAnswers[currentIdx] === optIdx;
                return (
                  <button
                    key={optIdx}
                    type="button"
                    onClick={() => handleSelectAnswer(currentIdx, optIdx)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '12px 16px',
                      borderRadius: '5px',
                      border: isSelected ? '2px solid var(--rust)' : '1px solid var(--paper-line)',
                      background: isSelected ? 'var(--white)' : 'var(--paper)',
                      color: 'var(--ink)',
                      fontSize: '14px',
                      cursor: 'pointer',
                      textAlign: 'left',
                      fontFamily: 'inherit',
                      boxShadow: isSelected ? '0 2px 8px rgba(168, 86, 47, 0.1)' : 'none',
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "var(--font-sans)",
                        fontWeight: 700,
                        marginRight: '12px',
                        minWidth: '22px',
                        color: isSelected ? 'var(--rust)' : 'var(--ink-soft)',
                      }}
                    >
                      {String.fromCharCode(65 + optIdx)}.
                    </span>
                    {opt}
                  </button>
                );
              })}
            </div>

            {/* Pagination & Submit Controls */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                type="button"
                className="btn-custom btn-custom-ghost"
                onClick={() => setCurrentIdx((p) => Math.max(0, p - 1))}
                disabled={currentIdx === 0}
                style={{ padding: '8px 16px', fontSize: '13px' }}
              >
                ← Previous
              </button>

              <div style={{ display: 'flex', gap: '6px' }}>
                {CHALLENGE_QUESTIONS.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setCurrentIdx(idx)}
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontFamily: "var(--font-sans)",
                      fontWeight: 600,
                      border: currentIdx === idx ? '2px solid var(--rust)' : '1px solid var(--paper-line)',
                      background: selectedAnswers[idx] !== undefined ? '#225a38' : 'var(--paper)',
                      color: selectedAnswers[idx] !== undefined ? '#ffffff' : 'var(--ink)',
                      cursor: 'pointer',
                    }}
                  >
                    {idx + 1}
                  </button>
                ))}
              </div>

              {currentIdx + 1 === CHALLENGE_QUESTIONS.length ? (
                <button
                  type="button"
                  className="btn-custom btn-custom-primary"
                  onClick={() => setIsSubmitted(true)}
                  style={{ padding: '8px 20px', fontSize: '13px' }}
                >
                  Submit Challenge ✓
                </button>
              ) : (
                <button
                  type="button"
                  className="btn-custom btn-custom-primary"
                  onClick={() => setCurrentIdx((p) => Math.min(CHALLENGE_QUESTIONS.length - 1, p + 1))}
                  style={{ padding: '8px 16px', fontSize: '13px' }}
                >
                  Next →
                </button>
              )}
            </div>
          </div>
        )}

        {/* Challenge Results View */}
        {isSubmitted && results && (
          <div
            style={{
              background: 'var(--white)',
              border: '2px solid var(--rust)',
              borderRadius: '8px',
              padding: '32px 28px',
              boxShadow: '0 4px 16px rgba(168, 86, 47, 0.12)',
            }}
          >
            <span className="eyebrow" style={{ fontSize: '11px' }}>Challenge Completed</span>
            <h2 style={{ fontSize: '24px', margin: '6px 0 16px 0', color: 'var(--ink)' }}>
              Weekly Challenge Results Summary
            </h2>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                gap: '14px',
                background: 'var(--paper)',
                padding: '20px',
                borderRadius: '6px',
                marginBottom: '28px',
              }}
            >
              <div>
                <span style={{ display: 'block', fontSize: '11px', fontFamily: "var(--font-sans)", color: 'var(--ink-soft)' }}>
                  ACCURACY SCORE
                </span>
                <span style={{ fontSize: '24px', fontWeight: 700, fontFamily: "var(--font-sans)", color: 'var(--rust)' }}>
                  {results.percentage}%
                </span>
              </div>
              <div>
                <span style={{ display: 'block', fontSize: '11px', fontFamily: "var(--font-sans)", color: 'var(--ink-soft)' }}>
                  CORRECT ANSWERS
                </span>
                <span style={{ fontSize: '24px', fontWeight: 700, fontFamily: "var(--font-sans)", color: 'var(--ink)' }}>
                  {results.correctCount} / {results.total}
                </span>
              </div>
              <div>
                <span style={{ display: 'block', fontSize: '11px', fontFamily: "var(--font-sans)", color: 'var(--ink-soft)' }}>
                  TIME REMAINING
                </span>
                <span style={{ fontSize: '24px', fontWeight: 700, fontFamily: "var(--font-sans)", color: 'var(--ink)' }}>
                  {formatTime(secondsRemaining)}
                </span>
              </div>
            </div>

            {/* Answer Explanations Review */}
            <h4 style={{ fontSize: '16px', fontFamily: "var(--font-sans)", marginBottom: '14px', color: 'var(--ink)' }}>
              Detailed Question Analysis &amp; Solutions
            </h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '24px' }}>
              {CHALLENGE_QUESTIONS.map((q, idx) => {
                const userAns = selectedAnswers[idx];
                const isCorrect = userAns === q.correct;
                return (
                  <div
                    key={idx}
                    style={{
                      background: 'var(--paper)',
                      border: '1px solid var(--paper-line)',
                      borderLeft: isCorrect ? '4px solid #225a38' : '4px solid #b91c1c',
                      borderRadius: '4px',
                      padding: '14px 16px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ fontWeight: 600, fontSize: '13.5px', color: 'var(--ink)' }}>
                        Q{idx + 1}. {q.question}
                      </span>
                      <span
                        style={{
                          fontSize: '11.5px',
                          fontFamily: "var(--font-sans)",
                          fontWeight: 700,
                          color: isCorrect ? '#225a38' : '#b91c1c',
                        }}
                      >
                        {isCorrect ? '✓ Correct' : '✗ Incorrect'}
                      </span>
                    </div>
                    <div style={{ fontSize: '12.5px', color: 'var(--ink-soft)', marginBottom: '4px' }}>
                      Your Answer: <strong>{userAns !== undefined ? q.options[userAns] : 'Unanswered'}</strong> | Correct: <strong>{q.options[q.correct]}</strong>
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--ink)', fontFamily: "var(--font-sans)" }}>
                      Explanation: {q.explanation}
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              className="btn-custom btn-custom-primary"
              onClick={() => {
                setHasStarted(false);
                setIsSubmitted(false);
                setSelectedAnswers({});
                setCurrentIdx(0);
              }}
              style={{ padding: '10px 24px', fontSize: '13px' }}
            >
              Return to Challenge Lobby
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

