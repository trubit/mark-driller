import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './client.js';

export interface CbtQuestion {
  _id: string;
  year: number;
  questionNumber: number;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  difficulty: string;
  topicName?: string;
  subjectId?: string;
  subjectName?: string;
  subjectCode?: string;
  imageUrl?: string;
  correctAnswer?: 'A' | 'B' | 'C' | 'D';
  explanation?: string;
}

export interface CbtAnswer {
  questionId: string;
  selectedOption: 'A' | 'B' | 'C' | 'D' | null;
  isSkipped?: boolean;
  isCorrect?: boolean;
  markedForReview?: boolean;
}

export interface CbtAttemptState {
  attemptId: string;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'EXPIRED';
  mode?: string;
  allocatedDurationSeconds: number;
  remainingSeconds: number;
  startTime: string;
  endTime: string;
  examName: string;
  examShortCode: string;
  subjectName: string;
  subjectCode: string;
  subjectId?: string;
  isMultiSubject?: boolean;
  questions: CbtQuestion[];
  answers: CbtAnswer[];
  score?: number;
  maxScore?: number;
  percentage?: number;
}

export interface CbtTrialStatus {
  isPro: boolean;
  allowed: number;
  used: number;
  remaining: number;
  isExhausted: boolean;
  permittedYear: number;
}

export interface StartCbtPayload {
  examId: string;
  subjectId?: string;
  subjectIds?: string[];
  topicId?: string;
  year?: number;
  years?: number[];
  allYears?: boolean;
  difficulty?: 'EASY' | 'MEDIUM' | 'HARD';
  questionOrder?: 'NORMAL' | 'SHUFFLE' | 'RANDOM';
  shuffleOptions?: boolean;
  onlyBookmarked?: boolean;
  drillType?: 'PAST_QUESTION' | 'PRACTICE_MOCK' | 'BOTH';
  durationMinutes?: number;
  questionCount?: number;
}

export interface SaveAnswerPayload {
  questionId: string;
  selectedOption?: 'A' | 'B' | 'C' | 'D' | null;
  isSkipped?: boolean;
  markedForReview?: boolean;
}

export interface TopicBreakdownItem {
  topicId?: string;
  topicName: string;
  totalQuestions: number;
  correctAnswers: number;
  accuracyPercentage: number;
}

export interface SubjectBreakdownItem {
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  totalQuestions: number;
  correctAnswers: number;
  accuracyPercentage: number;
}

export interface CbtResultResponse {
  result: {
    _id: string;
    attemptId: string;
    score: number;
    maxScore: number;
    percentage: number;
    correctCount: number;
    incorrectCount: number;
    unansweredCount: number;
    skippedCount?: number;
    timeSpentSeconds: number;
    topicBreakdown: TopicBreakdownItem[];
    subjectBreakdown?: SubjectBreakdownItem[];
    createdAt: string;
  };
  attempt: {
    _id: string;
    mode: string;
    startTime: string;
    submittedAt: string;
    examName: string;
    examShortCode: string;
    subjectName: string;
    subjectCode: string;
  };
  reviewedQuestions: (CbtQuestion & {
    studentChoice: 'A' | 'B' | 'C' | 'D' | null;
    isCorrect: boolean;
    isSkipped?: boolean;
  })[];
}

export function useCbtTrialStatusQuery() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('md_token') : null;
  return useQuery<CbtTrialStatus>({
    queryKey: ['cbt', 'trial-status'],
    queryFn: () => apiClient<CbtTrialStatus>('/api/cbt/trial-status'),
    enabled: Boolean(token),
    staleTime: 30000,
  });
}

export function useStartCbtMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: StartCbtPayload) =>
      apiClient<CbtAttemptState>('/api/cbt/start', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cbt', 'trial-status'] });
      queryClient.invalidateQueries({ queryKey: ['subscription', 'my-subscription'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
    },
  });
}

export function useCbtAttemptQuery(attemptId?: string) {
  return useQuery<CbtAttemptState>({
    queryKey: ['cbtAttempt', attemptId],
    queryFn: () => apiClient<CbtAttemptState>(`/api/cbt/${attemptId}`),
    enabled: !!attemptId,
    refetchOnWindowFocus: true,
  });
}

export function useSaveCbtAnswerMutation(attemptId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: SaveAnswerPayload) =>
      apiClient(`/api/cbt/${attemptId}/answer`, {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cbtAttempt', attemptId] });
    },
  });
}

export function useSubmitCbtMutation(attemptId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () =>
      apiClient(`/api/cbt/${attemptId}/submit`, {
        method: 'POST',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cbtAttempt', attemptId] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
      queryClient.invalidateQueries({ queryKey: ['analyticsOverview'] });
      queryClient.invalidateQueries({ queryKey: ['resultsHistory'] });
      queryClient.invalidateQueries({ queryKey: ['subscription', 'my-subscription'] });
    },
  });
}

export function useCbtResultQuery(attemptId?: string) {
  return useQuery<CbtResultResponse>({
    queryKey: ['cbtResult', attemptId],
    queryFn: () => apiClient<CbtResultResponse>(`/api/cbt/${attemptId}/result`),
    enabled: !!attemptId,
  });
}

