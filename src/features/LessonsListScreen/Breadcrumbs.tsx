import React from 'react';

interface BreadcrumbsProps {
  moduleTitle: string;
  onModulesClick: () => void;
  // Optional props for lesson page
  lessonTitle?: string;
  onLessonsClick?: () => void;
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({
  moduleTitle,
  onModulesClick,
  lessonTitle,
  onLessonsClick
}) => {
  const isLessonPage = !!lessonTitle;

  return (
    <div className="mb-4">
      <div className="flex items-center gap-1 text-sm min-w-0">
        {/* Modules link */}
        <button
          onClick={onModulesClick}
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
        
        {/* Module title - clickable on lesson page */}
        {isLessonPage && onLessonsClick ? (
          <button
            onClick={onLessonsClick}
            className="flex items-center gap-0.5 text-telegram-accent hover:text-telegram-accent/80 transition-all duration-200 hover:scale-105 group min-w-0"
          >
            <svg 
              className="w-4 h-4 shrink-0" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14,2 14,8 20,8"/>
            </svg>
            <span className="font-medium truncate max-w-[80px] xs:max-w-[100px] sm:max-w-[120px]">
              {moduleTitle}
            </span>
          </button>
        ) : (
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
        )}
        
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
        
        {/* Lessons or Lesson title */}
        {isLessonPage ? (
          <div className="flex items-center gap-0.5 text-telegram-hint min-w-0 shrink-0">
            <svg 
              className="w-4 h-4 shrink-0" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2"
            >
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
            <span className="font-medium truncate max-w-[80px] xs:max-w-[100px] sm:max-w-[140px]">
              {lessonTitle}
            </span>
          </div>
        ) : (
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
        )}
      </div>
      
      <div className="mt-3 h-px bg-gradient-to-r from-transparent via-telegram-hint/20 to-transparent"></div>
    </div>
  );
};
