import React, { useState, useEffect } from 'react';
import { Screen, Button, StepIndicator, ReminderTimeSelector, ProficiencyLevelSelector, LearningGoalsSelector, DailyGoalSelector } from '../components';
import { useUserStore } from '../store/user';
import { useCompleteOnboarding, useSaveLearningGoals, useSaveDailyGoal, useSaveReminderSettings } from '../services/auth';
import { useAppNavigation } from '../hooks/useAppNavigation';
import { tracking } from '../services/tracking';
import { APP_STATES } from '../utils/constants';
import { ProficiencyLevel, LearningGoal, DailyGoal } from '../utils/constants';
import { ReminderTime } from '../types';
import { hideMainButton, requestWriteAccess, hapticFeedback } from '../utils/telegram';




export const OnboardingScreen: React.FC = () => {
  const { user, setUser } = useUserStore();
  const { navigateTo } = useAppNavigation();
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedLevel, setSelectedLevel] = useState<ProficiencyLevel | null>(null);
  const [selectedGoals, setSelectedGoals] = useState<LearningGoal[]>([]);
  const [selectedDailyGoal, setSelectedDailyGoal] = useState<DailyGoal | null>(null);
  const [selectedReminderTime, setSelectedReminderTime] = useState<ReminderTime | null>(null);
  const [reminderEnabled, setReminderEnabled] = useState<boolean>(false);
  
  const completeOnboardingMutation = useCompleteOnboarding();
  const saveLearningGoalsMutation = useSaveLearningGoals();
  const saveDailyGoalMutation = useSaveDailyGoal();
  const saveReminderSettingsMutation = useSaveReminderSettings();

  // Track onboarding started
  useEffect(() => {
    tracking.onboardingStarted();
  }, []);

  // Hide Telegram Main Button since we use interface button
  useEffect(() => {
    hideMainButton();
    return () => hideMainButton();
  }, []);

  const handleNextStep = async () => {
    try {
      if (currentStep === 1 && selectedLevel) {
        setCurrentStep(2);
        return;
      }
      if (currentStep === 2) {
        if (selectedGoals.length > 0 && user?.userId) {
          await saveLearningGoalsMutation.mutateAsync({
            userId: user.userId,
            goals: selectedGoals,
          });
          setCurrentStep(3);
        }
        return;
      }
      if (currentStep === 3) {
        if (selectedDailyGoal && user?.userId) {
          await saveDailyGoalMutation.mutateAsync({
            userId: user.userId,
            dailyGoalMinutes: selectedDailyGoal,
            allowsNotifications: reminderEnabled,
          });
          setCurrentStep(4);
        }
        return;
      }
      if (currentStep === 4) {
        await handleComplete();
        return;
      }
    } catch (error) {
      console.error('Failed to save onboarding step:', error);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleStepClick = (step: number) => {
    // Allow navigation only to previous steps or if current step is valid
    if (step < currentStep || 
        (step === 1 && selectedLevel) || 
        (step === 2 && selectedLevel && selectedGoals.length > 0) ||
        (step === 3 && selectedLevel && selectedGoals.length > 0 && selectedDailyGoal) ||
        (step === 4 && selectedLevel && selectedGoals.length > 0 && selectedDailyGoal)) {
      setCurrentStep(step);
    }
  };

  const handleComplete = async () => {
    if (!selectedLevel || !user?.userId) return;

    try {
      // Save learning goals first (mock API)
      if (selectedGoals.length > 0) {
        await saveLearningGoalsMutation.mutateAsync({
          userId: user.userId,
          goals: selectedGoals,
        });
      }

      // Save daily goal (mock API) - only if selected
      if (selectedDailyGoal) {
        await saveDailyGoalMutation.mutateAsync({
          userId: user.userId,
          dailyGoalMinutes: selectedDailyGoal,
          allowsNotifications: reminderEnabled,
        });
      }

      // Save reminder settings if enabled
      if (reminderEnabled && selectedReminderTime) {
        await saveReminderSettingsMutation.mutateAsync({
          userId: user.userId,
          reminderSettings: {
            enabled: true,
            time: selectedReminderTime,
            allowsNotifications: true,
          },
        });
      }

      // Complete onboarding
      await completeOnboardingMutation.mutateAsync({
        userId: user.userId,
        proficiencyLevel: selectedLevel,
        learningGoals: selectedGoals,
      });

      // Update user state
      setUser({
        ...user,
        proficiencyLevel: selectedLevel,
        onboardingCompletedAt: new Date(),
      });

      // Track completion
      tracking.onboardingCompleted(selectedLevel);

      // Navigate to levels selection
      navigateTo(APP_STATES.LEVELS);
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
      // Could show error message to user here
    }
  };


  const handleSkip = () => {
    if (currentStep === 2) {
      setCurrentStep(3);
    } else if (currentStep === 3) {
      setCurrentStep(4);
    } else if (currentStep === 4) {
      handleComplete();
    }
  };

  const handleEnableReminders = async () => {
    if (!selectedReminderTime) return;

    try {
      hapticFeedback.selection();
      const granted = await requestWriteAccess();
      
      if (granted) {
        setReminderEnabled(true);
        hapticFeedback.notification('success');
        // Save reminder settings immediately, then complete onboarding
        if (user?.userId) {
          await saveReminderSettingsMutation.mutateAsync({
            userId: user.userId,
            reminderSettings: {
              enabled: true,
              time: selectedReminderTime,
              allowsNotifications: true,
            },
          });
        }
        await handleComplete();
      } else {
        hapticFeedback.notification('error');
        // Still allow to continue without reminders
        setReminderEnabled(false);
      }
    } catch (error) {
      console.error('Failed to request write access:', error);
      hapticFeedback.notification('error');
      setReminderEnabled(false);
    }
  };


  const isLoading = completeOnboardingMutation.isPending || saveLearningGoalsMutation.isPending || saveDailyGoalMutation.isPending || saveReminderSettingsMutation.isPending;

  return (
    <Screen>
      <div className="max-w-md mx-auto">
        {/* Step Indicator */}
        <StepIndicator 
          currentStep={currentStep} 
          totalSteps={4} 
          onStepClick={handleStepClick}
          allowNavigation={true}
        />

        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-telegram-text mb-4 leading-tight">
            {currentStep === 1 && '👋 Привет!'}
            {currentStep === 2 && '🎯 Расскажите о ваших целях'}
            {currentStep === 3 && '⏰ Сколько времени готовы уделять?'}
            {currentStep === 4 && '🔔 Включить напоминания?'}
          </h1>
          <p className="text-telegram-hint text-base leading-relaxed px-4">
            {currentStep === 1 && 'Давайте узнаем ваш уровень английского, чтобы подобрать идеальные уроки специально для вас ✨'}
            {currentStep === 2 && 'Для чего изучаете английский? Это поможет нам создать персональную программу обучения 🚀'}
            {currentStep === 3 && 'Выберите комфортное для вас время ежедневных занятий. Можно изменить в любой момент! 😊'}
            {currentStep === 4 && 'Мы будем мягко напоминать о занятиях, чтобы вы не забывали о своей цели. Это действительно помогает! 💪'}
          </p>
        </div>

        {/* Step 1: Level Selection */}
        {currentStep === 1 && (
          <div className="mb-8">
            <ProficiencyLevelSelector
              value={selectedLevel}
              onChange={(value) => setSelectedLevel(value)}
            />
          </div>
        )}

        {/* Step 2: Goals Selection */}
        {currentStep === 2 && (
          <div className="mb-8">
            <div className="text-center mb-6">
              <p className="text-telegram-hint text-sm">
                💡 Выберите всё, что подходит
              </p>
            </div>
            
            <LearningGoalsSelector
              values={selectedGoals}
              onChange={(values) => setSelectedGoals(values)}
            />
          </div>
        )}

        {/* Step 3: Daily Goal Selection */}
        {currentStep === 3 && (
          <div className="mb-8">
            <DailyGoalSelector
              value={selectedDailyGoal}
              onChange={(value) => setSelectedDailyGoal(value)}
            />
          </div>
        )}

        {/* Step 4: Reminder Settings */}
        {currentStep === 4 && (
          <div className="mb-8">
            <ReminderTimeSelector
              value={selectedReminderTime}
              onChange={(value) => setSelectedReminderTime(value)}
            />

            <p className="mt-6 text-xs text-telegram-hint/70 text-center">
              Настройки можно изменить в любое время
            </p>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="space-y-3 mb-4">
          {/* Next/Complete Button */}
          {currentStep === 1 && (
            <Button
              fullWidth
              size="lg"
              disabled={!selectedLevel}
              isLoading={isLoading}
              onClick={handleNextStep}
            >
              Далее
            </Button>
          )}

          {/* Step 2: Next or Skip */}
          {currentStep === 2 && (
            <>
              <Button
                fullWidth
                size="lg"
                disabled={selectedGoals.length === 0}
                isLoading={isLoading}
                onClick={handleNextStep}
              >
                Далее
              </Button>
              <button
                onClick={handleSkip}
                disabled={isLoading}
                className="text-telegram-hint hover:text-telegram-accent text-center py-2 text-sm transition-colors duration-200 disabled:opacity-50"
              >
                Сделаю позже
              </button>
            </>
          )}

          {/* Step 3: Next or Skip */}
          {currentStep === 3 && (
            <>
              <Button
                fullWidth
                size="lg"
                disabled={!selectedDailyGoal}
                isLoading={isLoading}
                onClick={handleNextStep}
              >
                Далее
              </Button>
              <button
                onClick={handleSkip}
                disabled={isLoading}
                className="text-telegram-hint hover:text-telegram-accent text-center py-2 text-sm transition-colors duration-200 disabled:opacity-50"
              >
                Сделаю позже
              </button>
            </>
          )}

          {/* Step 4: Enable reminders or Skip */}
          {currentStep === 4 && (
            <>
              <Button
                fullWidth
                size="lg"
                disabled={!selectedReminderTime}
                isLoading={isLoading}
                onClick={handleEnableReminders}
              >
                Включить напоминания
              </Button>
              <button
                onClick={handleSkip}
                disabled={isLoading}
                className="text-telegram-hint hover:text-telegram-accent text-center py-2 text-sm transition-colors duration-200 disabled:opacity-50"
              >
                Сделаю позже
              </button>
            </>
          )}

          {/* Back Button */}
          {currentStep > 1 && (
            <Button
              variant="ghost"
              fullWidth
              size="lg"
              onClick={handlePrevStep}
              disabled={isLoading}
              className="mt-2"
            >
              Назад
            </Button>
          )}
        </div>

        {/* Info */}
        <div className="text-center">
          <p className="text-telegram-hint text-sm leading-relaxed">
            {currentStep === 1 && '🌟 Не переживайте, уровень всегда можно скорректировать'}
            {currentStep === 2 && '🎯 Это поможет нам лучше понять ваши потребности'}
            {currentStep === 3 && '⚡ Даже 5 минут в день принесут заметный результат'}
            {currentStep === 4 && '🚀 Регулярность — ключ к успеху в изучении языка'}
          </p>
        </div>
      </div>
    </Screen>
  );
};
