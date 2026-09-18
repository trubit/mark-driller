import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './client.js';

export interface PlanTier {
  id: 'FREE' | 'PRO_MONTHLY' | 'PRO_ANNUAL';
  name: string;
  priceNGN: number;
  priceKobo: number;
  billingPeriod: string;
  description: string;
  features: string[];
  isPopular: boolean;
}

export interface UserSubscription {
  plan: 'FREE' | 'PRO_MONTHLY' | 'PRO_ANNUAL';
  status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
  startDate: string;
  endDate?: string | null;
  isPro: boolean;
}

export function useSubscriptionPlansQuery() {
  return useQuery<PlanTier[]>({
    queryKey: ['subscription', 'plans'],
    queryFn: () => apiClient<PlanTier[]>('/api/subscriptions/plans'),
    staleTime: 300000,
  });
}

export function useMySubscriptionQuery() {
  return useQuery<UserSubscription>({
    queryKey: ['subscription', 'my-subscription'],
    queryFn: () => apiClient<UserSubscription>('/api/subscriptions/my-subscription'),
    staleTime: 60000,
  });
}

export function useInitializePaymentMutation() {
  return useMutation({
    mutationFn: (plan: 'PRO_MONTHLY' | 'PRO_ANNUAL') =>
      apiClient<{
        reference: string;
        amountKobo: number;
        currency: string;
        plan: string;
        userEmail: string;
        publicKey: string;
        authorizationUrl?: string;
        accessCode?: string;
      }>('/api/subscriptions/initialize', {
        method: 'POST',
        body: JSON.stringify({ plan }),
      }),
  });
}

export function useVerifyPaymentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (reference: string) =>
      apiClient<UserSubscription>('/api/subscriptions/verify', {
        method: 'POST',
        body: JSON.stringify({ reference }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
    },
  });
}
