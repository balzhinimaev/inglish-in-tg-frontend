import React, { useEffect, useState } from 'react';
import { Screen, Card, Button, Loader, LessonProgress, TaskRenderer } from '../components';
import { useUserStore } from '../store/user';
import { useDetailedLesson } from '../services/content';
import { useEntitlements } from '../services/entitlements';
import { useAppNavigation } from '../hooks/useAppNavigation';
import { useTrackAction } from '../hooks/useYandexMetrika';
import { tracking } from '../services/tracking';
import { APP_STATES } from '../utils/constants';
import { hideMainButton, hapticFeedback } from '../utils/telegram';

interface LessonScreenProps {}

export const LessonScreen: React.FC<LessonScreenProps> = () => {
  const { user, hasActiveSubscription } = useUserStore();
  const { navigateTo, setupBackButton, navigationParams } = useAppNavigation();
  const { trackLessonStart, trackLessonComplete } = useTrackAction();
  
  // Get lessonRef from navigation parameters
  const lessonRef = navigationParams?.lessonRef || '';
  
  
  const [hasStartedLesson, setHasStartedLesson] = useState(false);
  const [lessonStartTime, setLessonStartTime] = useState<Date | null>(null);
  
  // Step-by-step lesson state
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [completedTasks, setCompletedTasks] = useState<number[]>([]);
  const [, setTaskAnswers] = useState<Record<number, any>>({});
  const [showResults, setShowResults] = useState(false);
  
  // Fetch lesson and subscription data
  const { data: lessonData, isLoading: lessonLoading, error: lessonError } = useDetailedLesson({ 
    lessonRef, 
    lang: 'ru' 
  });
  const { isLoading: entitlementLoading } = useEntitlements(user?.userId || null);
  
  const lesson = lessonData?.lesson;
  const tasks = lesson?.tasks || [];
  const currentTask = tasks[currentTaskIndex];


  const isLoading = lessonLoading || entitlementLoading;

  // Setup navigation
  useEffect(() => {
    setupBackButton();
  }, [setupBackButton]);

  // Track lesson start
  useEffect(() => {
    if (lesson && !hasStartedLesson) {
      tracking.lessonStarted(lesson.lessonRef);
      // Track in Yandex.Metrika
      trackLessonStart(lesson.lessonRef, lesson.moduleRef);
      setHasStartedLesson(true);
      setLessonStartTime(new Date());
    }
  }, [lesson, hasStartedLesson, trackLessonStart]);

  // Initialize lesson state based on progress
  useEffect(() => {
    if (lesson?.progress?.lastTaskIndex !== undefined) {
      setCurrentTaskIndex(lesson.progress.lastTaskIndex);
    }
  }, [lesson]);

  // Hide Telegram Main Button since we use interface button
  useEffect(() => {
    hideMainButton();
    return () => hideMainButton();
  }, []);

  const handleTaskAnswer = (answer: any) => {
    hapticFeedback.selection();
    
    // Save the answer
    setTaskAnswers(prev => ({
      ...prev,
      [currentTaskIndex]: answer
    }));
    
    // Mark task as completed
    if (!completedTasks.includes(currentTaskIndex)) {
      setCompletedTasks(prev => [...prev, currentTaskIndex]);
    }
    
    // Track task completion
    if (lesson && currentTask) {
      tracking.custom('task_completed', {
        lessonRef: lesson.lessonRef,
        taskRef: currentTask.ref,
        taskType: currentTask.type,
        taskIndex: currentTaskIndex,
        answer: answer
      });
    }
    
    // Move to next task or show results
    if (currentTaskIndex < tasks.length - 1) {
      setCurrentTaskIndex(prev => prev + 1);
    } else {
      setShowResults(true);
      handleCompleteLesson();
    }
  };

  const handleTaskSkip = () => {
    hapticFeedback.impact('light');
    
    // Track skip
    if (lesson && currentTask) {
      tracking.custom('task_skipped', {
        lessonRef: lesson.lessonRef,
        taskRef: currentTask.ref,
        taskType: currentTask.type,
        taskIndex: currentTaskIndex
      });
    }
    
    // Move to next task
    if (currentTaskIndex < tasks.length - 1) {
      setCurrentTaskIndex(prev => prev + 1);
    } else {
      setShowResults(true);
      handleCompleteLesson();
    }
  };

  const handlePreviousTask = () => {
    if (currentTaskIndex > 0) {
      hapticFeedback.selection();
      setCurrentTaskIndex(prev => prev - 1);
    }
  };

  const handleCompleteLesson = () => {
    if (!hasStartedLesson || !lessonStartTime || !lesson) return;

    const duration = Math.floor((Date.now() - lessonStartTime.getTime()) / 1000);
    const score = Math.round((completedTasks.length / tasks.length) * 100);
    
    tracking.lessonCompleted(lesson.lessonRef, duration);
    // Track in Yandex.Metrika
    trackLessonComplete(lesson.lessonRef, lesson.moduleRef);
    tracking.custom('lesson_completed_detailed', {
      lessonRef: lesson.lessonRef,
      duration,
      score,
      completedTasks: completedTasks.length,
      totalTasks: tasks.length
    });

    // Check if user has subscription for continued access
    if (hasActiveSubscription()) {
      // User has subscription, could navigate to next lesson
      // For now, just show completion message and go back to lessons list
      setTimeout(() => {
        alert(`Урок завершён! Ваш результат: ${score}% 🎉`);
        navigateTo(APP_STATES.LESSONS_LIST, {
          moduleRef: lesson.moduleRef,
          moduleTitle: 'Модуль'
        });
      }, 1500);
    } else {
      // No subscription, show paywall after lesson
      setTimeout(() => {
        navigateTo(APP_STATES.PAYWALL);
      }, 1500);
    }
  };


  if (isLoading) {
    return (
      <Screen className="flex items-center justify-center">
        <Loader size="lg" text="Загрузка урока..." />
      </Screen>
    );
  }

  if (lessonError) {
    return (
      <Screen className="flex items-center justify-center">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="15" y1="9" x2="9" y2="15"/>
              <line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
          </div>
          <h2 className="text-xl font-bold text-telegram-text mb-2">Ошибка загрузки урока</h2>
          <p className="text-sm text-telegram-hint mb-4">Проверьте подключение к интернету и попробуйте снова.</p>
          <div className="space-y-3">
            <Button 
              fullWidth
              onClick={() => navigateTo(APP_STATES.LESSONS_LIST, {
                moduleRef: navigationParams?.moduleRef,
                moduleTitle: navigationParams?.moduleTitle || 'Модуль'
              })}
              className="bg-telegram-accent text-white"
            >
              ← Вернуться к урокам
            </Button>
          </div>
        </div>
      </Screen>
    );
  }

  if (!lesson) {
    return (
      <Screen className="flex items-center justify-center">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="15" y1="9" x2="9" y2="15"/>
              <line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
          </div>
          
          <h2 className="text-xl font-bold text-telegram-text mb-2">
            Урок не найден
          </h2>
          
          <p className="text-sm text-telegram-hint mb-4">
            Попробуйте выбрать урок заново
          </p>
          
          <div className="space-y-3">
            <Button 
              fullWidth
              onClick={() => {
                // Try to go back to lessons list if we have moduleRef
                const moduleRef = navigationParams?.moduleRef;
                if (moduleRef) {
                  navigateTo(APP_STATES.LESSONS_LIST, {
                    moduleRef,
                    moduleTitle: navigationParams?.moduleTitle || 'Модуль'
                  });
                } else {
                  navigateTo(APP_STATES.MODULES);
                }
              }}
              className="bg-telegram-accent text-white"
            >
              ← Вернуться к урокам
            </Button>
            
            <Button 
              variant="ghost"
              fullWidth
              onClick={() => navigateTo(APP_STATES.LEVELS)}
            >
              Главная страница
            </Button>
          </div>
        </div>
      </Screen>
    );
  }

  // Show results screen
  if (showResults) {
    const score = Math.round((completedTasks.length / tasks.length) * 100);
    
    return (
      <Screen>
        <div className="max-w-md mx-auto">
          {/* Results Header */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-r from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <path d="M9 12l2 2 4-4"/>
              </svg>
            </div>
            
            <h1 className="text-2xl font-bold text-telegram-text mb-2">
              Урок завершён!
            </h1>
            <p className="text-telegram-hint mb-4">
              Отличная работа! 🎉
            </p>
            
            {/* Score Display */}
            <div className="bg-telegram-secondary-bg rounded-xl p-4 mb-6">
              <div className="text-3xl font-bold text-telegram-accent mb-2">
                {score}%
              </div>
              <div className="text-sm text-telegram-hint">
                Выполнено {completedTasks.length} из {tasks.length} заданий
              </div>
            </div>
          </div>

          {/* XP Reward */}
          {lesson?.xpReward && (
            <Card className="mb-6 text-center">
              <div className="flex items-center justify-center gap-2 text-telegram-accent">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
                <span className="font-semibold">+{lesson.xpReward} XP</span>
              </div>
            </Card>
          )}

          {/* Actions */}
          <div className="space-y-3">
            <Button
              fullWidth
              size="lg"
              onClick={() => navigateTo(APP_STATES.LESSONS_LIST, {
                moduleRef: lesson?.moduleRef,
                moduleTitle: 'Модуль'
              })}
              className="bg-telegram-accent hover:bg-telegram-accent/90 text-white"
            >
              Продолжить обучение
            </Button>

            <Button
              variant="ghost"
              fullWidth
              onClick={() => {
                setShowResults(false);
                setCurrentTaskIndex(0);
                setCompletedTasks([]);
                setTaskAnswers({});
              }}
            >
              Пройти урок заново
            </Button>
          </div>

          {/* Subscription reminder */}
          {!hasActiveSubscription() && (
            <div className="mt-6 p-4 bg-gradient-to-r from-telegram-accent/10 to-blue-500/10 border border-telegram-accent/20 rounded-xl">
              <p className="text-sm text-telegram-text text-center">
                ✨ Открыть полный доступ ко всем урокам с подпиской
              </p>
            </div>
          )}
        </div>
      </Screen>
    );
  }

  return (
    <Screen>
      <div className="max-w-md mx-auto">
        {/* Header with Breadcrumb */}
        <div className="mb-6">
          {/* Back to Lessons Button */}
          <div className="flex items-center gap-2 mb-4">
            <button
              onClick={() => navigateTo(APP_STATES.LESSONS_LIST, {
                moduleRef: lesson?.moduleRef,
                moduleTitle: 'Модуль'
              })}
              className="flex items-center gap-1 px-3 py-2 text-sm text-telegram-hint hover:text-telegram-text transition-colors rounded-lg hover:bg-telegram-secondary-bg"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 18l-6-6 6-6"/>
              </svg>
              <span>Уроки</span>
            </button>
          </div>

          {/* Lesson Title */}
          <div className="text-center mb-4">
            <h1 className="text-2xl font-bold text-telegram-text mb-2">
              {lesson?.title}
            </h1>
            <p className="text-telegram-hint">
              {lesson?.description}
            </p>
          </div>

          {/* Progress Bar */}
          <LessonProgress
            currentTask={currentTaskIndex}
            totalTasks={tasks.length}
            className="mb-4"
          />

          {/* Task Type Badge */}
          {currentTask && (
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="px-3 py-1 bg-telegram-accent/10 text-telegram-accent rounded-full text-xs font-medium uppercase">
                {currentTask.type === 'flashcard' && '🃏 Карточка'}
                {currentTask.type === 'multiple_choice' && '❓ Выбор'}
                {currentTask.type === 'listening' && '👂 Аудирование'}
                {currentTask.type === 'gap_fill' && '📝 Пропуски'}
                {currentTask.type === 'matching' && '🔗 Сопоставление'}
              </div>
              
              <div className="text-xs text-telegram-hint">
                ⏱ ~{Math.ceil((lesson?.estimatedMinutes || 0) / tasks.length)} мин
              </div>
            </div>
          )}
        </div>

        {/* Current Task */}
        {currentTask ? (
          <div className="mb-6">
            <TaskRenderer
              task={currentTask}
              onAnswer={handleTaskAnswer}
              onSkip={handleTaskSkip}
            />
          </div>
        ) : (
          <Card className="p-6">
            <p className="text-telegram-hint text-center">
              Нет доступных заданий
            </p>
          </Card>
        )}

        {/* Navigation Controls */}
        <div className="space-y-3">
          {/* Progress indicator - always visible */}
          <div className="text-center">
            <div className="text-xs text-telegram-hint">
              {currentTaskIndex + 1} / {tasks.length}
            </div>
          </div>
          
          {/* Buttons - responsive layout */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
            <Button
              variant="ghost"
              onClick={handlePreviousTask}
              disabled={currentTaskIndex === 0}
              className="flex items-center justify-center gap-2 disabled:opacity-50 order-2 sm:order-1"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 18l-6-6 6-6"/>
              </svg>
              Назад
            </Button>

            <Button
              variant="ghost"
              onClick={handleTaskSkip}
              className="flex items-center justify-center gap-2 text-telegram-hint order-1 sm:order-2"
            >
              Пропустить
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 18l6-6-6-6"/>
              </svg>
            </Button>
          </div>
        </div>
      </div>
    </Screen>
  );
};
