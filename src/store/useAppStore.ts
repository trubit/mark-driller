import { create } from 'zustand';

interface AppState {
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  selectedExamBoard: string;
  setSelectedExamBoard: (board: string) => void;
  authModalOpen: boolean;
  authModalMode: 'login' | 'signup';
  openAuthModal: (mode?: 'login' | 'signup') => void;
  closeAuthModal: () => void;

  // Email Verification Modal
  emailVerificationModalOpen: boolean;
  emailToVerify: string;
  openEmailVerificationModal: (email: string) => void;
  closeEmailVerificationModal: () => void;

  // Forgot Password Modal
  forgotPasswordModalOpen: boolean;
  openForgotPasswordModal: (initialEmail?: string) => void;
  closeForgotPasswordModal: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  mobileMenuOpen: false,
  setMobileMenuOpen: (open) => set({ mobileMenuOpen: open }),
  selectedExamBoard: 'WAEC',
  setSelectedExamBoard: (board) => set({ selectedExamBoard: board }),
  authModalOpen: false,
  authModalMode: 'signup',
  openAuthModal: (mode = 'signup') => set({ authModalOpen: true, authModalMode: mode }),
  closeAuthModal: () => set({ authModalOpen: false }),

  emailVerificationModalOpen: false,
  emailToVerify: '',
  openEmailVerificationModal: (email: string) =>
    set({ emailVerificationModalOpen: true, emailToVerify: email, authModalOpen: false }),
  closeEmailVerificationModal: () => set({ emailVerificationModalOpen: false }),

  forgotPasswordModalOpen: false,
  openForgotPasswordModal: (initialEmail = '') =>
    set({ forgotPasswordModalOpen: true, emailToVerify: initialEmail, authModalOpen: false }),
  closeForgotPasswordModal: () => set({ forgotPasswordModalOpen: false }),
}));
