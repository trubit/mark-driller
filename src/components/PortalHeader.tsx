import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import Offcanvas from 'react-bootstrap/Offcanvas';
import { useAuthStore } from '../store/useAuthStore.js';
import { useAppStore } from '../store/useAppStore.js';
import { BrandLogo } from './BrandLogo.js';
import { ThemeToggle } from './ThemeToggle.js';
import { UserAccountMenu } from './UserAccountMenu.js';
import { PortalQuickSearchModal } from './PortalQuickSearchModal.js';
import { PortalNotificationPopover } from './PortalNotificationPopover.js';

export interface PortalHeaderProps {
  badge?: string;
  badgeColor?: 'rust' | 'forest' | 'ink' | 'amber';
  activePath?: string;
  extraAction?: React.ReactNode;
}

const badgeColorMap = {
  rust: { bg: 'var(--rust-soft, rgba(168, 86, 47, 0.12))', text: 'var(--rust, #a8562f)', border: 'rgba(168, 86, 47, 0.25)' },
  forest: { bg: 'var(--forest-soft, rgba(34, 90, 56, 0.12))', text: 'var(--forest, #225a38)', border: 'rgba(34, 90, 56, 0.25)' },
  ink: { bg: 'var(--ink, #14181c)', text: '#ffffff', border: 'transparent' },
  amber: { bg: 'var(--amber-soft, rgba(226, 154, 60, 0.15))', text: 'var(--amber-deep, #c17d24)', border: 'rgba(226, 154, 60, 0.3)' },
};

const LEARNING_TOOLS = [
  { label: 'JAMB Literature Novels', path: '/portal/novels', icon: '📖', desc: 'Chapter summaries & likely exam questions' },
  { label: 'Interactive Flashcards', path: '/flashcards', icon: '🎴', desc: 'Active recall & spaced repetition' },
  { label: 'Science Formula Handbook', path: '/portal/formulas', icon: '📐', desc: 'Physics, Chemistry & Maths equations' },
  { label: 'Academic Dictionary', path: '/portal/dictionary', icon: '📚', desc: 'Comprehensive terminology & glossary' },
  { label: 'Educational Games', path: '/games', icon: '🎮', desc: 'Gamified syllabus revision drills' },
  { label: 'Weekly National Challenge', path: '/challenge', icon: '🏆', desc: 'Compete for national scholarship ranks' },
  { label: 'Video Lessons', path: '/lessons', icon: '📹', desc: 'Curriculum-aligned masterclasses' },
  { label: 'Nigerian School Finder', path: '/portal/schools', icon: '🏫', desc: 'Universities, Polytechnics & cut-offs' },
  { label: 'Career Mentorship Guide', path: '/portal/careers', icon: '🧭', desc: 'Course matching & career pathways' },
  { label: 'Psychometric Analytics', path: '/analytics', icon: '📈', desc: 'Performance readiness & breakdown' },
];

const MORE_TOOLS = [
  { label: 'Pro Subscription Plans', path: '/portal/pricing', icon: '★', desc: 'Upgrade for unlimited mocks & analytics' },
  { label: 'MarkDriller Study Blog', path: '/portal/blog', icon: '📰', desc: 'Examination guides, tips & news' },
  { label: 'Help & Contact Support', path: '/portal/contact', icon: '💬', desc: 'WhatsApp support & customer service' },
];

const ROUTE_BADGE_MAP: Record<string, { badge: string; color: 'rust' | 'forest' | 'ink' | 'amber' }> = {
  '/admin': { badge: '🛡️ ADMIN', color: 'ink' },
  '/dashboard': { badge: '📊 DASHBOARD', color: 'rust' },
  '/cbt': { badge: '💻 CBT SIMULATOR', color: 'forest' },
  '/questions': { badge: '📚 QUESTION BANK', color: 'rust' },
  '/materials': { badge: '📄 STUDY MATERIALS', color: 'forest' },
  '/post-utme': { badge: '🏛️ POST-UTME', color: 'rust' },
  '/novels': { badge: '📖 JAMB NOVELS', color: 'forest' },
  '/profile': { badge: '👤 STUDENT PROFILE', color: 'forest' },
  '/settings': { badge: '⚙️ SETTINGS', color: 'forest' },
  '/bookmarks': { badge: '🔖 BOOKMARKS', color: 'rust' },
  '/history': { badge: '📜 EXAM HISTORY', color: 'rust' },
  '/analytics': { badge: '📈 ANALYTICS', color: 'rust' },
  '/flashcards': { badge: '🎴 FLASHCARDS', color: 'rust' },
  '/formulas': { badge: '📐 FORMULAS', color: 'forest' },
  '/dictionary': { badge: '📖 DICTIONARY', color: 'forest' },
  '/schools': { badge: '🏫 SCHOOL FINDER', color: 'forest' },
  '/careers': { badge: '🧭 CAREER GUIDE', color: 'forest' },
  '/games': { badge: '🎮 EDUCATIONAL GAMES', color: 'forest' },
  '/challenge': { badge: '🏆 WEEKLY CHALLENGE', color: 'amber' },
  '/lessons': { badge: '📹 VIDEO LESSONS', color: 'forest' },
};

const normalizePortalPath = (path: string) => (
  path.startsWith('/portal/') ? path.slice('/portal'.length) : path
);

export const PortalHeader: React.FC<PortalHeaderProps> = ({
  badge,
  badgeColor,
  activePath,
  extraAction,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [toolsDropdownOpen, setToolsDropdownOpen] = useState(false);
  const [moreDropdownOpen, setMoreDropdownOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);

  const toolsDropdownRef = useRef<HTMLDivElement>(null);
  const moreDropdownRef = useRef<HTMLDivElement>(null);
  const { user, isAuthenticated, clearSession } = useAuthStore();
  const { openAuthModal } = useAppStore();
  const navigate = useNavigate();
  const location = useLocation();

  // Dynamically calculate active route
  const currentPath = normalizePortalPath(activePath || location.pathname);

  const isToolActive = LEARNING_TOOLS.some((t) => currentPath.startsWith(normalizePortalPath(t.path)));
  const isMoreActive = MORE_TOOLS.some((t) => currentPath.startsWith(normalizePortalPath(t.path)));

  const handleLogout = () => {
    clearSession();
    setMobileMenuOpen(false);
    navigate('/');
  };

  // Close dropdowns when clicking outside or pressing Escape
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (toolsDropdownRef.current && !toolsDropdownRef.current.contains(e.target as Node)) {
        setToolsDropdownOpen(false);
      }
      if (moreDropdownRef.current && !moreDropdownRef.current.contains(e.target as Node)) {
        setMoreDropdownOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setToolsDropdownOpen(false);
        setMoreDropdownOpen(false);
      }
    };

    if (toolsDropdownOpen || moreDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [toolsDropdownOpen, moreDropdownOpen]);

  // Global keyboard shortcut: Ctrl+K / Cmd+K to open search
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setSearchModalOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  const isAdmin = isAuthenticated && user?.role === 'ADMIN';

  // Automatically determine badge and color from route prefix if not provided explicitly
  const matchedRoute = Object.keys(ROUTE_BADGE_MAP).find((prefix) => currentPath.startsWith(prefix));
  const autoBadgeConfig = matchedRoute ? ROUTE_BADGE_MAP[matchedRoute] : null;

  const resolvedBadgeColor = badgeColor || autoBadgeConfig?.color || 'forest';
  const badgeStyle = badgeColorMap[resolvedBadgeColor] || badgeColorMap.forest;
  const professionalBadge = badge
    || (matchedRoute ? matchedRoute.slice(1).replace(/-/g, ' ').toUpperCase() : null)
    || (isAdmin && currentPath.startsWith('/admin') ? 'ADMIN' : 'STUDENT PORTAL');

  return (
    <>
      <header
        className="site-header"
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 1000,
          width: '100%',
          backgroundColor: 'var(--nav-bg, rgba(236, 238, 230, 0.94))',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderBottom: '1.5px solid var(--paper-line)',
          transition: 'all 0.2s ease',
        }}
      >
        <div
          style={{
            maxWidth: '1600px',
            margin: '0 auto',
            padding: '0 clamp(12px, 1.8vw, 28px)',
            height: '66px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '10px',
          }}
        >
          {/* ======================================================== */}
          {/* LEFT: Canonical Brand Logo + Student Portal Indicator */}
          {/* ======================================================== */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            <Link
              to={isAuthenticated ? (isAdmin ? '/admin' : '/dashboard') : '/'}
              className="logo"
              style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}
              aria-label="MarkDriller Student Portal Home"
            >
              <BrandLogo size="md" />
            </Link>

            <span
              className="portal-badge-indicator"
              style={{
                fontSize: '10.5px',
                fontFamily: "var(--font-sans)",
                fontWeight: 700,
                backgroundColor: badgeStyle.bg,
                color: badgeStyle.text,
                border: `1px solid ${badgeStyle.border}`,
                padding: '2px 8px',
                borderRadius: '999px',
                letterSpacing: '0.04em',
                whiteSpace: 'nowrap',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              {professionalBadge}
            </span>
          </div>

          {/* ======================================================== */}
          {/* CENTER: Complete Primary Desktop Navigation              */}
          {/* ======================================================== */}
          <nav
            aria-label="Student Portal Primary Navigation"
            className="portal-desktop-nav"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '3px',
              margin: '0 6px',
              flex: '1 1 auto',
              justifyContent: 'center',
              minWidth: 0,
              overflow: 'visible',
              flexWrap: 'nowrap',
            }}
          >
            {/* 1. Dashboard */}
            {isAuthenticated && (
              <Link
                to="/dashboard"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '6px 8px',
                  borderRadius: '6px',
                  textDecoration: 'none',
                  fontSize: '12.5px',
                  fontFamily: "var(--font-sans)",
                  fontWeight: currentPath === '/dashboard' ? 700 : 500,
                  color: currentPath === '/dashboard' ? 'var(--rust, #a8562f)' : 'var(--ink-soft)',
                  backgroundColor: currentPath === '/dashboard' ? 'var(--white)' : 'transparent',
                  border: currentPath === '/dashboard' ? '1px solid var(--paper-line)' : '1px solid transparent',
                  boxShadow: currentPath === '/dashboard' ? 'var(--shadow)' : 'none',
                  flexShrink: 1,
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease',
                }}
              >
                <span>📊</span>
                <span className="portal-nav-label">Dashboard</span>
              </Link>
            )}

            {/* 2. CBT Practice / Exam Room */}
            <Link
              to="/portal/cbt"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '6px 8px',
                borderRadius: '6px',
                textDecoration: 'none',
                fontSize: '12.5px',
                fontFamily: "var(--font-sans)",
                fontWeight: currentPath.startsWith('/cbt') ? 700 : 500,
                color: currentPath.startsWith('/cbt') ? 'var(--rust, #a8562f)' : 'var(--ink-soft)',
                backgroundColor: currentPath.startsWith('/cbt') ? 'var(--white)' : 'transparent',
                border: currentPath.startsWith('/cbt') ? '1px solid var(--paper-line)' : '1px solid transparent',
                boxShadow: currentPath.startsWith('/cbt') ? 'var(--shadow)' : 'none',
                flexShrink: 1,
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease',
              }}
            >
              <span>💻</span>
              <span className="portal-nav-label">CBT Practice</span>
            </Link>

            {/* 3. Past Questions */}
            <Link
              to="/portal/questions"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '6px 8px',
                borderRadius: '6px',
                textDecoration: 'none',
                fontSize: '12.5px',
                fontFamily: "var(--font-sans)",
                fontWeight: currentPath.startsWith('/questions') ? 700 : 500,
                color: currentPath.startsWith('/questions') ? 'var(--rust, #a8562f)' : 'var(--ink-soft)',
                backgroundColor: currentPath.startsWith('/questions') ? 'var(--white)' : 'transparent',
                border: currentPath.startsWith('/questions') ? '1px solid var(--paper-line)' : '1px solid transparent',
                boxShadow: currentPath.startsWith('/questions') ? 'var(--shadow)' : 'none',
                flexShrink: 1,
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease',
              }}
            >
              <span>📚</span>
              <span className="portal-nav-label">Past Questions</span>
            </Link>

            {/* 4. Study Materials */}
            <Link
              to="/portal/materials"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '6px 8px',
                borderRadius: '6px',
                textDecoration: 'none',
                fontSize: '12.5px',
                fontFamily: "var(--font-sans)",
                fontWeight: currentPath.startsWith('/materials') ? 700 : 500,
                color: currentPath.startsWith('/materials') ? 'var(--rust, #a8562f)' : 'var(--ink-soft)',
                backgroundColor: currentPath.startsWith('/materials') ? 'var(--white)' : 'transparent',
                border: currentPath.startsWith('/materials') ? '1px solid var(--paper-line)' : '1px solid transparent',
                boxShadow: currentPath.startsWith('/materials') ? 'var(--shadow)' : 'none',
                flexShrink: 1,
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease',
              }}
            >
              <span>📄</span>
              <span className="portal-nav-label">Study Materials</span>
            </Link>

            {/* 5. Post-UTME */}
            <Link
              to="/portal/post-utme"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '6px 8px',
                borderRadius: '6px',
                textDecoration: 'none',
                fontSize: '12.5px',
                fontFamily: "var(--font-sans)",
                fontWeight: currentPath.startsWith('/post-utme') ? 700 : 500,
                color: currentPath.startsWith('/post-utme') ? 'var(--rust, #a8562f)' : 'var(--ink-soft)',
                backgroundColor: currentPath.startsWith('/post-utme') ? 'var(--white)' : 'transparent',
                border: currentPath.startsWith('/post-utme') ? '1px solid var(--paper-line)' : '1px solid transparent',
                boxShadow: currentPath.startsWith('/post-utme') ? 'var(--shadow)' : 'none',
                flexShrink: 1,
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease',
              }}
            >
              <span>🏛️</span>
              <span className="portal-nav-label">Post-UTME</span>
            </Link>

            {/* 6. Learning Tools Popover Dropdown */}
            <div
              ref={toolsDropdownRef}
              style={{ position: 'relative', flexShrink: 1, paddingBottom: '8px', marginBottom: '-8px' }}
              onMouseEnter={() => setToolsDropdownOpen(true)}
              onMouseLeave={() => setToolsDropdownOpen(false)}
            >
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setToolsDropdownOpen((prev) => !prev);
                  setMoreDropdownOpen(false);
                }}
                aria-expanded={toolsDropdownOpen}
                aria-haspopup="true"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '6px 9px',
                  borderRadius: '6px',
                  background: 'none',
                  cursor: 'pointer',
                  fontSize: '12.5px',
                  fontFamily: "var(--font-sans)",
                  fontWeight: isToolActive || toolsDropdownOpen ? 700 : 500,
                  color: isToolActive || toolsDropdownOpen ? 'var(--rust, #a8562f)' : 'var(--ink-soft)',
                  backgroundColor: isToolActive || toolsDropdownOpen ? 'var(--white)' : 'transparent',
                  border: isToolActive || toolsDropdownOpen ? '1px solid var(--paper-line)' : '1px solid transparent',
                  boxShadow: isToolActive || toolsDropdownOpen ? 'var(--shadow)' : 'none',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease',
                }}
              >
                <span>🧰</span>
                <span className="portal-nav-label">Learning Tools</span>
                <span
                  style={{
                    fontSize: '9px',
                    marginLeft: '2px',
                    transform: toolsDropdownOpen ? 'rotate(180deg)' : 'none',
                    transition: 'transform 0.15s ease',
                  }}
                >
                  ▼
                </span>
              </button>

              {/* Popover Card */}
              {toolsDropdownOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: '340px',
                    backgroundColor: 'var(--white, #ffffff)',
                    border: '1.5px solid var(--paper-line)',
                    borderRadius: '10px',
                    boxShadow: '0 20px 45px rgba(0, 0, 0, 0.22)',
                    zIndex: 99999,
                    padding: '8px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2px',
                    animation: 'fadeIn 0.15s ease',
                  }}
                >
                  <div
                    style={{
                      padding: '8px 12px',
                      fontSize: '11px',
                      fontFamily: "var(--font-sans)",
                      color: 'var(--ink-soft)',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      borderBottom: '1px solid var(--paper-line)',
                      marginBottom: '4px',
                    }}
                  >
                    Academic Revision &amp; Study Utilities
                  </div>

                  {LEARNING_TOOLS.map((tool) => {
                    const active = currentPath.startsWith(normalizePortalPath(tool.path));
                    return (
                      <Link
                        key={tool.path}
                        to={tool.path}
                        onClick={() => setToolsDropdownOpen(false)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          padding: '8px 12px',
                          borderRadius: '6px',
                          textDecoration: 'none',
                          backgroundColor: active ? 'var(--forest-soft, rgba(34, 90, 56, 0.12))' : 'transparent',
                          transition: 'background-color 0.1s ease',
                        }}
                        onMouseEnter={(e) => {
                          if (!active) (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--paper)';
                        }}
                        onMouseLeave={(e) => {
                          if (!active) (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
                        }}
                      >
                        <span style={{ fontSize: '18px', flexShrink: 0 }}>{tool.icon}</span>
                        <div>
                          <div
                            style={{
                              fontSize: '13px',
                              fontWeight: active ? 700 : 600,
                              color: active ? 'var(--forest, #225a38)' : 'var(--ink)',
                              fontFamily: "var(--font-sans)",
                            }}
                          >
                            {tool.label}
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--ink-soft)' }}>
                            {tool.desc}
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 7. Platform & More Popover Dropdown */}
            <div
              ref={moreDropdownRef}
              style={{ position: 'relative', flexShrink: 1, paddingBottom: '8px', marginBottom: '-8px' }}
              onMouseEnter={() => setMoreDropdownOpen(true)}
              onMouseLeave={() => setMoreDropdownOpen(false)}
            >
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setMoreDropdownOpen((prev) => !prev);
                  setToolsDropdownOpen(false);
                }}
                aria-expanded={moreDropdownOpen}
                aria-haspopup="true"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '6px 9px',
                  borderRadius: '6px',
                  background: 'none',
                  cursor: 'pointer',
                  fontSize: '12.5px',
                  fontFamily: "var(--font-sans)",
                  fontWeight: isMoreActive || moreDropdownOpen ? 700 : 500,
                  color: isMoreActive || moreDropdownOpen ? 'var(--rust, #a8562f)' : 'var(--ink-soft)',
                  backgroundColor: isMoreActive || moreDropdownOpen ? 'var(--white)' : 'transparent',
                  border: isMoreActive || moreDropdownOpen ? '1px solid var(--paper-line)' : '1px solid transparent',
                  boxShadow: isMoreActive || moreDropdownOpen ? 'var(--shadow)' : 'none',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease',
                }}
              >
                <span>⚡</span>
                <span className="portal-nav-label">More</span>
                <span
                  style={{
                    fontSize: '9px',
                    marginLeft: '2px',
                    transform: moreDropdownOpen ? 'rotate(180deg)' : 'none',
                    transition: 'transform 0.15s ease',
                  }}
                >
                  ▼
                </span>
              </button>

              {/* Popover Card */}
              {moreDropdownOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    width: '320px',
                    backgroundColor: 'var(--white, #ffffff)',
                    border: '1.5px solid var(--paper-line)',
                    borderRadius: '10px',
                    boxShadow: '0 20px 45px rgba(0, 0, 0, 0.22)',
                    zIndex: 99999,
                    padding: '8px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2px',
                    animation: 'fadeIn 0.15s ease',
                  }}
                >
                  <div
                    style={{
                      padding: '8px 12px',
                      fontSize: '11px',
                      fontFamily: "var(--font-sans)",
                      color: 'var(--ink-soft)',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      borderBottom: '1px solid var(--paper-line)',
                      marginBottom: '4px',
                    }}
                  >
                    Platform Services &amp; Resources
                  </div>

                  {MORE_TOOLS.map((tool) => {
                    const active = currentPath.startsWith(normalizePortalPath(tool.path));
                    return (
                      <Link
                        key={tool.path}
                        to={tool.path}
                        onClick={() => setMoreDropdownOpen(false)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          padding: '8px 12px',
                          borderRadius: '6px',
                          textDecoration: 'none',
                          backgroundColor: active ? 'var(--rust-soft, rgba(168, 86, 47, 0.12))' : 'transparent',
                          transition: 'background-color 0.1s ease',
                        }}
                        onMouseEnter={(e) => {
                          if (!active) (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--paper)';
                        }}
                        onMouseLeave={(e) => {
                          if (!active) (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
                        }}
                      >
                        <span style={{ fontSize: '18px', flexShrink: 0 }}>{tool.icon}</span>
                        <div>
                          <div
                            style={{
                              fontSize: '13px',
                              fontWeight: active ? 700 : 600,
                              color: active ? 'var(--rust, #a8562f)' : 'var(--ink)',
                              fontFamily: "var(--font-sans)",
                            }}
                          >
                            {tool.label}
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--ink-soft)' }}>
                            {tool.desc}
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 11. Admin Portal (if role === ADMIN) */}
            {isAdmin && (
              <Link
                to="/admin"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '6px 8px',
                  borderRadius: '6px',
                  textDecoration: 'none',
                  fontSize: '12.5px',
                  fontFamily: "var(--font-sans)",
                  fontWeight: 700,
                  color: currentPath.startsWith('/admin') ? 'var(--white)' : 'var(--rust, #a8562f)',
                  backgroundColor: currentPath.startsWith('/admin') ? 'var(--rust, #a8562f)' : 'var(--rust-soft, rgba(168, 86, 47, 0.12))',
                  border: '1px solid rgba(168, 86, 47, 0.3)',
                  flexShrink: 1,
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease',
                }}
              >
                <span>🛡️</span>
                <span className="portal-nav-label">Admin</span>
              </Link>
            )}
          </nav>

          {/* ======================================================== */}
          {/* RIGHT: Quick Search, Notifications, Theme & Account Menu */}
          {/* ======================================================== */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(4px, 1vw, 10px)', flexShrink: 0 }}>
            {/* Desktop Quick Search Button */}
            <button
              type="button"
              className="portal-search-btn-desktop"
              onClick={() => setSearchModalOpen(true)}
              aria-label="Open global quick search"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 12px',
                borderRadius: '20px',
                border: '1px solid var(--paper-line)',
                backgroundColor: 'var(--white)',
                color: 'var(--ink-soft)',
                fontSize: '13px',
                fontFamily: "var(--font-sans)",
                cursor: 'pointer',
                boxShadow: 'var(--shadow)',
                transition: 'all 0.15s ease',
              }}
            >
              <span>🔍</span>
              <span className="portal-search-text" style={{ display: 'inline-block' }}>Search</span>
              <span
                className="portal-search-shortcut"
                style={{
                  fontSize: '10.5px',
                  fontFamily: "var(--font-sans)",
                  backgroundColor: 'var(--paper)',
                  border: '1px solid var(--paper-line)',
                  padding: '1px 5px',
                  borderRadius: '4px',
                  color: 'var(--ink-soft)',
                }}
              >
                ⌘K
              </span>
            </button>

            {/* Real Notification Bell */}
            {isAuthenticated && <PortalNotificationPopover />}

            {/* Dark / Light Theme Toggle */}
            <ThemeToggle />

            {/* Extra Action (e.g. Upload Button) if provided */}
            {extraAction && (
              <div style={{ display: 'flex', alignItems: 'center' }}>
                {extraAction}
              </div>
            )}

            {/* Authenticated Account Menu Dropdown */}
            {isAuthenticated ? (
              <UserAccountMenu />
            ) : (
              <button
                type="button"
                className="btn-custom btn-custom-primary"
                style={{ fontSize: '13px', padding: '7px 16px', whiteSpace: 'nowrap' }}
                onClick={() => openAuthModal('login')}
              >
                Sign In
              </button>
            )}

            {/* Hamburger Button for Mobile & Tablet (<= 1180px) */}
            <button
              type="button"
              className="portal-menu-btn"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open student portal navigation drawer"
            >
              <svg width="22" height="22" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <rect y="3" width="20" height="2.2" rx="1.1" fill="currentColor" />
                <rect y="8.9" width="20" height="2.2" rx="1.1" fill="currentColor" />
                <rect y="14.8" width="20" height="2.2" rx="1.1" fill="currentColor" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Global Command Palette / Search Modal */}
      <PortalQuickSearchModal
        isOpen={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
      />

      {/* ======================================================== */}
      {/* MOBILE & TABLET OFFCANVAS NAVIGATION DRAWER              */}
      {/* ======================================================== */}
      <Offcanvas
        show={mobileMenuOpen}
        onHide={() => setMobileMenuOpen(false)}
        placement="end"
        className="mobile-offcanvas"
        style={{
          maxWidth: '340px',
          width: '88vw',
          backgroundColor: 'var(--paper, #eceee6)',
          color: 'var(--ink)',
        }}
      >
        <Offcanvas.Header
          closeButton
          style={{
            borderBottom: '1px solid var(--paper-line)',
            padding: '16px 20px',
            backgroundColor: 'var(--white)',
          }}
        >
          <Offcanvas.Title style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BrandLogo size="sm" />
            <span
              style={{
                fontSize: '10px',
                fontFamily: "var(--font-sans)",
                fontWeight: 700,
                backgroundColor: badgeStyle.bg,
                color: badgeStyle.text,
                padding: '2px 6px',
                borderRadius: '4px',
              }}
            >
              STUDENT PORTAL
            </span>
          </Offcanvas.Title>
        </Offcanvas.Header>

        <Offcanvas.Body
          style={{
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            overflowY: 'auto',
          }}
        >
          <div>
            {/* Student Account Summary Card */}
            {user && (
              <div
                style={{
                  padding: '14px',
                  backgroundColor: 'var(--white)',
                  border: '1.5px solid var(--paper-line)',
                  borderRadius: '8px',
                  boxShadow: 'var(--shadow)',
                  marginBottom: '18px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--rust, #a8562f)',
                      color: 'var(--white)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: '15px',
                      fontFamily: "var(--font-sans)",
                      overflow: 'hidden',
                      flexShrink: 0,
                    }}
                  >
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.fullName}
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      user.fullName ? user.fullName[0].toUpperCase() : 'U'
                    )}
                  </div>

                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {user.fullName || 'Student'}
                    </div>
                    <div style={{ fontSize: '11.5px', color: 'var(--ink-soft)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {user.email}
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: '10px', display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: 700,
                      backgroundColor: user.isVerified ? 'var(--forest-soft)' : 'var(--amber-soft)',
                      color: user.isVerified ? 'var(--forest)' : 'var(--amber-deep)',
                      padding: '2px 6px',
                      borderRadius: '4px',
                    }}
                  >
                    {user.isVerified ? '✓ VERIFIED' : '! UNVERIFIED'}
                  </span>
                  <Link
                    to="/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    style={{ fontSize: '11.5px', color: 'var(--forest, #225a38)', fontWeight: 700, marginLeft: 'auto', textDecoration: 'none' }}
                  >
                    View Profile ➔
                  </Link>
                </div>
              </div>
            )}

            {/* Quick Search Shortcut */}
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                setSearchModalOpen(true);
              }}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 14px',
                backgroundColor: 'var(--white)',
                border: '1.5px solid var(--paper-line)',
                borderRadius: '8px',
                fontSize: '13.5px',
                color: 'var(--ink-soft)',
                cursor: 'pointer',
                marginBottom: '20px',
                boxShadow: 'var(--shadow)',
              }}
            >
              <span>🔍</span>
              <span>Search questions, tools, formulas...</span>
            </button>

            {/* Section 1: Core Workspaces */}
            <div style={{ marginBottom: '18px' }}>
              <div style={{ fontSize: '11px', fontFamily: "var(--font-sans)", fontWeight: 700, color: 'var(--ink-soft)', textTransform: 'uppercase', marginBottom: '8px', paddingLeft: '4px' }}>
                Core Workspaces
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {[
                  { label: 'Dashboard', path: '/dashboard', icon: '📊' },
                  { label: 'CBT Exam Practice', path: '/portal/cbt', icon: '💻' },
                  { label: 'Past Questions Catalog', path: '/portal/questions', icon: '📚' },
                  { label: 'Study Materials & PDFs', path: '/portal/materials', icon: '📄' },
                  { label: 'Post-UTME Screening', path: '/portal/post-utme', icon: '🏛️' },
                  { label: 'JAMB Prescribed Novels', path: '/portal/novels', icon: '📖' },
                  { label: 'Psychometric Analytics', path: '/analytics', icon: '📈' },
                ].map((item) => {
                  const active = currentPath === normalizePortalPath(item.path);
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileMenuOpen(false)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '10px 14px',
                        borderRadius: '6px',
                        backgroundColor: active ? 'var(--white)' : 'transparent',
                        border: active ? '1px solid var(--paper-line)' : '1px solid transparent',
                        boxShadow: active ? 'var(--shadow)' : 'none',
                        color: active ? 'var(--rust, #a8562f)' : 'var(--ink)',
                        fontWeight: active ? 700 : 500,
                        fontSize: '13.5px',
                        textDecoration: 'none',
                      }}
                    >
                      <span style={{ fontSize: '16px' }}>{item.icon}</span>
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Section 2: Revision & Learning Tools */}
            <div style={{ marginBottom: '18px' }}>
              <div style={{ fontSize: '11px', fontFamily: "var(--font-sans)", fontWeight: 700, color: 'var(--ink-soft)', textTransform: 'uppercase', marginBottom: '8px', paddingLeft: '4px' }}>
                Revision &amp; Learning Tools
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {LEARNING_TOOLS.map((item) => {
                  const active = currentPath.startsWith(normalizePortalPath(item.path));
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileMenuOpen(false)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '9px 14px',
                        borderRadius: '6px',
                        backgroundColor: active ? 'var(--white)' : 'transparent',
                        border: active ? '1px solid var(--paper-line)' : '1px solid transparent',
                        boxShadow: active ? 'var(--shadow)' : 'none',
                        color: active ? 'var(--forest, #225a38)' : 'var(--ink)',
                        fontWeight: active ? 700 : 500,
                        fontSize: '13.5px',
                        textDecoration: 'none',
                      }}
                    >
                      <span style={{ fontSize: '16px' }}>{item.icon}</span>
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Section 3: Account & Billing */}
            <div style={{ marginBottom: '18px' }}>
              <div style={{ fontSize: '11px', fontFamily: "var(--font-sans)", fontWeight: 700, color: 'var(--ink-soft)', textTransform: 'uppercase', marginBottom: '8px', paddingLeft: '4px' }}>
                Account &amp; Subscriptions
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {[
                  { label: 'Student Profile', path: '/profile', icon: '👤' },
                  { label: 'Account Settings', path: '/settings', icon: '⚙️' },
                  { label: 'Saved Bookmarks', path: '/settings?tab=bookmarks', icon: '📑' },
                  { label: 'Attempt History', path: '/settings?tab=history', icon: '📝' },
                  { label: 'Subscription & Pricing', path: '/portal/pricing', icon: '★' },
                  { label: 'Academic Blog & Guides', path: '/portal/blog', icon: '📰' },
                ].map((item) => {
                  const active = currentPath === normalizePortalPath(item.path);
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileMenuOpen(false)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '9px 14px',
                        borderRadius: '6px',
                        backgroundColor: active ? 'var(--white)' : 'transparent',
                        border: active ? '1px solid var(--paper-line)' : '1px solid transparent',
                        boxShadow: active ? 'var(--shadow)' : 'none',
                        color: active ? 'var(--ink)' : 'var(--ink-soft)',
                        fontWeight: active ? 700 : 500,
                        fontSize: '13.5px',
                        textDecoration: 'none',
                      }}
                    >
                      <span style={{ fontSize: '16px' }}>{item.icon}</span>
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Bottom Actions: Theme Toggle & Logout */}
          <div style={{ paddingTop: '16px', borderTop: '1px solid var(--paper-line)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ink)' }}>Theme Appearance</span>
              <ThemeToggle showLabel />
            </div>

            {isAuthenticated ? (
              <button
                type="button"
                className="btn-custom btn-custom-ghost"
                style={{
                  width: '100%',
                  justifyContent: 'center',
                  padding: '11px',
                  fontSize: '13.5px',
                  color: 'var(--color-error)',
                  borderColor: 'rgba(220, 38, 38, 0.3)',
                }}
                onClick={handleLogout}
              >
                Sign Out Everywhere
              </button>
            ) : (
              <button
                type="button"
                className="btn-custom btn-custom-primary"
                style={{ width: '100%', justifyContent: 'center', padding: '11px', fontSize: '13.5px' }}
                onClick={() => {
                  setMobileMenuOpen(false);
                  openAuthModal('login');
                }}
              >
                Sign In
              </button>
            )}
          </div>
        </Offcanvas.Body>
      </Offcanvas>
    </>
  );
};

