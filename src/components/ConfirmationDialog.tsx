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
          backgroundColor: '#ffffff',
          borderRadius: '4px',
          border: '1.5px solid #14181c',
          padding: '12px 16px',
          boxShadow: '0 12px 36px rgba(20, 24, 28, 0.25)',
        },
      }}
    >
      <DialogTitle
        id="confirmation-dialog-title"
        sx={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontWeight: 700,
          fontSize: '18px',
          color: isDestructive ? '#b91c1c' : '#14181c',
          p: '12px 0 8px',
        }}
      >
        {title}
      </DialogTitle>

      <DialogContent sx={{ p: '8px 0 16px' }}>
        <Typography
          id="confirmation-dialog-description"
          sx={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: '14.5px',
            color: '#374151',
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
              fontFamily: "'JetBrains Mono', monospace",
              color: '#b91c1c',
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
            fontFamily: "'Space Grotesk', sans-serif",
            fontWeight: 600,
            color: '#4b5563',
            textTransform: 'none',
            fontSize: '13.5px',
            px: 2,
            '&:hover': {
              backgroundColor: 'rgba(20, 24, 28, 0.05)',
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
            fontFamily: "'Space Grotesk', sans-serif",
            fontWeight: 700,
            textTransform: 'none',
            fontSize: '13.5px',
            px: 2.5,
            py: 0.8,
            backgroundColor: isDestructive ? '#b91c1c' : '#14181c',
            color: '#ffffff',
            boxShadow: 'none',
            '&:hover': {
              backgroundColor: isDestructive ? '#991b1b' : '#000000',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            },
          }}
        >
          {isProcessing ? (
            <CircularProgress size={18} sx={{ color: '#ffffff', mr: 1 }} />
          ) : null}
          {confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
