import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore.js';
import { useAuthStore } from '../store/useAuthStore.js';
import { useTelemetryQuery } from '../api/exams.js';
import { SafeImage } from './SafeImage.js';

export const Hero: React.FC = () => {
  const navigate = useNavigate();
  const { openAuthModal } = useAppStore();
  const { isAuthenticated } = useAuthStore();
  const { data: telemetry } = useTelemetryQuery();

  const handleExploreBoardsClick = () => {
    if (isAuthenticated) {
      navigate('/dashboard');
    } else {
      openAuthModal('login');
    }
  };

  const totalQuestions = telemetry?.totalQuestions
    ? `${telemetry.totalQuestions.toLocaleString()}+`
    : 'Curriculum-Verified';

  return (
    <section className="hero full-width-hero" id="hero" aria-label="Hero section">
      {/* Layer 1: Full-width edge-to-edge background visual */}
      <div className="hero-background-layer" aria-hidden="true">
        <SafeImage
          src="/assets/images/students-study.jpg"
          alt=""
          className="hero-background-image"
          loading="eager"
        />
        {/* Layer 2: Dark/transparent gradient overlay for high-contrast legibility */}
        <div className="hero-gradient-overlay" />
      </div>

      {/* Layer 3: Foreground layered content */}
      <div className="wrap hero-foreground-content">
        <div className="hero-eyebrow-container">
          <span className="hero-eyebrow-text">
            NIGERIA'S FOREMOST CBT EXAM PRACTICE PLATFORM
          </span>
        </div>

        <h1 className="hero-headline">
          Learn smarter. Drill deeper.<br />
          Hit the <span className="hero-accent">mark.</span>
        </h1>

        <p className="hero-lede">
          Curriculum-verified past questions, step-by-step solutions, and timed CBT simulations for <strong>JAMB/UTME</strong>, <strong>WAEC/SSCE</strong>, <strong>NECO</strong>, and university <strong>Post-UTME</strong>.
        </p>

        {/* Primary and Secondary Action CTAs */}
        <div className="hero-actions">
          <button
            type="button"
            className="btn-custom btn-custom-accent btn-custom-lg"
            onClick={() => openAuthModal('signup')}
          >
            Start practising free →
          </button>
          <button
            type="button"
            className="btn-custom btn-custom-ghost-light btn-custom-lg"
            onClick={handleExploreBoardsClick}
            aria-label="Log in to explore examination boards"
          >
            Explore Examination Boards ↓
          </button>
        </div>

        {/* Authenticated Platform Capability Badges */}
        <div className="hero-trust-badges">
          <div className="hero-badge-item">
            <span className="badge-check" aria-hidden="true">✓</span>
            <span>{totalQuestions} PAST QUESTIONS</span>
          </div>
          <span className="badge-divider" aria-hidden="true">·</span>
          <div className="hero-badge-item">
            <span className="badge-check" aria-hidden="true">✓</span>
            <span>EXAM-STANDARD CBT ENGINE</span>
          </div>
          <span className="badge-divider" aria-hidden="true">·</span>
          <div className="hero-badge-item">
            <span className="badge-check" aria-hidden="true">✓</span>
            <span>FREE TO START · NO CARD REQUIRED</span>
          </div>
        </div>
      </div>
    </section>
  );
};
