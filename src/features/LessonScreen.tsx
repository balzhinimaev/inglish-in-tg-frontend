import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Screen, Card, Button, Loader, LessonProgress, TaskRenderer } from '../components';
import { Breadcrumbs } from './LessonsListScreen/Breadcrumbs';
import { useUserStore } from '../store/user';
import { useDetailedLesson } from '../services/content';
import { useEntitlements } from '../services/entitlements';
import { useEndLessonSession, useStartLessonSession, useSubmitAnswer } from '../services/lessonRuntime';
import { serializeAnswer } from '../services/answerSerializer';
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
  const runtimeStorageKey = useMemo(() => `lesson_runtime:${lessonRef}`, [lessonRef]);

  const [hasStartedLesson, setHasStartedLesson] = useState(false);
  const [lessonStartTime, setLessonStartTime] = useState<Date | null>(null);
  
  // Step-by-step lesson state
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [completedTasks, setCompletedTasks] = useState<number[]>([]);
  const [, setTaskAnswers] = useState<Record<number, any>>({});
  const [showResults, setShowResults] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [lastValidation, setLastValidation] = useState<{ isCorrect: boolean; feedback?: string; explanation?: string } | null>(null);
  const [runtimeError, setRuntimeError] = useState<string | null>(null);
  const taskStartedAtRef = useRef<number>(Date.now());
  
  // Fetch lesson and subscription data
  const { data: lessonData, isLoading: lessonLoading, error: lessonError } = useDetailedLesson({ 
    lessonRef, 
    lang: 'ru' 
  });
  const { isLoading: entitlementLoading } = useEntitlements(user?.userId || null);
  const startSession = useStartLessonSession();
  const submitAnswer = useSubmitAnswer();
  const endSession = useEndLessonSession();

  const lesson = lessonData?.lesson;
  const tasks = lesson?.tasks || [];
  const currentTask = tasks[currentTaskIndex];


  const isLoading = lessonLoading || entitlementLoading;

  const parseRuntimeError = (error: any): string => {
    const status = error?.response?.status;
    const payload = error?.response?.data;
    const messageObj = payload?.message;
    const code = payload?.code || payload?.errorCode || payload?.error || messageObj?.error;
    const message = typeof messageObj === 'string' ? messageObj : (messageObj?.message || payload?.error);

    if (code === 'PREREQ_NOT_MET') {
      return 'Этот урок пока недоступен: сначала заверши предыдущий.';
    }

    if (status === 403 && String(message || '').toLowerCase().includes('prereq')) {
      return 'Этот урок пока недоступен: сначала заверши предыдущий.';
    }

    if (status === 400) {
      return 'Некорректный формат ответа. Попробуй ещё раз.';
    }

    if (status === 401) {
      return 'Сессия истекла. Перезапусти мини‑приложение.';
    }

    return 'Не удалось отправить ответ. Проверь интернет и попробуй ещё раз.';
  };

  const getTaskTypeBadge = (type?: string) => {
    switch (type) {
      case 'flashcard':
        return '🃏 Карточка';
      case 'multiple_choice':
      case 'choice':
        return '❓ Выбор';
      case 'listening':
      case 'listen':
        return '👂 Аудирование';
      case 'gap_fill':
      case 'gap':
        return '📝 Пропуски';
      case 'matching':
      case 'match':
        return '🔗 Сопоставление';
      case 'order':
        return '🧩 Порядок';
      case 'translate':
        return '🌐 Перевод';
      case 'speak':
        return '🎤 Произношение';
      default:
        return '📘 Задание';
    }
  };

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

  // Start backend runtime session once lesson is loaded
  useEffect(() => {
    if (!lesson || sessionId || startSession.isPending) return;

    startSession
      .mutateAsync({
        moduleRef: lesson.moduleRef,
        lessonRef: lesson.lessonRef,
        source: 'home',
      })
      .then((res) => setSessionId(res.sessionId))
      .catch((e) => {
        if (import.meta.env.VITE_ENABLE_DEBUG_LOGGING) {
          console.warn('Failed to start lesson session', e);
        }
        const message = parseRuntimeError(e);
        setRuntimeError(message);
        tracking.custom('lesson_runtime_error', {
          lessonRef: lesson.lessonRef,
          stage: 'start-session',
          message,
        });
      });
  }, [lesson, sessionId, startSession]);

  // Initialize lesson state based on progress + local recovery snapshot
  useEffect(() => {
    if (!lesson) return;

    let recoveredIndex: number | undefined;
    let recoveredSessionId: string | undefined;

    try {
      const raw = localStorage.getItem(runtimeStorageKey);
      if (raw) {
        const parsed = JSON.parse(raw) as { currentTaskIndex?: number; sessionId?: string; lessonRef?: string };
        if (parsed.lessonRef === lesson.lessonRef) {
          recoveredIndex = parsed.currentTaskIndex;
          recoveredSessionId = parsed.sessionId;
        }
      }
    } catch {
      // ignore corrupted local recovery data
    }

    if (typeof recoveredIndex === 'number' && recoveredIndex >= 0) {
      setCurrentTaskIndex(Math.min(recoveredIndex, Math.max(0, tasks.length - 1)));
      tracking.custom('lesson_runtime_recovered', {
        lessonRef: lesson.lessonRef,
        recoveredTaskIndex: recoveredIndex,
      });
    } else if (lesson?.progress?.lastTaskIndex !== undefined) {
      setCurrentTaskIndex(lesson.progress.lastTaskIndex);
    }

    if (recoveredSessionId) {
      setSessionId(recoveredSessionId);
    }
  }, [lesson, runtimeStorageKey, tasks.length]);

  useEffect(() => {
    taskStartedAtRef.current = Date.now();
    setLastValidation(null);

    tracking.custom('task_seen', {
      lessonRef,
      taskIndex: currentTaskIndex,
    });
  }, [currentTaskIndex, lessonRef]);

  // Persist runtime snapshot for session recovery
  useEffect(() => {
    if (!lessonRef) return;
    try {
      localStorage.setItem(
        runtimeStorageKey,
        JSON.stringify({
          lessonRef,
          currentTaskIndex,
          sessionId,
          updatedAt: Date.now(),
        }),
      );
    } catch {
      // ignore storage errors
    }
  }, [lessonRef, runtimeStorageKey, currentTaskIndex, sessionId]);

  // Hide Telegram Main Button since we use interface button
  useEffect(() => {
    hideMainButton();
    return () => hideMainButton();
  }, []);

  const handleTaskAnswer = async (answer: any) => {
    if (submitAnswer.isPending) return;
    hapticFeedback.selection();

    // Save the answer locally for UX/debug
    setTaskAnswers(prev => ({
      ...prev,
      [currentTaskIndex]: answer
    }));

    if (!lesson || !currentTask) return;

    const durationMs = Math.max(0, Date.now() - taskStartedAtRef.current);
    const isLastTask = currentTaskIndex >= tasks.length - 1;

    try {
      setRuntimeError(null);
      const validation = await submitAnswer.mutateAsync({
        lessonRef: lesson.lessonRef,
        taskRef: currentTask.ref,
        userAnswer: serializeAnswer(currentTask as any, answer),
        durationMs,
        sessionId: sessionId || undefined,
        lastTaskIndex: tasks.length - 1,
        isLastTask,
      });

      const isCorrect = Boolean(validation.isCorrect);

      setLastValidation({
        isCorrect,
        feedback: validation.feedback,
        explanation: validation.explanation || (currentTask.data as any)?.explanation,
      });

      tracking.custom('task_answer_result', {
        lessonRef: lesson.lessonRef,
        taskRef: currentTask.ref,
        taskIndex: currentTaskIndex,
        isCorrect,
        score: validation.score,
        durationMs,
      });

      if (!isCorrect) {
        hapticFeedback.notification('error');
        tracking.custom('task_answer_incorrect', {
          lessonRef: lesson.lessonRef,
          taskRef: currentTask.ref,
          taskType: currentTask.type,
          taskIndex: currentTaskIndex,
        });
        return;
      }

      if (!completedTasks.includes(currentTaskIndex)) {
        setCompletedTasks(prev => [...prev, currentTaskIndex]);
      }

      tracking.custom('task_completed', {
        lessonRef: lesson.lessonRef,
        taskRef: currentTask.ref,
        taskType: currentTask.type,
        taskIndex: currentTaskIndex,
      });

      if (!isLastTask) {
        setTimeout(() => setCurrentTaskIndex(prev => prev + 1), 700);
      } else {
        setShowResults(true);
        handleCompleteLesson();
      }
    } catch (e) {
      console.error('submit-answer failed', e);
      const message = parseRuntimeError(e);
      setRuntimeError(message);
      tracking.custom('lesson_runtime_error', {
        lessonRef: lesson.lessonRef,
        taskRef: currentTask.ref,
        taskIndex: currentTaskIndex,
        message,
      });
    }
  };

  const handleTaskSkip = () => {
    if (submitAnswer.isPending) return;
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

  const handleCompleteLesson = async () => {
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

    if (sessionId) {
      try {
        await endSession.mutateAsync({ sessionId });
      } catch (e) {
        console.warn('Failed to end lesson session', e);
        setRuntimeError(parseRuntimeError(e));
      }
    }

    try {
      localStorage.removeItem(runtimeStorageKey);
    } catch {
      // ignore
    }

    // Остаёмся на экране результатов — пользователь сам выбирает следующий шаг.
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
                moduleTitle: navigationParams?.moduleTitle || 'Модуль',
                level: navigationParams?.level,
                _overridePreviousScreen: APP_STATES.MODULES,
                _overridePreviousScreenParams: { level: navigationParams?.level }
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
                    moduleTitle: navigationParams?.moduleTitle || 'Модуль',
                    level: navigationParams?.level,
                    _overridePreviousScreen: APP_STATES.MODULES,
                    _overridePreviousScreenParams: { level: navigationParams?.level }
                  });
                } else {
                  navigateTo(APP_STATES.MODULES, { level: navigationParams?.level });
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
                moduleTitle: navigationParams?.moduleTitle || 'Модуль',
                level: navigationParams?.level,
                _overridePreviousScreen: APP_STATES.MODULES,
                _overridePreviousScreenParams: { level: navigationParams?.level }
              })}
              className="bg-telegram-accent hover:bg-telegram-accent/90 text-white"
            >
              Продолжить обучение
            </Button>

            {!hasActiveSubscription() && (
              <Button
                fullWidth
                variant="ghost"
                onClick={() => navigateTo(APP_STATES.PAYWALL)}
              >
                Открыть Pro
              </Button>
            )}

            <Button
              variant="ghost"
              fullWidth
              onClick={() => {
                setShowResults(false);
                setCurrentTaskIndex(0);
                setCompletedTasks([]);
                setTaskAnswers({});
                setSessionId(null);
                try {
                  localStorage.removeItem(runtimeStorageKey);
                } catch {
                  // ignore
                }
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

  const handleNavigateToLessons = () => {
    hapticFeedback.selection();
    navigateTo(APP_STATES.LESSONS_LIST, {
      moduleRef: lesson?.moduleRef,
      moduleTitle: navigationParams?.moduleTitle || 'Модуль',
      level: navigationParams?.level,
      _overridePreviousScreen: APP_STATES.MODULES,
      _overridePreviousScreenParams: { level: navigationParams?.level }
    });
  };

  const handleNavigateToModules = () => {
    hapticFeedback.selection();
    navigateTo(APP_STATES.MODULES, { level: navigationParams?.level });
  };

  return (
    <Screen>
      <div className="max-w-md mx-auto">
        {/* Header with Breadcrumb */}
        <div className="mb-6">
          {/* Breadcrumbs */}
          <Breadcrumbs
            moduleTitle={navigationParams?.moduleTitle || 'Модуль'}
            onModulesClick={handleNavigateToModules}
            lessonTitle={lesson?.title}
            onLessonsClick={handleNavigateToLessons}
          />

          {/* Lesson Description */}
          {lesson?.description && (
            <p className="text-telegram-hint text-center text-sm mb-4">
              {lesson.description}
            </p>
          )}

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
                {getTaskTypeBadge(currentTask.type)}
              </div>

              <div className="text-xs text-telegram-hint">
                ⏱ ~{tasks.length > 0 ? Math.max(1, Math.ceil((lesson?.estimatedMinutes || 0) / tasks.length)) : 1} мин
              </div>
            </div>
          )}
        </div>

        {/* Runtime Error */}
        {runtimeError && (
          <Card className="mb-4 border border-red-500/30">
            <div className="text-sm text-red-300">{runtimeError}</div>
          </Card>
        )}

        {/* Current Task */}
        {currentTask ? (
          <div className="mb-6">
            {lastValidation && (
              <Card className={`mb-3 ${lastValidation.isCorrect ? 'border border-green-500/30' : 'border border-orange-500/30'}`}>
                <div className="text-sm">
                  <div className={lastValidation.isCorrect ? 'text-green-400 font-semibold' : 'text-orange-400 font-semibold'}>
                    {lastValidation.isCorrect ? 'Верно ✅' : 'Почти, попробуй ещё 💡'}
                  </div>
                  {lastValidation.feedback && <div className="text-telegram-hint mt-1">{lastValidation.feedback}</div>}
                  {lastValidation.explanation && <div className="text-telegram-hint mt-1">{lastValidation.explanation}</div>}
                </div>
              </Card>
            )}
            <TaskRenderer
              key={currentTask.ref}
              task={currentTask}
              onAnswer={handleTaskAnswer}
              onSkip={handleTaskSkip}
            />
            {submitAnswer.isPending && (
              <p className="text-xs text-telegram-hint mt-2 text-center">Проверяем ответ…</p>
            )}
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
