import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { useAppStore } from '../store/useAppStore';

interface SampleQuestion {
  id: string;
  subject: string;
  exam: string;
  year: number;
  questionNumber: number;
  topic: string;
  questionText: string;
  options: { label: 'A' | 'B' | 'C' | 'D'; text: string }[];
  correct: 'A' | 'B' | 'C' | 'D';
  explanation: string;
  examinerNote: string;
}

const SAMPLE_QUESTIONS: SampleQuestion[] = [
  {
    id: 'pq-math-1',
    subject: 'Mathematics',
    exam: 'JAMB / UTME',
    year: 2024,
    questionNumber: 14,
    topic: 'Logarithms & Indices',
    questionText: 'Evaluate log₁₀(25) + 2 log₁₀(2) - log₁₀(10) without the use of mathematical tables.',
    options: [
      { label: 'A', text: '0' },
      { label: 'B', text: '1' },
      { label: 'C', text: '2' },
      { label: 'D', text: '10' },
    ],
    correct: 'B',
    explanation: 'Using the laws of logarithms:\n2 log₁₀(2) = log₁₀(2²) = log₁₀(4).\nThen, log₁₀(25) + log₁₀(4) = log₁₀(25 × 4) = log₁₀(100).\nFinally, log₁₀(100) - log₁₀(10) = log₁₀(100 / 10) = log₁₀(10) = 1.',
    examinerNote: 'Common pitfall: Candidates frequently mistake log(A) + log(B) for log(A + B) instead of log(A × B).',
  },
  {
    id: 'pq-eng-1',
    subject: 'English Language',
    exam: 'WAEC',
    year: 2023,
    questionNumber: 8,
    topic: 'Concord & Grammatical Agreement',
    questionText: 'The committee, along with the chairman and executive secretary, ______ submitted its report to the Senate.',
    options: [
      { label: 'A', text: 'have' },
      { label: 'B', text: 'has' },
      { label: 'C', text: 'are' },
      { label: 'D', text: 'were' },
    ],
    correct: 'B',
    explanation: "Parenthetical phrases introduced by 'along with', 'as well as', or 'in conjunction with' do not affect the grammatical number of the subject. The main subject 'The committee' is singular (taking the singular possessive pronoun 'its'), requiring the singular verb 'has'.",
    examinerNote: 'WASSCE Chief Examiner notes that 62% of candidates pick plural verbs when blinded by intervening nouns in parenthetical clauses.',
  },
  {
    id: 'pq-phy-1',
    subject: 'Physics',
    exam: 'JAMB / UTME',
    year: 2024,
    questionNumber: 22,
    topic: 'Kinematics & Work-Energy',
    questionText: 'A body of mass 4 kg is projected vertically upwards with a velocity of 20 m/s. Calculate its maximum potential energy at the peak of its trajectory. [Take g = 10 m/s²]',
    options: [
      { label: 'A', text: '400 J' },
      { label: 'B', text: '800 J' },
      { label: 'C', text: '1600 J' },
      { label: 'D', text: '200 J' },
    ],
    correct: 'B',
    explanation: 'By the Law of Conservation of Mechanical Energy:\nMaximum Potential Energy (PE_max) at the top = Kinetic Energy (KE_initial) at the point of projection.\nKE = ½ m v²\nKE = ½ × 4 kg × (20 m/s)² = 2 × 400 = 800 Joules.',
    examinerNote: 'Quick shortcut: Avoid calculating height h first; equate KE_init = PE_max directly to save 45 seconds during CBT timing.',
  },
  {
    id: 'pq-chem-1',
    subject: 'Chemistry',
    exam: 'NECO',
    year: 2023,
    questionNumber: 31,
    topic: 'Periodic Table & Chemical Bonding',
    questionText: 'Which of the following electronic configurations represents an element with the highest first ionization energy?',
    options: [
      { label: 'A', text: '1s² 2s² 2p⁶' },
      { label: 'B', text: '1s² 2s² 2p³' },
      { label: 'C', text: '1s² 2s² 2p⁴' },
      { label: 'D', text: '1s² 2s¹' },
    ],
    correct: 'A',
    explanation: '1s² 2s² 2p⁶ is the electron configuration of Neon (a noble gas). Completely filled valence shells possess exceptional stability, demanding the highest energy input to dislodge an electron.',
    examinerNote: 'Remember that half-filled (2p³) is more stable than partially filled (2p⁴), but completely filled octet (2p⁶) surpasses all within period 2.',
  },
  {
    id: 'pq-bio-1',
    subject: 'Biology',
    exam: 'JAMB / UTME',
    year: 2024,
    questionNumber: 17,
    topic: 'Genetics & Heredity',
    questionText: 'In humans, normal pigmentation (A) is dominant over albinism (a). If a heterozygous carrier man marries an albino woman, what percentage of their offspring is expected to be albino?',
    options: [
      { label: 'A', text: '0%' },
      { label: 'B', text: '25%' },
      { label: 'C', text: '50%' },
      { label: 'D', text: '100%' },
    ],
    correct: 'C',
    explanation: 'Cross: Heterozygous male (Aa) × Albino female (aa).\nGametes: (A, a) × (a, a).\nPunnett Square yields: Aa (Carrier, 50%) and aa (Albino, 50%).\nTherefore, 50% of the offspring are expected to exhibit the albino phenotype.',
    examinerNote: 'Always clearly separate genotype ratios (1:1) from phenotype probabilities when reading UTME genetics stems.',
  },
  {
    id: 'pq-econs-1',
    subject: 'Economics',
    exam: 'WAEC',
    year: 2023,
    questionNumber: 19,
    topic: 'Elasticity of Demand & Supply',
    questionText: 'When a 10% increase in the price of Garri leads to a 5% decrease in the quantity demanded, the price elasticity of demand is:',
    options: [
      { label: 'A', text: 'Inelastic (0.5)' },
      { label: 'B', text: 'Elastic (2.0)' },
      { label: 'C', text: 'Unitary (1.0)' },
      { label: 'D', text: 'Perfect (∞)' },
    ],
    correct: 'A',
    explanation: 'Price Elasticity of Demand (PED) = |% Change in Quantity Demanded| / |% Change in Price|\nPED = 5% / 10% = 0.5.\nSince PED < 1, the demand for Garri is price inelastic.',
    examinerNote: 'Essential food staples in Nigeria typically feature inelastic demand because consumers have limited immediate substitutes.',
  },
];

export const PastQuestionsExplorer: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const { openAuthModal } = useAppStore();
  const [selectedSubject, setSelectedSubject] = useState('Mathematics');
  const [revealedSolutions, setRevealedSolutions] = useState<Record<string, boolean>>({});
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});

  const subjects = ['Mathematics', 'English Language', 'Physics', 'Chemistry', 'Biology', 'Economics'];

  const currentQ = SAMPLE_QUESTIONS.find((q) => q.subject === selectedSubject) || SAMPLE_QUESTIONS[0];

  const handleToggleSolution = (id: string) => {
    setRevealedSolutions((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSelectOption = (qid: string, label: string) => {
    setSelectedAnswers((prev) => ({ ...prev, [qid]: label }));
  };

  return (
    <section className="section" id="questions" aria-label="Official Nigerian Past Questions Bank">
      <div className="wrap">
        <div className="section-head" style={{ marginBottom: '32px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span className="eyebrow">Authentic Past Papers (1978–2026)</span>
            <span
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: '11px',
                padding: '2px 8px',
                borderRadius: '4px',
                background: 'rgba(226, 154, 60, 0.15)',
                color: 'var(--amber)',
                fontWeight: 600,
              }}
            >
              150,000+ Questions Indexed
            </span>
          </div>
          <h2>Drill Real Examination Questions with Worked Explanations</h2>
          <p style={{ maxWidth: '680px', margin: '0 auto', color: 'var(--ink-soft)', fontSize: '15px' }}>
            Select a subject below to preview actual questions set in past national examinations. Learn the exact reasoning steps and avoid the common traps noted by WAEC and JAMB Chief Examiners.
          </p>
        </div>

        {/* Subject Navigation Tabs */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: '8px',
            marginBottom: '28px',
          }}
        >
          {subjects.map((subj) => {
            const isActive = selectedSubject === subj;
            return (
              <button
                key={subj}
                type="button"
                onClick={() => setSelectedSubject(subj)}
                className={`btn-custom ${isActive ? 'btn-custom-primary' : 'btn-custom-ghost'}`}
                style={{ fontSize: '13px', padding: '8px 18px' }}
              >
                {subj}
              </button>
            );
          })}
        </div>

        {/* Interactive Sample Question Showcase Card */}
        <div
          style={{
            maxWidth: '820px',
            margin: '0 auto',
            background: 'var(--white)',
            border: '2px solid var(--paper-line)',
            borderRadius: '10px',
            padding: 'clamp(20px, 4vw, 32px)',
            boxShadow: 'var(--card-shadow)',
          }}
        >
          {/* Question Metadata Header */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '10px',
              borderBottom: '1px solid var(--paper-line)',
              paddingBottom: '14px',
              marginBottom: '18px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span
                style={{
                  fontFamily: "var(--font-sans)",
                  fontWeight: 700,
                  fontSize: '15px',
                  color: 'var(--ink)',
                }}
              >
                {currentQ.exam} {currentQ.year}
              </span>
              <span
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: '11px',
                  backgroundColor: 'rgba(168, 86, 47, 0.1)',
                  color: 'var(--rust)',
                  padding: '2px 8px',
                  borderRadius: '3px',
                  fontWeight: 600,
                }}
              >
                QUESTION {currentQ.questionNumber}
              </span>
              <span
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: '11px',
                  backgroundColor: 'var(--paper)',
                  color: 'var(--ink-soft)',
                  padding: '2px 8px',
                  borderRadius: '3px',
                }}
              >
                TOPIC: {currentQ.topic.toUpperCase()}
              </span>
            </div>

            <span
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: '11px',
                color: '#16a34a',
                fontWeight: 600,
              }}
            >
              ✓ Verified Curriculum Key
            </span>
          </div>

          {/* Question Stem */}
          <div
            style={{
              fontSize: '16.5px',
              lineHeight: 1.6,
              color: 'var(--ink)',
              fontFamily: "var(--font-sans)",
              fontWeight: 500,
              marginBottom: '20px',
            }}
          >
            {currentQ.questionText}
          </div>

          {/* Multiple Choice Options */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '10px', marginBottom: '20px' }}>
            {currentQ.options.map((opt) => {
              const isSelected = selectedAnswers[currentQ.id] === opt.label;
              const isRevealed = revealedSolutions[currentQ.id];
              const isCorrectOption = opt.label === currentQ.correct;

              let borderStyle = '1px solid var(--paper-line)';
              let bgStyle = 'var(--white)';
              if (isSelected) {
                borderStyle = '2px solid var(--rust)';
                bgStyle = 'rgba(168, 86, 47, 0.05)';
              }
              if (isRevealed) {
                if (isCorrectOption) {
                  borderStyle = '2px solid #22c55e';
                  bgStyle = 'rgba(34, 197, 94, 0.08)';
                } else if (isSelected && !isCorrectOption) {
                  borderStyle = '2px solid #ef4444';
                  bgStyle = 'rgba(239, 68, 68, 0.08)';
                }
              }

              return (
                <button
                  key={opt.label}
                  type="button"
                  onClick={() => handleSelectOption(currentQ.id, opt.label)}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                    padding: '12px 14px',
                    borderRadius: '6px',
                    border: borderStyle,
                    backgroundColor: bgStyle,
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <span
                    style={{
                      fontFamily: "var(--font-sans)",
                      fontWeight: 700,
                      fontSize: '12.5px',
                      backgroundColor: 'var(--paper)',
                      padding: '2px 6px',
                      borderRadius: '3px',
                      color: 'var(--ink)',
                    }}
                  >
                    {opt.label}
                  </span>
                  <span
                    style={{
                      fontSize: '14px',
                      fontFamily: "var(--font-sans)",
                      color: 'var(--ink)',
                      lineHeight: 1.4,
                    }}
                  >
                    {opt.text}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Action Row: Reveal Solution & Link to full bank */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '12px',
              paddingTop: '12px',
              borderTop: '1px solid var(--paper-line)',
            }}
          >
            <button
              type="button"
              onClick={() => handleToggleSolution(currentQ.id)}
              className="btn-custom btn-custom-ghost"
              style={{ fontSize: '13px', padding: '8px 16px' }}
            >
              {revealedSolutions[currentQ.id]
                ? '▲ Hide Worked Solution'
                : '▼ Reveal Step-by-Step Solution & Examiner Remarks'}
            </button>

            <button
              type="button"
              onClick={() =>
                !isAuthenticated
                  ? openAuthModal('login')
                  : navigate(`/questions?subject=${encodeURIComponent(currentQ.subject)}`)
              }
              className="btn-custom btn-custom-primary"
              style={{ fontSize: '13px', padding: '8px 18px' }}
            >
              {!isAuthenticated
                ? `Log in to Browse ${currentQ.subject} →`
                : `Browse All ${currentQ.subject} Questions →`}
            </button>
          </div>

          {/* Step-by-Step Worked Solution Details */}
          {revealedSolutions[currentQ.id] && (
            <div
              style={{
                marginTop: '18px',
                padding: '16px 20px',
                backgroundColor: 'var(--paper-soft, #fcfcfb)',
                borderRadius: '6px',
                border: '1.5px solid var(--paper-line)',
                borderLeft: '4px solid #22c55e',
                animation: 'fadeIn 0.2s ease-in',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{ color: '#16a34a', fontSize: '16px' }}>✓</span>
                <strong style={{ fontFamily: "var(--font-sans)", fontSize: '14.5px', color: 'var(--ink)' }}>
                  Correct Answer: Option {currentQ.correct}
                </strong>
              </div>

              <div
                style={{
                  fontSize: '13.5px',
                  lineHeight: 1.6,
                  color: 'var(--ink)',
                  whiteSpace: 'pre-line',
                  marginBottom: '12px',
                }}
              >
                {currentQ.explanation}
              </div>

              <div
                style={{
                  padding: '10px 14px',
                  backgroundColor: 'var(--white)',
                  borderRadius: '4px',
                  border: '1px solid var(--paper-line)',
                  fontSize: '12px',
                  color: 'var(--rust)',
                  fontFamily: "var(--font-sans)",
                  lineHeight: 1.45,
                }}
              >
                <strong>⚠️ CHIEF EXAMINER REMARK:</strong> {currentQ.examinerNote}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

