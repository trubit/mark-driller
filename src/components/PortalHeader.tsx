import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Offcanvas from 'react-bootstrap/Offcanvas';
import { useAuthStore } from '../store/useAuthStore.js';
import { BrandLogo } from './BrandLogo.js';

export interface PortalHeaderProps {
  badge?: string;
  badgeColor?: 'rust' | 'forest' | 'ink' | 'amber';
  activePath?: string;
  extraAction?: React.ReactNode;
}

const badgeColorMap = {
  rust: { bg: 'var(--rust, #a8562f)', text: '#ffffff' },
  forest: { bg: 'var(--forest, #225a38)', text: '#ffffff' },
  ink: { bg: 'var(--ink, #14181c)', text: '#ffffff' },
  amber: { bg: 'var(--amber, #d97706)', text: '#14181c' },
};

/**
 * Unified Responsive Portal Header
 * Provides a rock-solid, fully responsive navigation experience across
 * small smartphones (320px–430px), tablets, and desktops.
 * Collapses gracefully into an accessible Offcanvas drawer on mobile screens.
 */
export const PortalHeader: React.FC<PortalHeaderProps> = ({
  badge,
  badgeColor = 'rust',
  activePath = '',
  extraAction,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, isAuthenticated, clearSession } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    clearSession();
    setMobileMenuOpen(false);
    navigate('/');
  };

  const handleNavClick = () => {
    setMobileMenuOpen(false);
  };

  const badgeStyle = badgeColorMap[badgeColor] || badgeColorMap.rust;
  const isAdmin = isAuthenticated && user?.role === 'ADMIN';

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: '📊' },
    { label: 'Question Bank', path: '/questions', icon: '📚' },
    { label: 'Study Materials', path: '/materials', icon: '📄' },
    { label: 'Analytics', path: '/analytics', icon: '📈' },
    { label: 'Subscription', path: '/pricing', icon: '★' },
  ];

  if (isAdmin) {
    navItems.push({ label: 'Admin Portal', path: '/admin', icon: '🛡️' });
  }

  return (
    <header className="site-header" style={{ width: '100%' }}>
      <nav className="wrap nav-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
        {/* Left: Brand Logo + Section Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flexShrink: 0 }}>
          <Link
            to={isAdmin ? '/admin' : '/dashboard'}
            className="logo"
            style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}
            aria-label="MarkDriller Portal Home"
          >
            <BrandLogo size="md" />
          </Link>

          {badge && (
            <span
              style={{
                fontSize: '11px',
                fontFamily: "'JetBrains Mono', monospace",
                fontWeight: 700,
                backgroundColor: badgeStyle.bg,
                color: badgeStyle.text,
                padding: '3px 8px',
                borderRadius: '2px',
                letterSpacing: '0.5px',
                whiteSpace: 'nowrap',
                display: 'inline-block',
              }}
            >
              {badge}
            </span>
          )}
        </div>

        {/* Center/Right Desktop Navigation (Hidden on Mobile/Tablet < 900px) */}
        <div
          className="portal-desktop-nav"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '18px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            {navItems.map((item) => {
              const isActive = activePath === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  style={{
                    color: isActive ? 'var(--ink, #14181c)' : 'var(--ink-soft, #555)',
                    textDecoration: 'none',
                    fontSize: '13px',
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontWeight: isActive ? 700 : 500,
                    padding: '6px 8px',
                    borderBottom: isActive ? '2px solid var(--rust, #a8562f)' : '2px solid transparent',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>

          {/* Desktop Extra Action (e.g. + Upload Material) */}
          {extraAction && (
            <div style={{ display: 'flex', alignItems: 'center' }}>
              {extraAction}
            </div>
          )}

          {/* User Session & Logout */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingLeft: '8px', borderLeft: '1px solid rgba(20,24,28,0.1)' }}>
            {user && (
              <span
                style={{
                  fontSize: '12px',
                  fontFamily: "'JetBrains Mono', monospace",
                  color: 'var(--slate, #666)',
                  maxWidth: '140px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
                title={user.email}
              >
                👤 {user.fullName ? user.fullName.split(' ')[0] : user.email}
              </span>
            )}
            <button
              type="button"
              className="btn-custom btn-custom-ghost"
              style={{ fontSize: '12px', padding: '5px 12px', whiteSpace: 'nowrap' }}
              onClick={handleLogout}
            >
              Log out
            </button>
          </div>
        </div>

        {/* Mobile / Tablet Right Controls (< 900px) */}
        <div
          className="portal-mobile-controls"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          {extraAction && (
            <div style={{ display: 'flex', alignItems: 'center' }}>
              {extraAction}
            </div>
          )}

          {/* Hamburger Menu Toggle Button */}
          <button
            type="button"
            className="menu-toggle-btn"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Open portal navigation menu"
            style={{
              padding: '8px',
              border: '1.5px solid var(--ink, #14181c)',
              background: 'var(--white, #ffffff)',
              color: 'var(--ink, #14181c)',
              cursor: 'pointer',
              borderRadius: '2px',
            }}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <rect y="3" width="20" height="2.5" fill="currentColor" />
              <rect y="8.75" width="20" height="2.5" fill="currentColor" />
              <rect y="14.5" width="20" height="2.5" fill="currentColor" />
            </svg>
          </button>
        </div>
      </nav>

      {/* Mobile Offcanvas Drawer */}
      <Offcanvas
        show={mobileMenuOpen}
        onHide={() => setMobileMenuOpen(false)}
        placement="end"
        className="mobile-offcanvas"
        style={{ maxWidth: '320px', width: '85vw', backgroundColor: 'var(--paper, #fdfbf7)' }}
      >
        <Offcanvas.Header closeButton style={{ borderBottom: '1px solid var(--paper-line, rgba(20,24,28,0.1))', padding: '16px 20px' }}>
          <Offcanvas.Title style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BrandLogo size="sm" />
            {badge && (
              <span
                style={{
                  fontSize: '10px',
                  fontFamily: "'JetBrains Mono', monospace",
                  fontWeight: 700,
                  backgroundColor: badgeStyle.bg,
                  color: badgeStyle.text,
                  padding: '2px 6px',
                  borderRadius: '2px',
                }}
              >
                {badge}
              </span>
            )}
          </Offcanvas.Title>
        </Offcanvas.Header>

        <Offcanvas.Body style={{ padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            {/* User Info Card in Drawer */}
            {user && (
              <div
                style={{
                  padding: '14px',
                  backgroundColor: 'var(--white, #ffffff)',
                  border: '1px solid rgba(20,24,28,0.12)',
                  boxShadow: '2px 2px 0 var(--ink, #14181c)',
                  marginBottom: '20px',
                }}
              >
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ink, #14181c)' }}>
                  {user.fullName || 'Student'}
                </div>
                <div
                  style={{
                    fontSize: '11px',
                    fontFamily: "'JetBrains Mono', monospace",
                    color: 'var(--slate, #666)',
                    wordBreak: 'break-all',
                    marginTop: '2px',
                  }}
                >
                  {user.email}
                </div>
                <div style={{ marginTop: '8px', display: 'flex', gap: '6px' }}>
                  <span
                    style={{
                      fontSize: '10px',
                      fontFamily: "'JetBrains Mono', monospace",
                      backgroundColor: user.role === 'ADMIN' ? 'var(--ink)' : 'var(--forest)',
                      color: '#ffffff',
                      padding: '2px 6px',
                      borderRadius: '2px',
                      fontWeight: 700,
                    }}
                  >
                    {user.role}
                  </span>
                </div>
              </div>
            )}

            {/* Navigation Links */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {navItems.map((item) => {
                const isActive = activePath === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={handleNavClick}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px 14px',
                      backgroundColor: isActive ? 'var(--white, #ffffff)' : 'transparent',
                      border: isActive ? '1.5px solid var(--ink, #14181c)' : '1.5px solid transparent',
                      boxShadow: isActive ? '3px 3px 0 var(--ink, #14181c)' : 'none',
                      color: isActive ? 'var(--ink, #14181c)' : 'var(--ink-soft, #444)',
                      textDecoration: 'none',
                      fontFamily: "'Space Grotesk', sans-serif",
                      fontWeight: isActive ? 700 : 500,
                      fontSize: '14.5px',
                      borderRadius: '2px',
                      minHeight: '48px',
                    }}
                  >
                    <span style={{ fontSize: '16px' }}>{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Bottom Logout Button */}
          <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid rgba(20,24,28,0.1)' }}>
            <button
              type="button"
              className="btn-custom btn-custom-ghost"
              style={{
                width: '100%',
                justifyContent: 'center',
                padding: '12px',
                fontSize: '13px',
                minHeight: '48px',
              }}
              onClick={handleLogout}
            >
              Log out
            </button>
          </div>
        </Offcanvas.Body>
      </Offcanvas>
    </header>
  );
};
