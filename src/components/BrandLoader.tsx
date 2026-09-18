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
          fontFamily: "'JetBrains Mono', monospace",
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
            backgroundColor: 'rgba(20, 24, 28, 0.08)',
            borderRadius: '2px',
            overflow: 'hidden',
            marginTop: '8px',
          }}
        >
          <div
            className="brand-loader-bar-fill"
            style={{
              height: '100%',
              backgroundColor: 'var(--rust, #a8562f)',
              borderRadius: '2px',
            }}
          />
        </div>

        {message && (
          <div
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: isFullscreen ? '13px' : '12px',
              color: 'var(--slate, #666)',
              letterSpacing: '0.5px',
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
