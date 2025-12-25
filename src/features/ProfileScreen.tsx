import React, { useEffect, useState } from 'react';
import { Screen, Loader, ProgressChart, LearningStatsChart, VocabularyChart } from '../components';
import { useUserStore } from '../store/user';
import { useProfile } from '../services/profile';
import { useEntitlements } from '../services/entitlements';
import { useVocabularyStats } from '../services/vocabularyStats';
import { useAppNavigation } from '../hooks/useAppNavigation';
import { APP_STATES } from '../utils/constants';
import { getTelegramUser, hapticFeedback } from '../utils/telegram';
import { tracking } from '../services/tracking';

export const ProfileScreen: React.FC = () => {
  const { user: storeUser, entitlement: storeEntitlement, hasActiveSubscription, setEntitlement } = useUserStore();
  const { navigateTo, setupBackButton } = useAppNavigation();
  
  const { data: profile, isLoading: profileLoading } = useProfile();
  // Используем данные из store как initialData, чтобы избежать запроса при монтировании
  // React Query будет использовать данные из store и обновит их в фоне, если они устарели
  const { data: entitlement, isLoading: entitlementLoading } = useEntitlements(
    storeUser?.userId || null,
    { 
      enabled: !!storeUser?.userId,
      initialData: storeEntitlement || undefined, // Используем данные из store как начальные
      staleTime: 5 * 60 * 1000, // 5 минут - данные считаются свежими
      // Если данные есть в store, запрос не будет выполнен сразу, только для обновления в фоне
    }
  );
  const { data: vocabularyStats, isLoading: vocabularyStatsLoading } = useVocabularyStats();

  // Синхронизируем данные из React Query обратно в store при обновлении
  useEffect(() => {
    if (entitlement && entitlement !== storeEntitlement) {
      setEntitlement(entitlement);
    }
  }, [entitlement, storeEntitlement, setEntitlement]);

  const isLoading = profileLoading || entitlementLoading || vocabularyStatsLoading;
  const telegramUser = getTelegramUser();
  
  // Реальные данные из API
  const realXP = profile?.xpTotal || 0;
  const realStreak = vocabularyStats?.streak?.current || 0;
  // TODO: Получить реальное количество завершенных уроков из API модулей
  // Пока используем моковые данные для количества уроков
  const completedLessons = 5; // Mock - нужно заменить на реальные данные из модулей
  const totalLessons = 23; // Mock - нужно заменить на реальные данные из модулей
  
  // Animation states
  const [animatedLessons, setAnimatedLessons] = useState(0);
  const [animatedXP, setAnimatedXP] = useState(0);
  const [animatedStreak, setAnimatedStreak] = useState(0);

  // Setup navigation
  useEffect(() => {
    setupBackButton();
  }, [setupBackButton]);

  // Animate statistics counters
  useEffect(() => {
    const targetLessons = completedLessons;
    const targetXP = realXP;
    const targetStreak = realStreak;

    const animateCounter = (
      target: number,
      setter: (value: number) => void,
      duration: number = 2000
    ) => {
      let start = 0;
      const increment = target / (duration / 16);
      const timer = setInterval(() => {
        start += increment;
        if (start >= target) {
          setter(target);
          clearInterval(timer);
        } else {
          setter(Math.floor(start));
        }
      }, 16);
      return timer;
    };

    const timer1 = animateCounter(targetLessons, setAnimatedLessons, 1500);
    const timer2 = animateCounter(targetXP, setAnimatedXP, 2000);
    const timer3 = animateCounter(targetStreak, setAnimatedStreak, 1800);

    return () => {
      clearInterval(timer1);
      clearInterval(timer2);
      clearInterval(timer3);
    };
  }, []);

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getSubscriptionStatus = () => {
    if (!entitlement) return null;

    const now = new Date();
    const endsAt = new Date(entitlement.endsAt);
    
    if (entitlement.status === 'active' && endsAt > now) {
      return {
        text: `Активна до ${formatDate(entitlement.endsAt)}`,
        color: 'text-green-600',
        isActive: true,
      };
    } else {
      return {
        text: 'Подписка истекла',
        color: 'text-red-600',
        isActive: false,
      };
    }
  };

  const subscriptionStatus = getSubscriptionStatus();

  if (isLoading) {
    return (
      <Screen className="flex items-center justify-center">
        <Loader size="lg" text="Загрузка профиля..." />
      </Screen>
    );
  }

  return (
    <Screen>
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="relative">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                <span className="text-white text-xl font-bold">
                  {(telegramUser?.first_name?.[0] || storeUser?.firstName?.[0] || 'U').toUpperCase()}
                </span>
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white" />
            </div>
            
            <div>
              <h1 className="text-xl font-bold text-telegram-text">
                {telegramUser?.first_name || profile?.firstName || 'Пользователь'}
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <div className="w-2 h-2 bg-blue-500 rounded-full" />
                <span className="text-sm text-telegram-hint">
                  {animatedXP} XP
                </span>
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span className="text-sm text-telegram-hint">
                  {animatedStreak} дней
                </span>
              </div>
            </div>
          </div>
          
          {/* Level Badge */}
          <div className="px-3 py-1 bg-yellow-100 rounded-full">
            <span className="text-yellow-800 text-sm font-medium">
              {profile?.proficiencyLevel === 'beginner' ? 'A1' : 
               profile?.proficiencyLevel === 'intermediate' ? 'B1' : 
               profile?.proficiencyLevel === 'advanced' ? 'C1' : 'A1'}
            </span>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {/* Completed */}
          <div className="bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl p-4 relative">
            <div className="flex items-center justify-between mb-2">
              <span className="text-blue-800 text-sm font-medium">Завершено</span>
              <div className="w-8 h-8 bg-blue-500 rounded-xl flex items-center justify-center">
                <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
            </div>
            <div className="text-2xl font-bold text-blue-800">
              {totalLessons > 0 ? Math.round((animatedLessons / totalLessons) * 100) : 0}%
            </div>
          </div>

          {/* Lessons */}
          <div className="bg-gradient-to-br from-purple-100 to-purple-200 rounded-2xl p-4 relative">
            <div className="flex items-center justify-between mb-2">
              <span className="text-purple-800 text-sm font-medium">Уроки</span>
              <div className="w-8 h-8 bg-purple-500 rounded-xl flex items-center justify-center">
                <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
                  <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
                </svg>
              </div>
            </div>
            <div className="text-2xl font-bold text-purple-800">
              {animatedLessons}/{totalLessons}
            </div>
          </div>

          {/* Hours */}
          <div className="bg-gradient-to-br from-pink-100 to-pink-200 rounded-2xl p-4 relative">
            <div className="flex items-center justify-between mb-2">
              <span className="text-pink-800 text-sm font-medium">Часы</span>
              <div className="w-8 h-8 bg-pink-500 rounded-xl flex items-center justify-center">
                <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12,6 12,12 16,14"/>
                </svg>
              </div>
            </div>
            <div className="text-2xl font-bold text-pink-800">
              {/* TODO: Получить реальное время из API */}
              {Math.round(animatedLessons * 0.5)}/12
            </div>
          </div>
        </div>

        {/* Progress & Categories */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-telegram-text">Прогресс обучения</h2>
            <span className="text-sm text-telegram-hint">
              {totalLessons > 0 ? Math.round((animatedLessons / totalLessons) * 100) : 0}% завершено
            </span>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full h-2 bg-gray-200 rounded-full mb-6 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${totalLessons > 0 ? (animatedLessons / totalLessons) * 100 : 0}%` }}
            />
          </div>

          {/* Categories */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gradient-to-br from-orange-100 to-red-200 rounded-2xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 12l2 2 4-4"/>
                  <path d="M21 12c-1 0-3-1-3-3s2-3 3-3 3 1 3 3-2 3-3 3"/>
                  <path d="M3 12c1 0 3-1 3-3s-2-3-3-3-3 1-3 3 2 3 3 3"/>
                </svg>
              </div>
              <div>
                <div className="font-semibold text-orange-800">Грамматика</div>
                <div className="text-sm text-orange-600">3 урока</div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-100 to-emerald-200 rounded-2xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
                  <polyline points="14,2 14,8 20,8"/>
                </svg>
              </div>
              <div>
                <div className="font-semibold text-green-800">Словарь</div>
                <div className="text-sm text-green-600">{animatedLessons - 3} уроков</div>
              </div>
            </div>
          </div>
        </div>

        {/* Subscription Status */}
        <div className="mb-6">
          <div className={`
            rounded-2xl p-4 border-2 transition-all duration-300
            ${subscriptionStatus?.isActive 
              ? 'bg-gradient-to-br from-green-50 to-emerald-100 border-green-200' 
              : 'bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200'
            }
          `}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`
                  w-10 h-10 rounded-xl flex items-center justify-center
                  ${subscriptionStatus?.isActive 
                    ? 'bg-green-500' 
                    : 'bg-gray-400'
                  }
                `}>
                  <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    {subscriptionStatus?.isActive ? (
                      <path d="M12 2L2 7v10c0 5.55 3.84 9.74 9 11 5.16-1.26 9-5.45 9-11V7l-10-5z"/>
                    ) : (
                      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                    )}
                  </svg>
                </div>
                <div>
                  <div className={`font-semibold ${subscriptionStatus?.isActive ? 'text-green-800' : 'text-gray-800'}`}>
                    {subscriptionStatus?.isActive ? 'Pro план' : 'Базовый план'}
                  </div>
                  <div className={`text-sm ${subscriptionStatus?.isActive ? 'text-green-600' : 'text-gray-600'}`}>
                    {subscriptionStatus?.text || 'Ограниченный доступ'}
                  </div>
                </div>
              </div>
              
              {!hasActiveSubscription() && (
                <button
                  onClick={() => {
                    hapticFeedback.impact('medium');
                    tracking.custom('profile_subscribe_clicked');
                    navigateTo(APP_STATES.PAYWALL);
                  }}
                  className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-xl hover:shadow-lg transform hover:scale-105 active:scale-95 transition-all duration-200"
                >
                  Upgrade
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Vocabulary Progress */}
        <div className="mb-6">
          <VocabularyChart />
        </div>

        {/* Progress Charts */}
        <div className="space-y-4 mb-6">
          <ProgressChart />
          <LearningStatsChart />
        </div>

        {/* Continue Learning Button */}
        <div className="relative group mb-6">
          <div className="absolute -inset-1 bg-gradient-to-r from-telegram-accent via-blue-500 to-purple-500 rounded-2xl blur-lg opacity-30 group-hover:opacity-50 transition-all duration-500" />
          <button
            onClick={() => {
              hapticFeedback.impact('heavy');
              tracking.custom('profile_continue_learning_clicked');
              navigateTo(APP_STATES.MODULES);
            }}
            className="relative w-full flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-telegram-accent via-blue-500 to-purple-500 hover:from-telegram-accent/90 hover:via-blue-500/90 hover:to-purple-500/90 text-white font-bold text-lg rounded-2xl shadow-2xl hover:shadow-3xl transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 ease-out border border-white/20 backdrop-blur-sm"
          >
            <div className="flex items-center gap-3">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polygon points="5 3 19 12 5 21 5 3"/>
              </svg>
              <span className="tracking-wide">Продолжить обучение</span>
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M5 12h14"/>
                <path d="M12 5l7 7-7 7"/>
              </svg>
            </div>
          </button>
        </div>

        {/* Additional Info */}
        {profile?.onboardingCompletedAt && (
          <div className="text-center text-telegram-hint text-sm mb-6">
            <p>Обучение начато {formatDate(profile.onboardingCompletedAt)}</p>
          </div>
        )}

      </div>
    </Screen>
  );
};
