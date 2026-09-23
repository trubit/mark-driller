import React, { useState, useEffect } from 'react';

type GameMode = 'VOCAB_DRILL' | 'MATH_SPRINT' | 'CHEM_RADICALS';

interface QuestionItem {
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

const VOCAB_QUESTIONS: QuestionItem[] = [
  {
    prompt: 'Select the nearest in meaning (Synonym) to: "EPHEMERAL"',
    options: ['Eternal', 'Transient / Short-lived', 'Substantial', 'Rigid'],
    correctIndex: 1,
    explanation: 'Ephemeral means lasting for a very short time (transient, fleeting).',
  },
  {
    prompt: 'Select the exact opposite in meaning (Antonym) to: "LACONIC"',
    options: ['Verbose / Talkative', 'Concise', 'Terse', 'Pithy'],
    correctIndex: 0,
    explanation: 'Laconic means using very few words; its antonym is verbose or loquacious.',
  },
  {
    prompt: 'Select the nearest in meaning to: "UBIQUITOUS"',
    options: ['Omnipresent / Everywhere', 'Rare', 'Dangerous', 'Insignificant'],
    correctIndex: 0,
    explanation: 'Ubiquitous means present, appearing, or found everywhere.',
  },
  {
    prompt: 'Select the exact opposite in meaning to: "CANDID"',
    options: ['Frank', 'Deceitful / Secretive', 'Outspoken', 'Direct'],
    correctIndex: 1,
    explanation: 'Candid means truthful and straightforward; its antonym is deceitful or disingenuous.',
  },
  {
    prompt: 'Select the nearest in meaning to: "METICULOUS"',
    options: ['Careless', 'Diligent and Painstaking', 'Hasty', 'Passive'],
    correctIndex: 1,
    explanation: 'Meticulous means showing great attention to detail; very careful and precise.',
  },
];

const MATH_QUESTIONS: QuestionItem[] = [
  {
    prompt: 'Evaluate: 15% of ₦24,000',
    options: ['₦3,200', '₦3,600', '₦4,000', '₦2,800'],
    correctIndex: 1,
    explanation: '10% of 24,000 = 2,400. 5% = 1,200. Total = 2,400 + 1,200 = ₦3,600.',
  },
  {
    prompt: 'What is the square of 25 minus the square of 24? [Use a² - b²]',
    options: ['49', '51', '47', '1'],
    correctIndex: 0,
    explanation: '25² - 24² = (25 - 24)(25 + 24) = 1 × 49 = 49.',
  },
  {
    prompt: 'If 3x - 7 = 20, what is the value of 2x + 5?',
    options: ['23', '27', '19', '18'],
    correctIndex: 0,
    explanation: '3x = 27 => x = 9. Therefore 2(9) + 5 = 18 + 5 = 23.',
  },
  {
    prompt: 'Express 0.375 as a simplified fraction.',
    options: ['3/8', '7/16', '5/12', '1/3'],
    correctIndex: 0,
    explanation: '375 / 1000 = 3 / 8 (dividing numerator and denominator by 125).',
  },
  {
    prompt: 'If a car travels at 72 km/h, what is its speed in metres per second (m/s)?',
    options: ['15 m/s', '20 m/s', '25 m/s', '30 m/s'],
    correctIndex: 1,
    explanation: 'Multiply by 5/18: 72 × (5/18) = 4 × 5 = 20 m/s.',
  },
];

export const EducationalGames: React.FC = () => {
  const [activeGame, setActiveGame] = useState<GameMode>('VOCAB_DRILL');
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(45);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [gameOver, setGameOver] = useState<boolean>(false);

  const questions = activeGame === 'VOCAB_DRILL' ? VOCAB_QUESTIONS : MATH_QUESTIONS;

  useEffect(() => {
    let timer: any;
    if (isPlaying && timeLeft > 0 && !gameOver) {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setGameOver(true);
            setIsPlaying(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isPlaying, timeLeft, gameOver]);

  const startGame = (mode: GameMode) => {
    setActiveGame(mode);
    setIsPlaying(true);
    setGameOver(false);
    setCurrentIdx(0);
    setScore(0);
    setTimeLeft(45);
    setSelectedOption(null);
    setFeedback(null);
  };

  const handleAnswer = (optionIndex: number) => {
    if (selectedOption !== null || gameOver) return;

    setSelectedOption(optionIndex);
    const q = questions[currentIdx];
    const isCorrect = optionIndex === q.correctIndex;

    if (isCorrect) {
      setScore((s) => s + 10);
      setFeedback('✓ Correct! +10 Points');
    } else {
      setFeedback(`✗ Incorrect. ${q.explanation}`);
    }

    setTimeout(() => {
      if (currentIdx + 1 < questions.length) {
        setCurrentIdx((idx) => idx + 1);
        setSelectedOption(null);
        setFeedback(null);
      } else {
        setGameOver(true);
        setIsPlaying(false);
      }
    }, 1400);
  };

  const currentQ = questions[currentIdx];

  return (
    <div className="portal-layout premium-portal-page premium-learning-page" style={{ minHeight: '100vh', background: 'var(--paper)' }}>
      <div className="wrap" style={{ padding: '32px 24px', maxWidth: '900px', margin: '0 auto' }}>
        <div style={{ marginBottom: '28px' }}>
          <span className="eyebrow" style={{ margin: 0 }}>CBT Speed &amp; Accuracy Training</span>
          <h1 style={{ fontSize: '28px', color: 'var(--ink)', margin: '6px 0' }}>
            Educational Speed Drills &amp; Quizzes
          </h1>
          <p style={{ color: 'var(--ink-soft)', fontSize: '15px', margin: 0 }}>
            Hone rapid mental reflexes for time-pressured JAMB UTME and WAEC examinations with structured 45-second sprints.
          </p>
        </div>

        {/* Drill Type Selectors */}
        {!isPlaying && !gameOver && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '20px',
              marginTop: '16px',
            }}
          >
            <div
              style={{
                background: 'var(--white)',
                border: '1px solid var(--paper-line)',
                borderRadius: '6px',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <span className="eyebrow" style={{ fontSize: '10px' }}>Use of English</span>
                <h3 style={{ fontSize: '18px', margin: '6px 0 10px 0', color: 'var(--ink)' }}>
                  JAMB Lexis &amp; Vocabulary Sprint
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--ink-soft)', lineHeight: 1.5, marginBottom: '16px' }}>
                  Test your mastery of high-frequency synonyms, antonyms, idioms, and grammatical concord under a 45-second clock.
                </p>
              </div>
              <button
                type="button"
                className="btn-custom btn-custom-primary"
                onClick={() => startGame('VOCAB_DRILL')}
                style={{ width: '100%', padding: '10px', textAlign: 'center' }}
              >
                Start Vocabulary Sprint →
              </button>
            </div>

            <div
              style={{
                background: 'var(--white)',
                border: '1px solid var(--paper-line)',
                borderRadius: '6px',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <span className="eyebrow" style={{ fontSize: '10px' }}>Mathematics &amp; Physics</span>
                <h3 style={{ fontSize: '18px', margin: '6px 0 10px 0', color: 'var(--ink)' }}>
                  Mental Arithmetic &amp; Speed Math
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--ink-soft)', lineHeight: 1.5, marginBottom: '16px' }}>
                  Quick algebraic factoring, percentage tricks, unit conversions, and quantitative reasoning without reaching for a calculator.
                </p>
              </div>
              <button
                type="button"
                className="btn-custom btn-custom-primary"
                onClick={() => startGame('MATH_SPRINT')}
                style={{ width: '100%', padding: '10px', textAlign: 'center' }}
              >
                Start Math Sprint →
              </button>
            </div>
          </div>
        )}

        {/* Active Game Interface */}
        {isPlaying && currentQ && (
          <div
            style={{
              background: 'var(--white)',
              border: '2px solid var(--paper-line)',
              borderRadius: '8px',
              padding: '28px',
              boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
            }}
          >
            {/* Header: Timer & Score */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontFamily: "var(--font-sans)", fontSize: '13px', color: 'var(--ink-soft)' }}>
                  Question {currentIdx + 1} of {questions.length}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <div
                  style={{
                    fontFamily: "var(--font-sans)",
                    fontSize: '15px',
                    fontWeight: 700,
                    color: timeLeft <= 10 ? '#b91c1c' : 'var(--rust)',
                  }}
                >
                  ⏱ {timeLeft}s remaining
                </div>
                <div
                  style={{
                    background: 'var(--paper)',
                    padding: '4px 12px',
                    borderRadius: '4px',
                    fontFamily: "var(--font-sans)",
                    fontWeight: 700,
                    fontSize: '14px',
                    color: 'var(--ink)',
                  }}
                >
                  Score: {score} pts
                </div>
              </div>
            </div>

            {/* Question Text */}
            <h2 style={{ fontSize: '19px', color: 'var(--ink)', lineHeight: 1.5, marginBottom: '24px' }}>
              {currentQ.prompt}
            </h2>

            {/* Options */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
              {currentQ.options.map((opt, idx) => {
                const isChosen = selectedOption === idx;
                const isCorrect = idx === currentQ.correctIndex;
                let optBg = 'var(--paper)';
                let optBorder = 'var(--paper-line)';
                let optColor = 'var(--ink)';

                if (selectedOption !== null) {
                  if (isCorrect) {
                    optBg = '#225a38';
                    optColor = '#ffffff';
                    optBorder = '#225a38';
                  } else if (isChosen) {
                    optBg = '#b91c1c';
                    optColor = '#ffffff';
                    optBorder = '#b91c1c';
                  }
                }

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleAnswer(idx)}
                    disabled={selectedOption !== null}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '12px 16px',
                      borderRadius: '5px',
                      border: `1px solid ${optBorder}`,
                      background: optBg,
                      color: optColor,
                      fontSize: '14.5px',
                      cursor: selectedOption === null ? 'pointer' : 'default',
                      textAlign: 'left',
                      fontFamily: 'inherit',
                      transition: 'all 0.12s ease',
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "var(--font-sans)",
                        fontWeight: 700,
                        marginRight: '12px',
                        minWidth: '22px',
                      }}
                    >
                      {String.fromCharCode(65 + idx)}.
                    </span>
                    {opt}
                  </button>
                );
              })}
            </div>

            {/* Feedback alert */}
            {feedback && (
              <div
                style={{
                  padding: '10px 14px',
                  borderRadius: '4px',
                  fontSize: '13px',
                  fontFamily: "var(--font-sans)",
                  background: selectedOption === currentQ.correctIndex ? 'rgba(34, 90, 56, 0.1)' : 'rgba(185, 28, 28, 0.08)',
                  color: selectedOption === currentQ.correctIndex ? '#225a38' : '#b91c1c',
                }}
              >
                {feedback}
              </div>
            )}
          </div>
        )}

        {/* Game Over / Results Summary */}
        {gameOver && (
          <div
            style={{
              background: 'var(--white)',
              border: '2px solid var(--rust)',
              borderRadius: '8px',
              padding: '36px 28px',
              textAlign: 'center',
              boxShadow: '0 4px 16px rgba(168, 86, 47, 0.12)',
            }}
          >
            <span className="eyebrow" style={{ fontSize: '11px' }}>Sprint Completed</span>
            <h2 style={{ fontSize: '26px', margin: '8px 0', color: 'var(--ink)' }}>
              Speed Drill Session Complete!
            </h2>
            <p style={{ color: 'var(--ink-soft)', fontSize: '14.5px', maxWidth: '500px', margin: '0 auto 24px auto' }}>
              Timed sprints reinforce immediate retrieval and eliminate exam hesitation during CBT multiple-choice modules.
            </p>

            <div
              style={{
                display: 'inline-flex',
                gap: '28px',
                background: 'var(--paper)',
                padding: '16px 28px',
                borderRadius: '6px',
                marginBottom: '28px',
                border: '1px solid var(--paper-line)',
              }}
            >
              <div>
                <span style={{ display: 'block', fontSize: '11px', fontFamily: "var(--font-sans)", color: 'var(--ink-soft)' }}>
                  FINAL SCORE
                </span>
                <span style={{ fontSize: '24px', fontWeight: 700, fontFamily: "var(--font-sans)", color: 'var(--rust)' }}>
                  {score} Pts
                </span>
              </div>
              <div>
                <span style={{ display: 'block', fontSize: '11px', fontFamily: "var(--font-sans)", color: 'var(--ink-soft)' }}>
                  QUESTIONS ATTEMPTED
                </span>
                <span style={{ fontSize: '24px', fontWeight: 700, fontFamily: "var(--font-sans)", color: 'var(--ink)' }}>
                  {currentIdx} / {questions.length}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
              <button
                type="button"
                className="btn-custom btn-custom-primary"
                onClick={() => startGame(activeGame)}
                style={{ padding: '10px 24px', fontSize: '14px' }}
              >
                Play Again ↺
              </button>
              <button
                type="button"
                className="btn-custom btn-custom-ghost"
                onClick={() => {
                  setGameOver(false);
                  setIsPlaying(false);
                }}
                style={{ padding: '10px 20px', fontSize: '14px' }}
              >
                Back to Drills
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

