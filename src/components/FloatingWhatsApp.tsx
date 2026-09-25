import React from 'react';
import { Link } from 'react-router-dom';
import { useSupportContactQuery, buildWhatsAppLink } from '../api/supportContact.js';

export const FloatingWhatsApp: React.FC = () => {
  const { data: support } = useSupportContactQuery();

  const isEnabled = support ? support.whatsappEnabled !== false : true;
  const whatsappNumber = support?.whatsappNumber || '2348030001234';
  const hasWhatsApp = isEnabled && Boolean(whatsappNumber);
  const targetUrl = buildWhatsAppLink(whatsappNumber, 'Hello MarkDriller Support, I need assistance with CBT practice / activation.');

  const commonStyles: React.CSSProperties = {
    position: 'fixed',
    bottom: '24px',
    right: '24px',
    zIndex: 9999,
    backgroundColor: '#22c55e',
    color: '#ffffff',
    borderRadius: '50px',
    padding: '10px 18px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    boxShadow: '0 6px 24px rgba(34, 197, 94, 0.45)',
    textDecoration: 'none',
    fontFamily: "var(--font-sans)",
    fontWeight: 700,
    fontSize: '13px',
    letterSpacing: '0.02em',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLElement>) => {
    e.currentTarget.style.transform = 'translateY(-2px) scale(1.03)';
    e.currentTarget.style.boxShadow = '0 8px 28px rgba(34, 197, 94, 0.6)';
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLElement>) => {
    e.currentTarget.style.transform = 'translateY(0) scale(1)';
    e.currentTarget.style.boxShadow = '0 6px 24px rgba(34, 197, 94, 0.45)';
  };

  if (!isEnabled) {
    return null;
  }

  if (hasWhatsApp) {
    return (
      <a
        href={targetUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Direct Customer Support on WhatsApp"
        style={commonStyles}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <span style={{ fontSize: '16px', lineHeight: 1 }}>💬</span>
        <span>Need Help? Chat on WhatsApp</span>
      </a>
    );
  }

  return (
    <Link
      to="/contact"
      aria-label="Contact MarkDriller Academic Help Desk"
      style={{ ...commonStyles, backgroundColor: 'var(--rust)' }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <span style={{ fontSize: '16px', lineHeight: 1 }}>✉️</span>
      <span>Support Desk</span>
    </Link>
  );
};
