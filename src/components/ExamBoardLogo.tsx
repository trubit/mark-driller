import React from 'react';

interface ExamBoardLogoProps {
  board: string;
  size?: number;
  className?: string;
  showName?: boolean;
}

export const ExamBoardLogo: React.FC<ExamBoardLogoProps> = ({
  board,
  size = 40,
  className = '',
  showName = false,
}) => {
  const norm = (board || '').toUpperCase();

  const isPostUtme = norm.includes('POST-UTME') || norm.includes('POST UTME');
  const isGce = norm.includes('GCE');

  if (isPostUtme || isGce) {
    const label = isPostUtme ? 'POST-UTME' : 'GCE';
    const subLabel = isPostUtme ? 'Tertiary Screening' : 'Private Series';
    const accentColor = isPostUtme ? 'var(--steel)' : 'var(--amber)';

    return (
      <div
        className={`exam-board-logo-container ${className}`}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        <div
          style={{
            width: `${size}px`,
            height: `${size}px`,
            minWidth: `${size}px`,
            borderRadius: '8px',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--paper-soft, #f8f9fa)',
            border: `1.5px solid ${accentColor}`,
            boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
            padding: '2px',
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-sans)",
              fontWeight: 800,
              fontSize: `${Math.max(9, size * 0.22)}px`,
              color: 'var(--ink)',
              lineHeight: 1.1,
              textAlign: 'center',
            }}
          >
            {label.split('-')[0]}
          </span>
          <span
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: `${Math.max(7, size * 0.16)}px`,
              color: 'var(--ink-soft)',
              fontWeight: 700,
            }}
          >
            {isPostUtme ? 'CBT' : 'EXT'}
          </span>
        </div>
        {showName && (
          <div style={{ display: 'inline-flex', flexDirection: 'column' }}>
            <span
              style={{
                fontFamily: "var(--font-sans)",
                fontWeight: 700,
                fontSize: `${Math.max(12, size * 0.32)}px`,
                color: 'var(--ink)',
                lineHeight: 1.2,
              }}
            >
              {label}
            </span>
            <span
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: `${Math.max(9, size * 0.22)}px`,
                color: 'var(--ink-soft)',
                letterSpacing: '0.02em',
              }}
            >
              {subLabel}
            </span>
          </div>
        )}
      </div>
    );
  }

  let logoSrc = '/assets/logos/jamb.png';
  let label = 'JAMB / UTME';

  if (norm.includes('WAEC') || norm.includes('WASSCE')) {
    logoSrc = '/assets/logos/waec.png';
    label = 'WAEC / SSCE';
  } else if (norm.includes('NECO')) {
    logoSrc = '/assets/logos/neco.png';
    label = 'NECO';
  } else if (norm.includes('NABTEB')) {
    logoSrc = '/assets/logos/nabteb.png';
    label = 'NABTEB';
  } else {
    logoSrc = '/assets/logos/jamb.png';
    label = 'JAMB / UTME';
  }

  const [hasError, setHasError] = React.useState(false);

  return (
    <div
      className={`exam-board-logo-container ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
      }}
    >
      <div
        style={{
          width: `${size}px`,
          height: `${size}px`,
          minWidth: `${size}px`,
          borderRadius: '8px',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#ffffff',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1), 0 0 0 1px rgba(0,0,0,0.06)',
          padding: '2px',
        }}
      >
        {!hasError ? (
          <img
            src={logoSrc}
            alt={`${label} Official Examination Logo`}
            onError={() => setHasError(true)}
            style={{
              maxWidth: '100%',
              maxHeight: '100%',
              objectFit: 'contain',
            }}
            loading="lazy"
          />
        ) : (
          <span
            style={{
              fontFamily: "var(--font-sans)",
              fontWeight: 800,
              fontSize: `${Math.max(10, size * 0.28)}px`,
              color: '#105B38',
              letterSpacing: '0.04em',
            }}
          >
            {label.split(' ')[0]}
          </span>
        )}
      </div>
      {showName && (
        <span
          style={{
            fontFamily: "var(--font-sans)",
            fontWeight: 700,
            fontSize: `${Math.max(12, size * 0.32)}px`,
            color: 'var(--ink)',
          }}
        >
          {label}
        </span>
      )}
    </div>
  );
};

