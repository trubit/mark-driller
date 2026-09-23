import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { useAuthStore } from '../store/useAuthStore';

export const StudentProgressSection: React.FC = () => {
  const navigate = useNavigate();
  const { openAuthModal } = useAppStore();
  const { isAuthenticated } = useAuthStore();

  const handleAction = () => {
    if (!isAuthenticated) {
      openAuthModal('login');
    } else {
      navigate('/analytics');
    }
  };

  const topicAnalytics = [
    { subject: 'Mathematics', topic: 'Calculus & Integration', mastery: 85, status: 'Mastered', color: '#22c55e' },
    { subject: 'Mathematics', topic: 'Trigonometry & Bearing', mastery: 92, status: 'Mastered', color: '#22c55e' },
    { subject: 'Physics', topic: 'Electromagnetism & Induction', mastery: 74, status: 'Good', color: 'var(--amber)' },
    { subject: 'Physics', topic: 'Simple Harmonic Motion (SHM)', mastery: 58, status: 'Needs Practice', color: 'var(--rust)' },
    { subject: 'Chemistry', topic: 'Organic Reaction Mechanisms', mastery: 48, status: 'Critical Revision', color: '#ef4444' },
    { subject: 'Use of English', topic: 'Oral English & Vowel Contrasts', mastery: 88, status: 'Mastered', color: '#22c55e' },
  ];

  return (
    <section className="section" id="progress" aria-label="Student Progress and Diagnostic Analytics">
      <div className="wrap">
        <div className="section-head" style={{ marginBottom: '32px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span className="eyebrow">Performance Intelligence</span>
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
              Diagnostic Analytics
            </span>
          </div>
          <h2>Know Exactly Where You Are Losing Marks</h2>
          <p style={{ maxWidth: '680px', margin: '0 auto', color: 'var(--ink-soft)', fontSize: '15px' }}>
            Traditional studying leaves you guessing. MarkDriller records every answer, monitors your speed per question, and isolates weak topics so you can target your revision with mathematical precision.
          </p>
        </div>

        {/* Analytics Showcase Container */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '24px',
            alignItems: 'stretch',
          }}
        >
          {/* Left Panel: Score Trajectory & Speed Metrics */}
          <div
            style={{
              background: 'var(--white)',
              border: '1.5px solid var(--paper-line)',
              borderRadius: '10px',
              padding: '28px',
              boxShadow: 'var(--card-shadow)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <span
                  style={{
                    fontFamily: "var(--font-sans)",
                    fontSize: '11px',
                    fontWeight: 700,
                    color: 'var(--ink-soft)',
                    textTransform: 'uppercase',
                  }}
                >
                  UTME AGGREGATE PROJECTION
                </span>
                <span
                  style={{
                    backgroundColor: 'rgba(34, 197, 94, 0.12)',
                    color: '#16a34a',
                    fontFamily: "var(--font-sans)",
                    fontSize: '11px',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontWeight: 600,
                  }}
                >
                  +42 Marks in 3 Weeks
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '8px' }}>
                <span style={{ fontSize: '44px', fontWeight: 800, fontFamily: "var(--font-sans)", color: 'var(--ink)' }}>
                  328
                </span>
                <span style={{ fontSize: '20px', color: 'var(--ink-soft)', fontFamily: "var(--font-sans)" }}>
                  / 400
                </span>
              </div>

              <p style={{ fontSize: '13px', color: 'var(--ink-soft)', margin: '0 0 20px 0', lineHeight: 1.5 }}>
                Current projected score across 4 subjects based on 12 timed CBT mock sessions and 840 practice questions.
              </p>

              {/* Subject Breakdown Bars */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 600, color: 'var(--ink)' }}>Use of English</span>
                    <span style={{ fontFamily: "var(--font-sans)", color: 'var(--rust)', fontWeight: 700 }}>82 / 100</span>
                  </div>
                  <div style={{ height: '6px', backgroundColor: 'var(--paper)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: '82%', height: '100%', backgroundColor: 'var(--rust)', borderRadius: '3px' }} />
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 600, color: 'var(--ink)' }}>Mathematics</span>
                    <span style={{ fontFamily: "var(--font-sans)", color: 'var(--steel)', fontWeight: 700 }}>88 / 100</span>
                  </div>
                  <div style={{ height: '6px', backgroundColor: 'var(--paper)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: '88%', height: '100%', backgroundColor: 'var(--steel)', borderRadius: '3px' }} />
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 600, color: 'var(--ink)' }}>Physics</span>
                    <span style={{ fontFamily: "var(--font-sans)", color: 'var(--amber)', fontWeight: 700 }}>76 / 100</span>
                  </div>
                  <div style={{ height: '6px', backgroundColor: 'var(--paper)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: '76%', height: '100%', backgroundColor: 'var(--amber)', borderRadius: '3px' }} />
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 600, color: 'var(--ink)' }}>Chemistry</span>
                    <span style={{ fontFamily: "var(--font-sans)", color: '#16a34a', fontWeight: 700 }}>82 / 100</span>
                  </div>
                  <div style={{ height: '6px', backgroundColor: 'var(--paper)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: '82%', height: '100%', backgroundColor: '#16a34a', borderRadius: '3px' }} />
                  </div>
                </div>
              </div>
            </div>

            <div
              style={{
                backgroundColor: 'var(--paper)',
                padding: '12px 14px',
                borderRadius: '6px',
                border: '1px solid var(--paper-line)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontFamily: "var(--font-sans)",
                fontSize: '11.5px',
              }}
            >
              <span>⏱️ SPEED AVERAGE: <strong>38s / Question</strong></span>
              <span style={{ color: '#16a34a', fontWeight: 700 }}>Optimal Timing ✓</span>
            </div>
          </div>

          {/* Right Panel: Granular Topic Diagnostic Heatmap */}
          <div
            style={{
              background: 'var(--white)',
              border: '1.5px solid var(--paper-line)',
              borderRadius: '10px',
              padding: '28px',
              boxShadow: 'var(--card-shadow)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <span
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: '11px',
                  fontWeight: 700,
                  color: 'var(--ink-soft)',
                  textTransform: 'uppercase',
                  display: 'block',
                  marginBottom: '6px',
                }}
              >
                TOPIC WEAKNESS DIAGNOSTICS
              </span>
              <h3 style={{ fontSize: '18px', margin: '0 0 16px 0', color: 'var(--ink)' }}>
                Targeted Remedial Recommendations
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                {topicAnalytics.map((t, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: '10px 12px',
                      borderRadius: '6px',
                      border: '1px solid var(--paper-line)',
                      backgroundColor: 'var(--paper-soft, #fcfcfb)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '10px',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ink)' }}>
                        {t.topic}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--ink-soft)', fontFamily: "var(--font-sans)" }}>
                        {t.subject}
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <span
                        style={{
                          fontSize: '11px',
                          fontFamily: "var(--font-sans)",
                          fontWeight: 700,
                          color: t.color,
                          display: 'block',
                        }}
                      >
                        {t.mastery}%
                      </span>
                      <span style={{ fontSize: '10.5px', color: 'var(--ink-soft)' }}>
                        {t.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={handleAction}
              className="btn-custom btn-custom-primary"
              style={{
                width: '100%',
                fontSize: '13.5px',
                padding: '10px',
                textAlign: 'center',
                justifyContent: 'center',
              }}
            >
              View Your Diagnostic Dashboard →
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

