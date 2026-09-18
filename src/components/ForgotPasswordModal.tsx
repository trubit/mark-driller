import React, { useState } from 'react';
import Modal from 'react-bootstrap/Modal';
import { useAppStore } from '../store/useAppStore.js';
import { useForgotPasswordMutation, useResetPasswordMutation } from '../api/auth.js';

export const ForgotPasswordModal: React.FC = () => {
  const { forgotPasswordModalOpen, closeForgotPasswordModal, openAuthModal, emailToVerify } = useAppStore();

  const [step, setStep] = useState<'REQUEST' | 'RESET' | 'DONE'>('REQUEST');
  const [email, setEmail] = useState(emailToVerify || '');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const forgotMutation = useForgotPasswordMutation();
  const resetMutation = useResetPasswordMutation();

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!email || !email.includes('@')) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    try {
      await forgotMutation.mutateAsync({ email: email.trim() });
      setSuccessMsg('A 6-digit recovery code has been dispatched to your email.');
      setStep('RESET');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to request password reset code.');
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (otp.trim().length !== 6) {
      setErrorMsg('Please enter the complete 6-digit recovery code.');
      return;
    }

    if (newPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    try {
      await resetMutation.mutateAsync({
        email: email.trim(),
        otp: otp.trim(),
        newPassword,
      });
      setStep('DONE');
      setTimeout(() => {
        closeForgotPasswordModal();
        openAuthModal('login');
      }, 3000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Password reset failed. Please check your recovery code.');
    }
  };

  return (
    <Modal
      show={forgotPasswordModalOpen}
      onHide={closeForgotPasswordModal}
      centered
      contentClassName="auth-modal-content"
    >
      <div style={{ background: 'var(--white)', border: '2px solid var(--ink)', padding: '32px', boxShadow: '5px 5px 0 var(--ink)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
          <div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', color: 'var(--rust)', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Account Recovery
            </div>
            <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '24px', margin: '4px 0 0', color: 'var(--ink)' }}>
              {step === 'REQUEST' ? 'Reset Your Password' : step === 'RESET' ? 'Enter Recovery Code' : 'Password Reset!'}
            </h3>
          </div>
          <button
            onClick={closeForgotPasswordModal}
            style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: 'var(--ink)' }}
          >
            ✕
          </button>
        </div>

        {errorMsg && (
          <div style={{ padding: '10px 14px', background: '#fdf0ed', border: '1px solid var(--rust)', color: 'var(--rust)', fontSize: '13px', marginBottom: '16px' }}>
            ⚠ {errorMsg}
          </div>
        )}

        {successMsg && (
          <div style={{ padding: '10px 14px', background: '#eaf4ee', border: '1px solid var(--forest)', color: 'var(--forest)', fontSize: '13px', marginBottom: '16px' }}>
            ✓ {successMsg}
          </div>
        )}

        {step === 'REQUEST' && (
          <form onSubmit={handleRequestOtp}>
            <p style={{ fontSize: '14px', color: 'var(--slate)', margin: '0 0 20px', lineHeight: 1.5 }}>
              Enter the email address associated with your MarkDriller account. We'll send you a 6-digit recovery code.
            </p>
            <div style={{ marginBottom: '20px' }}>
              <label
                htmlFor="resetEmailInput"
                style={{ display: 'block', fontSize: '11px', fontFamily: "'JetBrains Mono', monospace", textTransform: 'uppercase', color: 'var(--slate)', marginBottom: '8px' }}
              >
                Account Email Address
              </label>
              <input
                id="resetEmailInput"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  fontSize: '14px',
                  border: '1px solid var(--ink)',
                  background: 'var(--paper)',
                }}
                autoFocus
              />
            </div>
            <button
              type="submit"
              disabled={forgotMutation.isPending}
              style={{
                width: '100%',
                padding: '12px',
                background: 'var(--ink)',
                color: 'var(--white)',
                border: 'none',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '13px',
                fontWeight: 700,
                cursor: forgotMutation.isPending ? 'not-allowed' : 'pointer',
              }}
            >
              {forgotMutation.isPending ? 'Sending Recovery Code...' : 'Send Recovery Code →'}
            </button>
          </form>
        )}

        {step === 'RESET' && (
          <form onSubmit={handleResetPassword}>
            <p style={{ fontSize: '13px', color: 'var(--slate)', margin: '0 0 16px' }}>
              Enter the 6-digit recovery code sent to <strong>{email}</strong> and choose a new password.
            </p>
            <div style={{ marginBottom: '16px' }}>
              <label
                htmlFor="recoveryOtpInput"
                style={{ display: 'block', fontSize: '11px', fontFamily: "'JetBrains Mono', monospace", textTransform: 'uppercase', color: 'var(--slate)', marginBottom: '6px' }}
              >
                6-Digit Recovery Passcode
              </label>
              <input
                id="recoveryOtpInput"
                type="text"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="123456"
                style={{
                  width: '100%',
                  padding: '10px',
                  fontSize: '20px',
                  fontFamily: "'JetBrains Mono', monospace",
                  fontWeight: 700,
                  textAlign: 'center',
                  letterSpacing: '6px',
                  border: '1.5px solid var(--ink)',
                  background: '#faf9f6',
                }}
                autoFocus
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label
                htmlFor="newPasswordInput"
                style={{ display: 'block', fontSize: '11px', fontFamily: "'JetBrains Mono', monospace", textTransform: 'uppercase', color: 'var(--slate)', marginBottom: '6px' }}
              >
                New Password (min. 6 chars)
              </label>
              <input
                id="newPasswordInput"
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  fontSize: '14px',
                  border: '1px solid var(--ink)',
                }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label
                htmlFor="confirmPasswordInput"
                style={{ display: 'block', fontSize: '11px', fontFamily: "'JetBrains Mono', monospace", textTransform: 'uppercase', color: 'var(--slate)', marginBottom: '6px' }}
              >
                Confirm New Password
              </label>
              <input
                id="confirmPasswordInput"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  fontSize: '14px',
                  border: '1px solid var(--ink)',
                }}
              />
            </div>

            <button
              type="submit"
              disabled={resetMutation.isPending || otp.length !== 6}
              style={{
                width: '100%',
                padding: '12px',
                background: 'var(--rust)',
                color: 'var(--white)',
                border: 'none',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '13px',
                fontWeight: 700,
                cursor: resetMutation.isPending || otp.length !== 6 ? 'not-allowed' : 'pointer',
              }}
            >
              {resetMutation.isPending ? 'Updating Password...' : 'Save New Password & Log In →'}
            </button>
          </form>
        )}

        {step === 'DONE' && (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: '36px', marginBottom: '12px' }}>🎉</div>
            <h4 style={{ fontFamily: "'Playfair Display', serif", fontSize: '20px', color: 'var(--forest)', margin: '0 0 8px' }}>
              Password Reset Complete!
            </h4>
            <p style={{ fontSize: '14px', color: 'var(--slate)', margin: '0 0 16px' }}>
              Your credentials have been securely updated. Redirecting to login...
            </p>
          </div>
        )}

        <div style={{ marginTop: '20px', textAlign: 'center', borderTop: '1px solid var(--cream-deep)', paddingTop: '16px' }}>
          <button
            type="button"
            onClick={() => {
              closeForgotPasswordModal();
              openAuthModal('login');
            }}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--ink)',
              fontSize: '12px',
              fontFamily: "'JetBrains Mono', monospace",
              cursor: 'pointer',
            }}
          >
            ← Back to Login
          </button>
        </div>
      </div>
    </Modal>
  );
};
