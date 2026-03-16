import { useMutation } from '@tanstack/react-query';
import apiClient from './api';
import { API_ENDPOINTS } from '../utils/constants';

export interface StartLessonSessionRequest {
  moduleRef?: string;
  lessonRef?: string;
  source?: 'reminder' | 'home' | 'deeplink' | 'unknown';
}

export interface StartLessonSessionResponse {
  sessionId: string;
}

export interface SubmitAnswerRequest {
  lessonRef: string;
  taskRef: string;
  userAnswer: string;
  durationMs?: number;
  variantKey?: string;
  sessionId?: string;
  lastTaskIndex?: number;
  isLastTask?: boolean;
}

export interface SubmitAnswerResponse {
  attemptId: string;
  isCorrect: boolean;
  score: number;
  feedback?: string;
  correctAnswer?: string;
  explanation?: string;
}

export const useStartLessonSession = () => {
  return useMutation({
    mutationFn: async (data: StartLessonSessionRequest): Promise<StartLessonSessionResponse> => {
      const response = await apiClient.post(API_ENDPOINTS.PROGRESS.SESSIONS_START, data);
      return response.data;
    },
  });
};

export const useSubmitAnswer = () => {
  return useMutation({
    mutationFn: async (data: SubmitAnswerRequest): Promise<SubmitAnswerResponse> => {
      const idempotencyKey =
        typeof crypto !== 'undefined' && 'randomUUID' in crypto
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

      const response = await apiClient.post(API_ENDPOINTS.PROGRESS.SUBMIT_ANSWER, data, {
        headers: {
          'Idempotency-Key': idempotencyKey,
        },
      });
      return response.data;
    },
  });
};

export const useEndLessonSession = () => {
  return useMutation({
    mutationFn: async ({ sessionId, extraXp }: { sessionId: string; extraXp?: number }) => {
      const response = await apiClient.post(`${API_ENDPOINTS.PROGRESS.SESSIONS_END}/${sessionId}/end`, {
        extraXp,
      });
      return response.data as { ok: boolean };
    },
  });
};
