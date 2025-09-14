import React, { useEffect } from 'react';
import { Screen, Loader } from '../components';
import { useUserStore } from '../store/user';
import { useVerifyUser } from '../services/auth';
import { useAppNavigation } from '../hooks/useAppNavigation';
import { APP_STATES } from '../utils/constants';
import { getTelegramUser, isDesktopBrowser } from '../utils/telegram';
import { User } from '../types';

export const LoaderScreen: React.FC = () => {
  const { setUser, setLoading, setError } = useUserStore();
  const { navigateTo } = useAppNavigation();
  
  // Check if user is on desktop browser (not in Telegram app)
  useEffect(() => {
    if (isDesktopBrowser()) {
      console.log('Desktop browser detected, showing QR bridge screen');
      navigateTo(APP_STATES.DESKTOP_BRIDGE);
      return;
    }
  }, [navigateTo]);
  
  const { data: authData, isLoading, error } = useVerifyUser();

  useEffect(() => {
    setLoading(isLoading);
  }, [isLoading, setLoading]);

  useEffect(() => {
    if (error) {
      console.error('Authentication failed:', error);
      setError('Ошибка авторизации. Попробуйте перезапустить приложение.');
      navigateTo(APP_STATES.ERROR);
      return;
    }

    if (authData) {
      // Получаем данные пользователя из Telegram
      const telegramUser = getTelegramUser();
      
      // Создаем объект User, комбинируя данные из Telegram и backend
      const user: User = {
        userId: authData.userId,
        firstName: telegramUser?.first_name,
        lastName: telegramUser?.last_name,
        username: telegramUser?.username,
        languageCode: telegramUser?.language_code,
        onboardingCompletedAt: authData.onboardingCompleted ? new Date() : undefined,
        proficiencyLevel: authData.proficiencyLevel,
        firstUtm: authData.utm,
        lastUtm: authData.utm,
        isFirstOpen: authData.isFirstOpen,
      };

      setUser(user);
      setError(null);

      // Определяем следующий экран на основе состояния онбординга
      if (!authData.onboardingCompleted) {
        navigateTo(APP_STATES.ONBOARDING);
      } else {
        // После онбординга открываем список модулей
        navigateTo(APP_STATES.MODULES);
      }
    }
  }, [authData, error, setUser, setError, navigateTo]);

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
