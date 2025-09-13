import { useQuery } from '@tanstack/react-query';
import apiClient from './api';
import { API_ENDPOINTS } from '../utils/constants';
import { User, ProfileResponse } from '../types';

/**
 * Get user profile data
 */
export const useProfile = (userId: number | null) => {
  return useQuery({
    queryKey: ['profile', userId],
    queryFn: async (): Promise<User> => {
      if (!userId) throw new Error('User ID is required');
      
      const response = await apiClient.get(`${API_ENDPOINTS.PROFILE.GET}/${userId}`);
      const profileData = response.data as ProfileResponse;
      
      // Преобразуем строковые даты в Date объекты
      const user: User = {
        ...profileData.user,
        onboardingCompletedAt: profileData.user.onboardingCompletedAt 
          ? new Date(profileData.user.onboardingCompletedAt)
          : undefined,
      };
      
      return user;
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
