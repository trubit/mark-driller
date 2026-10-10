import React from 'react';
import Offcanvas from 'react-bootstrap/Offcanvas';
import { Link, useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore.js';
import { useAuthStore } from '../store/useAuthStore.js';
import { BrandLogo } from './BrandLogo.js';
import { ThemeToggle } from './ThemeToggle.js';

export const Navbar: React.FC = () => {
  const { mobileMenuOpen, setMobileMenuOpen, openAuthModal } = useAppStore();
  const { user, isAuthenticated, clearSession } = useAuthStore();
  const navigate = useNavigate();

  const handleNavClick = () => {
    setMobileMenuOpen(false);
  };

  const handleLogout = () => {
    clearSession();
    handleNavClick();
    navigate('/');
  };

  const scrollToSection = (sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleMobileNavScroll = (sectionId: string) => {
    setMobileMenuOpen(false);
    scrollToSection(sectionId);
  };

  return (
    <header className="site-header">
      <nav className="wrap nav-container site-header__inner">
        <Link to="/" className="logo" aria-label="Mark Driller home" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
          <BrandLogo size="md" />
        </Link>

        {/* Middle & Right: Unified Desktop Row (Reference Layout) */}
        <div className="nav-desktop-group">
          <div className="nav-links">
            {isAuthenticated && (
              <Link to="/dashboard" style={{ color: 'var(--rust)', fontWeight: 700 }}>
                📊 Dashboard
              </Link>
            )}
            <button type="button" className="nav-link-btn" onClick={() => scrollToSection('offers')}>What We Offer</button>
            <button type="button" className="nav-link-btn" onClick={() => scrollToSection('exam-boards')}>Examinations</button>
            <button type="button" className="nav-link-btn" onClick={() => scrollToSection('how-it-works')}>How It Works</button>
            <button type="button" className="nav-link-btn" onClick={() => scrollToSection('experience')}>Exam Simulator</button>
            <button type="button" className="nav-link-btn" onClick={() => scrollToSection('performance')}>Analytics</button>
          </div>

          <div className="nav-auth-group">
            {isAuthenticated && user ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {user.role === 'ADMIN' ? (
                  <Link
                    to="/admin"
                    className="btn-custom btn-custom-primary nav-btn-compact"
                  >
                    🛡️ Admin Portal
                  </Link>
                ) : (
                  <Link
                    to="/dashboard"
                    className="btn-custom btn-custom-ghost nav-btn-compact"
                  >
                    👤 {user.fullName ? user.fullName.split(' ')[0] : 'Student'}
                  </Link>
                )}
                <button
                  type="button"
                  className="nav-login"
                  onClick={handleLogout}
                >
                  Log out
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button
                  type="button"
                  className="nav-login"
                  onClick={() => openAuthModal('login')}
                >
                  Log in
                </button>
                <button
                  type="button"
                  className="btn-custom btn-custom-primary nav-btn-compact"
                  onClick={() => openAuthModal('signup')}
                >
                  Get started
                </button>
              </div>
            )}
          </div>

          {/* Far Right: Existing Theme Toggle */}
          <div className="nav-theme-slot" aria-label="Theme switcher">
            <ThemeToggle />
          </div>
        </div>

        {/* Mobile & Tablet Controls */}
        <div className="nav-mobile-controls">
          <ThemeToggle />
          <button
            type="button"
            className="menu-toggle-btn"
            aria-label="Toggle navigation menu"
            aria-expanded={mobileMenuOpen}
            aria-controls="public-mobile-drawer"
            onClick={() => setMobileMenuOpen(true)}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <rect y="3" width="20" height="2.2" rx="1.1" fill="currentColor" />
              <rect y="8.9" width="20" height="2.2" rx="1.1" fill="currentColor" />
              <rect y="14.8" width="20" height="2.2" rx="1.1" fill="currentColor" />
            </svg>
          </button>
        </div>
      </nav>

      {/* Mobile Offcanvas Navigation */}
      <Offcanvas
        id="public-mobile-drawer"
        show={mobileMenuOpen}
        onHide={() => setMobileMenuOpen(false)}
        placement="end"
        className="mobile-offcanvas"
      >
        <Offcanvas.Header closeButton>
          <Offcanvas.Title className="logo" style={{ display: 'flex', alignItems: 'center' }}>
            <BrandLogo size="sm" />
          </Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid var(--paper-line)' }}>
            <span style={{ fontSize: '12px', fontFamily: "var(--font-sans)", color: 'var(--ink-soft)' }}>
              Appearance
            </span>
            <ThemeToggle showLabel />
          </div>

          <div className="mobile-nav-links">
            {isAuthenticated && (
              <Link to="/dashboard" onClick={handleNavClick} style={{ color: 'var(--rust)', fontWeight: 700 }}>
                📊 Student Dashboard
              </Link>
            )}
            {isAuthenticated && user?.role === 'ADMIN' && (
              <Link to="/admin" onClick={handleNavClick} style={{ color: 'var(--ink)', fontWeight: 700 }}>
                🛡️ Admin Portal
              </Link>
            )}
            <button type="button" className="mobile-nav-link-btn" onClick={() => handleMobileNavScroll('offers')}>🎯 What We Offer</button>
            <button type="button" className="mobile-nav-link-btn" onClick={() => handleMobileNavScroll('exam-boards')}>🏛️ Examination Boards</button>
            <button type="button" className="mobile-nav-link-btn" onClick={() => handleMobileNavScroll('how-it-works')}>⚡ How It Works</button>
            <button type="button" className="mobile-nav-link-btn" onClick={() => handleMobileNavScroll('experience')}>💻 CBT Exam Simulator</button>
            <button type="button" className="mobile-nav-link-btn" onClick={() => handleMobileNavScroll('performance')}>📊 Diagnostic Analytics</button>
          </div>
          <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {isAuthenticated ? (
              <button
                type="button"
                className="btn-custom btn-custom-ghost"
                style={{ width: '100%', justifyContent: 'center' }}
                onClick={handleLogout}
              >
                Log out
              </button>
            ) : (
              <>
                <button
                  type="button"
                  className="btn-custom btn-custom-primary"
                  style={{ width: '100%', justifyContent: 'center' }}
                  onClick={() => {
                    handleNavClick();
                    openAuthModal('signup');
                  }}
                >
                  Get started
                </button>
                <button
                  type="button"
                  className="btn-custom btn-custom-ghost"
                  style={{ width: '100%', justifyContent: 'center' }}
                  onClick={() => {
                    handleNavClick();
                    openAuthModal('login');
                  }}
                >
                  Log in
                </button>
              </>
            )}
          </div>
        </Offcanvas.Body>
      </Offcanvas>
    </header>
  );
};

