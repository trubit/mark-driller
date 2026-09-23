import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore.js';
import { useAppStore } from '../store/useAppStore.js';
import { LandingPage } from './LandingPage.js';

export const PublicLandingRoute: React.FC = () => {
  const { user, isAuthenticated, isInitialized } = useAuthStore();
  const { openAuthModal } = useAppStore();
  const location = useLocation();

  useEffect(() => {
    // If redirected here from a protected route with openLogin state, open login modal
    if (location.state && (location.state as any).openLogin && !isAuthenticated) {
      openAuthModal('login');
      // Clear state so modal doesn't re-open unexpectedly on subsequent interactions
      window.history.replaceState({}, document.title);
    }
  }, [location.state, isAuthenticated, openAuthModal]);

  // Loading barrier while auth session rehydrates
  if (!isInitialized) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'var(--paper, #fdfbf7)',
          color: 'var(--ink, #14181c)',
          fontFamily: "var(--font-sans)",
          gap: '16px',
        }}
      >
        <svg className="mark-icon" width="40" height="40" viewBox="0 0 28 28" fill="none" style={{ animation: 'spin 2s linear infinite' }}>
          <circle cx="14" cy="14" r="12" stroke="#14181c" strokeWidth="2" />
          <circle cx="14" cy="14" r="6.5" stroke="#a8562f" strokeWidth="2" />
          <circle cx="14" cy="14" r="1.8" fill="#14181c" />
          <line x1="14" y1="0" x2="14" y2="5" stroke="#14181c" strokeWidth="2" />
          <line x1="14" y1="23" x2="14" y2="28" stroke="#14181c" strokeWidth="2" />
          <line x1="0" y1="14" x2="5" y2="14" stroke="#14181c" strokeWidth="2" />
          <line x1="23" y1="14" x2="28" y2="14" stroke="#14181c" strokeWidth="2" />
        </svg>
        <div style={{ fontSize: '14px', letterSpacing: '0.5px', color: 'var(--ink-soft, #555)' }}>
          Loading MarkDriller...
        </div>
      </div>
    );
  }

  // If already authenticated and verified, redirect directly into the respective dashboard
  if (isAuthenticated && user && user.isVerified) {
    if (user.role === 'ADMIN') {
      return <Navigate to="/admin" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  // Unauthenticated visitor or unverified account visiting root -> Public Landing Page
  return <LandingPage />;
};

