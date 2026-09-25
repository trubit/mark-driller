import React, { useState } from 'react';

export interface SafeImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackSrc?: string;
  fallbackIcon?: React.ReactNode;
}

export const SafeImage: React.FC<SafeImageProps> = ({
  src,
  alt = '',
  className = '',
  style,
  fallbackSrc,
  fallbackIcon,
  onError,
  loading = 'lazy',
  ...rest
}) => {
  const [hasError, setHasError] = useState(false);
  const [attemptedFallback, setAttemptedFallback] = useState(false);

  const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    if (fallbackSrc && !attemptedFallback) {
      setAttemptedFallback(true);
      return;
    }
    setHasError(true);
    if (onError) {
      onError(e);
    }
  };

  const currentSrc = attemptedFallback && fallbackSrc ? fallbackSrc : src;

  if (hasError || !currentSrc) {
    return (
      <div
        className={`safe-image-fallback ${className}`}
        role="img"
        aria-label={alt || 'Visual illustration'}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'var(--color-bg-muted, #f1f5f9)',
          color: 'var(--color-text-muted, #64748b)',
          borderRadius: (style as any)?.borderRadius || '8px',
          width: style?.width || '100%',
          height: style?.height || '100%',
          minHeight: '80px',
          padding: '16px',
          textAlign: 'center',
          boxSizing: 'border-box',
          ...style,
        }}
      >
        {fallbackIcon || (
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
        )}
        {alt && (
          <span
            style={{
              fontSize: '12px',
              marginTop: '8px',
              lineHeight: 1.3,
              fontWeight: 500,
              maxWidth: '90%',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {alt}
          </span>
        )}
      </div>
    );
  }

  return (
    <img
      src={currentSrc}
      alt={alt}
      className={className}
      style={style}
      loading={loading}
      onError={handleError}
      referrerPolicy="no-referrer"
      {...rest}
    />
  );
};
