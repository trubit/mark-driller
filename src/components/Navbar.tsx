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

  return (
    <header className="site-header">
      <nav className="wrap nav-container">
        <Link to="/" className="logo" aria-label="Mark Driller home" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
          <BrandLogo size="md" />
        </Link>

        <div className="nav-links">
          {isAuthenticated && (
            <Link to="/dashboard" style={{ color: 'var(--rust)', fontWeight: 700 }}>
              📊 Dashboard
            </Link>
          )}
          <Link to="/products">Products</Link>
          <Link to="/cbt" style={{ fontWeight: 600, color: 'var(--rust)' }}>
            💻 CBT Practice
          </Link>
          <Link to="/novels">JAMB Novels</Link>
          <Link to="/pricing">Pricing</Link>
          <Link to="/activate">Activate PIN</Link>
          <Link to="/blog">Blog</Link>
          <Link to="/contact">Contact</Link>
        </div>

        <div className="nav-cta" style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <ThemeToggle />

          {isAuthenticated && user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {user.role === 'ADMIN' ? (
                <Link
                  to="/admin"
                  className="btn-custom btn-custom-primary"
                  style={{ fontSize: '13px', padding: '7px 14px' }}
                >
                  🛡️ Admin Portal
                </Link>
              ) : (
                <Link
                  to="/dashboard"
                  className="btn-custom btn-custom-ghost"
                  style={{ fontSize: '13px', padding: '7px 12px' }}
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
            <Link to="/products" onClick={handleNavClick}>📦 Products &amp; Offline Downloads</Link>
            <Link to="/cbt" onClick={handleNavClick} style={{ color: 'var(--rust)', fontWeight: 700 }}>
              💻 CBT Practice Simulator
            </Link>
            <Link to="/novels" onClick={handleNavClick}>📖 JAMB Novels &amp; Summaries</Link>
            <Link to="/pricing" onClick={handleNavClick}>★ Subscription Plans</Link>
            <Link to="/activate" onClick={handleNavClick}>🏷️ Activate Voucher / PIN</Link>
            <Link to="/blog" onClick={handleNavClick}>📰 Academic Blog &amp; Guides</Link>
            <Link to="/reseller" onClick={handleNavClick}>🤝 Become an Accredited Reseller</Link>
            <Link to="/contact" onClick={handleNavClick}>📞 24/7 Support &amp; Helpline</Link>
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

