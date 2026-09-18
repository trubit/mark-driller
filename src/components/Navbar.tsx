import React from 'react';
import Offcanvas from 'react-bootstrap/Offcanvas';
import { Link, useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore.js';
import { useAuthStore } from '../store/useAuthStore.js';
import { BrandLogo } from './BrandLogo.js';

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

  return (
    <header className="site-header">
      <nav className="wrap nav-container">
        <Link to="/" className="logo" aria-label="Mark Driller home" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
          <BrandLogo size="md" />
        </Link>

        <div className="nav-links">
          <Link to="/materials">Study Materials</Link>
          <Link to="/questions">Past Questions</Link>
          <a href="#cbt">CBT Practice</a>
          <a href="#boards">Exam Boards</a>
          <Link to="/pricing">Pricing</Link>
          {isAuthenticated && (
            <Link to="/dashboard" style={{ color: 'var(--rust)', fontWeight: 600 }}>
              Dashboard
            </Link>
          )}
          {isAuthenticated && user?.role === 'ADMIN' && (
            <Link to="/admin" style={{ color: '#14181c', fontWeight: 700 }}>
              Admin
            </Link>
          )}
        </div>

        <div className="nav-cta">
          {isAuthenticated && user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Link
                to="/dashboard"
                className="btn-custom btn-custom-ghost"
                style={{ fontSize: '13.5px', padding: '8px 14px' }}
              >
                👤 {user.fullName.split(' ')[0]}
              </Link>
              <button
                type="button"
                className="nav-login"
                onClick={handleLogout}
              >
                Log out
              </button>
            </div>
          ) : (
            <>
              <button
                type="button"
                className="nav-login"
                onClick={() => openAuthModal('login')}
              >
                Log in
              </button>
              <button
                type="button"
                className="btn-custom btn-custom-primary"
                onClick={() => openAuthModal('signup')}
              >
                Get started
              </button>
            </>
          )}
          <button
            type="button"
            className="menu-toggle-btn"
            aria-label="Toggle navigation menu"
            onClick={() => setMobileMenuOpen(true)}
          >
            ☰
          </button>
        </div>
      </nav>

      {/* Mobile Offcanvas Navigation */}
      <Offcanvas
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
          <div className="mobile-nav-links">
            {isAuthenticated && (
              <Link to="/dashboard" onClick={handleNavClick} style={{ color: 'var(--rust)', fontWeight: 600 }}>
                ★ My Dashboard
              </Link>
            )}
            {isAuthenticated && user?.role === 'ADMIN' && (
              <Link to="/admin" onClick={handleNavClick} style={{ color: '#14181c', fontWeight: 700 }}>
                ⚙ Admin Portal
              </Link>
            )}
            <Link to="/materials" onClick={handleNavClick}>Study Materials</Link>
            <Link to="/questions" onClick={handleNavClick}>Past Questions</Link>
            <a href="#cbt" onClick={handleNavClick}>CBT Practice</a>
            <a href="#boards" onClick={handleNavClick}>Exam Boards</a>
            <Link to="/pricing" onClick={handleNavClick}>Pricing</Link>
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
