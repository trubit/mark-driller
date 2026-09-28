import { create } from 'zustand';

export interface UserSession {
  _id: string;
  fullName: string;
  email: string;
  role: 'STUDENT' | 'ADMIN';
  targetExam?: any;
  selectedSubjects?: any[];
  isVerified: boolean;
  avatar?: string;
  phone?: string;
  educationLevel?: string;
  state?: string;
  country?: string;
  accountStatus?: string;
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

function safeGetItem(key: string): string | null {
  try {
    return typeof window !== 'undefined' && window.localStorage ? window.localStorage.getItem(key) : null;
  } catch {
    return null;
  }
}

function safeGetJson<T>(key: string, fallback: T): T {
  const item = safeGetItem(key);
  if (!item) return fallback;
  try {
    return JSON.parse(item) as T;
  } catch {
    return fallback;
  }
}

function safeSetItem(key: string, value: string): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, value);
    }
  } catch {
    // QuotaExceededError or SecurityError in strict mobile private browsing
  }
}

function safeRemoveItem(key: string): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(key);
    }
  } catch {}
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: safeGetItem('md_token'),
  user: safeGetJson<UserSession | null>('md_user', null),
  isAuthenticated: !!safeGetItem('md_token'),
  isInitialized: false,

  setSession: (token, user) => {
    safeSetItem('md_token', token);
    safeSetItem('md_user', JSON.stringify(user));
    set({ token, user, isAuthenticated: true, isInitialized: true });
  },

  updateUser: (updates) => {
    set((state) => {
      if (!state.user) return state;
      const updatedUser = { ...state.user, ...updates };
      safeSetItem('md_user', JSON.stringify(updatedUser));
      return { user: updatedUser };
    });
  },

  clearSession: () => {
    safeRemoveItem('md_token');
    safeRemoveItem('md_user');
    set({ token: null, user: null, isAuthenticated: false, isInitialized: true });
  },

  checkAuth: async () => {
    const token = get().token || safeGetItem('md_token');
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
          const freshUser: UserSession = {
            ...payload.data.user,
            avatar: payload.data.profile?.avatar || payload.data.user.avatar,
            phone: payload.data.profile?.phone || payload.data.user.phone,
            educationLevel: payload.data.profile?.educationLevel || payload.data.user.educationLevel,
            state: payload.data.profile?.state || payload.data.user.state,
            country: payload.data.profile?.country || payload.data.user.country || 'Nigeria',
          };
          safeSetItem('md_token', token);
          safeSetItem('md_user', JSON.stringify(freshUser));
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
    const token = safeGetItem('md_token');
    const userJson = safeGetItem('md_user');
    if (token && userJson) {
      try {
        const user = JSON.parse(userJson);
        set({ token, user, isAuthenticated: true });
      } catch {
        safeRemoveItem('md_token');
        safeRemoveItem('md_user');
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

