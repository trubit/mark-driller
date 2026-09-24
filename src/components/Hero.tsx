import React from 'react';
import { Link } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { useTelemetryQuery } from '../api/exams';
import { handleImageError, FALLBACK_STUDY_HERO } from '../utils/imageFallbacks';

export const Hero: React.FC = () => {
  const { openAuthModal } = useAppStore();
  const { data: telemetry } = useTelemetryQuery();

  const totalQuestions = telemetry?.totalQuestions
    ? telemetry.totalQuestions.toLocaleString()
    : 'curriculum-aligned';

  return (
    <section className="hero">
      <div className="wrap hero-grid">
        {/* Left Column: Mission, Value Proposition, and Direct CTAs */}
        <div>
          <div className="hero-rule"></div>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '4px 12px',
              borderRadius: '20px',
              backgroundColor: 'var(--rust-soft)',
              border: '1px solid var(--paper-line)',
              marginBottom: '16px',
            }}
          >
            <span style={{ fontSize: '12px' }}>🇳🇬</span>
            <span
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: '11.5px',
                fontWeight: 600,
                letterSpacing: '0.08em',
                color: 'var(--rust)',
                textTransform: 'uppercase',
              }}
            >
              Nigeria's Foremost CBT Exam Practice Platform
            </span>
          </div>

          <h1>
            Learn smarter.<br />
            Drill deeper.<br />
            Hit the <span className="accent">mark.</span>
          </h1>

          <p className="lede">
            Curriculum-verified study materials, past-question practice, and CBT simulations for <strong>JAMB/UTME</strong>, <strong>WAEC/SSCE</strong>, <strong>NECO</strong>, <strong>BECE</strong>, and university <strong>Post-UTME</strong>.
          </p>

          <div className="hero-actions">
            <button
              type="button"
              className="btn-custom btn-custom-primary btn-custom-lg"
              onClick={() => openAuthModal('login')}
            >
              Start practising free
            </button>
            <Link to="/cbt" className="btn-custom btn-custom-ghost btn-custom-lg">
              Explore CBT Simulator 💻
            </Link>
          </div>

          <div
            style={{
              marginTop: '28px',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '14px 20px',
              fontFamily: "var(--font-sans)",
              fontSize: '11.5px',
              color: 'var(--ink-soft)',
              alignItems: 'center',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ color: 'var(--amber)', fontSize: '14px' }}>✓</span>
              <span>NO CARD REQUIRED</span>
            </div>
            <span>·</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ color: 'var(--amber)', fontSize: '14px' }}>✓</span>
              <span>{totalQuestions} QUESTION BANK</span>
            </div>
            <span>·</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ color: 'var(--amber)', fontSize: '14px' }}>✓</span>
              <span>EXAM-STANDARD CBT ENGINE</span>
            </div>
          </div>
        </div>

        {/* Right Column: Real Student Visual & Live CBT Interface Simulation */}
        <div style={{ position: 'relative' }}>
          {/* Main Visual Container */}
          <div
            style={{
              position: 'relative',
              borderRadius: '12px',
              overflow: 'hidden',
              boxShadow: 'var(--card-shadow)',
              border: '1.5px solid var(--paper-line)',
              background: 'var(--white)',
            }}
          >
            {/* Licensed Unsplash photography used as a real student-study context visual. */}
            <img
              src="/assets/images/study-hero.svg"
              alt="Students studying together with a laptop and notebooks"
              onError={handleImageError(FALLBACK_STUDY_HERO)}
              style={{
                width: '100%',
                height: 'clamp(240px, 42vw, 420px)',
                objectFit: 'cover',
                objectPosition: 'center 20%',
                display: 'block',
              }}
              loading="eager"
            />

            {/* Gradient Scrim for crisp text contrast */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(to top, rgba(8, 13, 27, 0.9) 0%, rgba(8, 13, 27, 0.28) 58%, rgba(8, 13, 27, 0.08) 100%)',
              }}
            />

            {/* Bottom Overlay Info Banner */}
            <div
              style={{
                position: 'absolute',
                bottom: '16px',
                left: '16px',
                right: '16px',
                color: '#ffffff',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span
                  style={{
                    display: 'inline-block',
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: '#22c55e',
                    boxShadow: '0 0 8px #22c55e',
                  }}
                />
                <span style={{ fontSize: '11px', fontFamily: "var(--font-sans)", letterSpacing: '0.08em', textTransform: 'uppercase', color: '#cbd5e1' }}>
                  Live Exam Simulation Terminal
                </span>
              </div>
              <h3 style={{ fontSize: '17px', color: '#ffffff', margin: 0, fontFamily: "var(--font-sans)" }}>
                JAMB UTME 4-Subject Mock Simulation
              </h3>
              <p style={{ fontSize: '12px', color: '#94a3b8', margin: '2px 0 0 0' }}>
                Timer: 01:54:20 · English, Math, Physics, Chemistry
              </p>
            </div>
          </div>

          {/* Floating workflow card */}
          <div
            className="hero-floating-top"
            style={{
              position: 'absolute',
              top: '-14px',
              right: '-8px',
              backgroundColor: 'var(--white)',
              color: 'var(--ink)',
              padding: '8px 14px',
              borderRadius: '8px',
              border: '1px solid var(--paper-line)',
              boxShadow: 'var(--card-shadow)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              zIndex: 2,
              maxWidth: 'calc(100% - 16px)',
            }}
          >
            <div
              style={{
                width: '34px',
                height: '34px',
                minWidth: '34px',
                borderRadius: '50%',
                backgroundColor: 'var(--rust-soft)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '14px',
                fontWeight: 800,
              }}
            >
              CBT
            </div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 700, fontFamily: "var(--font-sans)", whiteSpace: 'nowrap' }}>
                Practice, review, repeat
              </div>
              <div style={{ fontSize: '10.5px', color: 'var(--ink-soft)', fontFamily: "var(--font-sans)", whiteSpace: 'nowrap' }}>
                Timed drills with progress feedback
              </div>
            </div>
          </div>

          {/* Floating Offline Badge */}
          <div
            className="hero-floating-bottom"
            style={{
              position: 'absolute',
              bottom: '-12px',
              left: '-8px',
              backgroundColor: 'var(--dark-panel, #0b1120)',
              color: '#ffffff',
              padding: '6px 12px',
              borderRadius: '6px',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              boxShadow: '0 6px 20px rgba(0, 0, 0, 0.3)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '11px',
              fontFamily: "var(--font-sans)",
              zIndex: 2,
              maxWidth: 'calc(100% - 16px)',
            }}
          >
            <span style={{ color: '#22c55e' }}>●</span>
            <span style={{ whiteSpace: 'nowrap' }}>FULL EXAM SIMULATION ENGINE</span>
          </div>
        </div>
      </div>
    </section>
  );
};

