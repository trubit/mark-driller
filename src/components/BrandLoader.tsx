import React from 'react';
import { BrandLogo } from './BrandLogo.js';

export interface BrandLoaderProps {
  mode?: 'fullscreen' | 'contained' | 'inline';
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * MarkDriller Production Brand Loader
 * Uses the canonical MarkDriller branding with subtle, accessible micro-animations.
 * Respects prefers-reduced-motion and has zero artificial delays.
 */
export const BrandLoader: React.FC<BrandLoaderProps> = ({
  mode = 'contained',
  message = 'MarkDriller is loading...',
  size = 'md',
  className = '',
}) => {
  const logoSize = size === 'sm' ? 'sm' : size === 'lg' ? 'xl' : 'lg';

  if (mode === 'inline') {
    return (
      <span
        className={`brand-loader-inline ${className}`}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          fontFamily: "var(--font-sans)",
          fontSize: '12px',
        }}
      >
        <span className="brand-loader-pulse-icon" style={{ display: 'inline-flex' }}>
          <BrandLogo size="sm" variant="icon-only" />
        </span>
        {message && <span>{message}</span>}
      </span>
    );
  }

  const isFullscreen = mode === 'fullscreen';

  return (
    <div
      className={`brand-loader-container ${isFullscreen ? 'brand-loader-fullscreen' : 'brand-loader-contained'} ${className}`}
      role="status"
      aria-live="polite"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: isFullscreen ? '100vh' : '280px',
        padding: '32px 16px',
        backgroundColor: isFullscreen ? 'var(--paper, #fdfbf7)' : 'transparent',
        width: '100%',
      }}
    >
      <div
        className="brand-loader-pulse-box"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px',
        }}
      >
        <div className="brand-loader-animated-logo">
          <BrandLogo size={logoSize} variant="stacked" showTagline={isFullscreen} />
        </div>

        {/* Minimal progress indicator */}
        <div
          className="brand-loader-bar-track"
          style={{
            width: isFullscreen ? '180px' : '120px',
            height: '3px',
            backgroundColor: 'var(--color-border, rgba(140, 150, 170, 0.2))',
            borderRadius: '2px',
            overflow: 'hidden',
            marginTop: '8px',
          }}
        >
          <div
            className="brand-loader-bar-fill"
            style={{
              height: '100%',
              backgroundColor: 'var(--brand-drill, var(--rust, #a8562f))',
              borderRadius: '2px',
            }}
          />
        </div>

        {message && (
          <div
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: isFullscreen ? '13px' : '12px',
              fontWeight: 500,
              color: 'var(--ink-soft, var(--color-text-muted, #64748b))',
              letterSpacing: '0.3px',
              marginTop: '4px',
              textAlign: 'center',
            }}
          >
            {message}
          </div>
        )}
      </div>
    </div>
  );
};

