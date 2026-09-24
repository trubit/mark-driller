import { useMutation, useQuery } from '@tanstack/react-query';
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
}

export interface SupportTicketResponse {
  ticketReference: string;
  category: string;
  status: string;
  createdAt: string;
}

export function useSubmitSupportTicketMutation() {
  return useMutation({
    mutationFn: (payload: CreateSupportTicketPayload) =>
      apiClient<SupportTicketResponse>('/api/support', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
  });
}

export function useMySupportTicketsQuery() {
  return useQuery<any[]>({
    queryKey: ['support', 'my-tickets'],
    queryFn: () => apiClient<any[]>('/api/support/my-tickets'),
  });
}
