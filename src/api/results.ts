import { useQuery } from '@tanstack/react-query';
import { apiClient } from './client.js';

export interface ResultSummaryItem {
  _id: string;
  attemptId: {
    _id: string;
    mode: string;
    startTime: string;
    submittedAt: string;
  };
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
  score: number;
  maxScore: number;
  percentage: number;
  correctCount: number;
  incorrectCount: number;
  unansweredCount: number;
  timeSpentSeconds: number;
  createdAt: string;
}

export interface ResultsHistoryResponse {
  results: ResultSummaryItem[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface SubjectPerformanceItem {
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  attemptCount: number;
  averageScore: number;
  highestScore: number;
  lowestScore: number;
}

export interface TopicMasteryItem {
  topicId?: string;
  topicName: string;
  totalQuestions: number;
  correctAnswers: number;
  accuracyPercentage: number;
}

export interface AnalyticsOverview {
  readinessScore: number;
  totalMocksTaken: number;
  totalQuestionsAnswered: number;
  totalCorrectAnswers: number;
  overallAccuracy: number;
  totalTimeSpentSeconds: number;
  averageScore: number;
  subjectPerformance: SubjectPerformanceItem[];
  topicStrengths: TopicMasteryItem[];
  topicWeaknesses: TopicMasteryItem[];
  recentTrend: {
    date: string;
    percentage: number;
    subjectCode: string;
    attemptId: string;
  }[];
}

export function useResultsHistoryQuery(page = 1, limit = 10) {
  return useQuery<ResultsHistoryResponse>({
    queryKey: ['resultsHistory', page, limit],
    queryFn: () => apiClient<ResultsHistoryResponse>(`/api/results?page=${page}&limit=${limit}`),
    staleTime: 1000 * 60 * 2,
  });
}

export function useResultDetailQuery(resultId?: string) {
  return useQuery<any>({
    queryKey: ['resultDetail', resultId],
    queryFn: () => apiClient(`/api/results/${resultId}`),
    enabled: !!resultId,
  });
}

export function useAnalyticsOverviewQuery() {
  return useQuery<AnalyticsOverview>({
    queryKey: ['analyticsOverview'],
    queryFn: () => apiClient<AnalyticsOverview>('/api/results/analytics/overview'),
    staleTime: 1000 * 60 * 2,
  });
}
