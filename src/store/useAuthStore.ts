import { create } from 'zustand';

export interface UserSession {
  _id: string;
  fullName: string;
  email: string;
  role: 'STUDENT' | 'ADMIN';
  targetExam?: string;
  selectedSubjects?: string[];
  isVerified: boolean;
  createdAt: string;
}

interface AuthState {
  token: string | null;
  user: UserSession | null;
  isAuthenticated: boolean;
  isInitialized: boolean;
  setSession: (token: string, user: UserSession) => void;
  clearSession: () => void;
  updateUser: (updates: Partial<UserSession>) => void;
  rehydrate: () => void;
  checkAuth: () => Promise<boolean>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: typeof window !== 'undefined' ? localStorage.getItem('md_token') : null,
  user: typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('md_user') || 'null') : null,
  isAuthenticated: typeof window !== 'undefined' ? !!localStorage.getItem('md_token') : false,
  isInitialized: false,

  setSession: (token, user) => {
    localStorage.setItem('md_token', token);
    localStorage.setItem('md_user', JSON.stringify(user));
    set({ token, user, isAuthenticated: true, isInitialized: true });
  },

  updateUser: (updates) => {
    set((state) => {
      if (!state.user) return state;
      const updatedUser = { ...state.user, ...updates };
      localStorage.setItem('md_user', JSON.stringify(updatedUser));
      return { user: updatedUser };
    });
  },

  clearSession: () => {
    localStorage.removeItem('md_token');
    localStorage.removeItem('md_user');
    set({ token: null, user: null, isAuthenticated: false, isInitialized: true });
  },

  checkAuth: async () => {
    const token = get().token || (typeof window !== 'undefined' ? localStorage.getItem('md_token') : null);
    if (!token) {
      set({ token: null, user: null, isAuthenticated: false, isInitialized: true });
      return false;
    }

    try {
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const payload = await response.json();
        if (payload.success && payload.data?.user) {
          const freshUser = payload.data.user;
          localStorage.setItem('md_token', token);
          localStorage.setItem('md_user', JSON.stringify(freshUser));
          set({
            token,
            user: freshUser,
            isAuthenticated: true,
            isInitialized: true,
          });
          return true;
        }
      }

      // If token rejected (401 or 403 suspended/locked), clear session
      if (response.status === 401 || response.status === 403) {
        get().clearSession();
        return false;
      }

      // Other non-fatal server responses: keep existing state if already hydrated
      set({ isInitialized: true });
      return get().isAuthenticated;
    } catch {
      // Network/offline fallback: keep cached session if present, mark initialized
      set({ isInitialized: true });
      return get().isAuthenticated;
    }
  },

  rehydrate: () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('md_token') : null;
    const userJson = typeof window !== 'undefined' ? localStorage.getItem('md_user') : null;
    if (token && userJson) {
      try {
        const user = JSON.parse(userJson);
        set({ token, user, isAuthenticated: true });
      } catch {
        localStorage.removeItem('md_token');
        localStorage.removeItem('md_user');
        set({ token: null, user: null, isAuthenticated: false, isInitialized: true });
        return;
      }
    } else {
      set({ token: null, user: null, isAuthenticated: false, isInitialized: true });
      return;
    }

    // Verify token freshness with server asynchronously
    get().checkAuth();
  },
}));
