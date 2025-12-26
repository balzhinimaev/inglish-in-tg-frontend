import React, { useEffect } from 'react';
import { Screen, Card } from '../components';
import { useUserStore } from '../store/user';
import { useAppNavigation } from '../hooks/useAppNavigation';
import { APP_STATES, MODULE_LEVELS, type ModuleLevel } from '../utils/constants';
import { tracking } from '../services/tracking';
import { hapticFeedback, hideBackButton, getTelegramUser } from '../utils/telegram';

// Level metadata for display
const LEVEL_DATA: Record<ModuleLevel, { 
  title: string; 
  description: string; 
  color: string;
  bgGradient: string;
  icon: string;
}> = {
  A0: {
    title: 'Starter',
    description: 'Абсолютный новичок',
    color: 'text-emerald-600',
    bgGradient: 'from-emerald-100 to-emerald-200',
    icon: '🌱',
  },
  A1: {
    title: 'Beginner',
    description: 'Базовые слова и фразы',
    color: 'text-green-600',
    bgGradient: 'from-green-100 to-green-200',
    icon: '🌿',
  },
  A2: {
    title: 'Elementary',
    description: 'Простые диалоги',
    color: 'text-lime-600',
    bgGradient: 'from-lime-100 to-lime-200',
    icon: '🌳',
  },
  B1: {
    title: 'Intermediate',
    description: 'Уверенное общение',
    color: 'text-blue-600',
    bgGradient: 'from-blue-100 to-blue-200',
    icon: '💪',
  },
  B2: {
    title: 'Upper-Intermediate',
    description: 'Свободное общение',
    color: 'text-indigo-600',
    bgGradient: 'from-indigo-100 to-indigo-200',
    icon: '🚀',
  },
  C1: {
    title: 'Advanced',
    description: 'Профессиональный уровень',
    color: 'text-purple-600',
    bgGradient: 'from-purple-100 to-purple-200',
    icon: '⭐',
  },
  C2: {
    title: 'Proficiency',
    description: 'Владение на уровне носителя',
    color: 'text-pink-600',
    bgGradient: 'from-pink-100 to-pink-200',
    icon: '👑',
  },
};

const LEVELS_ORDER: ModuleLevel[] = ['A0', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

export const LevelsScreen: React.FC = () => {
  const { user, hasActiveSubscription } = useUserStore();
  const telegramUser = getTelegramUser();
  const { navigateTo } = useAppNavigation();

  useEffect(() => {
    // Hide back button on levels screen (main screen)
    hideBackButton();
  }, []);

  // Preload likely next screens' code-split chunks in background
  useEffect(() => {
    import('./ModulesScreen');
    import('./PaywallScreen');
    import('./ProfileScreen');
  }, []);

  const handleLevelClick = (level: ModuleLevel) => {
    hapticFeedback.impact('medium');
    tracking.custom('level_clicked', { level });
    
    // Navigate to modules screen with selected level
    navigateTo(APP_STATES.MODULES, { level });
  };

  return (
    <Screen>
      <div className="max-w-md mx-auto">
        {/* Profile Button - Above Header */}
        <div className="flex justify-center mb-4 max-[300px]:mb-2">
          <button
            onClick={() => {
              hapticFeedback.impact('light');
              tracking.custom('levels_profile_button_clicked');
              navigateTo(APP_STATES.PROFILE);
            }}
            className="flex items-center gap-2 px-3 py-2 bg-telegram-card-bg hover:bg-telegram-secondary-bg border border-telegram-hint/20 rounded-full transition-all duration-200 hover:scale-105 active:scale-95 shadow-sm group max-[300px]:px-2 max-[300px]:py-1.5 max-[300px]:gap-1"
          >
            {/* Avatar */}
            <div className="relative">
              {user?.photoUrl ? (
                <img 
                  src={user.photoUrl} 
                  alt="Profile"
                  className="w-8 h-8 rounded-full border-2 border-telegram-hint/30 max-[300px]:w-6 max-[300px]:h-6 max-[300px]:border"
                />
              ) : (
                <div className="w-8 h-8 bg-gradient-to-br from-telegram-accent to-blue-500 rounded-full flex items-center justify-center max-[300px]:w-6 max-[300px]:h-6">
                  <span className="text-white text-sm font-semibold max-[300px]:text-xs">
                    {(telegramUser?.first_name?.[0] || user?.firstName?.[0] || 'У').toUpperCase()}
                  </span>
                </div>
              )}
              
              {/* Subscription indicator */}
              {hasActiveSubscription() && (
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-telegram-accent rounded-full border-2 border-telegram-bg flex items-center justify-center max-[300px]:w-2 max-[300px]:h-2 max-[300px]:border">
                  <svg className="w-1.5 h-1.5 text-white max-[300px]:w-1 max-[300px]:h-1" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9 12l2 2 4-4"/>
                  </svg>
                </div>
              )}
            </div>
            
            {/* User info */}
            <div className="hidden sm:flex flex-col items-start min-w-0 max-[300px]:hidden">
              <span className="text-sm font-medium text-telegram-text truncate max-w-20">
                {telegramUser?.first_name || user?.firstName || 'Профиль'}
              </span>
              <span className="text-xs text-telegram-hint">
                {user?.proficiencyLevel === 'beginner' ? 'A1-A2' :
                 user?.proficiencyLevel === 'intermediate' ? 'B1-B2' :
                 user?.proficiencyLevel === 'advanced' ? 'C1-C2' : 'Новичок'}
              </span>
            </div>
            
            {/* Arrow icon */}
            <svg className="w-4 h-4 text-telegram-hint group-hover:text-telegram-text transition-colors max-[300px]:w-3 max-[300px]:h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 18l6-6-6-6"/>
            </svg>
          </button>
        </div>

        {/* Header */}
        <div className="text-center mb-8 max-[300px]:mb-4">
          <h1 className="text-2xl font-bold text-telegram-text mb-3 max-[300px]:text-xl max-[300px]:mb-2">
            Выберите уровень
          </h1>
          <p className="text-telegram-hint text-lg max-[300px]:text-base max-[300px]:px-2">
            Начните обучение с подходящего уровня
          </p>
        </div>

        {/* Levels Grid */}
        <div className="space-y-3 max-[300px]:space-y-2">
          {LEVELS_ORDER.map((level, index) => {
            const levelData = LEVEL_DATA[level];
            
            return (
              <Card 
                key={level} 
                clickable 
                onClick={() => handleLevelClick(level)}
                className="max-[300px]:px-3 max-[300px]:py-3 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
              >
                <div className="flex items-center gap-4 max-[300px]:gap-2.5">
                  {/* Level Badge with Icon */}
                  <div className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center shrink-0 bg-gradient-to-br ${levelData.bgGradient} max-[300px]:w-10 max-[300px]:h-10 max-[300px]:rounded-xl`}>
                    <span className="text-xl max-[300px]:text-sm">{levelData.icon}</span>
                    <span className={`text-xs font-bold ${levelData.color} max-[300px]:text-[10px]`}>
                      {level}
                    </span>
                  </div>

                  {/* Level Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 max-[300px]:mb-0">
                      <h3 className="font-semibold text-lg text-telegram-text max-[300px]:text-base max-[300px]:leading-tight">
                        {levelData.title}
                      </h3>
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full bg-gradient-to-r ${levelData.bgGradient} ${levelData.color} max-[300px]:px-1.5 max-[300px]:text-[10px]`}>
                        {level}
                      </span>
                    </div>
                    <p className="text-sm text-telegram-hint max-[300px]:text-xs max-[300px]:leading-tight">
                      {levelData.description}
                    </p>
                  </div>

                  {/* Arrow */}
                  <div className="shrink-0">
                    <svg className="w-5 h-5 text-telegram-hint max-[300px]:w-4 max-[300px]:h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  </div>
                </div>

                {/* Progress indicator - можно добавить позже, когда будет API для прогресса по уровням */}
                {/* <div className="mt-3 max-[300px]:mt-2">
                  <div className="w-full h-1.5 rounded-full bg-telegram-secondary-bg overflow-hidden">
                    <div
                      className={`h-full bg-gradient-to-r ${levelData.bgGradient.replace('from-', 'from-').replace('to-', 'to-')} rounded-full transition-all`}
                      style={{ width: '0%' }}
                    />
                  </div>
                </div> */}
              </Card>
            );
          })}
        </div>

        {/* Info section */}
        <div className="mt-8 mb-4 max-[300px]:mt-4 max-[300px]:mb-2">
          <div className="bg-telegram-secondary-bg rounded-2xl p-4 max-[300px]:p-3 max-[300px]:rounded-xl">
            <div className="flex items-start gap-3 max-[300px]:gap-2">
              <div className="w-10 h-10 bg-telegram-accent/20 rounded-xl flex items-center justify-center shrink-0 max-[300px]:w-8 max-[300px]:h-8 max-[300px]:rounded-lg">
                <svg className="w-5 h-5 text-telegram-accent max-[300px]:w-4 max-[300px]:h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M12 16v-4"/>
                  <path d="M12 8h.01"/>
                </svg>
              </div>
              <div>
                <h4 className="font-semibold text-telegram-text mb-1 max-[300px]:text-sm">
                  Не знаете свой уровень?
                </h4>
                <p className="text-sm text-telegram-hint max-[300px]:text-xs">
                  Начните с уровня A0 или A1 — система адаптируется под ваш темп обучения
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Screen>
  );
};

