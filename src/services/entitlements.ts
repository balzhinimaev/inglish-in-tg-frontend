import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import apiClient from './api';
import { API_ENDPOINTS } from '../utils/constants';
import { Entitlement } from '../types';

/**
 * Get user entitlements (subscription status)
 * Returns the user's subscription entitlement or null if no subscription exists
 */
export const useEntitlements = (
  userId: number | null,
  options?: Partial<UseQueryOptions<Entitlement | null, Error>>
) => {
  return useQuery({
    queryKey: ['entitlements', userId],
    queryFn: async (): Promise<Entitlement | null> => {
      if (!userId) throw new Error('User ID is required');
      
      try {
        const response = await apiClient.get(`${API_ENDPOINTS.ENTITLEMENTS.GET}/${userId}`);
        // API returns null if no subscription exists, or an Entitlement object
        return response.data ?? null;
      } catch (error: any) {
        // If 404 (not found), treat as no subscription (return null)
        // This handles the case where backend returns 404 for users without subscriptions
        if (error.response?.status === 404) {
          return null;
        }
        // For other errors, rethrow
        throw error;
      }
    },
    enabled: !!userId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: (failureCount, error: any) => {
      // Don't retry on 404 (no subscription is a valid state)
      if (error?.response?.status === 404) {
        return false;
      }
      // Retry up to 3 times for other errors
      return failureCount < 3;
    },
    ...options,
  });
};
