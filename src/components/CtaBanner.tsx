import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore.js';
import { useAuthStore } from '../store/useAuthStore.js';

export const CtaBanner: React.FC = () => {
  const { openAuthModal } = useAppStore();
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  const handleExploreQuestionsClick = () => {
    if (isAuthenticated) {
      navigate('/questions');
    } else {
      openAuthModal('login');
    }
  };

  return (
    <section className="cta-banner" id="cta" aria-label="Call to action">
      <div className="wrap">
        <h2>Your next mock score starts with today's practice set.</h2>
        <p>Curriculum past questions, authentic CBT simulation, and instant diagnostic tracking. Free to start.</p>
        <div className="hero-actions" style={{ justifyContent: 'center' }}>
          <button
            type="button"
            className="btn-custom btn-custom-accent btn-custom-lg"
            onClick={() => openAuthModal('signup')}
          >
            Create Free Account →
          </button>
          <button
            type="button"
            className="btn-custom btn-custom-ghost btn-custom-lg"
            onClick={handleExploreQuestionsClick}
            aria-label="Log in to explore past questions"
          >
            Explore Past Questions
          </button>
        </div>
      </div>
    </section>
  );
};
