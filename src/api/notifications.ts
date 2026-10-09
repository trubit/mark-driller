import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './client.js';

export interface StudentNotificationItem {
  _id: string;
  title: string;
  message: string;
  audience: string;
  type: string;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  actionText?: string;
  actionLink?: string;
  isRead: boolean;
  createdAt: string;
}

export interface StudentNotificationsResponse {
  data: StudentNotificationItem[];
  unreadCount: number;
}

export interface AdminNotificationItem {
  _id: string;
  title: string;
  message: string;
  audience: string;
  type: string;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  status: 'ACTIVE' | 'ARCHIVED';
  actionText?: string;
  actionLink?: string;
  expiresAt?: string;
  readCount: number;
  createdAt: string;
}

export function useStudentNotificationsQuery(enabled = true) {
  return useQuery<StudentNotificationsResponse>({
    queryKey: ['studentNotifications'],
    queryFn: async () => {
      const response = await apiClient<StudentNotificationItem[]>('/api/notifications');
      // API client returns json.data as T, and route returns { success: true, data: [...], unreadCount: N }
      // To ensure typed compatibility:
      return {
        data: Array.isArray(response) ? response : (response as any).data || [],
        unreadCount: (response as any).unreadCount ?? (Array.isArray(response) ? response.filter(n => !n.isRead).length : 0),
      };
    },
    enabled,
    staleTime: 1000 * 30, // 30 seconds
    refetchInterval: 1000 * 60, // Poll every 1 minute
  });
}

export function useMarkNotificationReadMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiClient<{ message: string }>(`/api/notifications/${id}/read`, {
        method: 'POST',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['studentNotifications'] });
    },
  });
}

export function useMarkAllNotificationsReadMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () =>
      apiClient<{ message: string }>('/api/notifications/read-all', {
        method: 'POST',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['studentNotifications'] });
    },
  });
}

export function useAdminNotificationsQuery(enabled = true) {
  return useQuery<AdminNotificationItem[]>({
    queryKey: ['adminNotifications'],
    queryFn: () => apiClient<AdminNotificationItem[]>('/api/admin/notifications'),
    enabled,
    staleTime: 1000 * 30,
  });
}

export function useCreateAdminNotificationMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      title: string;
      message: string;
      audience: string;
      type: string;
      priority: string;
      actionText?: string;
      actionLink?: string;
      expiresAt?: string | null;
    }) =>
      apiClient<{ message: string; data: AdminNotificationItem }>('/api/admin/notifications', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminNotifications'] });
      queryClient.invalidateQueries({ queryKey: ['studentNotifications'] });
    },
  });
}

export function useArchiveAdminNotificationMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiClient<{ message: string }>(`/api/admin/notifications/${id}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminNotifications'] });
      queryClient.invalidateQueries({ queryKey: ['studentNotifications'] });
    },
  });
}
