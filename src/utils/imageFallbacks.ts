import React from 'react';

export const FALLBACK_STUDY_HERO = '/assets/images/study-hero.svg';
export const FALLBACK_EXAM_PREP = '/assets/images/exam-prep.svg';

/**
 * Universal safe image fallback handler.
 * Automatically catches network timeouts, CDN blockages, or 404/403 errors,
 * swapping the broken image with a crisp local offline SVG asset.
 */
export const handleImageError = (
  fallbackUrl: string = FALLBACK_STUDY_HERO
) => (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
  const target = e.currentTarget;
  if (!target.src.endsWith(fallbackUrl)) {
    target.onerror = null; // Prevent recursive loops
    target.src = fallbackUrl;
  }
};
