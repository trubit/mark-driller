import React from 'react';

export interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'horizontal' | 'stacked' | 'icon-only';
  showTagline?: boolean;
  className?: string;
  style?: React.CSSProperties;
  theme?: 'light' | 'dark' | 'auto';
}

const sizeConfig = {
  sm: { icon: 20, font: '16px', suffix: '16px', gap: '6px' },
  md: { icon: 28, font: '20px', suffix: '20px', gap: '8px' },
  lg: { icon: 44, font: '28px', suffix: '28px', gap: '12px' },
  xl: { icon: 60, font: '38px', suffix: '38px', gap: '16px' },
};

/**
 * MarkDriller Canonical Brand Logo
 * Unified source of truth for the target/crosshair insignia and brand typography.
 * Supports theme="dark" for headers, dark mode surfaces, and footers.
 */
export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 'md',
  variant = 'horizontal',
  showTagline = false,
  className = '',
  style = {},
  theme = 'light',
}) => {
  const config = sizeConfig[size] || sizeConfig.md;
  const isStacked = variant === 'stacked';
  const isIconOnly = variant === 'icon-only';

  const isDark = theme === 'dark';
  const baseColor = isDark ? '#ffffff' : (style?.color || 'var(--ink, #14181c)');
  const drillColor = isDark ? '#fb923c' : 'var(--rust, #a8562f)';
  const innerRingColor = isDark ? '#fb923c' : 'var(--rust, #a8562f)';

  const iconSvg = (
    <svg
      className="mark-icon"
      width={config.icon}
      height={config.icon}
      viewBox="0 0 28 28"
      fill="none"
      role="img"
      aria-label="MarkDriller Target Insignia"
      style={{ flexShrink: 0 }}
    >
      <circle cx="14" cy="14" r="12" stroke={baseColor} strokeWidth="2" />
      <circle cx="14" cy="14" r="6.5" stroke={innerRingColor} strokeWidth="2" />
      <circle cx="14" cy="14" r="1.8" fill={baseColor} />
      <line x1="14" y1="0" x2="14" y2="5" stroke={baseColor} strokeWidth="2" />
      <line x1="14" y1="23" x2="14" y2="28" stroke={baseColor} strokeWidth="2" />
      <line x1="0" y1="14" x2="5" y2="14" stroke={baseColor} strokeWidth="2" />
      <line x1="23" y1="14" x2="28" y2="14" stroke={baseColor} strokeWidth="2" />
    </svg>
  );

  if (isIconOnly) {
    return (
      <div
        className={`brand-logo-container ${className}`}
        style={{ display: 'inline-flex', alignItems: 'center', color: baseColor, ...style }}
      >
        {iconSvg}
      </div>
    );
  }

  return (
    <div
      className={`brand-logo-container ${className}`}
      style={{
        display: 'inline-flex',
        flexDirection: isStacked ? 'column' : 'row',
        alignItems: 'center',
        gap: config.gap,
        fontFamily: "var(--font-sans)",
        fontWeight: 700,
        textDecoration: 'none',
        color: baseColor,
        ...style,
      }}
    >
      {iconSvg}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: isStacked ? 'center' : 'flex-start' }}>
        <div style={{ fontSize: config.font, letterSpacing: '-0.5px', lineHeight: 1 }}>
          <span style={{ color: baseColor }}>Mark</span>
          <span className="drill-suffix" style={{ color: drillColor }}>Driller</span>
        </div>
        {showTagline && (
          <span
            style={{
              fontSize: '11px',
              fontFamily: "var(--font-sans)",
              color: isDark ? 'rgba(255, 255, 255, 0.75)' : 'var(--slate, #666)',
              fontWeight: 500,
              letterSpacing: '0.5px',
              marginTop: '4px',
            }}
          >
            Drill down. Hit the mark.
          </span>
        )}
      </div>
    </div>
  );
};


