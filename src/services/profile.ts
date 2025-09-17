import { useQuery } from '@tanstack/react-query';
import apiClient from './api';
import { API_ENDPOINTS } from '../utils/constants';
import { User, ProfileResponse } from '../types';

/**
 * Get user profile data
 */
export const useProfile = () => {
  return useQuery({
    queryKey: ['profile'],
    queryFn: async (): Promise<User> => {
      const response = await apiClient.get(API_ENDPOINTS.PROFILE.GET);
      const profileData = response.data as ProfileResponse;
      
      // Преобразуем строковые даты в Date объекты
      const user: User = {
        ...profileData.user,
        onboardingCompletedAt: profileData.user.onboardingCompletedAt 
          ? new Date(profileData.user.onboardingCompletedAt)
          : undefined,
        createdAt: profileData.user.createdAt 
          ? new Date(profileData.user.createdAt)
          : undefined,
        updatedAt: profileData.user.updatedAt 
          ? new Date(profileData.user.updatedAt)
          : undefined,
      };
      
      return user;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
