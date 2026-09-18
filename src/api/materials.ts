import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './client.js';

export interface StudyMaterialItem {
  _id: string;
  examId: {
    _id: string;
    name: string;
    shortCode: string;
  };
  subjectId: {
    _id: string;
    name: string;
    code: string;
  };
  title: string;
  description: string;
  fileUrl?: string;
  storageFilename?: string;
  originalFilename?: string;
  fileType: string;
  mimeType?: string;
  fileSize: number;
  downloadCount: number;
  year?: number;
  isPublished: boolean;
  isPremium: boolean;
  createdAt: string;
}

export function useStudyMaterialsQuery(params?: {
  examId?: string;
  subjectId?: string;
  year?: number | string;
  search?: string;
  premiumOnly?: string;
}) {
  const searchParams = new URLSearchParams();
  if (params?.examId) searchParams.set('examId', params.examId);
  if (params?.subjectId) searchParams.set('subjectId', params.subjectId);
  if (params?.year) searchParams.set('year', String(params.year));
  if (params?.search) searchParams.set('search', params.search);
  if (params?.premiumOnly) searchParams.set('premiumOnly', params.premiumOnly);

  const qs = searchParams.toString();
  const endpoint = qs ? `/api/materials?${qs}` : '/api/materials';

  return useQuery<StudyMaterialItem[]>({
    queryKey: ['materials', params],
    queryFn: () => apiClient<StudyMaterialItem[]>(endpoint),
    staleTime: 30000,
  });
}

export function useStudyMaterialDetailQuery(id: string) {
  return useQuery<StudyMaterialItem>({
    queryKey: ['material', id],
    queryFn: () => apiClient<StudyMaterialItem>(`/api/materials/${id}`),
    enabled: Boolean(id),
  });
}

export function useUploadMaterialMutation() {
  return useMutation({
    mutationFn: async (formData: FormData) => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('md_token') : null;
      const res = await fetch('/api/materials/upload', {
        method: 'POST',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: formData,
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || 'File upload failed');
      }
      return json.data as {
        storageFilename: string;
        fileUrl?: string;
        originalFilename: string;
        fileSize: number;
        mimeType: string;
      };
    },
  });
}

export function useCreateMaterialMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      examId: string;
      subjectId: string;
      title: string;
      description?: string;
      storageFilename: string;
      fileUrl?: string;
      originalFilename: string;
      fileSize: number;
      isPublished?: boolean;
      isPremium?: boolean;
    }) =>
      apiClient<any>('/api/materials', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materials'] });
      queryClient.invalidateQueries({ queryKey: ['admin'] });
    },
  });
}

export function useTogglePublishMaterialMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (materialId: string) =>
      apiClient<any>(`/api/materials/${materialId}/publish`, {
        method: 'PATCH',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materials'] });
      queryClient.invalidateQueries({ queryKey: ['admin'] });
    },
  });
}

export function useDeleteMaterialMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (materialId: string) =>
      apiClient<any>(`/api/materials/${materialId}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materials'] });
      queryClient.invalidateQueries({ queryKey: ['admin'] });
    },
  });
}
