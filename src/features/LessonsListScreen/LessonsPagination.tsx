import React from 'react';
import { Button } from '../../components';

interface LessonsPaginationProps {
  currentPage: number;
  totalPages: number;
  totalLessons: number;
  onPageChange: (page: number) => void;
  onPrev: () => void;
  onNext: () => void;
}

export const LessonsPagination: React.FC<LessonsPaginationProps> = ({
  currentPage,
  totalPages,
  totalLessons,
  onPageChange,
  onPrev,
  onNext
}) => {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="mt-8 flex flex-col items-center">
      <div className="flex items-center gap-2 mb-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={onPrev}
          disabled={currentPage === 1}
          className="p-2 opacity-70 hover:opacity-100"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l-6-6 6-6"/>
          </svg>
        </Button>

        <div className="flex items-center gap-1">
          {Array.from({ length: Math.min(totalPages, 8) }, (_, i) => {
            let pageIndex;
            if (totalPages <= 8) {
              pageIndex = i;
            } else {
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
                onClick={() => onPageChange(pageNumber)}
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

        <Button
          variant="ghost"
          size="sm"
          onClick={onNext}
          disabled={currentPage === totalPages}
          className="p-2 opacity-70 hover:opacity-100"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 18l6-6-6-6"/>
          </svg>
        </Button>
      </div>
      
      <div className="text-xs text-telegram-hint font-medium mb-2">
        {currentPage} / {totalPages}
      </div>
      
      <div className="text-center">
        <p className="text-telegram-hint text-xs opacity-70">
          Всего уроков: {totalLessons}
        </p>
      </div>
    </div>
  );
};
