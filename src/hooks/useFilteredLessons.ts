import { useMemo } from 'react';
import type { LessonItem, LessonType } from '../types';

interface UseFilteredLessonsParams {
  lessons: LessonItem[];
  selectedFilter: LessonType | 'all';
  sortBy: 'order' | 'difficulty' | 'duration';
  sortDirection: 'asc' | 'desc';
  currentPage: number;
  lessonsPerPage: number;
}

export const useFilteredLessons = ({
  lessons,
  selectedFilter,
  sortBy,
  sortDirection,
  currentPage,
  lessonsPerPage
}: UseFilteredLessonsParams) => {
  return useMemo(() => {
    let filtered = selectedFilter === 'all'
      ? lessons
      : lessons.filter(lesson => lesson.type === selectedFilter);

    filtered = [...filtered].sort((a, b) => {
      let result = 0;

      switch (sortBy) {
        case 'difficulty': {
          const difficultyOrder: Record<string, number> = { easy: 1, medium: 2, hard: 3, undefined: 0 };
          const aDiff = a.difficulty || 'undefined';
          const bDiff = b.difficulty || 'undefined';
          result = (difficultyOrder[aDiff] || 0) - (difficultyOrder[bDiff] || 0);
          break;
        }
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

    const totalPages = Math.ceil(filtered.length / lessonsPerPage);
    const startIndex = (currentPage - 1) * lessonsPerPage;
    const endIndex = startIndex + lessonsPerPage;
    const paginatedLessons = filtered.slice(startIndex, endIndex);

    return {
      filteredLessons: paginatedLessons,
      totalPages,
      allFilteredLessons: filtered
    };
  }, [lessons, selectedFilter, sortBy, sortDirection, currentPage, lessonsPerPage]);
};
