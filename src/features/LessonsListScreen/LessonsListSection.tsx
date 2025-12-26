import React from 'react';
import type { LessonItem, LessonType } from '../../types';
import { LessonCard } from '../../components';

interface LessonsListSectionProps {
  filteredLessons: LessonItem[];
  selectedFilter: LessonType | 'all';
  sortBy: 'order' | 'difficulty' | 'duration';
  showPreview: string | null;
  onPreviewToggle: (lessonRef: string) => void;
  onLessonClick: (lesson: LessonItem) => void;
  allFilteredLessonsCount: number;
  totalLessonsCount: number;
}

export const LessonsListSection: React.FC<LessonsListSectionProps> = ({
  filteredLessons,
  selectedFilter,
  sortBy,
  showPreview,
  onPreviewToggle,
  onLessonClick,
  allFilteredLessonsCount,
  totalLessonsCount
}) => {
  return (
    <>
      <div className="space-y-6 relative">
        {filteredLessons.map((lesson, index) => {
          const isPreviewOpen = showPreview === lesson.lessonRef;

          const isLastLesson = index === filteredLessons.length - 1;
          const shouldShowConnectingLine = sortBy === 'order' && selectedFilter === 'all' && !isLastLesson;

          return (
            <div key={lesson.lessonRef} className="relative">
              {shouldShowConnectingLine && (
                <div className={`
                  connecting-line
                  ${lesson.progress?.status === 'completed' ? 'completed' : ''}
                `} />
              )}
              
              <LessonCard
                lesson={lesson}
                isPreviewOpen={isPreviewOpen}
                onPreviewToggle={onPreviewToggle}
                onLessonClick={onLessonClick}
              />
            </div>
          );
        })}
      </div>

      {selectedFilter !== 'all' && (
        <div className="mt-4 text-center text-sm text-telegram-hint">
          Показано {allFilteredLessonsCount} из {totalLessonsCount} уроков
        </div>
      )}
    </>
  );
};
