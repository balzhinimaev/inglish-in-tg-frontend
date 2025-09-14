import { useMutation, useQuery } from '@tanstack/react-query';
import apiClient from './api';
import { API_ENDPOINTS } from '../utils/constants';
import { AuthVerifyResponse, BackendAuthVerifyResponse, OnboardingCompleteRequest, OnboardingStatusResponse, SaveReminderSettingsRequest, User, JwtPayload } from '../types';
import { LearningGoal, DailyGoal } from '../utils/constants';
import { getTelegramInitData, getTelegramUser } from '../utils/telegram';

/**
 * JWT Token utilities
 */
export const jwtUtils = {
  /**
   * Parse JWT token and extract payload
   */
  parseToken: (token: string): JwtPayload | null => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('Failed to parse JWT token:', error);
      return null;
    }
  },

  /**
   * Check if JWT token is expired
   */
  isTokenExpired: (token: string): boolean => {
    const payload = jwtUtils.parseToken(token);
    if (!payload) return true;
    
    const now = Math.floor(Date.now() / 1000);
    return payload.exp < now;
  },

  /**
   * Get token from localStorage
   */
  getStoredToken: (): string | null => {
    return localStorage.getItem('accessToken');
  },

  /**
   * Store token in localStorage
   */
  storeToken: (token: string): void => {
    localStorage.setItem('accessToken', token);
  },

  /**
   * Remove token from localStorage
   */
  removeToken: (): void => {
    localStorage.removeItem('accessToken');
  },
};

/**
 * Convert Telegram user to frontend User type
 */
const convertApiUserToUser = (telegramUser: any): User => {
  return {
    userId: telegramUser.id,
    firstName: telegramUser.first_name,
    lastName: telegramUser.last_name,
    username: telegramUser.username,
    languageCode: telegramUser.language_code,
    photoUrl: telegramUser.photo_url,
    // These fields will be set from authData
    onboardingCompletedAt: undefined,
    proficiencyLevel: undefined,
    firstUtm: undefined,
    lastUtm: undefined,
    isFirstOpen: undefined,
  };
};

/**
 * Verify user authentication with Telegram initData and get JWT token
 */
export const useVerifyUser = () => {
  return useQuery({
    queryKey: ['auth', 'verify'],
    queryFn: async (): Promise<AuthVerifyResponse> => {
      console.log('Making auth verify request to:', API_ENDPOINTS.AUTH.VERIFY);
      const response = await apiClient.get(API_ENDPOINTS.AUTH.VERIFY);

      console.log('Auth verify response:', {
        status: response.status,
        data: response.data,
        headers: response.headers
      });

      console.log('Full response data:', JSON.stringify(response.data, null, 2));

      const data = response.data as BackendAuthVerifyResponse;
      
      // Store JWT token if received
      if (data.accessToken) {
        jwtUtils.storeToken(data.accessToken);
        console.log('JWT token stored');
      } else {
        console.warn('No accessToken in response:', data);
      }

      // Convert backend response to frontend format
      const convertedData: AuthVerifyResponse = {
        ...data,
        userId: parseInt(data.userId), // Convert string to number for frontend
        proficiencyLevel: data.englishLevel, // Map englishLevel to proficiencyLevel
      };

      return convertedData;
    },
    staleTime: 0, // Always refetch on mount
    retry: 3,
    retryDelay: 1000,
    // Ensure we only call verify when Telegram initData is present
    enabled: !!getTelegramInitData(),
  });
};

/**
 * Hook to handle authentication flow
 */
export const useAuth = () => {
  const { data: authData, isLoading, error } = useVerifyUser();
  
  // Get user data from Telegram directly since backend doesn't return user object
  const telegramUser = getTelegramUser();
  const user = telegramUser ? convertApiUserToUser(telegramUser) : null;
  
  console.log('useAuth hook state:', {
    authData,
    isLoading,
    error,
    hasAccessToken: !!authData?.accessToken,
    hasUser: !!user,
    telegramUser
  });
  
  return {
    authData,
    isLoading,
    error,
    isAuthenticated: !!authData?.accessToken,
    user,
  };
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
