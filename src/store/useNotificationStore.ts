import { create } from 'zustand';

export type NotificationSeverity = 'success' | 'error' | 'warning' | 'info';

export interface NotificationItem {
  id: string;
  severity: NotificationSeverity;
  title?: string;
  message: string;
  duration?: number;
}

export interface ConfirmDialogOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
}

interface NotificationState {
  // Notification Queue / Current active toast
  currentNotification: NotificationItem | null;
  notify: (severity: NotificationSeverity, message: string, title?: string, duration?: number) => void;
  notifySuccess: (message: string, title?: string) => void;
  notifyError: (message: string, title?: string) => void;
  notifyWarning: (message: string, title?: string) => void;
  notifyInfo: (message: string, title?: string) => void;
  dismissNotification: () => void;

  // Centralized Confirmation Modal
  confirmDialogOpen: boolean;
  confirmDialogOptions: ConfirmDialogOptions | null;
  confirmAction: (options: ConfirmDialogOptions) => void;
  closeConfirmDialog: () => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  currentNotification: null,

  notify: (severity, message, title, duration = 5000) => {
    // Prevent duplicate consecutive toasts with identical text
    const current = get().currentNotification;
    if (current && current.message === message && current.severity === severity) {
      return;
    }

    const id = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    set({
      currentNotification: {
        id,
        severity,
        title,
        message,
        duration,
      },
    });
  },

  notifySuccess: (message, title) => get().notify('success', message, title, 4000),
  notifyError: (message, title) => get().notify('error', message, title, 6000),
  notifyWarning: (message, title) => get().notify('warning', message, title, 5000),
  notifyInfo: (message, title) => get().notify('info', message, title, 4500),

  dismissNotification: () => set({ currentNotification: null }),

  confirmDialogOpen: false,
  confirmDialogOptions: null,

  confirmAction: (options) => {
    set({
      confirmDialogOpen: true,
      confirmDialogOptions: options,
    });
  },

  closeConfirmDialog: () => {
    const opts = get().confirmDialogOptions;
    if (opts?.onCancel) {
      try {
        opts.onCancel();
      } catch (err) {
        console.error('Error in onCancel handler:', err);
      }
    }
    set({
      confirmDialogOpen: false,
      confirmDialogOptions: null,
    });
  },
}));
