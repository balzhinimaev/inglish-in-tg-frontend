import { useMutation, useQuery } from '@tanstack/react-query';
import apiClient from './api';
import { API_ENDPOINTS } from '../utils/constants';

// Progress session types
export interface ProgressSessionRequest {
  userId: number;
  lessonRef: string;
  moduleRef: string;
  score: number;
  timeSpent: number; // in seconds
  completedTasks: number;
  totalTasks: number;
  completedAt: string; // ISO date string
}

export interface ProgressSessionResponse {
  success: boolean;
  xpEarned?: number;
  levelUp?: boolean;
  newLevel?: number;
}

/**
 * Save user progress for a lesson session
 */
export const useSaveProgressSession = () => {
  return useMutation({
    mutationFn: async (data: ProgressSessionRequest): Promise<ProgressSessionResponse> => {
      const response = await apiClient.post(API_ENDPOINTS.PROGRESS.SESSION, data);
      return response.data;
    },
  });
};

/**
 * Get user progress for a specific lesson
 */
export const useLessonProgress = (lessonRef: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: ['progress', 'lesson', lessonRef],
    queryFn: async () => {
      const response = await apiClient.get(`${API_ENDPOINTS.PROGRESS.SESSION}/${lessonRef}`);
      return response.data;
    },
    enabled: enabled && !!lessonRef,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Get user progress for a module
 */
export const useModuleProgress = (moduleRef: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: ['progress', 'module', moduleRef],
    queryFn: async () => {
      const response = await apiClient.get(`${API_ENDPOINTS.PROGRESS.SESSION}/module/${moduleRef}`);
      return response.data;
    },
    enabled: enabled && !!moduleRef,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
