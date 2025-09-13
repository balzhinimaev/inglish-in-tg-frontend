import { useOnboardingStatus } from './auth';

/**
 * Список защищенных endpoints, которые требуют завершенного онбординга
 */
export const PROTECTED_ENDPOINTS = [
  '/content/lesson1',
  '/content/paywall',
  '/entitlements',
  '/events',
] as const;

/**
 * Список незащищенных endpoints, доступ к которым разрешен без онбординга
 */
export const UNPROTECTED_ENDPOINTS = [
  '/content/onboarding',
  '/auth/verify',
  '/auth/onboarding/status',
  '/profile/onboarding/complete',
  '/payments/webhook',
] as const;

/**
 * Hook для проверки требований онбординга
 */
export const useOnboardingGuard = (userId: number | null) => {
  const { data: onboardingStatus, isLoading, error } = useOnboardingStatus(userId);

  return {
    isLoading,
    error,
    onboardingCompleted: onboardingStatus?.onboardingCompleted ?? false,
    proficiencyLevel: onboardingStatus?.proficiencyLevel ?? null,
    onboardingRequired: onboardingStatus?.onboardingRequired ?? true,
    
    /**
     * Проверяет, разрешен ли доступ к endpoint
     */
    isEndpointAccessAllowed: (endpoint: string): boolean => {
      // Если онбординг не завершен, проверяем список незащищенных endpoints
      if (!onboardingStatus?.onboardingCompleted) {
        return UNPROTECTED_ENDPOINTS.some(unprotectedEndpoint => 
          endpoint.startsWith(unprotectedEndpoint)
        );
      }
      
      // Если онбординг завершен, доступ ко всем endpoints
      return true;
    },

    /**
     * Проверяет, нужно ли блокировать основной функционал
     */
    shouldBlockAccess: (): boolean => {
      return Boolean(onboardingStatus?.onboardingRequired && !onboardingStatus?.onboardingCompleted);
    },

    /**
     * Получает информацию о состоянии онбординга для UI
     */
    getOnboardingState: () => ({
      completed: onboardingStatus?.onboardingCompleted ?? false,
      required: onboardingStatus?.onboardingRequired ?? true,
      proficiencyLevel: onboardingStatus?.proficiencyLevel ?? null,
      shouldShowOnboarding: Boolean(
        onboardingStatus?.onboardingRequired && 
        !onboardingStatus?.onboardingCompleted
      ),
    }),
  };
};

/**
 * Utility функция для проверки endpoint без hook (для использования в services)
 */
export const isEndpointProtected = (endpoint: string): boolean => {
  return !UNPROTECTED_ENDPOINTS.some(unprotectedEndpoint => 
    endpoint.startsWith(unprotectedEndpoint)
  );
};

/**
 * Типы для состояния онбординга
 */
export interface OnboardingState {
  completed: boolean;
  required: boolean;
  proficiencyLevel: 'beginner' | 'intermediate' | 'advanced' | null;
  shouldShowOnboarding: boolean;
}
