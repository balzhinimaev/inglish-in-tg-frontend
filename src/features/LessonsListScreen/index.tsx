import React, { useEffect, useState, useMemo, useRef } from 'react';
import { Screen, Button, Loader, TabSwitch, ModuleVocabulary } from '../../components';
import { BackToModulesButton } from './BackToModulesButton';
import { PaywallBottomSheet } from '../../components/PaywallBottomSheet';
import { useLessons, useModuleVocabulary } from '../../services/content';
import { useAppNavigation } from '../../hooks/useAppNavigation';
import { APP_STATES } from '../../utils/constants';
import { tracking } from '../../services/tracking';
import { hapticFeedback } from '../../utils/telegram';
import { useAudioPreload } from '../../utils/audio';
import type { LessonItem, LessonType, LessonDifficulty, TaskType } from '../../types';
import {
  LESSONS_PER_PAGE,
  LESSON_DIFFICULTY_COLORS,
  LESSON_DIFFICULTY_LABELS,
  TASK_TYPES_CONFIG,
  type EnhancedTag
} from './constants';
import {
  getAvailableLessonTypes,
  getDefaultTaskTypes,
  getEnhancedTags,
  getLessonTypeIcon,
  getLessonTypeLabel,
  mapApiTaskTypes
} from './utils';
import './styles.lessonsList.css';

interface LessonsListScreenProps {
  moduleRef?: string;
  moduleTitle?: string;
  level?: string;
}

// Enhanced tag display component
const TagDisplay: React.FC<{ tag: EnhancedTag; compact?: boolean }> = ({ tag, compact = false }) => {
  return (
    <span 
      className={`
        inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium
        ${tag.color} ${tag.bgColor}
        transition-all duration-200 hover:scale-105 cursor-default
        ${compact ? 'px-1.5 py-0.5' : ''}
      `}
      title={`${tag.label} (${tag.category})`}
    >
      <span className={compact ? 'text-xs' : ''}>{tag.icon}</span>
      {!compact && <span>{tag.label}</span>}
    </span>
  );
};

// Task cards row component
const TaskCardsRow: React.FC<{ taskTypes: TaskType[]; isLocked?: boolean }> = ({ taskTypes, isLocked = false }) => {
  if (!taskTypes || taskTypes.length === 0) return null;

  // Limit to first 6 task types for horizontal layout
  const displayTypes = taskTypes.slice(0, 6);
  
  return (
    <div className="task-cards-row">
      {displayTypes.map((taskType, index) => {
        const config = TASK_TYPES_CONFIG[taskType];
        if (!config) return null;
        
        const opacity = isLocked ? 0.4 : 1;
        
        return (
          <div
            key={`${taskType}-${index}`}
            className={`task-card ${taskType}`}
            style={{
              opacity,
              pointerEvents: isLocked ? 'none' : 'auto'
            }}
          >
            <span>{config.icon}</span>
            <div className="task-card-tooltip">
              {config.label}
            </div>
          </div>
        );
      })}
      
      {/* Show count if more than 6 types */}
      {taskTypes.length > 6 && (
        <div
          className="task-card-count"
          style={{
            opacity: isLocked ? 0.4 : 1
          }}
        >
          +{taskTypes.length - 6}
        </div>
      )}
    </div>
  );
};

export const LessonsListScreen: React.FC<LessonsListScreenProps> = ({
  moduleRef = '',
  moduleTitle = 'Модуль',
  level: propLevel
}) => {
  const { navigateTo, setupBackButton, navigationParams } = useAppNavigation();
  // Get level from props or navigation params
  const level = propLevel || (navigationParams.level as string | undefined);
  const screenRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<'lessons' | 'vocabulary'>('lessons');
  const [selectedFilter, setSelectedFilter] = useState<LessonType | 'all'>('all');
  const [showPreview, setShowPreview] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'order' | 'difficulty' | 'duration'>('order');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [animatedProgress, setAnimatedProgress] = useState(0);
  const [animatedCompleted, setAnimatedCompleted] = useState(0);
  const [animatedXP, setAnimatedXP] = useState(0);
  const [showStickyBreadcrumbs, setShowStickyBreadcrumbs] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isPaywallOpen, setIsPaywallOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const lessonsPerPage = LESSONS_PER_PAGE; // Количество уроков на странице

  const { data, isLoading } = useLessons({ 
    moduleRef, 
    lang: 'ru' 
  });

  // Audio preloading hook
  const { isPreloading, preloadAudioFiles, getPreloadedAudio } = useAudioPreload();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [preloadedAudioMap, setPreloadedAudioMap] = useState<Map<string, HTMLAudioElement>>(new Map());
  const [loadedAudioUrls, setLoadedAudioUrls] = useState<Set<string>>(new Set());

  // Get vocabulary data for audio preloading
  const { data: vocabularyData } = useModuleVocabulary({ 
    moduleRef, 
    lang: 'ru' 
  });
  
  // Enhanced mock data with sequential progression logic
  const mockLessons: LessonItem[] = useMemo(() => {
    // Add default values to existing lessons from API
    const apiLessons = (data?.lessons || []).map(lesson => ({
      ...lesson,
      type: lesson.type || 'vocabulary' as LessonType,
      difficulty: lesson.difficulty || 'medium' as LessonDifficulty,
      tags: lesson.tags || [],
      xpReward: lesson.xpReward || 20,
      hasAudio: lesson.hasAudio || false,
      hasVideo: lesson.hasVideo || false,
      taskTypes: lesson.taskTypes ? mapApiTaskTypes(lesson.taskTypes) : getDefaultTaskTypes(lesson.type || 'vocabulary')
    }));

    // Apply sequential progression logic to API lessons
    const processedApiLessons = apiLessons.map((lesson, index) => {
      if (index === 0) {
        // First lesson is always available
        return lesson;
      }
      
      // Check if previous lesson is completed
      const previousLesson = apiLessons[index - 1];
      const isPreviousCompleted = previousLesson?.progress?.status === 'completed';
      
      return {
        ...lesson,
        isLocked: !isPreviousCompleted,
        unlockCondition: !isPreviousCompleted ? `Завершите урок "${previousLesson?.title}"` : undefined
      };
    });

    const allLessons = [
      ...processedApiLessons,
    // Add rich mock lessons ONLY if no real data is available
    ...(!data?.lessons || data.lessons.length === 0 ? [
      {
        lessonRef: "travel.a0.greetings",
        moduleRef: moduleRef || "travel.a0",
        title: "Приветствие и знакомство",
        description: "Изучите основные фразы для знакомства в аэропорту",
        estimatedMinutes: 8,
        order: 1,
        type: "conversation" as LessonType,
        difficulty: "easy" as LessonDifficulty,
        tags: ["greetings", "basics", "airport", "beginner"],
        xpReward: 25,
        hasAudio: true,
        hasVideo: false,
        previewText: "Hello! My name is... Nice to meet you!",
        taskTypes: ["flashcard", "multiple_choice", "listening"] as TaskType[],
        progress: {
          status: "completed" as const,
          score: 95,
          attempts: 2,
          completedAt: "2024-01-15T10:30:00Z",
          timeSpent: 480
        }
      },
      {
        lessonRef: "travel.a0.security",
        moduleRef: moduleRef || "travel.a0",
        title: "Досмотр безопасности",
        description: "Пройдите контроль безопасности без проблем",
        estimatedMinutes: 12,
        order: 2,
        type: "listening" as LessonType,
        difficulty: "medium" as LessonDifficulty,
        tags: ["security", "airport", "instructions", "important"],
        xpReward: 35,
        hasAudio: true,
        hasVideo: true,
        previewText: "Please put your belongings in the tray...",
        taskTypes: ["listening", "gap_fill", "multiple_choice"] as TaskType[],
        progress: {
          status: "in_progress" as const,
          score: 67,
          attempts: 1,
          timeSpent: 420
        }
      },
      {
        lessonRef: "travel.a0.boarding",
        moduleRef: moduleRef || "travel.a0",
        title: "Посадка на самолет",
        description: "Найдите свое место и подготовьтесь к полету",
        estimatedMinutes: 10,
        order: 3,
        type: "vocabulary" as LessonType,
        difficulty: "easy" as LessonDifficulty,
        tags: ["transport", "airport", "vocabulary"],
        xpReward: 30,
        hasAudio: true,
        hasVideo: false,
        previewText: "Boarding pass, seat number, overhead compartment...",
        taskTypes: ["flashcard", "matching", "gap_fill", "multiple_choice", "listening"] as TaskType[],
        progress: {
          status: "not_started" as const,
          score: 0,
          attempts: 0
        }
      },
      {
        lessonRef: "travel.a0.flight",
        moduleRef: moduleRef || "travel.a0",
        title: "Во время полета",
        description: "Общение с экипажем и пассажирами",
        estimatedMinutes: 15,
        order: 4,
        type: "conversation" as LessonType,
        difficulty: "medium" as LessonDifficulty,
        tags: ["transport", "ordering", "popular"],
        xpReward: 40,
        hasAudio: true,
        hasVideo: true,
        previewText: "Excuse me, could I have some water please?",
        taskTypes: ["flashcard", "gap_fill"] as TaskType[],
        isLocked: true,
        unlockCondition: "Завершите урок 'Посадка на самолет'"
      },
      {
        lessonRef: "travel.a0.arrival",
        moduleRef: moduleRef || "travel.a0",
        title: "Прибытие и паспортный контроль",
        description: "Пройдите паспортный контроль и получите багаж",
        estimatedMinutes: 18,
        order: 5,
        type: "grammar" as LessonType,
        difficulty: "hard" as LessonDifficulty,
        tags: ["airport", "passport", "customs", "important"],
        xpReward: 50,
        hasAudio: true,
        hasVideo: true,
        previewText: "Purpose of visit, duration of stay, customs declaration...",
        taskTypes: ["matching", "multiple_choice", "listening"] as TaskType[],
        isLocked: true,
        unlockCondition: "Завершите урок 'Во время полета'"
      },
      {
        lessonRef: "travel.a0.hotel",
        moduleRef: moduleRef || "travel.a0",
        title: "Заселение в отель",
        description: "Зарегистрируйтесь в отеле и узнайте о услугах",
        estimatedMinutes: 14,
        order: 6,
        type: "speaking" as LessonType,
        difficulty: "medium" as LessonDifficulty,
        tags: ["hotel", "check-in", "popular"],
        xpReward: 35,
        hasAudio: true,
        hasVideo: false,
        previewText: "I have a reservation under the name...",
        isLocked: true,
        unlockCondition: "Завершите урок 'Прибытие и паспортный контроль'"
      },
      {
        lessonRef: "travel.a0.restaurant",
        moduleRef: moduleRef || "travel.a0",
        title: "В ресторане",
        description: "Закажите еду и пообщайтесь с официантом",
        estimatedMinutes: 16,
        order: 7,
        type: "conversation" as LessonType,
        difficulty: "medium" as LessonDifficulty,
        tags: ["restaurant", "ordering", "popular"],
        xpReward: 40,
        hasAudio: true,
        hasVideo: true,
        previewText: "Could I see the menu, please? I'd like to order...",
        isLocked: true,
        unlockCondition: "Завершите урок 'Заселение в отель'"
      },
      {
        lessonRef: "travel.a0.directions",
        moduleRef: moduleRef || "travel.a0",
        title: "Спросить дорогу",
        description: "Научитесь спрашивать и понимать направления",
        estimatedMinutes: 12,
        order: 8,
        type: "listening" as LessonType,
        difficulty: "easy" as LessonDifficulty,
        tags: ["city", "directions", "beginner"],
        xpReward: 30,
        hasAudio: true,
        hasVideo: false,
        previewText: "Excuse me, how do I get to...? Go straight, turn left...",
        isLocked: true,
        unlockCondition: "Завершите урок 'В ресторане'"
      }
    ] : [])
    ];

    // Apply sequential progression logic to all lessons
    return allLessons
      .sort((a: LessonItem, b: LessonItem) => a.order - b.order) // Ensure proper order
      .map((lesson: LessonItem, index: number) => {
        if (index === 0) {
          // First lesson is always available
          return { ...lesson, isLocked: false };
        }
        
        // Check if previous lesson is completed
        const previousLesson = allLessons.find((l: LessonItem) => l.order === lesson.order - 1);
        const isPreviousCompleted = (previousLesson && 'progress' in previousLesson && previousLesson.progress?.status === 'completed') || false;
        
        return {
          ...lesson,
          isLocked: !isPreviousCompleted,
          unlockCondition: !isPreviousCompleted 
            ? `Завершите урок "${previousLesson?.title}"` 
            : lesson.unlockCondition
        };
      });
  }, [data?.lessons, moduleRef]);

  // Filter and paginate lessons
  const { filteredLessons, totalPages, allFilteredLessons } = useMemo(() => {
    let filtered = selectedFilter === 'all' 
      ? mockLessons 
      : mockLessons.filter(lesson => lesson.type === selectedFilter);
    
    // Sort lessons
    filtered = filtered.sort((a, b) => {
      let result = 0;
      
      switch (sortBy) {
        case 'difficulty':
          const difficultyOrder: Record<string, number> = { easy: 1, medium: 2, hard: 3, undefined: 0 };
          const aDiff = a.difficulty || 'undefined';
          const bDiff = b.difficulty || 'undefined';
          result = (difficultyOrder[aDiff] || 0) - (difficultyOrder[bDiff] || 0);
          break;
        case 'duration':
          result = a.estimatedMinutes - b.estimatedMinutes;
          break;
        case 'order':
        default:
          result = a.order - b.order;
          break;
      }
      
      return sortDirection === 'desc' ? -result : result;
    });
    
    // Calculate pagination
    const totalPages = Math.ceil(filtered.length / lessonsPerPage);
    const startIndex = (currentPage - 1) * lessonsPerPage;
    const endIndex = startIndex + lessonsPerPage;
    const paginatedLessons = filtered.slice(startIndex, endIndex);
    
    return {
      filteredLessons: paginatedLessons,
      totalPages,
      allFilteredLessons: filtered
    };
  }, [mockLessons, selectedFilter, sortBy, sortDirection, currentPage, lessonsPerPage]);

  // Calculate module statistics
  const moduleStats = useMemo(() => {
    const completed = mockLessons.filter(l => l.progress?.status === 'completed').length;
    const inProgress = mockLessons.filter(l => l.progress?.status === 'in_progress').length;
    const totalXP = mockLessons
      .filter(l => l.progress?.status === 'completed')
      .reduce((sum, l) => sum + (l.xpReward || 0), 0);
    const avgScore = mockLessons
      .filter(l => l.progress?.status === 'completed')
      .reduce((sum, l, _, arr) => sum + (l.progress?.score || 0) / arr.length, 0);
    
    return {
      completed,
      inProgress,
      total: mockLessons.length,
      totalXP,
      avgScore: Math.round(avgScore)
    };
  }, [mockLessons]);

  useEffect(() => {
    setupBackButton();
  }, [setupBackButton]);

  // Smart sticky breadcrumbs with scroll direction detection
  useEffect(() => {
    let ticking = false;
    let hideTimeout: NodeJS.Timeout | undefined;

    const handleScroll = (e: Event) => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const target = e.target as HTMLElement;
          const currentScrollY = target.scrollTop;
          
          // Determine scroll direction
          const direction = currentScrollY > lastScrollY ? 'down' : 'up';
          
          // Show sticky when regular breadcrumbs are out of view
          const threshold = 120;
          
          // Clear any existing timeout
          if (hideTimeout) {
            clearTimeout(hideTimeout);
          }
          
          if (currentScrollY < threshold) {
            // Near top - hide immediately
            setShowStickyBreadcrumbs(false);
          } else {
            // Past threshold
            if (direction === 'down') {
              // Scrolling down - show
              setShowStickyBreadcrumbs(true);
            } else if (direction === 'up') {
              // Scrolling up - hide
              setShowStickyBreadcrumbs(false);
            }
          }
          
          setLastScrollY(currentScrollY);
          ticking = false;
        });
        ticking = true;
      }
    };

    // Use ref to access Screen element directly
    const screenElement = screenRef.current;
    if (screenElement) {
      screenElement.addEventListener('scroll', handleScroll, { passive: true });
      
      return () => {
        screenElement.removeEventListener('scroll', handleScroll);
        if (hideTimeout) {
          clearTimeout(hideTimeout);
        }
      };
    }
  }, [lastScrollY]);

  // Animate progress bar and counters
  useEffect(() => {
    const targetProgress = (moduleStats.completed / moduleStats.total) * 100;
    const targetCompleted = moduleStats.completed;
    const targetXP = moduleStats.totalXP;
    const animationDuration = 1500; // 1.5 seconds
    const steps = 60; // 60fps
    
    const progressIncrement = targetProgress / steps;
    const completedIncrement = targetCompleted / steps;
    const xpIncrement = targetXP / steps;
    
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      const progressValue = Math.min(progressIncrement * currentStep, targetProgress);
      const completedValue = Math.min(Math.round(completedIncrement * currentStep), targetCompleted);
      const xpValue = Math.min(Math.round(xpIncrement * currentStep), targetXP);
      
      setAnimatedProgress(progressValue);
      setAnimatedCompleted(completedValue);
      setAnimatedXP(xpValue);

      if (currentStep >= steps) {
        clearInterval(timer);
        setAnimatedProgress(targetProgress);
        setAnimatedCompleted(targetCompleted);
        setAnimatedXP(targetXP);
        
        // Add haptic feedback when animation completes
        hapticFeedback.selection();
      }
    }, animationDuration / steps);

    return () => clearInterval(timer);
  }, [moduleStats.completed, moduleStats.total, moduleStats.totalXP]);

  // Track module lessons view
  useEffect(() => {
    if (filteredLessons.length > 0) {
      tracking.moduleView(moduleRef, false, true);
    }
  }, [filteredLessons, moduleRef]);

  const handleLessonClick = (lesson: LessonItem) => {
    if (lesson.isLocked) {
      hapticFeedback.selection();
      tracking.custom('locked_lesson_clicked', { 
        lessonRef: lesson.lessonRef,
        unlockCondition: lesson.unlockCondition,
        source: 'lessons_list'
      });
      
      // Show paywall bottom sheet for locked lessons
      setIsPaywallOpen(true);
      return;
    }
    
    hapticFeedback.selection();
    tracking.lessonStarted(lesson.lessonRef);
    
    // Navigate to lesson with lessonRef
    navigateTo(APP_STATES.LESSON, { lessonRef: lesson.lessonRef });
  };

  const handlePreviewToggle = (lessonRef: string) => {
    hapticFeedback.selection();
    setShowPreview(showPreview === lessonRef ? null : lessonRef);
  };


  const getDifficultyColor = (difficulty?: LessonDifficulty) => {
    if (!difficulty) return "text-gray-600 bg-gray-50";
    return LESSON_DIFFICULTY_COLORS[difficulty] || "text-gray-600 bg-gray-50";
  };

  const getDifficultyText = (difficulty?: LessonDifficulty) => {
    if (!difficulty) return "Неизвестно";
    return LESSON_DIFFICULTY_LABELS[difficulty] || "Неизвестно";
  };

  const getProgressIcon = (lesson: LessonItem) => {
    if (lesson.isLocked) {
      return (
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center shadow-lg relative">
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/20 to-transparent"></div>
          <svg className="w-6 h-6 text-gray-600 relative z-10" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM9 6c0-1.66 1.34-3 3-3s3 1.34 3 3v2H9V6z"/>
          </svg>
        </div>
      );
    }

    if (!lesson.progress) {
      return (
        <div className="w-12 h-12 rounded-full border-3 border-telegram-accent/30 bg-gradient-to-br from-white to-telegram-accent/5 flex items-center justify-center shadow-lg relative group hover:scale-110 transition-transform">
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-telegram-accent/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <span className="text-telegram-accent text-lg font-bold relative z-10">{lesson.order}</span>
        </div>
      );
    }

    switch (lesson.progress.status) {
      case 'completed':
        return (
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 via-green-500 to-green-600 flex items-center justify-center relative shadow-xl">
            {/* Premium glass effect */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/30 to-transparent"></div>
            
            {/* Modern checkmark */}
            <svg className="w-7 h-7 text-white relative z-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <path d="M20 6L9 17l-5-5"/>
            </svg>
            
            {/* Completion glow effect */}
            <div className="absolute inset-0 rounded-full bg-green-400 opacity-40 animate-pulse" style={{ animationDuration: '3s' }}></div>
            
            {/* High score badge */}
            {lesson.progress.score >= 90 && (
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-br from-yellow-400 via-orange-400 to-red-400 rounded-full flex items-center justify-center shadow-lg border-2 border-white">
                <span className="text-sm">⭐</span>
              </div>
            )}
            
            {/* Success particles */}
            <div className="absolute inset-0">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-1 h-1 bg-yellow-300 rounded-full animate-bounce opacity-60"
                  style={{
                    top: `${20 + i * 15}%`,
                    left: `${15 + i * 25}%`,
                    animationDelay: `${i * 0.5}s`,
                    animationDuration: '2.5s'
                  }}
                />
              ))}
            </div>
          </div>
        );
      case 'in_progress':
        return (
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 via-blue-500 to-telegram-accent flex items-center justify-center relative shadow-xl">
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/30 to-transparent"></div>
            <span className="text-white text-lg font-bold relative z-10">{lesson.order}</span>
            <div className="absolute inset-0 rounded-full border-3 border-blue-300 animate-pulse"></div>
            
            {/* Progress ring */}
            <div className="absolute inset-0 rounded-full border-2 border-blue-200 animate-spin" style={{ animationDuration: '3s' }}>
              <div className="w-1 h-1 bg-white rounded-full absolute top-0 left-1/2 transform -translate-x-1/2"></div>
            </div>
          </div>
        );
      default:
        return (
          <div className="w-12 h-12 rounded-full border-3 border-telegram-hint/40 bg-gradient-to-br from-white to-gray-50 flex items-center justify-center shadow-lg relative group hover:scale-110 transition-transform">
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-telegram-hint/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <span className="text-telegram-hint text-lg font-medium relative z-10">{lesson.order}</span>
          </div>
        );
    }
  };

  const getProgressText = (lesson: LessonItem) => {
    if (lesson.isLocked) return lesson.unlockCondition || 'Заблокировано';
    if (!lesson.progress) return '';
    
    switch (lesson.progress.status) {
      case 'completed':
        return `Завершён • ${lesson.progress.score}%`;
      case 'in_progress':
        return 'В процессе';
      default:
        return '';
    }
  };

  // Get dynamic filter options based on available lesson types
  const filterOptions = useMemo(() => {
    const options = getAvailableLessonTypes(mockLessons);
    
    // Debug logging
    if (import.meta.env.VITE_ENABLE_DEBUG_LOGGING) {
      console.log('Available lesson types:', options.map(o => o.key));
    }
    
    return options;
  }, [mockLessons]);

  // Reset filter if selected type is no longer available
  useEffect(() => {
    const availableKeys = filterOptions.map(option => option.key);
    if (!availableKeys.includes(selectedFilter)) {
      setSelectedFilter('all');
    }
  }, [filterOptions, selectedFilter]);

  // Preload audio when switching to vocabulary tab (silent background loading)
  useEffect(() => {
    if (activeTab === 'vocabulary' && vocabularyData?.vocabulary && !isPreloading) {
      const audioUrls = vocabularyData.vocabulary
        .map(item => item.pronunciation)
        .filter(Boolean) as string[];
      
      // Check if we need to load any new audio files
      const newAudioUrls = audioUrls.filter(url => !loadedAudioUrls.has(url));
      
      if (newAudioUrls.length > 0) {
        console.log('Silently preloading audio for vocabulary tab:', newAudioUrls.length, 'files');
        setLoadedAudioUrls(prev => new Set([...prev, ...newAudioUrls]));
        
        // Start preloading immediately
        preloadAudioFiles(newAudioUrls).then(() => {
          // Update the preloaded audio map after preloading is complete
          setPreloadedAudioMap(prevMap => {
            const newMap = new Map(prevMap);
            newAudioUrls.forEach(url => {
              const audio = getPreloadedAudio(url);
              if (audio) {
                newMap.set(url, audio);
              }
            });
            return newMap;
          });
        });
      }
    }
  }, [activeTab, vocabularyData, preloadAudioFiles, getPreloadedAudio, isPreloading, loadedAudioUrls]);

  if (isLoading) {
    return (
      <Screen className="flex items-center justify-center">
        <Loader size="lg" text="Загрузка уроков..." />
      </Screen>
    );
  }

  if (mockLessons.length === 0) {
    return (
      <Screen className="flex items-center justify-center">
        <div className="text-center">
          <p className="text-telegram-text text-lg mb-4">
            Уроки не найдены
          </p>
          <Button onClick={() => navigateTo(APP_STATES.MODULES, level ? { level } : {})}>
            Вернуться к модулям
          </Button>
        </div>
      </Screen>
    );
  }

  return (
    <>
      {/* Sticky Breadcrumb Navigation - full width at top of viewport */}
      <div 
        className={`
          fixed top-0 left-0 right-0 z-50 w-full transition-all duration-300 ease-out
          ${showStickyBreadcrumbs 
            ? 'bg-telegram-bg/95 backdrop-blur-md border-b border-telegram-hint/10 shadow-lg' 
            : ''
          }
        `}
        style={{
          transform: showStickyBreadcrumbs 
            ? 'translateY(0) scale(1)' 
            : 'translateY(-110%) scale(0.95)',
          opacity: showStickyBreadcrumbs ? 1 : 0,
          marginBottom: 0,
          transition: 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)', // Spring-like easing
          transformOrigin: 'center top',
          pointerEvents: showStickyBreadcrumbs ? 'auto' : 'none'
        }}
      >
          <div className={`w-full transition-all duration-300 ${showStickyBreadcrumbs ? 'py-3' : 'py-0'}`}>
            <div className="max-w-md mx-auto px-4">
              <div className="flex items-center gap-1 text-sm min-w-0">
              {/* Modules Link - Compact on small screens */}
              <button
                onClick={() => {
                  hapticFeedback.selection();
                  tracking.custom('sticky_breadcrumb_modules_clicked', { 
                    page: 'lessons_list',
                    module: moduleRef 
                  });
                  navigateTo(APP_STATES.MODULES, level ? { level } : {});
                }}
                className="flex items-center gap-0.5 text-telegram-accent hover:text-telegram-accent/80 transition-all duration-200 hover:scale-105 group shrink-0"
              >
                <svg 
                  className="w-4 h-4 transform group-hover:-translate-x-0.5 transition-transform duration-200" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2"
                >
                  <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
                  <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
                </svg>
                <span className="font-medium hidden xs:inline">Модули</span>
              </button>
              
              {/* Separator */}
              <div className="flex items-center shrink-0">
                <svg 
                  className="w-3 h-3 text-telegram-hint" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2"
                >
                  <path d="M9 18l6-6-6-6"/>
                </svg>
              </div>
              
              {/* Current Module - Truncated */}
              <div className="flex items-center gap-0.5 text-telegram-text min-w-0">
                <svg 
                  className="w-4 h-4 text-telegram-hint shrink-0" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2"
                >
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14,2 14,8 20,8"/>
                </svg>
                <span className="font-medium text-telegram-text/80 truncate max-w-[80px] xs:max-w-[120px] sm:max-w-[150px]">
                  {moduleTitle}
                </span>
              </div>
              
              {/* Separator */}
              <div className="flex items-center shrink-0">
                <svg 
                  className="w-3 h-3 text-telegram-hint" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2"
                >
                  <path d="M9 18l6-6-6-6"/>
                </svg>
              </div>
              
              {/* Current Page - Compact on small screens */}
              <div className="flex items-center gap-0.5 text-telegram-hint shrink-0">
                <svg 
                  className="w-4 h-4" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2"
                >
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
                <span className="font-medium hidden xs:inline">Уроки</span>
              </div>
            </div>
          </div>
          </div>
      </div>

      <Screen ref={screenRef}>
        <div className="max-w-md mx-auto min-w-0">
        {/* Regular Breadcrumb Navigation */}
        <div className="mb-4">
          <div className="flex items-center gap-1 text-sm min-w-0">
            {/* Modules Link - Compact on small screens */}
            <button
              onClick={() => {
                hapticFeedback.selection();
                tracking.custom('breadcrumb_modules_clicked', { 
                  page: 'lessons_list',
                  module: moduleRef 
                });
                navigateTo(APP_STATES.MODULES, level ? { level } : {});
              }}
              className="flex items-center gap-0.5 text-telegram-accent hover:text-telegram-accent/80 transition-all duration-200 hover:scale-105 group shrink-0"
            >
              <svg 
                className="w-4 h-4 transform group-hover:-translate-x-0.5 transition-transform duration-200" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2"
              >
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
              </svg>
              <span className="font-medium hidden xs:inline">Модули</span>
            </button>
            
            {/* Separator */}
            <div className="flex items-center shrink-0">
              <svg 
                className="w-3 h-3 text-telegram-hint animate-pulse" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2"
              >
                <path d="M9 18l6-6-6-6"/>
              </svg>
            </div>
            
            {/* Current Module - Truncated */}
            <div className="flex items-center gap-0.5 text-telegram-text min-w-0">
              <svg 
                className="w-4 h-4 text-telegram-hint shrink-0" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14,2 14,8 20,8"/>
              </svg>
              <span className="font-medium text-telegram-text/80 truncate max-w-[100px] xs:max-w-[140px] sm:max-w-[180px]">
                {moduleTitle}
              </span>
            </div>
            
            {/* Separator */}
            <div className="flex items-center shrink-0">
              <svg 
                className="w-3 h-3 text-telegram-hint animate-pulse animation-delay-200" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2"
              >
                <path d="M9 18l6-6-6-6"/>
              </svg>
            </div>
            
            {/* Current Page - Compact on small screens */}
            <div className="flex items-center gap-0.5 text-telegram-hint shrink-0">
              <svg 
                className="w-4 h-4" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2"
              >
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
              <span className="font-medium hidden xs:inline">Уроки</span>
            </div>
          </div>
          
          {/* Decorative line */}
          <div className="mt-3 h-px bg-gradient-to-r from-transparent via-telegram-hint/20 to-transparent"></div>
        </div>

        {/* Header with Stats */}
        <div className="text-center mb-3">
          <h1 className="text-2xl font-bold text-telegram-text mb-2">{moduleTitle}</h1>
          
          {/* Module Progress Stats */}
          <div className="bg-telegram-secondary-bg rounded-xl p-4 mb-4">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="group">
                <div className="text-2xl font-bold text-telegram-accent transition-all duration-300 group-hover:scale-110">
                  {animatedCompleted}
                  {animatedCompleted === moduleStats.completed && moduleStats.completed > 0 && (
                    <span className="inline-block ml-1 animate-bounce">🎯</span>
                  )}
                </div>
                <div className="text-xs text-telegram-hint">Завершено</div>
              </div>
              <div className="group">
                <div className="text-2xl font-bold text-telegram-button transition-all duration-300 group-hover:scale-110">
                  {animatedXP}
                  {animatedXP === moduleStats.totalXP && moduleStats.totalXP > 0 && (
                    <span className="inline-block ml-1 animate-pulse">⚡</span>
                  )}
                </div>
                <div className="text-xs text-telegram-hint">XP получено</div>
              </div>
            </div>
            
            {/* Animated Progress Bar */}
            <div className="mt-3">
              <div className="flex justify-between text-xs text-telegram-hint mb-1">
                <span>Прогресс модуля</span>
                <span className="font-medium">{Math.round(animatedProgress)}%</span>
              </div>
              <div className="relative w-full h-3 bg-telegram-card-bg rounded-full overflow-hidden shadow-inner">
                {/* Background pattern */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-pulse opacity-30"></div>
                
                {/* Main progress bar */}
                <div 
                  className="relative h-full bg-gradient-to-r from-telegram-accent via-blue-500 to-green-500 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${animatedProgress}%` }}
                >
                  {/* Shine effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer-progress" style={{animationDuration: '2s', animationIterationCount: 'infinite'}}></div>
                  
                  {/* Glow effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-telegram-accent to-green-500 rounded-full blur-sm opacity-50"></div>
                </div>
                
                {/* Progress milestones */}
                <div className="absolute inset-0 flex items-center">
                  {[25, 50, 75].map(milestone => (
                    <div
                      key={milestone}
                      className={`absolute w-0.5 h-full bg-white/30 transition-opacity duration-300 ${
                        animatedProgress >= milestone ? 'opacity-0' : 'opacity-100'
                      }`}
                      style={{ left: `${milestone}%` }}
                    />
                  ))}
                </div>
                
                {/* Completion celebration */}
                {animatedProgress >= 100 && (
                  <div className="absolute -inset-1 rounded-full">
                    <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-green-500 to-blue-500 rounded-full animate-ping opacity-30"></div>
                    <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-6">
                      <div className="flex space-x-1 animate-bounce">
                        <span className="text-lg">🎉</span>
                        <span className="text-lg">🏆</span>
                        <span className="text-lg">🎉</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Progress description */}
              <div className="mt-2 text-center">
                {animatedProgress === 0 && (
                  <p className="text-xs text-telegram-hint">Начните первый урок!</p>
                )}
                {animatedProgress > 0 && animatedProgress < 100 && (
                  <p className="text-xs text-telegram-hint">
                    Осталось {moduleStats.total - moduleStats.completed} {
                      moduleStats.total - moduleStats.completed === 1 ? 'урок' : 
                      moduleStats.total - moduleStats.completed < 5 ? 'урока' : 'уроков'
                    }
                  </p>
                )}
                {animatedProgress >= 100 && (
                  <p className="text-xs text-green-600 font-medium animate-pulse">
                    🏆 Модуль завершен! Поздравляем!
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6">
          <TabSwitch
            tabs={[
              { 
                key: 'lessons', 
                label: 'Уроки', 
                icon: '📚',
                count: mockLessons.length
              },
              { 
                key: 'vocabulary', 
                label: 'Словарь', 
                icon: '📖'
              }
            ]}
            activeTab={activeTab}
            onTabChange={(tab) => setActiveTab(tab as 'lessons' | 'vocabulary')}
          />
        </div>

        {/* Lessons Tab Content */}
        {activeTab === 'lessons' && (
          <>
            {/* Filters */}
            <div className="mb-6 -mx-2 px-2">
          <div className="flex items-center gap-1.5 xs:gap-2 mb-3 overflow-x-auto pb-2">
            {filterOptions.map(option => (
              <button
                key={option.key}
                onClick={() => {
                  hapticFeedback.selection();
                  setSelectedFilter(option.key);
                }}
                className={`
                  flex items-center gap-0.5 xs:gap-1 px-2 xs:px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all shrink-0
                  ${selectedFilter === option.key 
                    ? 'bg-telegram-accent text-white shadow-lg' 
                    : 'bg-telegram-secondary-bg text-telegram-hint hover:bg-telegram-card-bg'
                  }
                `}
              >
                <span className="text-xs">{option.icon}</span>
                <span className="hidden xs:inline">{option.label}</span>
                <span className="inline xs:hidden text-xs">
                  {option.key === 'all' ? 'Все' :
                   option.key === 'conversation' ? 'Разг.' :
                   option.key === 'vocabulary' ? 'Слов.' :
                   option.key === 'listening' ? 'Ауд.' :
                   option.key === 'grammar' ? 'Грам.' :
                   option.key === 'speaking' ? 'Гов.' :
                   option.key === 'reading' ? 'Чт.' :
                   option.key === 'writing' ? 'Пис.' : option.label}
                </span>
              </button>
            ))}
          </div>
          
          {/* Sort Options - Compact for mobile */}
          <div className="flex items-center gap-1 text-xs overflow-x-auto pb-1 -mx-1 px-1">
            <span className="text-telegram-hint shrink-0 hidden xs:inline">Сортировка:</span>
            {[
              { key: 'order', label: 'По порядку', shortLabel: 'Порядок' },
              { key: 'difficulty', label: 'По сложности', shortLabel: 'Сложность' },
              { key: 'duration', label: 'По времени', shortLabel: 'Время' }
            ].map(option => (
              <button
                key={option.key}
                onClick={() => {
                  hapticFeedback.selection();
                  if (sortBy === option.key) {
                    // Toggle direction if same sort option
                    setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                  } else {
                    // Change sort option and reset to ascending
                    setSortBy(option.key as any);
                    setSortDirection('asc');
                  }
                }}
                className={`
                  flex items-center gap-0.5 px-1.5 xs:px-2 py-1 rounded transition-all whitespace-nowrap shrink-0
                  ${sortBy === option.key 
                    ? 'text-telegram-accent font-medium bg-telegram-accent/10' 
                    : 'text-telegram-hint hover:text-telegram-text hover:bg-telegram-secondary-bg'
                  }
                `}
              >
                <span className="hidden xs:inline">{option.label}</span>
                <span className="inline xs:hidden">{option.shortLabel}</span>
                {sortBy === option.key && (
                  <svg 
                    className={`w-2.5 h-2.5 xs:w-3 xs:h-3 transition-transform ${sortDirection === 'desc' ? 'rotate-180' : ''}`}
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2"
                  >
                    <path d="M7 14l5-5 5 5"/>
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Premium Lessons List */}
        <div className="space-y-6 relative">
          {filteredLessons.map((lesson, index) => {
            const isCompleted = lesson.progress?.status === 'completed';
            const isInProgress = lesson.progress?.status === 'in_progress';
            const progressText = getProgressText(lesson);
            const isPreviewOpen = showPreview === lesson.lessonRef;

            const isLastLesson = index === filteredLessons.length - 1;
            const shouldShowConnectingLine = sortBy === 'order' && selectedFilter === 'all' && !isLastLesson;

            return (
              <div key={lesson.lessonRef} className="relative">
                {/* Connecting line to next lesson */}
                {shouldShowConnectingLine && (
                  <div className={`
                    connecting-line
                    ${isCompleted ? 'completed' : ''}
                  `} />
                )}
                
                <div 
                  data-lesson-ref={lesson.lessonRef}
                  className={`
                    octagonal-card p-6 relative
                    ${lesson.isLocked ? 'locked opacity-70 cursor-pointer hover:opacity-80 transition-opacity' : ''}
                    ${isCompleted ? 'completed' : ''}
                    ${isInProgress ? 'in-progress' : ''}
                  `}
                  onClick={lesson.isLocked ? () => handleLessonClick(lesson) : undefined}
                >
                <div className="flex items-start gap-4">
                  {/* Progress indicator */}
                  <div className="pt-1">
                    {getProgressIcon(lesson)}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-start gap-2 mb-2">
                      <h3 className={`font-semibold text-lg leading-tight ${lesson.isLocked ? 'text-gray-500' : 'text-telegram-text'}`}>
                        {lesson.title}
                      </h3>
                    </div>
                    
                    <p className={`text-sm mb-3 ${lesson.isLocked ? 'text-gray-400' : 'text-telegram-hint'}`}>
                      {lesson.description}
                    </p>

                    {/* Task Types Row */}
                    {lesson.taskTypes && lesson.taskTypes.length > 0 && (
                      <TaskCardsRow 
                        taskTypes={lesson.taskTypes} 
                        isLocked={lesson.isLocked}
                      />
                    )}

                    {/* Enhanced Tags */}
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {getEnhancedTags(lesson).slice(0, 4).map(tag => (
                        <TagDisplay key={tag.id} tag={tag} compact={false} />
                      ))}
                      {getEnhancedTags(lesson).length > 4 && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-telegram-hint bg-telegram-card-bg">
                          +{getEnhancedTags(lesson).length - 4}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-xs text-telegram-hint">
                        <span>⏱ {lesson.estimatedMinutes} мин</span>
                        {lesson.difficulty && (
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${getDifficultyColor(lesson.difficulty)}`}>
                            {getDifficultyText(lesson.difficulty)}
                          </span>
                        )}
                        {lesson.xpReward && (
                          <span className="text-telegram-accent font-medium">+{lesson.xpReward} XP</span>
                        )}
                      </div>
                      
                      {/* Preview toggle button */}
                      {lesson.previewText && !lesson.isLocked && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePreviewToggle(lesson.lessonRef);
                          }}
                          className="p-2 rounded-full hover:bg-telegram-card-bg transition-colors group"
                        >
                          <svg className={`w-4 h-4 text-telegram-hint transition-transform group-hover:text-telegram-accent ${isPreviewOpen ? 'rotate-180' : ''}`} 
                               viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M6 9l6 6 6-6"/>
                          </svg>
                        </button>
                      )}
                    </div>

                    {/* Progress Status and Action Button */}
                    <div className="flex items-center justify-between mt-2">
                      {progressText && (
                        <div className={`text-xs font-medium ${
                          lesson.isLocked ? 'text-gray-400' : 
                          isCompleted ? 'text-green-600' : 
                          isInProgress ? 'text-blue-600' : 'text-telegram-hint'
                        }`}>
                          {progressText}
                        </div>
                      )}
                      
                      {/* Locked lesson hint */}
                      {lesson.isLocked && (
                        <div className="text-xs text-gray-500 italic">
                          Нажмите для разблокировки
                        </div>
                      )}
                      
                      {/* Action Button - only for unlocked lessons */}
                      {!lesson.isLocked && (
                        <button
                          className={`
                            relative inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold
                            transition-all duration-300 cursor-pointer select-none group overflow-hidden active:scale-95
                            ${isCompleted 
                              ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 hover:scale-105 shadow-lg hover:shadow-green-500/25'
                              : isInProgress
                                ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700 hover:scale-105 shadow-lg hover:shadow-blue-500/25'
                                : 'bg-gradient-to-r from-telegram-accent to-blue-600 text-white hover:from-telegram-accent/90 hover:to-blue-600/90 hover:scale-105 shadow-lg hover:shadow-telegram-accent/25'
                            }
                          `}
                          onClick={() => handleLessonClick(lesson)}
                        >
                          <span className="relative z-10">
                            {isCompleted ? '🔄' : 
                             isInProgress ? '⚡' : '🚀'}
                          </span>
                          <span className="relative z-10 font-medium">
                            {isCompleted ? 'Повторить' : 
                             isInProgress ? 'Продолжить' : 'Начать'}
                          </span>
                          
                          {/* Premium button glow effect */}
                          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        </button>
                      )}
                    </div>

                    {/* Preview */}
                    {isPreviewOpen && lesson.previewText && (
                      <div className="mt-3 p-3 bg-telegram-card-bg rounded-lg border-l-4 border-telegram-accent">
                        <div className="text-sm text-telegram-text italic">
                          "{lesson.previewText}"
                        </div>
                        <div className="text-xs text-telegram-hint mt-1">
                          Превью урока
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Filter Results Info */}
        {selectedFilter !== 'all' && (
          <div className="mt-4 text-center text-sm text-telegram-hint">
            Показано {allFilteredLessons.length} из {mockLessons.length} уроков
          </div>
        )}

        {/* Pagination - OnboardingScreen style */}
        {totalPages > 1 && (
          <div className="mt-8 flex flex-col items-center">
            {/* Page indicators (like step indicators) */}
            <div className="flex items-center gap-2 mb-4">
              {/* Previous button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  hapticFeedback.selection();
                  setCurrentPage(prev => Math.max(1, prev - 1));
                }}
                disabled={currentPage === 1}
                className="p-2 opacity-70 hover:opacity-100"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M15 18l-6-6 6-6"/>
                </svg>
              </Button>

              {/* Page bars */}
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(totalPages, 8) }, (_, i) => {
                  let pageIndex;
                  if (totalPages <= 8) {
                    pageIndex = i;
                  } else {
                    // Smart pagination for many pages
                    const start = Math.max(0, currentPage - 4);
                    const end = Math.min(totalPages, start + 8);
                    pageIndex = start + i;
                    if (pageIndex >= end) return null;
                  }
                  
                  const pageNumber = pageIndex + 1;
                  const isCurrent = pageNumber === currentPage;
                  
                  return (
                    <div
                      key={pageNumber}
                      onClick={() => {
                        hapticFeedback.selection();
                        setCurrentPage(pageNumber);
                      }}
                      className={`
                        h-1 w-8 rounded-full transition-all duration-300 cursor-pointer
                        ${isCurrent 
                          ? 'bg-telegram-accent shadow-glow scale-105' 
                          : 'bg-telegram-secondary-bg border border-telegram-hint/50 hover:bg-telegram-accent/60 hover:scale-105'
                        }
                      `}
                    />
                  );
                })}
              </div>

              {/* Next button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  hapticFeedback.selection();
                  setCurrentPage(prev => Math.min(totalPages, prev + 1));
                }}
                disabled={currentPage === totalPages}
                className="p-2 opacity-70 hover:opacity-100"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 18l6-6-6-6"/>
                </svg>
              </Button>
            </div>
            
            {/* Page counter (like step counter) */}
            <div className="text-xs text-telegram-hint font-medium mb-2">
              {currentPage} / {totalPages}
            </div>
            
            {/* Additional info */}
            <div className="text-center">
              <p className="text-telegram-hint text-xs opacity-70">
                Всего уроков: {allFilteredLessons.length}
              </p>
            </div>
          </div>
        )}
        </>
        )}

        {/* Vocabulary Tab Content */}
        {activeTab === 'vocabulary' && (
          <ModuleVocabulary 
            moduleRef={moduleRef} 
            moduleTitle={moduleTitle}
            preloadedAudio={preloadedAudioMap}
          />
        )}

        {/* Back to modules button at bottom */}
        <BackToModulesButton moduleRef={moduleRef} level={level} />

      </div>
      </Screen>

      {/* Paywall Bottom Sheet */}
      <PaywallBottomSheet
        isOpen={isPaywallOpen}
        onClose={() => setIsPaywallOpen(false)}
      />
    </>
  );
};
