import React from 'react';
import { Link } from 'react-router-dom';
import { SUPPORT_CONFIG, getWhatsAppUrl } from '../config/supportConfig.js';

export const FloatingWhatsApp: React.FC = () => {
  const hasWhatsApp = Boolean(SUPPORT_CONFIG.whatsappNumber);
  const targetUrl = getWhatsAppUrl();

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

  if (hasWhatsApp) {
    return (
      <a
        href={targetUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat with MarkDriller on WhatsApp"
        style={commonStyles}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <span style={{ fontSize: '18px' }}>💬</span>
        <span>WhatsApp Support</span>
      </a>
    );
  }

  return (
    <Link
      to="/contact"
      aria-label="Contact MarkDriller 24/7 Support Desk"
      style={commonStyles}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <span style={{ fontSize: '18px' }}>💬</span>
      <span>24/7 Support Desk</span>
    </Link>
  );
};

