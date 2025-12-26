import React from 'react';
import type { LessonType } from '../../types';

interface FilterOption {
  key: LessonType | 'all';
  label: string;
  icon: string;
}

interface LessonsFiltersProps {
  filterOptions: FilterOption[];
  selectedFilter: LessonType | 'all';
  onFilterChange: (filter: LessonType | 'all') => void;
  sortBy: 'order' | 'difficulty' | 'duration';
  sortDirection: 'asc' | 'desc';
  onSortChange: (sortKey: 'order' | 'difficulty' | 'duration') => void;
}

export const LessonsFilters: React.FC<LessonsFiltersProps> = ({
  filterOptions,
  selectedFilter,
  onFilterChange,
  sortBy,
  sortDirection,
  onSortChange
}) => {
  return (
    <div className="mb-6 -mx-2 px-2">
      <div className="flex items-center gap-1.5 xs:gap-2 mb-3 overflow-x-auto pb-2">
        {filterOptions.map(option => (
          <button
            key={option.key}
            onClick={() => onFilterChange(option.key)}
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
      
      <div className="flex items-center gap-1 text-xs overflow-x-auto pb-1 -mx-1 px-1">
        <span className="text-telegram-hint shrink-0 hidden xs:inline">Сортировка:</span>
        {[
          { key: 'order', label: 'По порядку', shortLabel: 'Порядок' },
          { key: 'difficulty', label: 'По сложности', shortLabel: 'Сложность' },
          { key: 'duration', label: 'По времени', shortLabel: 'Время' }
        ].map(option => (
          <button
            key={option.key}
            onClick={() => onSortChange(option.key as 'order' | 'difficulty' | 'duration')}
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
  );
};
