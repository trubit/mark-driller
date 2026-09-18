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
  correctAnswer?: 'A' | 'B' | 'C' | 'D';
  explanation?: string;
}

export interface CbtAnswer {
  questionId: string;
  selectedOption: 'A' | 'B' | 'C' | 'D' | null;
  isCorrect?: boolean;
  markedForReview?: boolean;
}

export interface CbtAttemptState {
  attemptId: string;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'EXPIRED';
  mode: 'PRACTICE' | 'TIMED_MOCK';
  allocatedDurationSeconds: number;
  remainingSeconds: number;
  startTime: string;
  endTime: string;
  examName: string;
  examShortCode: string;
  subjectName: string;
  subjectCode: string;
  questions: CbtQuestion[];
  answers: CbtAnswer[];
  score?: number;
  maxScore?: number;
  percentage?: number;
}

export interface StartCbtPayload {
  examId: string;
  subjectId: string;
  mode?: 'PRACTICE' | 'TIMED_MOCK';
  durationMinutes?: number;
  questionCount?: number;
}

export interface SaveAnswerPayload {
  questionId: string;
  selectedOption: 'A' | 'B' | 'C' | 'D' | null;
  markedForReview?: boolean;
}

export interface TopicBreakdownItem {
  topicId?: string;
  topicName: string;
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
    timeSpentSeconds: number;
    topicBreakdown: TopicBreakdownItem[];
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
  })[];
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
