import React, { useEffect } from 'react';
import { Screen, Loader } from '../components';
import { useUserStore } from '../store/user';
import { useAuth } from '../services/auth';
import { useAppNavigation } from '../hooks/useAppNavigation';
import { APP_STATES } from '../utils/constants';
import { isDesktopBrowser } from '../utils/telegram';

export const LoaderScreen: React.FC = () => {
  const { setLoading, setError, login } = useUserStore();
  const { navigateTo } = useAppNavigation();
  
  // Always call hooks first (React rules)
  const { authData, isLoading, error, isAuthenticated, user } = useAuth();
  
  // Check desktop after hooks
  const isDesktop = isDesktopBrowser();
  
  // Desktop detection effect
  useEffect(() => {
    // More conservative detection - only show QR if definitely desktop
    const shouldShowQR = isDesktop && !window.Telegram?.WebApp?.initDataUnsafe?.user;
    
    if (shouldShowQR) {
      if (import.meta.env.VITE_ENABLE_DEBUG_LOGGING) {
        console.log('Showing QR bridge screen - desktop browser without Telegram user');
      }
      navigateTo(APP_STATES.DESKTOP_BRIDGE);
      return;
    }
  }, [navigateTo, isDesktop]);

  // Loading state effect
  useEffect(() => {
    setLoading(isLoading);
  }, [isLoading, setLoading]);

  // Auth data processing effect
  useEffect(() => {
    console.log('LoaderScreen auth effect:', {
      isDesktop,
      shouldShowQR: isDesktop && !window.Telegram?.WebApp?.initDataUnsafe?.user,
      error,
      authData,
      isAuthenticated,
      user,
      isLoading
    });

    // Skip auth logic if showing QR screen
    const shouldShowQR = isDesktop && !window.Telegram?.WebApp?.initDataUnsafe?.user;
    if (shouldShowQR) {
      return;
    }

    if (error) {
      console.error('Authentication failed:', error);
      setError('Ошибка авторизации. Попробуйте перезапустить приложение.');
      navigateTo(APP_STATES.ERROR);
      return;
    }

    if (authData && isAuthenticated && user) {
      console.log('Login user with data:', { user, accessToken: authData.accessToken });
      
      // Update user with data from authData
      const updatedUser = {
        ...user,
        onboardingCompletedAt: authData.onboardingCompleted ? new Date() : undefined,
        proficiencyLevel: authData.proficiencyLevel || undefined,
        isFirstOpen: authData.isFirstOpen,
      };
      
      // Login user with JWT token
      login(updatedUser, authData.accessToken);
      setError(null);

      // Определяем следующий экран на основе состояния онбординга
      if (!authData.onboardingCompleted) {
        console.log('Navigating to onboarding');
        navigateTo(APP_STATES.ONBOARDING);
      } else {
        console.log('Navigating to modules');
        // После онбординга открываем список модулей
        navigateTo(APP_STATES.MODULES);
      }
    }
  }, [authData, error, isAuthenticated, user, login, setError, navigateTo, isDesktop, isLoading]);

  // Don't show loader if showing QR screen
  const shouldShowQR = isDesktop && !window.Telegram?.WebApp?.initDataUnsafe?.user;
  if (shouldShowQR) {
    return null;
  }

  return (
    <Screen className="flex items-center justify-center">
      <Loader
        size="xl"
        text="Загрузка приложения..."
        fullScreen={false}
      />
    </Screen>
  );
};
