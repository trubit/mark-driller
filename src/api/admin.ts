import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './client.js';

export interface AdminOverviewData {
  totalUsers: number;
  totalStudents: number;
  totalAdmins: number;
  totalQuestions: number;
  totalPublishedQuestions: number;
  totalExams: number;
  totalSubjects: number;
  totalTopics: number;
  totalStudyMaterials: number;
  totalAttempts: number;
  activePaidSubscriptions: number;
  successfulPayments: number;
  totalRevenueNGN: number;
  recentUsers: Array<{
    _id: string;
    fullName: string;
    email: string;
    role: 'STUDENT' | 'ADMIN';
    accountStatus: string;
    isVerified: boolean;
    createdAt: string;
  }>;
}

export interface AdminUserData {
  _id: string;
  fullName: string;
  email: string;
  role: 'STUDENT' | 'ADMIN';
  accountStatus: 'ACTIVE' | 'SUSPENDED' | 'LOCKED';
  isVerified: boolean;
  targetExam?: {
    _id: string;
    shortCode: string;
    name: string;
  };
  createdAt: string;
}

export interface AdminUsersResponse {
  users: AdminUserData[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export function useAdminOverviewQuery() {
  return useQuery<AdminOverviewData>({
    queryKey: ['admin', 'overview'],
    queryFn: () => apiClient<AdminOverviewData>('/api/admin/overview'),
    staleTime: 15000,
  });
}

export function useAdminUsersQuery(params: { page?: number; limit?: number; search?: string; role?: string; status?: string }) {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set('page', params.page.toString());
  if (params.limit) searchParams.set('limit', params.limit.toString());
  if (params.search) searchParams.set('search', params.search);
  if (params.role) searchParams.set('role', params.role);
  if (params.status) searchParams.set('status', params.status);

  const qs = searchParams.toString();
  const endpoint = qs ? `/api/admin/users?${qs}` : '/api/admin/users';

  return useQuery<AdminUsersResponse>({
    queryKey: ['admin', 'users', params],
    queryFn: () => apiClient<AdminUsersResponse>(endpoint),
    staleTime: 10000,
  });
}

export function useToggleUserRoleMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) =>
      apiClient<{ userId: string; role: string }>(`/api/admin/users/${userId}/toggle-role`, {
        method: 'POST',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin'] });
    },
  });
}

export function useUpdateUserStatusMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, status }: { userId: string; status: 'ACTIVE' | 'SUSPENDED' | 'LOCKED' }) =>
      apiClient<{ userId: string; accountStatus: string }>(`/api/admin/users/${userId}/status`, {
        method: 'POST',
        body: JSON.stringify({ status }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin'] });
    },
  });
}

// Exam Admin Hooks
export function useAdminCreateExamMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: any) =>
      apiClient<any>('/api/admin/exams', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exams'] });
      queryClient.invalidateQueries({ queryKey: ['admin'] });
    },
  });
}

export function useAdminDeleteExamMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (examId: string) =>
      apiClient<any>(`/api/admin/exams/${examId}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exams'] });
      queryClient.invalidateQueries({ queryKey: ['admin'] });
    },
  });
}

// Subject Admin Hooks
export function useAdminCreateSubjectMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: any) =>
      apiClient<any>('/api/admin/subjects', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
      queryClient.invalidateQueries({ queryKey: ['admin'] });
    },
  });
}

export function useAdminDeleteSubjectMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (subjectId: string) =>
      apiClient<any>(`/api/admin/subjects/${subjectId}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
      queryClient.invalidateQueries({ queryKey: ['admin'] });
    },
  });
}

// Topic Admin Hooks
export function useAdminCreateTopicMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: any) =>
      apiClient<any>('/api/admin/topics', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['topics'] });
      queryClient.invalidateQueries({ queryKey: ['admin'] });
    },
  });
}

export function useAdminDeleteTopicMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (topicId: string) =>
      apiClient<any>(`/api/admin/topics/${topicId}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['topics'] });
      queryClient.invalidateQueries({ queryKey: ['admin'] });
    },
  });
}

// Question Admin Hooks
export function useAdminCreateQuestionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: any) =>
      apiClient<any>('/api/admin/questions', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questions'] });
      queryClient.invalidateQueries({ queryKey: ['admin'] });
    },
  });
}

export function useAdminDeleteQuestionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (questionId: string) =>
      apiClient<any>(`/api/admin/questions/${questionId}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questions'] });
      queryClient.invalidateQueries({ queryKey: ['admin'] });
    },
  });
}

export function useAdminIngestQuestionsMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { examShortCode?: string; subjectCode?: string; year?: number; count?: number }) =>
      apiClient<any>('/api/admin/questions/sync', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questions'] });
      queryClient.invalidateQueries({ queryKey: ['admin'] });
      queryClient.invalidateQueries({ queryKey: ['exams'] });
    },
  });
}

// Question Sync & Import Hooks
export function useAdminQuestionSyncStatusQuery() {
  return useQuery<{
    enabled: boolean;
    isRunning: boolean;
    intervalHours: number;
    lastRunAt?: string;
    nextRunAt?: string;
    lastRunStatus?: string;
    sourceUrlConfigured: boolean;
    lastSyncLog?: any;
    recentLogs: any[];
  }>({
    queryKey: ['admin', 'questions', 'sync-status'],
    queryFn: () => apiClient<any>('/api/admin/questions/sync-status'),
    refetchInterval: 15000,
  });
}

export function useAdminTriggerQuestionSyncMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload?: { examShortCode?: string; subjectCode?: string; year?: number; batchSize?: number }) =>
      apiClient<any>('/api/admin/questions/sync', {
        method: 'POST',
        body: JSON.stringify(payload || {}),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'questions', 'sync-status'] });
      queryClient.invalidateQueries({ queryKey: ['questions'] });
      queryClient.invalidateQueries({ queryKey: ['admin'] });
    },
  });
}

export function useAdminToggleQuestionSyncMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (enabled: boolean) =>
      apiClient<any>('/api/admin/questions/sync-toggle', {
        method: 'POST',
        body: JSON.stringify({ enabled }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'questions', 'sync-status'] });
    },
  });
}

export function useAdminImportQuestionsMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { fileContent: string; fileType: 'csv' | 'json'; defaultExam?: string; defaultSubject?: string }) =>
      apiClient<any>('/api/admin/questions/import', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questions'] });
      queryClient.invalidateQueries({ queryKey: ['admin'] });
      queryClient.invalidateQueries({ queryKey: ['exams'] });
    },
  });
}

export function useAdminQuestionReviewQueueQuery(params?: { status?: string; page?: number; limit?: number }) {
  const searchParams = new URLSearchParams();
  if (params?.status) searchParams.set('status', params.status);
  if (params?.page) searchParams.set('page', params.page.toString());
  if (params?.limit) searchParams.set('limit', params.limit.toString());

  const qs = searchParams.toString();
  return useQuery<{
    questions: any[];
    pagination: { total: number; page: number; limit: number; totalPages: number };
  }>({
    queryKey: ['admin', 'questions', 'review-queue', params],
    queryFn: () => apiClient<any>(`/api/admin/questions/review-queue?${qs}`),
  });
}

export function useAdminReviewQuestionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ questionId, action, reviewNotes }: { questionId: string; action: string; reviewNotes?: string }) =>
      apiClient<any>(`/api/admin/questions/${questionId}/review`, {
        method: 'POST',
        body: JSON.stringify({ action, reviewNotes }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'questions'] });
      queryClient.invalidateQueries({ queryKey: ['questions'] });
    },
  });
}


