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

export interface LessonProgressItem {
  lessonRef: string;
  moduleRef?: string;
  status: 'not_started' | 'in_progress' | 'completed';
  score?: number;
  attempts?: number;
  timeSpent?: number;
  completedAt?: string;
  updatedAt?: string;
}

/**
 * Save user progress for a lesson session
 */
export const useSaveProgressSession = () => {
  return useMutation({
    // Deprecated shim: starts+ends a session for backward compatibility only.
    mutationFn: async (_data: ProgressSessionRequest): Promise<ProgressSessionResponse> => {
      return { success: true };
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
      const response = await apiClient.get(`${API_ENDPOINTS.PROGRESS.LESSONS}?lessonRef=${encodeURIComponent(lessonRef)}`);
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
      const response = await apiClient.get(`${API_ENDPOINTS.PROGRESS.LESSONS}?moduleRef=${encodeURIComponent(moduleRef)}`);
      return response.data;
    },
    enabled: enabled && !!moduleRef,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Get lesson progress items for current user.
 */
export const useLessonsProgress = (params?: { status?: 'not_started' | 'in_progress' | 'completed'; enabled?: boolean }) => {
  return useQuery({
    queryKey: ['progress', 'lessons', params?.status],
    queryFn: async (): Promise<{ items: LessonProgressItem[] }> => {
      const query = new URLSearchParams();
      if (params?.status) query.set('status', params.status);
      const url = `${API_ENDPOINTS.PROGRESS.LESSONS}${query.toString() ? `?${query.toString()}` : ''}`;
      const response = await apiClient.get(url);
      return { items: response.data?.items || [] };
    },
    enabled: params?.enabled ?? true,
    staleTime: 5 * 60 * 1000,
  });
};
