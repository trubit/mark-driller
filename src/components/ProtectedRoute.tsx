import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore.js';
import { useAppStore } from '../store/useAppStore.js';
import { BrandLoader } from './BrandLoader.js';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ('STUDENT' | 'ADMIN')[];
  requireVerified?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles = ['STUDENT', 'ADMIN'],
  requireVerified = true,
}) => {
  const { user, isAuthenticated, isInitialized, clearSession } = useAuthStore();
  const { openEmailVerificationModal } = useAppStore();
  const location = useLocation();

  useEffect(() => {
    // If authenticated but not verified, automatically prompt verification modal
    if (isInitialized && isAuthenticated && user && !user.isVerified && requireVerified) {
      openEmailVerificationModal(user.email);
    }
  }, [isInitialized, isAuthenticated, user, requireVerified, openEmailVerificationModal]);

  // 1. Loading authentication barrier to prevent redirect flash / loops
  if (!isInitialized) {
    return <BrandLoader mode="fullscreen" message="Authenticating secure session..." />;
  }

  // 2. Unauthenticated check: Redirect to public landing page with login request
  if (!isAuthenticated || !user) {
    return <Navigate to="/" state={{ openLogin: true, from: location.pathname }} replace />;
  }

  // 3. Email Verification enforcement: block direct URL access to dashboard
  if (requireVerified && !user.isVerified) {
    return (
      <div
        style={{
          minHeight: '100vh',
          backgroundColor: 'var(--paper, #fdfbf7)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            maxWidth: '500px',
            background: 'var(--white, #fff)',
            border: '2px solid var(--ink, #14181c)',
            padding: '36px',
            boxShadow: '4px 4px 0 var(--ink, #14181c)',
          }}
        >
          <div style={{ fontSize: '36px', marginBottom: '16px' }}>✉️</div>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '24px', margin: '0 0 12px', color: 'var(--ink, #14181c)' }}>
            Email Verification Required
          </h2>
          <p style={{ color: 'var(--slate, #555)', fontSize: '14.5px', lineHeight: 1.6, marginBottom: '24px' }}>
            Hi <strong>{user.fullName}</strong>, your account ({user.email}) must be verified with the 6-digit passcode sent to your inbox before accessing the student dashboard.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <button
              type="button"
              className="btn-custom btn-custom-primary"
              style={{ width: '100%', justifyContent: 'center' }}
              onClick={() => openEmailVerificationModal(user.email)}
            >
              Enter Verification Passcode
            </button>
            <button
              type="button"
              className="btn-custom btn-custom-ghost"
              style={{ width: '100%', justifyContent: 'center' }}
              onClick={() => {
                clearSession();
              }}
            >
              Log out &amp; Return to Public Website
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 4. Role Authorization check: student attempting to access admin route
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    if (user.role === 'STUDENT') {
      return <Navigate to="/dashboard" replace />;
    }
    return <Navigate to="/admin" replace />;
  }

  return <>{children}</>;
};
