import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './client.js';

export interface SupportContactInfo {
  whatsappNumber: string;
  whatsappDisplay: string;
  whatsappEnabled: boolean;
  phone: string;
  phoneDisplay: string;
  phoneEnabled: boolean;
  email: string;
  emailDisplay: string;
  emailEnabled: boolean;
  workingHours: string;
}

export const DEFAULT_CLIENT_SUPPORT: SupportContactInfo = {
  whatsappNumber: '2348030001234',
  whatsappDisplay: '+234 803 000 1234',
  whatsappEnabled: true,
  phone: '+2348030001234',
  phoneDisplay: '+234 803 000 1234',
  phoneEnabled: true,
  email: 'support@markdriller.com',
  emailDisplay: 'support@markdriller.com',
  emailEnabled: true,
  workingHours: 'Mon – Sat: 8:00 AM – 8:00 PM WAT',
};

// Public query for landing page, footer, floating buttons, and contact forms
export function useSupportContactQuery() {
  return useQuery<SupportContactInfo>({
    queryKey: ['supportContact'],
    queryFn: async () => {
      try {
        const response = await apiClient<SupportContactInfo>('/api/support/contact-info');
        return response;
      } catch (err) {
        console.warn('[useSupportContactQuery] Falling back to standard platform support config:', err);
        return DEFAULT_CLIENT_SUPPORT;
      }
    },
    staleTime: 1000 * 60, // 1 minute
    refetchOnWindowFocus: true,
  });
}

// Admin query for settings panel
export function useAdminSupportSettingsQuery() {
  return useQuery<SupportContactInfo>({
    queryKey: ['adminSupportSettings'],
    queryFn: () => apiClient<SupportContactInfo>('/api/admin/support-settings'),
    staleTime: 1000 * 30,
  });
}

// Admin mutation to update settings
export function useUpdateAdminSupportSettingsMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: SupportContactInfo) =>
      apiClient<SupportContactInfo>('/api/admin/support-settings', {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onSuccess: (updated) => {
      queryClient.setQueryData(['supportContact'], updated);
      queryClient.setQueryData(['adminSupportSettings'], updated);
      queryClient.invalidateQueries({ queryKey: ['supportContact'] });
      queryClient.invalidateQueries({ queryKey: ['adminSupportSettings'] });
    },
  });
}

// Safe action link builders
export function buildWhatsAppLink(number?: string, message?: string): string {
  const cleanNumber = (number || '').replace(/[^0-9]/g, '');
  if (!cleanNumber) {
    return '/contact';
  }
  const defaultMsg = 'Hello MarkDriller Support, I need assistance with CBT practice / activation.';
  const encodedText = encodeURIComponent(message || defaultMsg);
  return `https://wa.me/${cleanNumber}?text=${encodedText}`;
}

export function buildTelLink(phone?: string): string {
  if (!phone) return '/contact';
  const cleanPhone = phone.replace(/[^0-9+]/g, '');
  return `tel:${cleanPhone}`;
}

export function buildMailtoLink(email?: string, subject?: string): string {
  if (!email) return '/contact';
  const cleanEmail = email.trim();
  const defaultSubj = encodeURIComponent(subject || 'Inquiry: MarkDriller Platform');
  return `mailto:${cleanEmail}?subject=${defaultSubj}`;
}
