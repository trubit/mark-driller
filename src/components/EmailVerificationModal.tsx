import React, { useState, useEffect } from 'react';
import Modal from 'react-bootstrap/Modal';
import { useAppStore } from '../store/useAppStore.js';
import { useVerifyEmailMutation, useResendVerificationMutation } from '../api/auth.js';

export const EmailVerificationModal: React.FC = () => {
  const { emailVerificationModalOpen, closeEmailVerificationModal, emailToVerify } = useAppStore();
  const [otp, setOtp] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const verifyMutation = useVerifyEmailMutation();
  const resendMutation = useResendVerificationMutation();

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (cooldown > 0) {
      timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (otp.trim().length !== 6) {
      setErrorMsg('Please enter the complete 6-digit passcode.');
      return;
    }

    try {
      await verifyMutation.mutateAsync({
        email: emailToVerify,
        otp: otp.trim(),
      });
      setSuccessMsg('Email successfully verified! Your account is now active.');
      setTimeout(() => {
        closeEmailVerificationModal();
      }, 2000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Verification failed. Please try again.');
    }
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      await resendMutation.mutateAsync({ email: emailToVerify });
      setSuccessMsg('A new 6-digit passcode has been dispatched to your email.');
      setCooldown(60);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to resend verification code.');
    }
  };

  return (
    <Modal
      show={emailVerificationModalOpen}
      onHide={closeEmailVerificationModal}
      centered
      backdrop="static"
      contentClassName="auth-modal-content"
    >
      <div style={{ background: 'var(--white)', border: '1.5px solid var(--paper-line)', borderRadius: '6px', padding: '32px', boxShadow: 'var(--card-shadow)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
          <div>
            <div style={{ fontFamily: "var(--font-sans)", fontSize: '11px', color: 'var(--rust)', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Identity Verification
            </div>
            <h3 style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: '24px', margin: '4px 0 0', color: 'var(--ink)' }}>
              Confirm Your Email
            </h3>
          </div>
          <button
            onClick={closeEmailVerificationModal}
            style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: 'var(--ink)' }}
          >
            ✕
          </button>
        </div>

        <p style={{ fontSize: '14px', color: 'var(--ink-soft)', lineHeight: 1.5, margin: '0 0 16px' }}>
          We sent a 6-digit security code to <strong style={{ color: 'var(--ink)' }}>{emailToVerify}</strong>. Enter it below to unlock all examination drills and mock rooms.
        </p>

        <div style={{ fontSize: '12px', color: 'var(--ink)', background: 'rgba(226, 154, 60, 0.12)', padding: '10px 14px', borderLeft: '3px solid var(--amber)', borderRadius: '4px', marginBottom: '20px', lineHeight: 1.5 }}>
          💡 <strong>Tip:</strong> If you don't see the email in your primary inbox, please check your <strong>Spam / Junk</strong> folder or <strong>Promotions</strong> tab.
        </div>

        {errorMsg && (
          <div style={{ padding: '10px 14px', background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '4px', color: '#ef4444', fontSize: '13px', marginBottom: '16px' }}>
            ⚠ {errorMsg}
          </div>
        )}

        {successMsg && (
          <div style={{ padding: '10px 14px', background: 'rgba(34, 197, 94, 0.12)', border: '1px solid rgba(34, 197, 94, 0.3)', borderRadius: '4px', color: '#22c55e', fontSize: '13px', marginBottom: '16px' }}>
            ✓ {successMsg}
          </div>
        )}

        <form onSubmit={handleVerify}>
          <div style={{ marginBottom: '20px' }}>
            <label
              htmlFor="otpInput"
              style={{ display: 'block', fontSize: '11px', fontFamily: "var(--font-sans)", textTransform: 'uppercase', color: 'var(--slate)', marginBottom: '8px' }}
            >
              6-Digit One-Time Passcode (OTP)
            </label>
            <input
              id="otpInput"
              type="text"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              placeholder="123456"
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '24px',
                fontFamily: "var(--font-sans)",
                fontWeight: 700,
                textAlign: 'center',
                letterSpacing: '8px',
                border: '1.5px solid var(--ink)',
                background: '#faf9f6',
              }}
              autoFocus
            />
          </div>

          <button
            type="submit"
            disabled={verifyMutation.isPending || otp.length !== 6}
            style={{
              width: '100%',
              padding: '12px',
              background: 'var(--ink)',
              color: 'var(--white)',
              border: 'none',
              fontFamily: "var(--font-sans)",
              fontSize: '13px',
              fontWeight: 700,
              cursor: verifyMutation.isPending || otp.length !== 6 ? 'not-allowed' : 'pointer',
              marginBottom: '16px',
            }}
          >
            {verifyMutation.isPending ? 'Validating Security Code...' : 'Activate Account →'}
          </button>
        </form>

        <div style={{ textAlign: 'center', borderTop: '1px solid var(--cream-deep)', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '12px', color: 'var(--slate)' }}>
            Didn't receive the email?
          </span>
          <button
            type="button"
            onClick={handleResend}
            disabled={cooldown > 0 || resendMutation.isPending}
            style={{
              background: 'none',
              border: 'none',
              color: cooldown > 0 ? 'var(--slate)' : 'var(--rust)',
              fontSize: '12px',
              fontFamily: "var(--font-sans)",
              fontWeight: 600,
              cursor: cooldown > 0 ? 'default' : 'pointer',
            }}
          >
            {cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend Code'}
          </button>
        </div>
      </div>
    </Modal>
  );
};

