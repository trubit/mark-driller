import React from 'react';
import { useAppStore } from '../store/useAppStore';

export const Hero: React.FC = () => {
  const { openAuthModal } = useAppStore();

  return (
    <section className="hero">
      <div className="wrap hero-grid">
        <div>
          <div className="hero-rule"></div>
          <span className="eyebrow">Exam prep, precision-drilled</span>
          <h1>
            Drill down.<br />
            Hit the <span className="accent">mark.</span>
          </h1>
          <p className="lede">
            Study materials, past questions and full CBT simulations for WAEC, NECO, JAMB/UTME and university exams — built for secondary and university students across West Africa.
          </p>
          <div className="hero-actions">
            <button
              type="button"
              className="btn-custom btn-custom-primary btn-custom-lg"
              onClick={() => openAuthModal('signup')}
            >
              Start practising free
            </button>
            <a href="#questions" className="btn-custom btn-custom-ghost btn-custom-lg">
              Browse past questions
            </a>
          </div>
          <p className="hero-note">NO CARD REQUIRED &nbsp;·&nbsp; 40,000+ STUDENTS ACTIVE THIS TERM</p>
        </div>
      </div>
    </section>
  );
};
