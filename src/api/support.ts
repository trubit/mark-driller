import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './client.js';

export interface CreateSupportTicketPayload {
  fullName: string;
  email: string;
  phone?: string;
  category:
    | 'PAYMENT_PROBLEM'
    | 'LOGIN_PROBLEM'
    | 'QUESTION_ERROR'
    | 'TECHNICAL_PROBLEM'
    | 'SUBSCRIPTION_PROBLEM'
    | 'OTHER';
  subject: string;
  message: string;
  idempotencyKey?: string;
}

export interface SupportTicketResponse {
  ticketReference: string;
  category: string;
  status: string;
  createdAt: string;
  emailDeliveryStatus?: string;
}

export interface AdminSupportTicketItem {
  _id: string;
  ticketReference: string;
  userId?: { _id: string; fullName: string; email: string };
  fullName: string;
  email: string;
  phone?: string;
  category:
    | 'PAYMENT_PROBLEM'
    | 'LOGIN_PROBLEM'
    | 'QUESTION_ERROR'
    | 'TECHNICAL_PROBLEM'
    | 'SUBSCRIPTION_PROBLEM'
    | 'OTHER';
  subject: string;
  message: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  emailDeliveryStatus: 'NOT_SENT' | 'SENT' | 'FAILED';
  emailMessageId?: string;
  emailRecipient?: string;
  emailError?: string;
  customerNotified?: boolean;
  adminNotes?: string;
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminSupportTicketsResponse {
  tickets: AdminSupportTicketItem[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  counts: {
    total: number;
    open: number;
    inProgress: number;
    resolved: number;
    closed: number;
    failedEmail: number;
  };
}

export function useSubmitSupportTicketMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateSupportTicketPayload) =>
      apiClient<SupportTicketResponse>('/api/support', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support', 'my-tickets'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'support', 'tickets'] });
    },
  });
}

export function useMySupportTicketsQuery() {
  return useQuery<any[]>({
    queryKey: ['support', 'my-tickets'],
    queryFn: () => apiClient<any[]>('/api/support/my-tickets'),
  });
}

export function useAdminSupportTicketsQuery(params: {
  page?: number;
  limit?: number;
  status?: string;
  category?: string;
  search?: string;
}) {
  const queryParams = new URLSearchParams();
  if (params.page) queryParams.set('page', params.page.toString());
  if (params.limit) queryParams.set('limit', params.limit.toString());
  if (params.status) queryParams.set('status', params.status);
  if (params.category) queryParams.set('category', params.category);
  if (params.search) queryParams.set('search', params.search);

  const qs = queryParams.toString();
  const url = `/api/admin/support/tickets${qs ? `?${qs}` : ''}`;

  return useQuery<AdminSupportTicketsResponse>({
    queryKey: ['admin', 'support', 'tickets', params],
    queryFn: () => apiClient<AdminSupportTicketsResponse>(url),
  });
}

export function useUpdateAdminSupportTicketMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      ticketId,
      status,
      priority,
      adminNotes,
    }: {
      ticketId: string;
      status?: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
      priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
      adminNotes?: string;
    }) =>
      apiClient<{ message: string; data: AdminSupportTicketItem }>(
        `/api/admin/support/tickets/${ticketId}`,
        {
          method: 'PATCH',
          body: JSON.stringify({ status, priority, adminNotes }),
        }
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'support', 'tickets'] });
    },
  });
}

export function useResendSupportTicketEmailMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ticketId: string) =>
      apiClient<{ success: boolean; message: string; data: any }>(
        `/api/admin/support/tickets/${ticketId}/resend`,
        {
          method: 'POST',
        }
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'support', 'tickets'] });
    },
  });
}

