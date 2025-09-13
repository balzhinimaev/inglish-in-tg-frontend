import { useQuery } from '@tanstack/react-query';
import apiClient from './api';
import { API_ENDPOINTS } from '../utils/constants';
import { Entitlement } from '../types';

/**
 * Get user entitlements (subscription status)
 */
export const useEntitlements = (userId: number | null) => {
  return useQuery({
    queryKey: ['entitlements', userId],
    queryFn: async (): Promise<Entitlement | null> => {
      if (!userId) throw new Error('User ID is required');
      
      const response = await apiClient.get(`${API_ENDPOINTS.ENTITLEMENTS.GET}/${userId}`);
      return response.data;
    },
    enabled: !!userId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 3,
  });
};
