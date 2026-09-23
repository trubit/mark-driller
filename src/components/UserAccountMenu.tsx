import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore.js';
import { useMySubscriptionQuery } from '../api/subscriptions.js';

interface UserAccountMenuProps {
  onItemClick?: () => void;
}

export const UserAccountMenu: React.FC<UserAccountMenuProps> = ({ onItemClick }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { user, clearSession } = useAuthStore();
  const { data: subscription } = useMySubscriptionQuery();
  const navigate = useNavigate();

  const handleLogout = () => {
    setIsOpen(false);
    clearSession();
    if (onItemClick) onItemClick();
    navigate('/');
  };

  const handleLinkClick = () => {
    setIsOpen(false);
    if (onItemClick) onItemClick();
  };

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  if (!user) return null;

  const initials = user.fullName
    ? user.fullName
        .split(' ')
        .filter(Boolean)
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'U';

  const isPro = subscription?.isPro || false;
  const isVerified = user.isVerified;

  return (
    <div ref={menuRef} style={{ position: 'relative', display: 'inline-block' }}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label="User account and profile menu"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'none',
          border: '1px solid var(--paper-line)',
          borderRadius: '24px',
          padding: '4px 10px 4px 5px',
          cursor: 'pointer',
          backgroundColor: isOpen ? 'var(--paper)' : 'var(--white)',
          transition: 'all 0.15s ease',
          boxShadow: 'var(--shadow)',
        }}
      >
        {/* Avatar / Fallback */}
        <div
          style={{
            width: '30px',
            height: '30px',
            borderRadius: '50%',
            backgroundColor: 'var(--rust, #a8562f)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: '12px',
            fontFamily: "var(--font-sans)",
            overflow: 'hidden',
            flexShrink: 0,
          }}
        >
          {user.avatar ? (
            <img
              src={user.avatar}
              alt={user.fullName}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={(e) => {
                // If avatar fails to load, fallback to initials
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          ) : (
            initials
          )}
        </div>

        <div className="portal-user-meta" style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <span
            style={{
              fontSize: '12.5px',
              fontFamily: "var(--font-sans)",
              fontWeight: 700,
              color: 'var(--ink)',
              maxWidth: '120px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              lineHeight: 1.2,
            }}
          >
            {user.fullName ? user.fullName.split(' ')[0] : 'Account'}
          </span>
          <span
            style={{
              fontSize: '10px',
              fontFamily: "var(--font-sans)",
              color: isPro ? 'var(--forest, #225a38)' : 'var(--ink-soft)',
              fontWeight: isPro ? 700 : 500,
              lineHeight: 1.1,
            }}
          >
            {isPro ? 'PRO SCHOLAR' : 'FREE PASS'}
          </span>
        </div>

        <span
          style={{
            fontSize: '10px',
            color: 'var(--ink-soft)',
            transform: isOpen ? 'rotate(180deg)' : 'none',
            transition: 'transform 0.15s ease',
          }}
        >
          ▼
        </span>
      </button>

      {/* Dropdown Menu Container */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            right: 0,
            top: 'calc(100% + 8px)',
            width: '260px',
            backgroundColor: 'var(--white)',
            border: '1.5px solid var(--paper-line)',
            borderRadius: '8px',
            boxShadow: 'var(--card-shadow)',
            zIndex: 1100,
            overflow: 'hidden',
            animation: 'fadeIn 0.15s ease',
          }}
        >
          {/* User Header Summary */}
          <div
            style={{
              padding: '14px 16px',
              backgroundColor: 'var(--paper)',
              borderBottom: '1px solid var(--paper-line)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span
                style={{
                  fontSize: '13.5px',
                  fontWeight: 700,
                  color: 'var(--ink)',
                  fontFamily: "var(--font-sans)",
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {user.fullName}
              </span>
              {isVerified ? (
                <span
                  title="Email Verified"
                  style={{
                    backgroundColor: 'var(--forest-soft, rgba(34, 90, 56, 0.12))',
                    color: 'var(--forest, #225a38)',
                    fontSize: '10px',
                    fontWeight: 700,
                    padding: '2px 6px',
                    borderRadius: '4px',
                  }}
                >
                  ✓ VERIFIED
                </span>
              ) : (
                <span
                  title="Email Unverified"
                  style={{
                    backgroundColor: 'var(--amber-soft, rgba(226, 154, 60, 0.15))',
                    color: 'var(--amber-deep, #c17d24)',
                    fontSize: '10px',
                    fontWeight: 700,
                    padding: '2px 6px',
                    borderRadius: '4px',
                  }}
                >
                  ! UNVERIFIED
                </span>
              )}
            </div>
            <div
              style={{
                fontSize: '11.5px',
                color: 'var(--ink-soft)',
                fontFamily: "var(--font-sans)",
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {user.email}
            </div>
          </div>

          {/* Navigation Links */}
          <div style={{ padding: '6px 0' }}>
            <Link
              to="/profile"
              onClick={handleLinkClick}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '9px 16px',
                color: 'var(--ink)',
                textDecoration: 'none',
                fontSize: '13.5px',
                fontFamily: "var(--font-sans)",
                fontWeight: 600,
                transition: 'background-color 0.1s ease',
              }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = 'var(--paper)')}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = 'transparent')}
            >
              <span>👤</span>
              <span>Student Profile</span>
            </Link>

            <Link
              to="/settings"
              onClick={handleLinkClick}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '9px 16px',
                color: 'var(--ink)',
                textDecoration: 'none',
                fontSize: '13.5px',
                fontFamily: "var(--font-sans)",
                fontWeight: 600,
                transition: 'background-color 0.1s ease',
              }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = 'var(--paper)')}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = 'transparent')}
            >
              <span>⚙️</span>
              <span>Account Settings</span>
            </Link>

            <Link
              to="/settings?tab=bookmarks"
              onClick={handleLinkClick}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '9px 16px',
                color: 'var(--ink)',
                textDecoration: 'none',
                fontSize: '13.5px',
                fontFamily: "var(--font-sans)",
                fontWeight: 600,
                transition: 'background-color 0.1s ease',
              }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = 'var(--paper)')}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = 'transparent')}
            >
              <span>📑</span>
              <span>Saved Bookmarks</span>
            </Link>

            <Link
              to="/settings?tab=history"
              onClick={handleLinkClick}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '9px 16px',
                color: 'var(--ink)',
                textDecoration: 'none',
                fontSize: '13.5px',
                fontFamily: "var(--font-sans)",
                fontWeight: 600,
                transition: 'background-color 0.1s ease',
              }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = 'var(--paper)')}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = 'transparent')}
            >
              <span>📊</span>
              <span>Attempt &amp; Results History</span>
            </Link>

            <Link
              to="/settings?tab=subscription"
              onClick={handleLinkClick}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '9px 16px',
                color: 'var(--ink)',
                textDecoration: 'none',
                fontSize: '13.5px',
                fontFamily: "var(--font-sans)",
                fontWeight: 600,
                transition: 'background-color 0.1s ease',
              }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = 'var(--paper)')}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = 'transparent')}
            >
              <span>★</span>
              <span>Subscription &amp; Payments</span>
            </Link>

            {user.role === 'ADMIN' && (
              <Link
                to="/admin"
                onClick={handleLinkClick}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '9px 16px',
                  color: 'var(--rust, #a8562f)',
                  textDecoration: 'none',
                  fontSize: '13.5px',
                  fontFamily: "var(--font-sans)",
                  fontWeight: 700,
                  transition: 'background-color 0.1s ease',
                }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = 'var(--paper)')}
                onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = 'transparent')}
              >
                <span>🛡️</span>
                <span>Administrator Portal</span>
              </Link>
            )}
          </div>

          {/* Logout Section */}
          <div style={{ borderTop: '1px solid var(--paper-line)', padding: '6px 0' }}>
            <button
              type="button"
              onClick={handleLogout}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 16px',
                border: 'none',
                background: 'none',
                color: '#dc2626',
                cursor: 'pointer',
                fontSize: '13px',
                fontFamily: "var(--font-sans)",
                fontWeight: 600,
                textAlign: 'left',
                transition: 'background-color 0.1s ease',
              }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(220, 38, 38, 0.08)')}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = 'transparent')}
            >
              <span>🚪</span>
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

