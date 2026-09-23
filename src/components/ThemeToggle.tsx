import React from 'react';
import { useAppStore } from '../store/useAppStore.js';

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ className = '', showLabel = false }) => {
  const { theme, toggleTheme } = useAppStore();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`theme-toggle-btn ${className}`}
      role="switch"
      aria-checked={isDark}
      aria-label={`Switch to ${isDark ? 'Light' : 'Dark'} mode`}
      title={`Switch to ${isDark ? 'Light' : 'Dark'} mode`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        background: 'none',
        border: 'none',
        padding: '2px',
        cursor: 'pointer',
        fontFamily: "var(--font-sans)",
        color: 'var(--ink)',
      }}
    >
      {/* Pill Track */}
      <div
        style={{
          width: '50px',
          height: '26px',
          borderRadius: '9999px',
          backgroundColor: isDark ? 'var(--steel-deep, #1e3a8a)' : 'var(--paper-dim, #e0e3d9)',
          border: isDark ? '1.5px solid var(--steel, #60a5fa)' : '1.5px solid var(--paper-line, rgba(20,24,28,0.2))',
          position: 'relative',
          transition: 'background-color 0.25s ease, border-color 0.25s ease',
          boxShadow: isDark
            ? 'inset 0 2px 4px rgba(0, 0, 0, 0.4)'
            : 'inset 0 1px 2px rgba(0, 0, 0, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 5px',
        }}
      >
        {/* Subtle Background Icons inside Track */}
        <span
          style={{
            fontSize: '11px',
            lineHeight: 1,
            opacity: isDark ? 0.35 : 0.85,
            transition: 'opacity 0.2s ease',
            display: 'flex',
            alignItems: 'center',
          }}
          aria-hidden="true"
        >
          {/* Sun SVG */}
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="5" fill="#f59e0b" />
            <line x1="12" y1="1" x2="12" y2="3" />
            <line x1="12" y1="21" x2="12" y2="23" />
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
            <line x1="1" y1="12" x2="3" y2="12" />
            <line x1="21" y1="12" x2="23" y2="12" />
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
          </svg>
        </span>

        <span
          style={{
            fontSize: '11px',
            lineHeight: 1,
            opacity: isDark ? 0.9 : 0.35,
            transition: 'opacity 0.2s ease',
            display: 'flex',
            alignItems: 'center',
          }}
          aria-hidden="true"
        >
          {/* Moon SVG */}
          <svg width="11" height="11" viewBox="0 0 24 24" fill="#93c5fd" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          </svg>
        </span>

        {/* Sliding Thumb */}
        <div
          style={{
            position: 'absolute',
            top: '2px',
            left: isDark ? '26px' : '2px',
            width: '18px',
            height: '18px',
            borderRadius: '50%',
            backgroundColor: '#ffffff',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'left 0.22s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          {isDark ? (
            <svg width="10" height="10" viewBox="0 0 24 24" fill="#1e3a8a" stroke="#1e3a8a" strokeWidth="1.5">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          ) : (
            <svg width="11" height="11" viewBox="0 0 24 24" fill="#f59e0b" stroke="#d97706" strokeWidth="1.5">
              <circle cx="12" cy="12" r="5" />
            </svg>
          )}
        </div>
      </div>

      {showLabel && (
        <span
          style={{
            fontSize: '12px',
            fontFamily: "var(--font-sans)",
            color: 'var(--ink-soft)',
            fontWeight: 600,
          }}
        >
          {isDark ? 'Dark Mode' : 'Light Mode'}
        </span>
      )}
    </button>
  );
};

