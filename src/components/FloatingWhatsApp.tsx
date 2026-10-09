import React, { useState, useEffect } from 'react';
import { useSupportContactQuery, buildWhatsAppWebLink, buildWhatsAppLink, buildMailtoLink, isWhatsAppNumberValid } from '../api/supportContact.js';
import { useNotificationStore } from '../store/useNotificationStore.js';

export const FloatingWhatsApp: React.FC = () => {
  const { data: support } = useSupportContactQuery();
  const [isOpen, setIsOpen] = useState(false);
  const notifySuccess = useNotificationStore((state) => state.notifySuccess);
  const notifyInfo = useNotificationStore((state) => state.notifyInfo);

  const isEnabled = support ? support.whatsappEnabled !== false : true;
  const whatsappNumber = support?.whatsappNumber || '';
  const displayPhone = support?.whatsappDisplay || support?.phoneDisplay || '+234 (0) 800 MARK DRILLER';
  const hasWhatsApp = isEnabled && isWhatsAppNumberValid(whatsappNumber);
  const email = support?.email || 'support@markdriller.com';
  const emailDisplay = support?.emailDisplay || email;
  const isEmailEnabled = support ? support.emailEnabled !== false : true;
  const workingHours = support?.workingHours || 'Mon – Sat: 8:00 AM – 9:00 PM (WAT)';

  const whatsappWebUrl = buildWhatsAppWebLink(whatsappNumber, 'Hello MarkDriller Support Desk, I need assistance with CBT practice / activation.');
  const whatsappAppUrl = buildWhatsAppLink(whatsappNumber, 'Hello MarkDriller Support Desk, I need assistance with CBT practice / activation.');

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  if (!isEnabled) {
    return null;
  }

  const handleCopyNumber = async () => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(displayPhone);
        notifySuccess(`${displayPhone} copied to clipboard! You can message us on WhatsApp.`, 'Number Copied');
      } else {
        notifyInfo(`Official Support Number: ${displayPhone}`, 'Official Support Number');
      }
    } catch {
      notifyInfo(`Official Support Number: ${displayPhone}`, 'Official Support Number');
    }
  };

  return (
    <>
      {/* Floating Interactive Trigger Button */}
      <button
        type="button"
        id="floating-support-btn"
        aria-label="Toggle MarkDriller Live Customer Support Desk"
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        onClick={() => setIsOpen((prev) => !prev)}
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 9990,
          backgroundColor: '#22c55e',
          color: '#ffffff',
          borderRadius: '50px',
          padding: '12px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: '9px',
          boxShadow: '0 6px 24px rgba(34, 197, 94, 0.45)',
          border: 'none',
          cursor: 'pointer',
          fontFamily: "var(--font-sans)",
          fontWeight: 700,
          fontSize: '13.5px',
          letterSpacing: '0.02em',
          transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px) scale(1.03)';
          e.currentTarget.style.boxShadow = '0 8px 28px rgba(34, 197, 94, 0.6)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0) scale(1)';
          e.currentTarget.style.boxShadow = '0 6px 24px rgba(34, 197, 94, 0.45)';
        }}
      >
        <span style={{ fontSize: '18px', lineHeight: 1 }} aria-hidden="true">
          {isOpen ? '✕' : '💬'}
        </span>
        <span>{isOpen ? 'Close Support' : 'Need Help? Chat with Us'}</span>
      </button>

      {/* Real In-App Support Desk Modal / Card */}
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="support-card-title"
          style={{
            position: 'fixed',
            bottom: '84px',
            right: '24px',
            zIndex: 9991,
            width: 'min(92vw, 360px)',
            background: 'var(--paper, #ffffff)',
            color: 'var(--ink, #14181c)',
            border: '2px solid var(--ink, #14181c)',
            boxShadow: '6px 6px 0 var(--ink, #14181c)',
            borderRadius: '6px',
            overflow: 'hidden',
            fontFamily: "var(--font-sans)",
            animation: 'fadeInUp 0.22s ease-out',
          }}
        >
          {/* Card Header */}
          <div
            style={{
              background: '#090d16',
              color: '#ffffff',
              padding: '16px 18px',
              borderBottom: '2px solid var(--ink, #14181c)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '12px', color: '#22c55e' }} aria-hidden="true">●</span>
                <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#94a3b8' }}>
                  Live Help Desk
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Close support dialog"
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#ffffff',
                  fontSize: '16px',
                  cursor: 'pointer',
                  padding: '2px 6px',
                  lineHeight: 1,
                }}
              >
                ✕
              </button>
            </div>
            <h3 id="support-card-title" style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: '#ffffff' }}>
              MarkDriller Support Desk
            </h3>
            <p style={{ fontSize: '12.5px', color: '#cbd5e1', margin: '4px 0 0 0', lineHeight: 1.4 }}>
              Direct curriculum, activation &amp; student onboarding assistance.
            </p>
          </div>

          {/* Card Body */}
          <div style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Number Display Box */}
            <div
              style={{
                background: 'rgba(34, 197, 94, 0.08)',
                border: '1px solid rgba(34, 197, 94, 0.25)',
                padding: '12px',
                borderRadius: '4px',
              }}
            >
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#15803d', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Verified Official WhatsApp Desk
              </div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--ink, #14181c)', marginTop: '4px' }}>
                {displayPhone}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--slate, #64748b)', marginTop: '2px' }}>
                {workingHours}
              </div>
            </div>

            {/* Action Buttons */}
            {hasWhatsApp ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {/* 1. Open WhatsApp Web (Guaranteed zero protocol alert on desktop) */}
                <a
                  href={whatsappWebUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-custom"
                  style={{
                    backgroundColor: '#22c55e',
                    color: '#ffffff',
                    width: '100%',
                    justifyContent: 'center',
                    padding: '10px 14px',
                    fontSize: '13px',
                    fontWeight: 700,
                    textDecoration: 'none',
                    borderRadius: '4px',
                  }}
                  onClick={() => setIsOpen(false)}
                >
                  💬 Chat on WhatsApp Web
                </a>

                {/* 2. Universal / Mobile App Direct Link */}
                <a
                  href={whatsappAppUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-custom"
                  style={{
                    backgroundColor: 'transparent',
                    color: 'var(--ink, #14181c)',
                    border: '1.5px solid var(--ink, #14181c)',
                    width: '100%',
                    justifyContent: 'center',
                    padding: '9px 14px',
                    fontSize: '12.5px',
                    fontWeight: 600,
                    textDecoration: 'none',
                    borderRadius: '4px',
                  }}
                  onClick={() => setIsOpen(false)}
                >
                  📱 Open in WhatsApp App
                </a>

                {/* 3. Copy Phone Number with in-app NotificationCenter toast */}
                <button
                  type="button"
                  onClick={handleCopyNumber}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--slate, #475569)',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    padding: '4px 0',
                    textDecoration: 'underline',
                    textAlign: 'center',
                  }}
                >
                  📋 Copy Support Number
                </button>
              </div>
            ) : null}

            {/* Email Alternative (Dynamic from Admin Settings) */}
            {isEmailEnabled && email ? (
              <div style={{ borderTop: '1px solid rgba(20, 24, 28, 0.1)', paddingTop: '12px' }}>
                <a
                  href={buildMailtoLink(email, 'MarkDriller Support Inquiry')}
                  style={{
                    fontSize: '12px',
                    color: 'var(--ink, #14181c)',
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontWeight: 600,
                  }}
                >
                  <span aria-hidden="true">✉️</span>
                  <span>Email Support: <strong>{emailDisplay}</strong></span>
                </a>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </>
  );
};
