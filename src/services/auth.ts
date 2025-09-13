import { useMutation, useQuery } from '@tanstack/react-query';
import apiClient from './api';
import { API_ENDPOINTS } from '../utils/constants';
import { AuthVerifyResponse, OnboardingCompleteRequest, OnboardingStatusResponse, SaveReminderSettingsRequest } from '../types';
import { LearningGoal, DailyGoal } from '../utils/constants';
import { getTelegramInitData } from '../utils/telegram';

/**
 * Verify user authentication with Telegram initData
 */
export const useVerifyUser = () => {
  return useQuery({
    queryKey: ['auth', 'verify'],
    queryFn: async (): Promise<AuthVerifyResponse> => {
      const initData = getTelegramInitData();
      const endpoint = `${API_ENDPOINTS.AUTH.VERIFY}${initData ? `?${initData}` : ''}`;
      const response = await apiClient.get(endpoint);

      return response.data as AuthVerifyResponse;
    },
    staleTime: 0, // Always refetch on mount
    retry: 3,
    retryDelay: 1000,
    // Ensure we only call verify when Telegram initData is present
    enabled: !!getTelegramInitData(),
  });
};

/**
 * Get onboarding status for a user
 */
export const useOnboardingStatus = (userId: number | null) => {
  return useQuery({
    queryKey: ['auth', 'onboarding', 'status', userId],
    queryFn: async (): Promise<OnboardingStatusResponse> => {
      if (!userId) throw new Error('User ID is required');
      
      const response = await apiClient.get(`${API_ENDPOINTS.AUTH.ONBOARDING_STATUS}/${userId}`);
      return response.data as OnboardingStatusResponse;
    },
    enabled: !!userId,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
};

/**
 * Save user learning goals
 */
export const useSaveLearningGoals = () => {
  return useMutation({
    mutationFn: async (data: { userId: number; goals: LearningGoal[] }): Promise<{ success: boolean }> => {
      const response = await apiClient.post(API_ENDPOINTS.PROFILE.LEARNING_GOALS, {
        userId: data.userId,
        goals: data.goals,
      });
      return response.data;
    },
  });
};

/**
 * Save user daily goal
 */
export const useSaveDailyGoal = () => {
  return useMutation({
    mutationFn: async (data: { userId: number; dailyGoalMinutes: DailyGoal; allowsNotifications: boolean }): Promise<{ success: boolean }> => {
      const response = await apiClient.post(API_ENDPOINTS.PROFILE.DAILY_GOAL, {
        userId: data.userId,
        dailyGoalMinutes: data.dailyGoalMinutes,
        notificationsAllowed: data.allowsNotifications
      });
      return response.data;
    },
  });
};

/**
 * Save reminder settings
 */
export const useSaveReminderSettings = () => {
  return useMutation({
    mutationFn: async (data: SaveReminderSettingsRequest): Promise<{ success: boolean }> => {
      const response = await apiClient.post(API_ENDPOINTS.PROFILE.REMINDER_SETTINGS, {
        userId: data.userId,
        reminderSettings: {
          enabled: data.reminderSettings.enabled,
          time: data.reminderSettings.time,
        },
        notificationsAllowed: data.reminderSettings.allowsNotifications,
      });
      return response.data;
    },
  });
};

/**
 * Complete user onboarding
 */
export const useCompleteOnboarding = () => {
  return useMutation({
    mutationFn: async (data: OnboardingCompleteRequest) => {
      const response = await apiClient.patch(
        API_ENDPOINTS.PROFILE.ONBOARDING_COMPLETE,
        data
      );
      return response.data;
    },
  });
};
