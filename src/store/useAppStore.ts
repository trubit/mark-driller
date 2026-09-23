import { create } from 'zustand';

interface AppState {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  setTheme: (theme: 'light' | 'dark') => void;

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

const getInitialTheme = (): 'light' | 'dark' => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('markdriller_theme');
    if (saved === 'dark' || saved === 'light') {
      document.documentElement.setAttribute('data-theme', saved);
      return saved;
    }
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      document.documentElement.setAttribute('data-theme', 'dark');
      return 'dark';
    }
  }
  return 'light';
};

export const useAppStore = create<AppState>((set, get) => ({
  theme: getInitialTheme(),
  toggleTheme: () => {
    const next = get().theme === 'light' ? 'dark' : 'light';
    if (typeof window !== 'undefined') {
      localStorage.setItem('markdriller_theme', next);
      document.documentElement.setAttribute('data-theme', next);
    }
    set({ theme: next });
  },
  setTheme: (theme) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('markdriller_theme', theme);
      document.documentElement.setAttribute('data-theme', theme);
    }
    set({ theme });
  },

  mobileMenuOpen: false,
  setMobileMenuOpen: (open) => set({ mobileMenuOpen: open }),
  selectedExamBoard: 'JAMB / UTME',
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

