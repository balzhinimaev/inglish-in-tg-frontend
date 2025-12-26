import React, { useMemo } from 'react';
import type { LessonItem, LessonDifficulty } from '../types';
import { LESSON_DIFFICULTY_COLORS, LESSON_DIFFICULTY_LABELS } from '../features/LessonsListScreen/constants';
import { getEnhancedTags } from '../features/LessonsListScreen/utils';
import { TagDisplay } from './TagDisplay';
import { TaskCardsRow } from './TaskCardsRow';

interface LessonCardProps {
  lesson: LessonItem;
  isPreviewOpen: boolean;
  onPreviewToggle: (lessonRef: string) => void;
  onLessonClick: (lesson: LessonItem) => void;
}

export const LessonCard: React.FC<LessonCardProps> = ({
  lesson,
  isPreviewOpen,
  onPreviewToggle,
  onLessonClick
}) => {
  const isCompleted = lesson.progress?.status === 'completed';
  const isInProgress = lesson.progress?.status === 'in_progress';
  const progressText = getProgressText(lesson);
  const enhancedTags = useMemo(() => getEnhancedTags(lesson), [lesson]);

  const getDifficultyColor = (difficulty?: LessonDifficulty) => {
    if (!difficulty) return "text-gray-600 bg-gray-50";
    return LESSON_DIFFICULTY_COLORS[difficulty] || "text-gray-600 bg-gray-50";
  };

  const getDifficultyText = (difficulty?: LessonDifficulty) => {
    if (!difficulty) return "Неизвестно";
    return LESSON_DIFFICULTY_LABELS[difficulty] || "Неизвестно";
  };

  const getProgressIcon = (targetLesson: LessonItem) => {
    if (targetLesson.isLocked) {
      return (
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center shadow-lg relative">
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/20 to-transparent"></div>
          <svg className="w-6 h-6 text-gray-600 relative z-10" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM9 6c0-1.66 1.34-3 3-3s3 1.34 3 3v2H9V6z"/>
          </svg>
        </div>
      );
    }

    if (!targetLesson.progress) {
      return (
        <div className="w-12 h-12 rounded-full border-3 border-telegram-accent/30 bg-gradient-to-br from-white to-telegram-accent/5 flex items-center justify-center shadow-lg relative group hover:scale-110 transition-transform">
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-telegram-accent/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <span className="text-telegram-accent text-lg font-bold relative z-10">{targetLesson.order}</span>
        </div>
      );
    }

    switch (targetLesson.progress.status) {
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
            {targetLesson.progress.score >= 90 && (
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
            <span className="text-white text-lg font-bold relative z-10">{targetLesson.order}</span>
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
            <span className="text-telegram-hint text-lg font-medium relative z-10">{targetLesson.order}</span>
          </div>
        );
    }
  };

  function getProgressText(targetLesson: LessonItem) {
    if (targetLesson.isLocked) return targetLesson.unlockCondition || 'Заблокировано';
    if (!targetLesson.progress) return '';
    
    switch (targetLesson.progress.status) {
      case 'completed':
        return `Завершён • ${targetLesson.progress.score}%`;
      case 'in_progress':
        return 'В процессе';
      default:
        return '';
    }
  }

  return (
    <div 
      data-lesson-ref={lesson.lessonRef}
      className={`
        octagonal-card p-6 relative
        ${lesson.isLocked ? 'locked opacity-70 cursor-pointer hover:opacity-80 transition-opacity' : ''}
        ${isCompleted ? 'completed' : ''}
        ${isInProgress ? 'in-progress' : ''}
      `}
      onClick={lesson.isLocked ? () => onLessonClick(lesson) : undefined}
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
            {enhancedTags.slice(0, 4).map(tag => (
              <TagDisplay key={tag.id} tag={tag} compact={false} />
            ))}
            {enhancedTags.length > 4 && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-telegram-hint bg-telegram-card-bg">
                +{enhancedTags.length - 4}
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
                  onPreviewToggle(lesson.lessonRef);
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
                onClick={() => onLessonClick(lesson)}
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
  );
};
