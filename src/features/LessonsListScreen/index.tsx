import React, { useEffect, useState, useMemo, useRef } from 'react';
import { Screen, Button, Loader, TabSwitch, ModuleVocabulary } from '../../components';
import { BackToModulesButton } from './BackToModulesButton';
import { Breadcrumbs } from './Breadcrumbs';
import { LessonsFilters } from './LessonsFilters';
import { LessonsListSection } from './LessonsListSection';
import { LessonsPagination } from './LessonsPagination';
import { ModuleStats } from './ModuleStats';
import { StickyBreadcrumbs } from './StickyBreadcrumbs';
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
  getAvailableLessonTypes
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

  const handleModulesClick = () => {
    hapticFeedback.selection();
    tracking.custom('breadcrumb_modules_clicked', { 
      page: 'lessons_list',
      module: moduleRef 
    });
    navigateTo(APP_STATES.MODULES, level ? { level } : {});
  };

  const handleStickyModulesClick = () => {
    hapticFeedback.selection();
    tracking.custom('sticky_breadcrumb_modules_clicked', { 
      page: 'lessons_list',
      module: moduleRef 
    });
    navigateTo(APP_STATES.MODULES, level ? { level } : {});
  };

  const handleFilterChange = (filter: LessonType | 'all') => {
    hapticFeedback.selection();
    setSelectedFilter(filter);
  };

  const handleSortChange = (sortKey: 'order' | 'difficulty' | 'duration') => {
    hapticFeedback.selection();
    if (sortBy === sortKey) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(sortKey);
      setSortDirection('asc');
    }
  };

  const handlePrevPage = () => {
    hapticFeedback.selection();
    setCurrentPage(prev => Math.max(1, prev - 1));
  };

  const handleNextPage = () => {
    hapticFeedback.selection();
    setCurrentPage(prev => Math.min(totalPages, prev + 1));
  };

  const handlePageChange = (pageNumber: number) => {
    hapticFeedback.selection();
    setCurrentPage(pageNumber);
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
      <StickyBreadcrumbs
        show={showStickyBreadcrumbs}
        moduleTitle={moduleTitle}
        onModulesClick={handleStickyModulesClick}
      />

      <Screen ref={screenRef}>
        <div className="max-w-md mx-auto min-w-0">
          <Breadcrumbs
            moduleTitle={moduleTitle}
            onModulesClick={handleModulesClick}
          />

          <ModuleStats
            moduleTitle={moduleTitle}
            moduleStats={moduleStats}
            animatedProgress={animatedProgress}
            animatedCompleted={animatedCompleted}
            animatedXP={animatedXP}
          />

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
            <LessonsFilters
              filterOptions={filterOptions}
              selectedFilter={selectedFilter}
              onFilterChange={handleFilterChange}
              sortBy={sortBy}
              sortDirection={sortDirection}
              onSortChange={handleSortChange}
            />

            <LessonsListSection
              filteredLessons={filteredLessons}
              selectedFilter={selectedFilter}
              sortBy={sortBy}
              showPreview={showPreview}
              onPreviewToggle={handlePreviewToggle}
              onLessonClick={handleLessonClick}
              allFilteredLessonsCount={allFilteredLessons.length}
              totalLessonsCount={preparedLessons.length}
            />

            <LessonsPagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalLessons={allFilteredLessons.length}
              onPrev={handlePrevPage}
              onNext={handleNextPage}
              onPageChange={handlePageChange}
            />
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
