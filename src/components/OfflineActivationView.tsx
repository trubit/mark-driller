import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore.js';
import { useAuthStore } from '../store/useAuthStore.js';
import { useNotificationStore } from '../store/useNotificationStore.js';
import { useRedeemPinMutation } from '../api/subscriptions.js';
import { SUPPORT_CONFIG, getWhatsAppUrl } from '../config/supportConfig.js';

export const OfflineActivationView: React.FC = () => {
  const { openAuthModal } = useAppStore();
  const { isAuthenticated } = useAuthStore();
  const { notifySuccess, notifyError } = useNotificationStore();
  const redeemPin = useRedeemPinMutation();

  const [pinCode, setPinCode] = useState('');
  const [hardwareId, setHardwareId] = useState('');
  const [validationResult, setValidationResult] = useState<{
    success: boolean;
    plan?: string;
    expiryDate?: string;
    message?: string;
  } | null>(null);

  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pinCode.trim()) {
      notifyError('Please enter a valid 16-digit scratch card or product key PIN.');
      return;
    }

    if (!isAuthenticated) {
      openAuthModal('login');
      return;
    }

    try {
      const res = await redeemPin.mutateAsync(pinCode.trim());
      setValidationResult({
        success: true,
        plan: res.plan,
        expiryDate: res.expiryDate,
        message: 'Product key successfully activated!',
      });
      notifySuccess('Product key activated successfully!');
    } catch (err: any) {
      notifyError(err.message || 'Invalid or redeemed activation key.');
    }
  };

  const handleGenerateOfflineToken = () => {
    if (!pinCode.trim()) {
      notifyError('Please enter your 16-digit PIN first.');
      return;
    }
    if (!hardwareId.trim()) {
      notifyError('Please enter the Product Key shown in your downloaded MarkDriller Windows or Android app.');
      return;
    }

    notifySuccess('Offline SMS format prepared! Send via SMS as instructed below.');
  };

  return (
    <div className="premium-portal-page premium-more-page" style={{ minHeight: '100vh', backgroundColor: 'var(--paper)', display: 'flex', flexDirection: 'column' }}>
      <main className="wrap" style={{ flex: 1, padding: '48px 24px', maxWidth: '960px', margin: '0 auto', width: '100%' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <span className="eyebrow" style={{ color: 'var(--rust)' }}>
            Software License &amp; Scratch Card Redemption
          </span>
          <h1 style={{ fontSize: 'clamp(28px, 4vw, 42px)', margin: '8px 0 12px 0' }}>
            Activate Product Key &amp; Offline Unlocking
          </h1>
          <p style={{ color: 'var(--ink-soft)', fontSize: '16px', maxWidth: '640px', margin: '0 auto', lineHeight: 1.6 }}>
            Validate your purchased MarkDriller scratch card PIN, link your device hardware ID, or generate instant offline SMS activation tokens.
          </p>
        </div>

        {/* Two-Column Activation Box */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '28px',
            marginBottom: '48px',
          }}
        >
          {/* Box 1: Online PIN Validation */}
          <div
            style={{
              backgroundColor: 'var(--white)',
              border: '1.5px solid var(--paper-line)',
              borderRadius: '8px',
              padding: '32px',
              boxShadow: 'var(--card-shadow)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <span style={{ fontSize: '20px' }}>⚡</span>
              <h3 style={{ fontSize: '19px', margin: 0, color: 'var(--ink)' }}>
                Instant Online PIN Activation
              </h3>
            </div>
            <p style={{ fontSize: '14px', color: 'var(--ink-soft)', lineHeight: 1.5, marginBottom: '20px' }}>
              Scratch the silver panel on your physical scratch card or locate the 16-digit PIN in your purchase confirmation email.
            </p>

            <form onSubmit={handleRedeem}>
              <div style={{ marginBottom: '18px' }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '11px',
                    fontFamily: "var(--font-sans)",
                    textTransform: 'uppercase',
                    color: 'var(--ink-soft)',
                    marginBottom: '8px',
                    fontWeight: 600,
                  }}
                >
                  16-Digit Product Activation PIN
                </label>
                <input
                  type="text"
                  placeholder="e.g. TD-9824-3841-5912"
                  value={pinCode}
                  onChange={(e) => setPinCode(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    fontSize: '15px',
                    fontFamily: "var(--font-sans)",
                    borderRadius: '4px',
                    border: '1.5px solid var(--paper-line)',
                    backgroundColor: 'var(--paper)',
                    color: 'var(--ink)',
                    outline: 'none',
                    letterSpacing: '1px',
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={redeemPin.isPending}
                className="btn-custom btn-custom-primary"
                style={{ width: '100%', justifyContent: 'center', padding: '12px' }}
              >
                {redeemPin.isPending ? 'Verifying PIN...' : 'Validate & Activate Account ➔'}
              </button>
            </form>

            {validationResult && (
              <div
                style={{
                  marginTop: '20px',
                  padding: '14px',
                  backgroundColor: 'rgba(34, 197, 94, 0.1)',
                  border: '1px solid rgba(34, 197, 94, 0.3)',
                  borderRadius: '6px',
                  fontSize: '13.5px',
                  color: 'var(--ink)',
                }}
              >
                <strong>✓ Status:</strong> {validationResult.message}
                {validationResult.plan && (
                  <div style={{ marginTop: '4px' }}>
                    Active Plan: <strong>{validationResult.plan}</strong>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Box 2: 100% Offline SMS / USSD Unlocking */}
          <div
            style={{
              backgroundColor: 'var(--white)',
              border: '1.5px solid var(--paper-line)',
              borderRadius: '8px',
              padding: '32px',
              boxShadow: 'var(--card-shadow)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <span style={{ fontSize: '20px' }}>📶</span>
              <h3 style={{ fontSize: '19px', margin: 0, color: 'var(--ink)' }}>
                100% Offline Device Unlocking
              </h3>
            </div>
            <p style={{ fontSize: '14px', color: 'var(--ink-soft)', lineHeight: 1.5, marginBottom: '20px' }}>
              No internet connection? No problem! Open the MarkDriller app on your computer or phone, copy the <strong>Product Key</strong> displayed on screen, and unlock via standard SMS.
            </p>

            <div style={{ marginBottom: '18px' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '11px',
                  fontFamily: "var(--font-sans)",
                  textTransform: 'uppercase',
                  color: 'var(--ink-soft)',
                  marginBottom: '8px',
                  fontWeight: 600,
                }}
              >
                App Hardware Product Key
              </label>
              <input
                type="text"
                placeholder="e.g. MD-PC-8910-AA42"
                value={hardwareId}
                onChange={(e) => setHardwareId(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  fontSize: '15px',
                  fontFamily: "var(--font-sans)",
                  borderRadius: '4px',
                  border: '1.5px solid var(--paper-line)',
                  backgroundColor: 'var(--paper)',
                  color: 'var(--ink)',
                  outline: 'none',
                }}
              />
            </div>

            <button
              type="button"
              onClick={handleGenerateOfflineToken}
              className="btn-custom btn-custom-ghost"
              style={{ width: '100%', justifyContent: 'center', padding: '12px', marginBottom: '16px' }}
            >
              Generate SMS Unlocking Command 📱
            </button>

            <div
              style={{
                backgroundColor: 'var(--paper)',
                border: '1px solid var(--paper-line)',
                borderRadius: '4px',
                padding: '12px 14px',
                fontSize: '12.5px',
                fontFamily: "var(--font-sans)",
                color: 'var(--ink-soft)',
                lineHeight: 1.6,
              }}
            >
              <div style={{ color: 'var(--rust)', fontWeight: 700, marginBottom: '4px' }}>
                SMS Activation Format:
              </div>
              Send: <strong>MD {pinCode || 'PIN'} {hardwareId || 'PRODUCT_KEY'}</strong><br />
              {SUPPORT_CONFIG.phoneDisplay ? (
                <>To Support Hotline: <strong>{SUPPORT_CONFIG.phoneDisplay}</strong></>
              ) : (
                <>Send via WhatsApp or Support Portal for instant key verification</>
              )}
            </div>
          </div>
        </div>

        {/* Official Nigerian Helpline & Reseller Locator */}
        <div
          style={{
            backgroundColor: 'var(--dark-panel, #0b1120)',
            color: '#ffffff',
            borderRadius: '8px',
            padding: '28px 32px',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '20px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <div>
            <h4 style={{ fontSize: '17px', color: '#ffffff', margin: '0 0 6px 0' }}>
              Need Help with Activation or Scratch Cards?
            </h4>
            <p style={{ fontSize: '13.5px', color: 'rgba(255, 255, 255, 0.75)', margin: 0 }}>
              Official Support Desk: <strong>{SUPPORT_CONFIG.email}</strong> · Available 24/7 for candidate assistance.
            </p>
          </div>

          {SUPPORT_CONFIG.whatsappNumber ? (
            <a
              href={getWhatsAppUrl('Hello MarkDriller Support, I need assistance with my CBT activation PIN')}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-custom btn-custom-primary"
              style={{ backgroundColor: '#22c55e', color: '#ffffff', border: 'none', padding: '10px 18px' }}
            >
              Chat with WhatsApp Support 💬
            </a>
          ) : (
            <Link
              to="/contact"
              className="btn-custom btn-custom-primary"
              style={{ backgroundColor: '#22c55e', color: '#ffffff', border: 'none', padding: '10px 18px' }}
            >
              Open Support Ticket 💬
            </Link>
          )}
        </div>
      </main>
    </div>
  );
};

