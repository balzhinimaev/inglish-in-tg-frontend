import React, { useEffect, useState, useMemo, useRef } from 'react';
import { Screen, Button, Loader, TabSwitch, ModuleVocabulary, LessonCard } from '../../components';
import { BackToModulesButton } from './BackToModulesButton';
import { PaywallBottomSheet } from '../../components/PaywallBottomSheet';
import { useLessons, useModuleVocabulary } from '../../services/content';
import {
  useAnimatedModuleStats,
  useAppNavigation,
  useFilteredLessons,
  usePreparedLessons,
  useStickyBreadcrumbs,
  useVocabularyAudioPreload
} from '../../hooks';
import { APP_STATES } from '../../utils/constants';
import { tracking } from '../../services/tracking';
import { hapticFeedback } from '../../utils/telegram';
import type { LessonItem, LessonType } from '../../types';
import {
  LESSONS_PER_PAGE
} from './constants';
import {
  getAvailableLessonTypes,
  pluralize
} from './utils';
import './styles.lessonsList.css';

interface LessonsListScreenProps {
  moduleRef?: string;
  moduleTitle?: string;
  level?: string;
}

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
  const [isPaywallOpen, setIsPaywallOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const lessonsPerPage = LESSONS_PER_PAGE; // Количество уроков на странице

  const { data, isLoading } = useLessons({ 
    moduleRef, 
    lang: 'ru' 
  });

  // Get vocabulary data for audio preloading
  const { data: vocabularyData } = useModuleVocabulary({ 
    moduleRef, 
    lang: 'ru' 
  });

  const preparedLessons = usePreparedLessons({ lessons: data?.lessons, moduleRef });
  const { filteredLessons, totalPages, allFilteredLessons } = useFilteredLessons({
    lessons: preparedLessons,
    selectedFilter,
    sortBy,
    sortDirection,
    currentPage,
    lessonsPerPage
  });

  const { showStickyBreadcrumbs } = useStickyBreadcrumbs(screenRef);
  const { preloadedAudioMap } = useVocabularyAudioPreload({ activeTab, vocabularyData });

  // Calculate module statistics
  const moduleStats = useMemo(() => {
    const completed = preparedLessons.filter(l => l.progress?.status === 'completed').length;
    const inProgress = preparedLessons.filter(l => l.progress?.status === 'in_progress').length;
    const totalXP = preparedLessons
      .filter(l => l.progress?.status === 'completed')
      .reduce((sum, l) => sum + (l.xpReward || 0), 0);
    const avgScore = preparedLessons
      .filter(l => l.progress?.status === 'completed')
      .reduce((sum, l, _, arr) => sum + (l.progress?.score || 0) / arr.length, 0);
    
    return {
      completed,
      inProgress,
      total: preparedLessons.length,
      totalXP,
      avgScore: Math.round(avgScore)
    };
  }, [preparedLessons]);

  const { animatedProgress, animatedCompleted, animatedXP } = useAnimatedModuleStats(moduleStats);

  useEffect(() => {
    setupBackButton();
  }, [setupBackButton]);

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


  // Get dynamic filter options based on available lesson types
  const filterOptions = useMemo(() => {
    const options = getAvailableLessonTypes(preparedLessons);
    
    // Debug logging
    if (import.meta.env.VITE_ENABLE_DEBUG_LOGGING) {
      console.log('Available lesson types:', options.map(o => o.key));
    }
    
    return options;
  }, [preparedLessons]);

  // Reset filter if selected type is no longer available
  useEffect(() => {
    const availableKeys = filterOptions.map(option => option.key);
    if (!availableKeys.includes(selectedFilter)) {
      setSelectedFilter('all');
    }
  }, [filterOptions, selectedFilter]);

  if (isLoading) {
    return (
      <Screen className="flex items-center justify-center">
        <Loader size="lg" text="Загрузка уроков..." />
      </Screen>
    );
  }

  if (preparedLessons.length === 0) {
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
                    Осталось {moduleStats.total - moduleStats.completed}{' '}
                    {pluralize(moduleStats.total - moduleStats.completed, 'урок', 'урока', 'уроков')}
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
                count: preparedLessons.length
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
            const isPreviewOpen = showPreview === lesson.lessonRef;

            const isLastLesson = index === filteredLessons.length - 1;
            const shouldShowConnectingLine = sortBy === 'order' && selectedFilter === 'all' && !isLastLesson;

            return (
              <div key={lesson.lessonRef} className="relative">
                {/* Connecting line to next lesson */}
                {shouldShowConnectingLine && (
                  <div className={`
                    connecting-line
                    ${lesson.progress?.status === 'completed' ? 'completed' : ''}
                  `} />
                )}
                
                <LessonCard
                  lesson={lesson}
                  isPreviewOpen={isPreviewOpen}
                  onPreviewToggle={handlePreviewToggle}
                  onLessonClick={handleLessonClick}
                />
              </div>
            );
          })}
        </div>

        {/* Filter Results Info */}
        {selectedFilter !== 'all' && (
          <div className="mt-4 text-center text-sm text-telegram-hint">
            Показано {allFilteredLessons.length} из {preparedLessons.length} уроков
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
