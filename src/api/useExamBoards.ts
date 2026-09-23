import { useQuery } from '@tanstack/react-query';
import { apiClient } from './client';

export interface ExamBoard {
  id: string;
  name: string;
  shortCode: string;
  region: string;
  questionCount: number;
  syllabusYear: string;
  coreSubjects: string[];
}

export function useExamBoards() {
  return useQuery<ExamBoard[]>({
    queryKey: ['examBoards'],
    queryFn: () => apiClient<ExamBoard[]>('/api/exam-boards'),
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}

