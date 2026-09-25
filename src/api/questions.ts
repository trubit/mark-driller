import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { apiClient } from './client.js';

export interface QuestionItem {
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
  topicId?: {
    _id: string;
    name: string;
  };
  year: number;
  questionNumber: number;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  explanation: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  imageUrl?: string;
  published: boolean;
}

export interface QuestionsFilterParams {
  examId?: string;
  subjectId?: string;
  topicId?: string;
  year?: number | string;
  difficulty?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface TrialUsageInfo {
  isPro: boolean;
  used: number;
  limit: number;
  remaining: number;
  isLimitReached: boolean;
}

export interface QuestionsResponse {
  questions: QuestionItem[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  trialUsage?: TrialUsageInfo;
  acquiredOnDemand?: boolean;
}


export interface BookmarkItem {
  bookmarkId: string;
  bookmarkDate: string;
  question: QuestionItem;
}

export function useQuestionsQuery(params: QuestionsFilterParams = {}) {
  const normalizedParams = {
    examId: params.examId || undefined,
    subjectId: params.subjectId || undefined,
    topicId: params.topicId || undefined,
    year: params.year ? params.year.toString() : undefined,
    difficulty: params.difficulty || undefined,
    search: params.search?.trim() || undefined,
    page: Math.max(1, Number(params.page) || 1),
    limit: Math.min(50, Math.max(1, Number(params.limit) || 10)),
  };

  const searchParams = new URLSearchParams();
  if (normalizedParams.examId) searchParams.set('examId', normalizedParams.examId);
  if (normalizedParams.subjectId) searchParams.set('subjectId', normalizedParams.subjectId);
  if (normalizedParams.topicId) searchParams.set('topicId', normalizedParams.topicId);
  if (normalizedParams.year) searchParams.set('year', normalizedParams.year);
  if (normalizedParams.difficulty) searchParams.set('difficulty', normalizedParams.difficulty);
  if (normalizedParams.search) searchParams.set('search', normalizedParams.search);
  searchParams.set('page', normalizedParams.page.toString());
  searchParams.set('limit', normalizedParams.limit.toString());

  const queryString = searchParams.toString();
  const endpoint = `/api/questions?${queryString}`;

  return useQuery<QuestionsResponse>({
    queryKey: ['questions', normalizedParams],
    queryFn: () => apiClient<QuestionsResponse>(endpoint),
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60 * 5,
  });
}

export function useQuestionDetailQuery(id?: string) {
  return useQuery<QuestionItem>({
    queryKey: ['question', id],
    queryFn: () => apiClient<QuestionItem>(`/api/questions/${id}`),
    enabled: !!id,
  });
}

export function useMyBookmarksQuery() {
  return useQuery<BookmarkItem[]>({
    queryKey: ['bookmarks'],
    queryFn: () => apiClient<BookmarkItem[]>('/api/questions/user/bookmarks'),
    staleTime: 1000 * 60 * 2,
  });
}

export function useToggleBookmarkMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (questionId: string) =>
      apiClient<{ isBookmarked: boolean; message: string }>(`/api/questions/${questionId}/bookmark`, {
        method: 'POST',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
      queryClient.invalidateQueries({ queryKey: ['questions'] });
    },
  });
}

export function useAcquireCurriculumMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: { examId: string; subjectId: string; year?: number }) =>
      apiClient<{
        exam: string;
        subject: string;
        year: string | number;
        totalInserted: number;
        totalUpdated: number;
        totalSkipped: number;
        totalFetched: number;
        status: string;
      }>('/api/questions/acquire-curriculum', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questions'] });
    },
  });
}

export function useTrialUsageQuery() {
  return useQuery<TrialUsageInfo>({
    queryKey: ['trial-usage'],
    queryFn: () => apiClient<TrialUsageInfo>('/api/questions/trial-usage'),
    staleTime: 1000 * 30,
  });
}



