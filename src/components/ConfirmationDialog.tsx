import React, { useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import { useNotificationStore } from '../store/useNotificationStore.js';

export const ConfirmationDialog: React.FC = () => {
  const { confirmDialogOpen, confirmDialogOptions, closeConfirmDialog } = useNotificationStore();
  const [isProcessing, setIsProcessing] = useState(false);

  if (!confirmDialogOptions) {
    return null;
  }

  const {
    title,
    message,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    isDestructive = false,
    onConfirm,
  } = confirmDialogOptions;

  const handleConfirm = async () => {
    try {
      setIsProcessing(true);
      await onConfirm();
      closeConfirmDialog();
    } catch (error) {
      console.error('Confirmation action error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancel = () => {
    if (isProcessing) return;
    closeConfirmDialog();
  };

  return (
    <Dialog
      open={confirmDialogOpen}
      onClose={handleCancel}
      maxWidth="xs"
      fullWidth
      aria-labelledby="confirmation-dialog-title"
      aria-describedby="confirmation-dialog-description"
      PaperProps={{
        style: {
          backgroundColor: 'var(--white)',
          color: 'var(--ink)',
          borderRadius: '6px',
          border: '1.5px solid var(--paper-line)',
          padding: '12px 16px',
          boxShadow: 'var(--card-shadow)',
          maxWidth: 'min(94vw, 420px)',
          margin: '12px auto',
        },
      }}
    >
      <DialogTitle
        id="confirmation-dialog-title"
        sx={{
          fontFamily: "var(--font-sans)",
          fontWeight: 700,
          fontSize: '18px',
          color: isDestructive ? 'var(--color-error)' : 'var(--ink)',
          p: '12px 0 8px',
        }}
      >
        {title}
      </DialogTitle>

      <DialogContent sx={{ p: '8px 0 16px' }}>
        <Typography
          id="confirmation-dialog-description"
          sx={{
            fontFamily: "var(--font-sans)",
            fontSize: '14.5px',
            color: 'var(--ink-soft)',
            lineHeight: 1.5,
          }}
        >
          {message}
        </Typography>

        {isDestructive && (
          <Typography
            sx={{
              mt: 1.5,
              fontSize: '12.5px',
              fontFamily: "var(--font-sans)",
              color: 'var(--color-error)',
              fontWeight: 600,
            }}
          >
            ⚠️ This action cannot be undone.
          </Typography>
        )}
      </DialogContent>

      <DialogActions sx={{ p: '12px 0 4px', gap: '8px', justifyContent: 'flex-end' }}>
        <Button
          onClick={handleCancel}
          disabled={isProcessing}
          sx={{
            fontFamily: "var(--font-sans)",
            fontWeight: 600,
            color: 'var(--ink-soft)',
            textTransform: 'none',
            fontSize: '13.5px',
            px: 2,
            '&:hover': {
              backgroundColor: 'var(--paper-line)',
            },
          }}
        >
          {cancelLabel}
        </Button>

        <Button
          onClick={handleConfirm}
          disabled={isProcessing}
          variant="contained"
          sx={{
            fontFamily: "var(--font-sans)",
            fontWeight: 700,
            textTransform: 'none',
            fontSize: '13.5px',
            px: 2.5,
            py: 0.8,
            backgroundColor: isDestructive ? 'var(--color-error)' : 'var(--rust)',
            color: 'var(--white)',
            boxShadow: 'none',
            '&:hover': {
              backgroundColor: isDestructive ? 'var(--color-error)' : 'var(--amber-deep)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            },
          }}
        >
          {isProcessing ? (
            <CircularProgress size={18} sx={{ color: 'var(--white)', mr: 1 }} />
          ) : null}
          {confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

