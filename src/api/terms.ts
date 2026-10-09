import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './client.js';

export interface TermsSection {
  number: number;
  title: string;
  items: string[];
}

export interface TermsDocumentData {
  title: string;
  version: string;
  lastUpdated: string;
  contact: {
    platform: string;
    email: string;
    phone: string;
    website: string;
  };
  introduction: string;
  sections: TermsSection[];
}

export interface TermsStatusResponse {
  termsVersion: string;
  hasAccepted: boolean;
  acceptedAt: string | null;
  title: string;
}

export interface StudentDeclarationChecklist {
  readAndUnderstood: boolean;
  followInstructions: boolean;
  antiCheating: boolean;
  understandConsequences: boolean;
  accurateInformation: boolean;
  lawfulUse: boolean;
}

export interface AcceptTermsPayload {
  version?: string;
  declarationChecklist: StudentDeclarationChecklist;
}

export interface TermsAuditRecord {
  _id: string;
  userId: {
    _id: string;
    fullName: string;
    email: string;
    role: string;
  };
  termsVersion: string;
  acceptedAt: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface TermsAuditResponse {
  activeVersion: string;
  totalAcceptances: number;
  currentVersionAcceptances: number;
  recentAcceptances: TermsAuditRecord[];
}

/**
 * Fetch the complete active Terms & Conditions document (public).
 */
export function useActiveTermsQuery() {
  return useQuery<TermsDocumentData>({
    queryKey: ['terms', 'active'],
    queryFn: () => apiClient<TermsDocumentData>('/api/terms/active'),
    staleTime: 1000 * 60 * 60, // 1 hour
  });
}

/**
 * Fetch terms acceptance status for the authenticated student.
 */
export function useTermsStatusQuery() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('md_token') : null;
  return useQuery<TermsStatusResponse>({
    queryKey: ['terms', 'status'],
    queryFn: () => apiClient<TermsStatusResponse>('/api/terms/status'),
    enabled: Boolean(token),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Explicitly submit Student Declaration and accept Terms & Conditions.
 */
export function useAcceptTermsMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: AcceptTermsPayload) =>
      apiClient<{ termsVersion: string; acceptedAt: string }>('/api/terms/accept', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['terms', 'status'] });
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
      queryClient.invalidateQueries({ queryKey: ['terms', 'audit'] });
    },
  });
}

/**
 * Administrator query to review student acceptance metrics & audit log.
 */
export function useTermsAuditQuery() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('md_token') : null;
  return useQuery<TermsAuditResponse>({
    queryKey: ['terms', 'audit'],
    queryFn: () => apiClient<TermsAuditResponse>('/api/terms/audit'),
    enabled: Boolean(token),
    staleTime: 1000 * 60, // 1 minute
  });
}
