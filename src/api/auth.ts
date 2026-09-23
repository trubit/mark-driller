import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './client.js';
import { useAuthStore, UserSession } from '../store/useAuthStore.js';

export interface RegisterPayload {
  fullName: string;
  email: string;
  password: string;
  targetExamCode?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthSuccessData {
  token: string;
  user: UserSession;
  needsVerification?: boolean;
}

export function useRegisterMutation() {
  const queryClient = useQueryClient();
  const setSession = useAuthStore((state) => state.setSession);

  return useMutation<AuthSuccessData, Error, RegisterPayload>({
    mutationFn: (payload) =>
      apiClient<AuthSuccessData>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    onSuccess: (data) => {
      setSession(data.token, data.user);
      queryClient.setQueryData(['currentUser'], data.user);
    },
  });
}

export function useLoginMutation() {
  const queryClient = useQueryClient();
  const setSession = useAuthStore((state) => state.setSession);

  return useMutation<AuthSuccessData, Error, LoginPayload>({
    mutationFn: (payload) =>
      apiClient<AuthSuccessData>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    onSuccess: (data) => {
      setSession(data.token, data.user);
      queryClient.setQueryData(['currentUser'], data.user);
    },
  });
}

export function useVerifyEmailMutation() {
  const queryClient = useQueryClient();
  const updateUser = useAuthStore((state) => state.updateUser);

  return useMutation<{ isVerified: boolean }, Error, { email: string; otp: string }>({
    mutationFn: (payload) =>
      apiClient<{ isVerified: boolean }>('/api/auth/verify-email', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      updateUser({ isVerified: true });
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
    },
  });
}

export function useResendVerificationMutation() {
  return useMutation<{ success: boolean; message: string }, Error, { email: string }>({
    mutationFn: (payload) =>
      apiClient<{ success: boolean; message: string }>('/api/auth/resend-verification', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
  });
}

export function useForgotPasswordMutation() {
  return useMutation<{ success: boolean; message: string }, Error, { email: string }>({
    mutationFn: (payload) =>
      apiClient<{ success: boolean; message: string }>('/api/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
  });
}

export function useVerifyResetOtpMutation() {
  return useMutation<{ valid: boolean }, Error, { email: string; otp: string }>({
    mutationFn: (payload) =>
      apiClient<{ valid: boolean }>('/api/auth/verify-reset-otp', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
  });
}

export function useResetPasswordMutation() {
  return useMutation<{ success: boolean; message: string }, Error, { email: string; otp: string; newPassword: string }>({
    mutationFn: (payload) =>
      apiClient<{ success: boolean; message: string }>('/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
  });
}

export function useCurrentUserQuery() {
  const { token, setSession, clearSession } = useAuthStore();

  return useQuery<{ user: UserSession; profile: any }>({
    queryKey: ['currentUser'],
    queryFn: async () => {
      try {
        const data = await apiClient<{ user: UserSession; profile: any }>('/api/auth/me');
        if (token && data.user) {
          setSession(token, {
            ...data.user,
            avatar: data.profile?.avatar || data.user.avatar,
            phone: data.profile?.phone || data.user.phone,
            educationLevel: data.profile?.educationLevel || data.user.educationLevel,
            state: data.profile?.state || data.user.state,
            country: data.profile?.country || data.user.country || 'Nigeria',
          });
        }
        return data;
      } catch (err) {
        clearSession();
        throw err;
      }
    },
    enabled: !!token,
    staleTime: 1000 * 60 * 5,
    retry: false,
  });
}

export interface UpdateProfilePayload {
  fullName?: string;
  phone?: string | null;
  educationLevel?: string | null;
  state?: string | null;
  country?: string | null;
  targetExamId?: string | null;
  selectedSubjects?: string[];
}

export function useUpdateProfileMutation() {
  const queryClient = useQueryClient();
  const updateUser = useAuthStore((state) => state.updateUser);

  return useMutation({
    mutationFn: (payload: UpdateProfilePayload) =>
      apiClient<{ user: UserSession; profile: any }>('/api/auth/profile', {
        method: 'PUT',
        body: JSON.stringify(payload),
      }),
    onSuccess: (data) => {
      updateUser({
        fullName: data.user.fullName,
        phone: data.profile?.phone,
        educationLevel: data.profile?.educationLevel,
        state: data.profile?.state,
        country: data.profile?.country,
        targetExam: data.user.targetExam,
        selectedSubjects: data.user.selectedSubjects,
      });
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
    },
  });
}

export function useUploadAvatarMutation() {
  const queryClient = useQueryClient();
  const updateUser = useAuthStore((state) => state.updateUser);

  return useMutation({
    mutationFn: async (file: File) => {
      const token = localStorage.getItem('md_token');
      const formData = new FormData();
      formData.append('avatar', file);

      const response = await fetch('/api/auth/profile/avatar', {
        method: 'POST',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: formData,
      });

      const json = await response.json();
      if (!response.ok || !json.success) {
        throw new Error(json.error?.message || 'Failed to upload profile photo.');
      }
      return json.data as { avatarUrl: string; profile: any };
    },
    onSuccess: (data) => {
      updateUser({ avatar: data.avatarUrl });
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
    },
  });
}

export function useRemoveAvatarMutation() {
  const queryClient = useQueryClient();
  const updateUser = useAuthStore((state) => state.updateUser);

  return useMutation({
    mutationFn: () =>
      apiClient<{ message: string }>('/api/auth/profile/avatar', {
        method: 'DELETE',
      }),
    onSuccess: () => {
      updateUser({ avatar: undefined });
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
    },
  });
}

export function useDeleteAccountMutation() {
  const clearSession = useAuthStore((state) => state.clearSession);

  return useMutation({
    mutationFn: (payload: { password: string; confirmationText: string }) =>
      apiClient<{ message: string }>('/api/auth/delete-account', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      clearSession();
    },
  });
}

