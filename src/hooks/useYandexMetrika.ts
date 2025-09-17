import { useEffect } from 'react';
import { useUserStore } from '../store/user';
import { trackPageView, trackEvent } from '../utils/yandexMetrika';
import { APP_STATES } from '../utils/constants';

// Hook to track screen changes in SPA
export const useYandexMetrika = () => {
  const { appState, navigationParams } = useUserStore();

  useEffect(() => {
    // Track screen changes
    const getScreenName = (state: string) => {
      switch (state) {
        case APP_STATES.LOADING:
          return 'loading';
        case APP_STATES.DESKTOP_BRIDGE:
          return 'desktop-bridge';
        case APP_STATES.ONBOARDING:
          return 'onboarding';
        case APP_STATES.MODULES:
          return 'modules';
        case APP_STATES.LESSONS_LIST:
          return `lessons-list-${navigationParams.moduleRef || 'unknown'}`;
        case APP_STATES.LESSON:
          return 'lesson';
        case APP_STATES.VOCABULARY_TEST:
          return `vocabulary-test-${navigationParams.moduleRef || 'unknown'}`;
        case APP_STATES.PAYWALL:
          return 'paywall';
        case APP_STATES.PROFILE:
          return 'profile';
        case APP_STATES.ERROR:
          return 'error';
        default:
          return 'unknown';
      }
    };

    const screenName = getScreenName(appState);
    const url = `/${screenName}`;
    const title = `Screen: ${screenName}`;

    // Track page view
    trackPageView(url, title);

    // Track custom screen view event
    trackEvent('screen_view', 'navigation', screenName);
  }, [appState, navigationParams]);
};

// Hook for tracking specific user actions
export const useTrackAction = () => {
  const trackLessonStart = (lessonId: string, moduleRef: string) => {
    trackEvent('lesson_start', 'learning', `${moduleRef}-${lessonId}`);
  };

  const trackLessonComplete = (lessonId: string, moduleRef: string) => {
    trackEvent('lesson_complete', 'learning', `${moduleRef}-${lessonId}`);
  };

  const trackModuleStart = (moduleRef: string) => {
    trackEvent('module_start', 'learning', moduleRef);
  };

  const trackModuleComplete = (moduleRef: string) => {
    trackEvent('module_complete', 'learning', moduleRef);
  };

  const trackPaywallView = () => {
    trackEvent('paywall_view', 'conversion');
  };

  const trackPurchase = (productId: string, price: number) => {
    trackEvent('purchase', 'conversion', productId, price);
  };

  const trackProfileAction = (action: string) => {
    trackEvent('profile_action', 'user', action);
  };

  return {
    trackLessonStart,
    trackLessonComplete,
    trackModuleStart,
    trackModuleComplete,
    trackPaywallView,
    trackPurchase,
    trackProfileAction,
  };
};
