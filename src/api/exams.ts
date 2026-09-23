import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './client.js';

export interface ExamItem {
  _id: string;
  name: string;
  shortCode: string;
  slug: string;
  description: string;
  region: string;
  syllabusYear: string;
  questionCount: number;
}

export interface SubjectItem {
  _id: string;
  examId: string;
  name: string;
  code: string;
  topicCount?: number;
  questionCount?: number;
}

export interface TopicItem {
  _id: string;
  subjectId: string;
  name: string;
  description?: string;
  order: number;
}

export interface DashboardStats {
  targetExam: ExamItem | null;
  totalAttempts: number;
  averageScore: number;
  recentAttempts: any[];
  availableSubjects: SubjectItem[];
}

export interface TelemetryData {
  totalQuestions: number;
  totalExams: number;
  totalSubjects: number;
  totalAttempts: number;
  totalStudents: number;
  lastUpdated: string;
}

export function useTelemetryQuery() {
  return useQuery<TelemetryData>({
    queryKey: ['telemetry'],
    queryFn: () => apiClient<TelemetryData>('/api/exams/telemetry'),
    staleTime: 1000 * 60,
  });
}

export function useExamsQuery() {
  return useQuery<ExamItem[]>({
    queryKey: ['exams'],
    queryFn: () => apiClient<ExamItem[]>('/api/exams'),
    staleTime: 1000 * 60 * 2,
    refetchOnMount: 'always',
  });
}

export function useExamSubjectsQuery(examId?: string) {
  return useQuery<SubjectItem[]>({
    queryKey: ['subjects', examId],
    queryFn: () => apiClient<SubjectItem[]>(`/api/exams/${examId}/subjects`),
    enabled: !!examId,
    staleTime: 1000 * 60 * 2,
    refetchOnMount: 'always',
  });
}

export function useSubjectTopicsQuery(subjectId?: string) {
  return useQuery<TopicItem[]>({
    queryKey: ['topics', subjectId],
    queryFn: () => apiClient<TopicItem[]>(`/api/exams/subjects/${subjectId}/topics`),
    enabled: !!subjectId,
    staleTime: 1000 * 60 * 10,
  });
}

export function useDashboardStatsQuery() {
  return useQuery<DashboardStats>({
    queryKey: ['dashboardStats'],
    queryFn: () => apiClient<DashboardStats>('/api/exams/dashboard/stats'),
    staleTime: 1000 * 60 * 2,
  });
}

export function useUpdateTargetExamMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: { examId: string; subjectIds?: string[] }) =>
      apiClient('/api/exams/user/target-exam', {
        method: 'PUT',
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
    },
  });
}

