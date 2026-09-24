import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { useAuthStore } from '../store/useAuthStore';

export const MockExamSection: React.FC = () => {
  const navigate = useNavigate();
  const { openAuthModal } = useAppStore();
  const { isAuthenticated } = useAuthStore();

  const handleStartMock = (examCode: string) => {
    if (!isAuthenticated) {
      openAuthModal('login');
    } else {
      navigate(`/dashboard?startMock=${encodeURIComponent(examCode)}`);
    }
  };

  const mockTypes = [
    {
      title: 'JAMB UTME 4-Subject Mock',
      badge: 'Official UTME Format',
      badgeColor: 'var(--rust)',
      subjects: 'Use of English (60 Qs) + 3 Chosen Subjects (40 Qs each)',
      duration: '120 Minutes (2 Hours)',
      scoring: 'Standardized 0 – 400 Aggregate Score',
      features: [
        'Exact JAMB 8-key keyboard navigation (A, B, C, D, N, P, S, R)',
        'Built-in e-Calculator with standard and scientific modes',
        'Automatic countdown submission on timer expiration',
        'Instant subject score breakdown and percentile rank',
      ],
      examCode: 'JAMB / UTME',
      cta: 'Simulate 4-Subject UTME Mock',
    },
    {
      title: 'WAEC / SSCE Timed Objective Mock',
      badge: 'WASSCE Accredited',
      badgeColor: 'var(--steel)',
      subjects: 'Single or Multi-Subject Objective Papers (50 Qs each)',
      duration: '60 – 90 Minutes per Subject Paper',
      scoring: 'A1 – F9 Credit Benchmarking',
      features: [
        'Curriculum-aligned questions matching current WAEC syllabus',
        'Paper 1 objective simulation with negative-marking avoidance tips',
        'Chief Examiners Report remarks for common errors',
        'Downloadable printable answer review summary',
      ],
      examCode: 'WAEC',
      cta: 'Simulate WAEC SSCE Mock',
    },
    {
      title: 'University Post-UTME Speed Screening',
      badge: 'Campus Screening',
      badgeColor: 'var(--amber)',
      subjects: 'Aptitude, General Paper, and Faculty Combinations',
      duration: '30 – 45 Minutes (High-Speed Timing)',
      scoring: '0 – 100% or 0 – 30 / 40 Points',
      features: [
        'Calibrated for UNILAG, UI, OAU, UNIBEN, ABU, and UNN',
        'High-speed drills testing mental math and critical reasoning',
        'Departmental cutoff score predictor based on UTME + Post-UTME',
        'Instant weakness detection across speed-sensitive topics',
      ],
      examCode: 'POST-UTME',
      cta: 'Simulate Post-UTME Mock',
    },
  ];

  return (
    <section className="section" id="mocks" aria-label="Authentic Timed Mock Examinations">
      <div className="wrap">
        <div className="section-head" style={{ marginBottom: '32px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span className="eyebrow">Exam-Day Conditioning</span>
            <span
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: '11px',
                padding: '2px 8px',
                borderRadius: '4px',
                background: 'rgba(62, 110, 142, 0.12)',
                color: 'var(--steel)',
                fontWeight: 600,
              }}
            >
              Strict Countdown Simulation
            </span>
          </div>
          <h2>Full-Fidelity Mock Examinations</h2>
          <p style={{ maxWidth: '680px', margin: '0 auto', color: 'var(--ink-soft)', fontSize: '15px' }}>
            Don't let exam anxiety reduce your score. Sit timed, syllabus-accurate mock exams under identical conditions to the real CBT centre, then analyze your strengths, weaknesses, and national percentile.
          </p>
        </div>

        {/* 3 Mock Exam Cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '24px',
            marginBottom: '36px',
          }}
        >
          {mockTypes.map((mock, idx) => (
            <div
              key={idx}
              style={{
                background: 'var(--white)',
                border: '1.5px solid var(--paper-line)',
                borderRadius: '10px',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: 'var(--card-shadow)',
                position: 'relative',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                <span
                  style={{
                    fontFamily: "var(--font-sans)",
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '3px 8px',
                    borderRadius: '4px',
                    backgroundColor: 'var(--paper)',
                    color: mock.badgeColor,
                    border: '1px solid var(--paper-line)',
                  }}
                >
                  {mock.badge}
                </span>
                <span style={{ fontSize: '12px', fontFamily: "var(--font-sans)", color: 'var(--ink-soft)' }}>
                  ⏱️ {mock.duration}
                </span>
              </div>

              <h3 style={{ fontSize: '18px', margin: '0 0 8px 0', color: 'var(--ink)', lineHeight: 1.3 }}>
                {mock.title}
              </h3>

              <div
                style={{
                  backgroundColor: 'var(--paper)',
                  padding: '10px 12px',
                  borderRadius: '6px',
                  border: '1px solid var(--paper-line)',
                  marginBottom: '16px',
                  fontSize: '12px',
                  fontFamily: "var(--font-sans)",
                }}
              >
                <div style={{ color: 'var(--ink)', marginBottom: '4px' }}>
                  <strong>Structure:</strong> {mock.subjects}
                </div>
                <div style={{ color: 'var(--rust)' }}>
                  <strong>Benchmark:</strong> {mock.scoring}
                </div>
              </div>

              <ul
                style={{
                  paddingLeft: '18px',
                  margin: '0 0 20px 0',
                  fontSize: '13px',
                  color: 'var(--ink-soft)',
                  lineHeight: 1.6,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  flex: 1,
                }}
              >
                {mock.features.map((feat, fIdx) => (
                  <li key={fIdx}>{feat}</li>
                ))}
              </ul>

              <button
                type="button"
                onClick={() => handleStartMock(mock.examCode)}
                className="btn-custom btn-custom-primary"
                style={{
                  width: '100%',
                  fontSize: '13px',
                  padding: '10px',
                  textAlign: 'center',
                  justifyContent: 'center',
                }}
              >
                {mock.cta} →
              </button>
            </div>
          ))}
        </div>

        {/* Diagnostic Value Banner */}
        <div
          style={{
            backgroundColor: '#0b1120',
            color: '#ffffff',
            borderRadius: '10px',
            padding: 'clamp(20px, 3vw, 32px)',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '20px',
          }}
        >
          <div style={{ maxWidth: '600px' }}>
            <span
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: '11px',
                letterSpacing: '0.08em',
                color: 'var(--amber)',
                textTransform: 'uppercase',
                display: 'block',
                marginBottom: '6px',
              }}
            >
              Zero-Risk Assessment
            </span>
            <h3 style={{ fontSize: '20px', color: '#ffffff', margin: '0 0 8px 0', fontFamily: "var(--font-sans)" }}>
              Take a Free Diagnostic CBT Mock Exam Today
            </h3>
            <p style={{ fontSize: '13.5px', color: '#94a3b8', margin: 0, lineHeight: 1.5 }}>
              Receive an instantaneous diagnostic score report detailing your exact speed per question, subject strengths, and topics requiring immediate revision. No credit card required.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => (!isAuthenticated ? openAuthModal('login') : navigate('/dashboard'))}
              className="btn-custom btn-custom-primary btn-custom-lg"
              style={{ fontSize: '13.5px' }}
            >
              {!isAuthenticated ? 'Log in to Start Free Mock' : 'Start Free Mock Now'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/cbt')}
              className="btn-custom btn-custom-ghost btn-custom-lg"
              style={{ color: '#ffffff', borderColor: 'rgba(255,255,255,0.3)', fontSize: '13.5px' }}
            >
              Explore Question Bank 📚
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

