import React from 'react';

interface StickyBreadcrumbsProps {
  show: boolean;
  moduleTitle: string;
  onModulesClick: () => void;
}

export const StickyBreadcrumbs: React.FC<StickyBreadcrumbsProps> = ({
  show,
  moduleTitle,
  onModulesClick
}) => {
  return (
    <div 
      className={`
          fixed top-0 left-0 right-0 z-50 w-full transition-all duration-300 ease-out
          ${show 
            ? 'bg-telegram-bg/95 backdrop-blur-md border-b border-telegram-hint/10 shadow-lg' 
            : ''
          }
        `}
      style={{
        transform: show 
          ? 'translateY(0) scale(1)' 
          : 'translateY(-110%) scale(0.95)',
        opacity: show ? 1 : 0,
        marginBottom: 0,
        transition: 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
        transformOrigin: 'center top',
        pointerEvents: show ? 'auto' : 'none'
      }}
    >
      <div className={`w-full transition-all duration-300 ${show ? 'py-3' : 'py-0'}`}>
        <div className="max-w-md mx-auto px-4">
          <div className="flex items-center gap-1 text-sm min-w-0">
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
  );
};
