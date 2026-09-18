import React, { useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Alert from '@mui/material/Alert';
import { useAppStore } from '../store/useAppStore.js';
import { useRegisterMutation, useLoginMutation } from '../api/auth.js';

const EXAM_OPTIONS = [
  'JAMB / UTME',
  'WAEC',
  'NECO',
  'GCE',
  'POST-UTME',
  'NB_828284',
];

export const AuthModal: React.FC = () => {
  const {
    authModalOpen,
    authModalMode,
    closeAuthModal,
    openAuthModal,
    selectedExamBoard,
    openEmailVerificationModal,
    openForgotPasswordModal,
  } = useAppStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [targetExam, setTargetExam] = useState(selectedExamBoard || 'WAEC');
  const [successData, setSuccessData] = useState<{ name: string; email: string } | null>(null);

  const registerMutation = useRegisterMutation();
  const loginMutation = useLoginMutation();

  React.useEffect(() => {
    if (selectedExamBoard && EXAM_OPTIONS.includes(selectedExamBoard)) {
      setTargetExam(selectedExamBoard);
    }
  }, [selectedExamBoard]);

  const isSignUp = authModalMode === 'signup';
  const currentMutation = isSignUp ? registerMutation : loginMutation;

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setSuccessData(null);
    registerMutation.reset();
    loginMutation.reset();
    openAuthModal(newValue === 0 ? 'signup' : 'login');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (isSignUp) {
      registerMutation.mutate(
        {
          fullName,
          email,
          password,
          targetExamCode: targetExam,
        },
        {
          onSuccess: (res) => {
            closeAuthModal();
            if (res.needsVerification) {
              openEmailVerificationModal(res.user.email);
            }
          },
        }
      );
    } else {
      loginMutation.mutate(
        {
          email,
          password,
        },
        {
          onSuccess: (res) => {
            setSuccessData({ name: res.user.fullName, email: res.user.email });
            setTimeout(() => {
              setSuccessData(null);
              closeAuthModal();
              if (res.needsVerification) {
                openEmailVerificationModal(res.user.email);
              }
            }, 1200);
          },
        }
      );
    }
  };

  return (
    <Dialog
      open={authModalOpen}
      onClose={closeAuthModal}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        style: {
          backgroundColor: '#eceee6', // --paper
          color: '#14181c', // --ink
          borderRadius: '4px',
          border: '1.5px solid #14181c',
          padding: '8px',
        },
      }}
    >
      <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="logo" style={{ fontSize: '18px' }}>
          Mark<span className="drill-suffix">Driller</span>
        </div>
        <IconButton
          aria-label="close"
          onClick={closeAuthModal}
          sx={{ color: '#14181c' }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 3, pt: 1 }}>
        <Tabs
          value={isSignUp ? 0 : 1}
          onChange={handleTabChange}
          sx={{
            mb: 3,
            borderBottom: '1px solid rgba(20,24,28,0.14)',
            '& .MuiTabs-indicator': { backgroundColor: '#a8562f' }, // --rust
            '& .MuiTab-root': {
              fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 600,
              fontSize: '14.5px',
              color: '#3a4048',
              '&.Mui-selected': { color: '#14181c' },
            },
          }}
        >
          <Tab label="Create account" />
          <Tab label="Log in" />
        </Tabs>

        {successData ? (
          <div style={{ textAlign: 'center', padding: '30px 10px' }}>
            <span className="eyebrow" style={{ display: 'block', marginBottom: '8px' }}>Authenticated</span>
            <h3 style={{ fontSize: '20px', marginBottom: '10px' }}>
              Welcome, {successData.name}!
            </h3>
            <p style={{ color: '#3a4048', fontSize: '14.5px', marginBottom: '12px' }}>
              {isSignUp ? 'Your account has been created.' : 'You have logged in successfully.'} Loading session...
            </p>
            <div
              style={{
                display: 'inline-block',
                background: '#e0e3d9',
                padding: '6px 14px',
                borderRadius: '3px',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '12.5px',
                color: '#14181c',
                border: '1px solid rgba(20,24,28,0.14)',
              }}
            >
              ✓ Verified Session
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {currentMutation.isError && (
              <Alert severity="error" sx={{ fontSize: '13px', py: 0.5 }}>
                {currentMutation.error?.message || 'Authentication failed. Please check your credentials.'}
              </Alert>
            )}

            {isSignUp && (
              <TextField
                label="Full name"
                required
                fullWidth
                size="small"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                InputLabelProps={{ style: { fontFamily: "'JetBrains Mono', monospace", fontSize: '13px' } }}
                InputProps={{ style: { backgroundColor: '#f8f7f2', borderRadius: '3px' } }}
              />
            )}

            <TextField
              label="Email address"
              type="email"
              required
              fullWidth
              size="small"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              InputLabelProps={{ style: { fontFamily: "'JetBrains Mono', monospace", fontSize: '13px' } }}
              InputProps={{ style: { backgroundColor: '#f8f7f2', borderRadius: '3px' } }}
            />

            <TextField
              label="Password"
              type="password"
              required
              fullWidth
              size="small"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              InputLabelProps={{ style: { fontFamily: "'JetBrains Mono', monospace", fontSize: '13px' } }}
              InputProps={{ style: { backgroundColor: '#f8f7f2', borderRadius: '3px' } }}
            />

            {!isSignUp && (
              <div style={{ textAlign: 'right', marginTop: '-4px' }}>
                <button
                  type="button"
                  onClick={() => openForgotPasswordModal(email)}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    fontSize: '11px',
                    fontFamily: "'JetBrains Mono', monospace",
                    color: 'var(--rust)',
                    cursor: 'pointer',
                  }}
                >
                  Forgot your password?
                </button>
              </div>
            )}

            {isSignUp && (
              <TextField
                select
                label="Target exam"
                fullWidth
                size="small"
                value={targetExam}
                onChange={(e) => setTargetExam(e.target.value)}
                InputLabelProps={{ style: { fontFamily: "'JetBrains Mono', monospace", fontSize: '13px' } }}
                InputProps={{ style: { backgroundColor: '#f8f7f2', borderRadius: '3px' } }}
              >
                {EXAM_OPTIONS.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </TextField>
            )}

            <button
              type="submit"
              disabled={currentMutation.isPending}
              className="btn-custom btn-custom-primary"
              style={{
                width: '100%',
                justifyContent: 'center',
                marginTop: '10px',
                padding: '12px',
                opacity: currentMutation.isPending ? 0.7 : 1,
              }}
            >
              {currentMutation.isPending
                ? 'Authenticating...'
                : isSignUp
                ? 'Start practising free'
                : 'Sign in to Mark Driller'}
            </button>

            <p style={{
              fontSize: '12px',
              textAlign: 'center',
              color: '#6b7280',
              fontFamily: "'JetBrains Mono', monospace",
              marginTop: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}>
              {isSignUp ? (
                'NO CREDIT CARD REQUIRED · INSTANT ACCESS'
              ) : (
                <>
                  <LockOutlinedIcon style={{ fontSize: '14px', color: '#16a34a' }} />
                  <span>SECURE & ENCRYPTED SIGN-IN</span>
                </>
              )}
            </p>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};
