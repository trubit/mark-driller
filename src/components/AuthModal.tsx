import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { BrandLogo } from './BrandLogo.js';

const EXAM_OPTIONS = [
  'JAMB / UTME',
  'WAEC',
  'NECO',
  'GCE',
  'POST-UTME',
  'NABTEB',
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
  const navigate = useNavigate();

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
            setSuccessData({ name: res.user.fullName, email: res.user.email });
            setTimeout(() => {
              setSuccessData(null);
              closeAuthModal();
              openEmailVerificationModal(res.user.email);
            }, 1200);
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
              } else if (res.user.role === 'ADMIN') {
                navigate('/admin');
              } else {
                navigate('/dashboard');
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
          backgroundColor: 'var(--paper)',
          color: 'var(--ink)',
          borderRadius: '6px',
          border: '1.5px solid var(--paper-line)',
          padding: '8px',
          boxShadow: 'var(--card-shadow)',
          maxWidth: 'min(94vw, 420px)',
          margin: '12px auto',
        },
      }}
    >
      <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <BrandLogo size="sm" />
        <IconButton
          aria-label="close"
          onClick={closeAuthModal}
          sx={{ color: 'var(--ink)' }}
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
            borderBottom: '1px solid var(--paper-line)',
            '& .MuiTabs-indicator': { backgroundColor: 'var(--rust)' },
            '& .MuiTab-root': {
              fontFamily: "var(--font-sans)",
              fontWeight: 600,
              fontSize: '14.5px',
              color: 'var(--ink-soft)',
              '&.Mui-selected': { color: 'var(--ink)' },
            },
          }}
        >
          <Tab label="Create account" />
          <Tab label="Log in" />
        </Tabs>

        {successData ? (
          <div style={{ textAlign: 'center', padding: '30px 10px' }}>
            <span className="eyebrow" style={{ display: 'block', marginBottom: '8px' }}>Authenticated</span>
            <h3 style={{ fontSize: '20px', marginBottom: '10px', color: 'var(--ink)' }}>
              Welcome, {successData.name}!
            </h3>
            <p style={{ color: 'var(--ink-soft)', fontSize: '14.5px', marginBottom: '12px' }}>
              {isSignUp ? 'Your account has been created.' : 'You have logged in successfully.'} Loading session...
            </p>
            <div
              style={{
                display: 'inline-block',
                background: 'var(--paper-dim)',
                padding: '6px 14px',
                borderRadius: '4px',
                fontFamily: "var(--font-sans)",
                fontSize: '12.5px',
                color: 'var(--ink)',
                border: '1px solid var(--paper-line)',
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
                InputLabelProps={{ style: { fontFamily: "var(--font-sans)", fontSize: '13px', color: 'var(--ink-soft)' } }}
                InputProps={{ style: { backgroundColor: 'var(--white)', color: 'var(--ink)', borderRadius: '4px' } }}
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
              InputLabelProps={{ style: { fontFamily: "var(--font-sans)", fontSize: '13px', color: 'var(--ink-soft)' } }}
              InputProps={{ style: { backgroundColor: 'var(--white)', color: 'var(--ink)', borderRadius: '4px' } }}
            />

            <TextField
              label="Password"
              type="password"
              required
              fullWidth
              size="small"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              InputLabelProps={{ style: { fontFamily: "var(--font-sans)", fontSize: '13px', color: 'var(--ink-soft)' } }}
              InputProps={{ style: { backgroundColor: 'var(--white)', color: 'var(--ink)', borderRadius: '4px' } }}
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
                    fontFamily: "var(--font-sans)",
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
                InputLabelProps={{ style: { fontFamily: "var(--font-sans)", fontSize: '13px', color: 'var(--ink-soft)' } }}
                InputProps={{ style: { backgroundColor: 'var(--white)', color: 'var(--ink)', borderRadius: '4px' } }}
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
              color: 'var(--ink-soft)',
              fontFamily: "var(--font-sans)",
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
                  <LockOutlinedIcon style={{ fontSize: '14px', color: 'var(--forest)' }} />
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

