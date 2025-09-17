import { useQuery } from '@tanstack/react-query';
import apiClient from './api';
import { API_ENDPOINTS } from '../utils/constants';
import { VocabularyStatsResponse } from '../types';

/**
 * Get vocabulary statistics for the current user
 */
export const useVocabularyStats = () => {
  return useQuery({
    queryKey: ['vocabulary-stats'],
    queryFn: async (): Promise<VocabularyStatsResponse> => {
      const response = await apiClient.get(API_ENDPOINTS.VOCABULARY.STATS);
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 3,
  });
};

/**
 * Get vocabulary statistics for a specific module
 */
export const useModuleVocabularyStats = (moduleRef: string | null) => {
  return useQuery({
    queryKey: ['vocabulary-stats', 'module', moduleRef],
    queryFn: async (): Promise<VocabularyStatsResponse> => {
      if (!moduleRef) throw new Error('Module reference is required');
      
      const response = await apiClient.get(`${API_ENDPOINTS.VOCABULARY.STATS}/module/${moduleRef}`);
      return response.data;
    },
    enabled: !!moduleRef,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 3,
  });
};
