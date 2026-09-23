import React, { useState } from 'react';
import { Link } from 'react-router-dom';

interface FaqItem {
  question: string;
  answer: React.ReactNode;
  category: string;
}

const FAQS: FaqItem[] = [
  {
    category: 'Offline Access',
    question: 'Does MarkDriller work completely offline without an active internet connection?',
    answer: (
      <span>
        Yes! Our downloadable <strong>Windows PC application (.exe)</strong> and <strong>Android Mobile APK</strong> operate 100% offline. Once installed or activated with a product key, you can practice over 150,000 past questions, sit timed mock exams, and view step-by-step worked solutions without consuming any internet data.
      </span>
    ),
  },
  {
    category: 'Syllabus & Questions',
    question: 'Are the questions authentic and updated to the latest 2026 JAMB & WAEC syllabi?',
    answer: (
      <span>
        Every question in the MarkDriller database is transcribed from authentic past examination papers spanning 1978 to 2026. Our academic editorial team continually audits the question bank against the official JAMB IBASS syllabus, WAEC regulations, and NECO curriculum, retiring outdated topics and adding comprehensive novel summaries for <em>The Life Changer</em> and prescribed literature texts.
      </span>
    ),
  },
  {
    category: 'CBT Controls',
    question: 'Can I practice with the official JAMB 8-key keyboard shortcut mode?',
    answer: (
      <span>
        Yes. In our CBT simulator, you can toggle the official <strong>8-Key Navigation Mode</strong>: keys <code>[A]</code>, <code>[B]</code>, <code>[C]</code>, and <code>[D]</code> select options, <code>[N]</code> advances to the next question, <code>[P]</code> navigates back, <code>[R]</code> reverses or clears a selected answer, and <code>[S]</code> submits the examination session. This builds vital exam-day speed and muscle memory.
      </span>
    ),
  },
  {
    category: 'Activation & Scratch Cards',
    question: 'How do I activate full access if I bought a physical scratch card or license PIN?',
    answer: (
      <span>
        Visit our <Link to="/activate" style={{ color: 'var(--rust)', fontWeight: 600 }}>Offline Activation Portal</Link> or click "Activate PIN" on the top navigation bar. Enter your 16-digit scratch card PIN or paste your software product key to immediately unlock uninterrupted lifetime access on your device.
      </span>
    ),
  },
  {
    category: 'Calculator & Tools',
    question: 'Is the on-screen calculator identical to what JAMB provides in the CBT centre?',
    answer: (
      <span>
        Yes. MarkDriller includes the official standard JAMB e-Calculator interface as well as an expanded scientific calculator for science and engineering subjects. Candidates practice under the exact mathematical tools permitted by the examination board.
      </span>
    ),
  },
  {
    category: 'Schools & Centres',
    question: 'Can schools, tutorial centres, and CBT centres install MarkDriller across computer labs?',
    answer: (
      <span>
        Yes! We supply the <strong>MarkDriller School LAN Server</strong> edition. It enables secondary schools and CBT centres to administer synchronized mock examinations across 50 to 500+ student computers on a local Wi-Fi or Ethernet network without active internet connectivity. Contact our institutional desk or visit the <Link to="/reseller" style={{ color: 'var(--rust)', fontWeight: 600 }}>Reseller &amp; School Portal</Link> for deployment licenses.
      </span>
    ),
  },
];

export const FaqSection: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleFaq = (index: number) => {
    setOpenIndex((prev) => (prev === index ? null : index));
  };

  return (
    <section className="section" id="faq" aria-label="Frequently Asked Questions">
      <div className="wrap">
        <div className="section-head" style={{ marginBottom: '32px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span className="eyebrow">Clear Answers</span>
            <span
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: '11px',
                padding: '2px 8px',
                borderRadius: '4px',
                background: 'rgba(168, 86, 47, 0.12)',
                color: 'var(--rust)',
                fontWeight: 600,
              }}
            >
              Candidate &amp; Parent Help
            </span>
          </div>
          <h2>Frequently Asked Questions</h2>
          <p style={{ maxWidth: '640px', margin: '0 auto', color: 'var(--ink-soft)', fontSize: '15px' }}>
            Everything you need to know about MarkDriller offline software, activation scratch cards, syllabus coverage, and CBT exam tools.
          </p>
        </div>

        {/* Accordion List */}
        <div
          style={{
            maxWidth: '820px',
            margin: '0 auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          {FAQS.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                style={{
                  background: 'var(--white)',
                  border: isOpen ? '1.5px solid var(--rust)' : '1px solid var(--paper-line)',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
                  boxShadow: isOpen ? '0 4px 14px rgba(168, 86, 47, 0.08)' : 'none',
                }}
              >
                <button
                  type="button"
                  onClick={() => toggleFaq(idx)}
                  style={{
                    width: '100%',
                    padding: '18px 22px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '16px',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                  aria-expanded={isOpen}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span
                      style={{
                        fontFamily: "var(--font-sans)",
                        fontSize: '10px',
                        fontWeight: 700,
                        color: isOpen ? 'var(--rust)' : 'var(--ink-soft)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                      }}
                    >
                      {faq.category}
                    </span>
                    <span
                      style={{
                        fontFamily: "var(--font-sans)",
                        fontWeight: 700,
                        fontSize: '15.5px',
                        color: 'var(--ink)',
                        lineHeight: 1.35,
                      }}
                    >
                      {faq.question}
                    </span>
                  </div>

                  <span
                    style={{
                      fontSize: '18px',
                      color: isOpen ? 'var(--rust)' : 'var(--ink-soft)',
                      fontWeight: 700,
                      transform: isOpen ? 'rotate(180deg)' : 'none',
                      transition: 'transform 0.2s ease',
                    }}
                  >
                    ▼
                  </span>
                </button>

                {isOpen && (
                  <div
                    style={{
                      padding: '0 22px 18px 22px',
                      fontSize: '14px',
                      lineHeight: 1.6,
                      color: 'var(--ink)',
                      borderTop: '1px dashed var(--paper-line)',
                      paddingTop: '14px',
                    }}
                  >
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Unresolved Question Helper */}
        <div
          style={{
            textAlign: 'center',
            marginTop: '32px',
            fontSize: '13.5px',
            color: 'var(--ink-soft)',
          }}
        >
          Have a specific question not listed here?{' '}
          <Link to="/contact" style={{ color: 'var(--rust)', fontWeight: 600 }}>
            Reach out to our customer support desk →
          </Link>
        </div>
      </div>
    </section>
  );
};

