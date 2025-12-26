import { useCallback } from 'react';
import { useUserStore } from '../store/user';
import { APP_STATES } from '../utils/constants';
import type { AppState } from '../types';
import { hapticFeedback, showBackButton, hideBackButton } from '../utils/telegram';

export const useAppNavigation = () => {
  const { appState, setAppState, previousScreen, previousScreenParams, navigationParams } = useUserStore();

  const navigateTo = useCallback((screen: AppState, params?: Record<string, any>) => {
    hapticFeedback.selection();
    setAppState(screen, params);
  }, [setAppState]);

  const goBack = useCallback(() => {
    if (previousScreen) {
      hapticFeedback.impact('light');
      setAppState(previousScreen, previousScreenParams);
    }
  }, [previousScreen, previousScreenParams, setAppState]);

  const canGoBack = useCallback(() => {
    return previousScreen !== null && previousScreen !== APP_STATES.LOADING;
  }, [previousScreen]);

  // Setup back button for Telegram
  const setupBackButton = useCallback(() => {
    if (canGoBack()) {
      showBackButton(goBack);
    } else {
      hideBackButton();
    }
  }, [canGoBack, goBack]);

  return {
    currentScreen: appState,
    navigationParams,
    navigateTo,
    goBack,
    canGoBack: canGoBack(),
    setupBackButton,
    
    // Specific navigation functions
    goToOnboarding: () => navigateTo(APP_STATES.ONBOARDING),
    goToLevels: () => navigateTo(APP_STATES.LEVELS),
    goToModules: (level?: string) => navigateTo(APP_STATES.MODULES, level ? { level } : {}),
    goToLessonsList: (moduleRef: string, moduleTitle?: string) => 
      navigateTo(APP_STATES.LESSONS_LIST, { moduleRef, moduleTitle }),
    goToLesson: (lessonRef?: string) => navigateTo(APP_STATES.LESSON, { lessonRef }),
    goToPaywall: () => navigateTo(APP_STATES.PAYWALL),
    goToProfile: () => navigateTo(APP_STATES.PROFILE),
    goToError: () => navigateTo(APP_STATES.ERROR),
  };
};
