import React from 'react';
import { useAppStore } from '../store/useAppStore';

export const CtaBanner: React.FC = () => {
  const { openAuthModal } = useAppStore();

  return (
    <section className="cta-banner" id="pricing">
      <div className="wrap">
        <h2>Your next mock score starts with today's practice set.</h2>
        <p>Free to start. No card required. Cancel anytime.</p>
        <div className="hero-actions">
          <button
            type="button"
            className="btn-custom btn-custom-primary btn-custom-lg"
            onClick={() => openAuthModal('login')}
          >
            Log in to Start Practising
          </button>
          <a href="#cbt" className="btn-custom btn-custom-ghost btn-custom-lg">
            See a sample CBT test
          </a>
        </div>
      </div>
    </section>
  );
};

