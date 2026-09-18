import { useMutation } from '@tanstack/react-query';
import { apiClient } from './client';

export interface InquiryInput {
  fullName?: string;
  email: string;
  password?: string;
  targetExam: string;
  mode: 'signup' | 'login';
}

export interface InquiryResponse {
  referenceId: string;
  email: string;
  targetExam: string;
  mode: string;
  timestamp: string;
}

export function useCreateInquiry() {
  return useMutation<InquiryResponse, Error, InquiryInput>({
    mutationFn: (input: InquiryInput) =>
      apiClient<InquiryResponse>('/api/leads', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
  });
}
