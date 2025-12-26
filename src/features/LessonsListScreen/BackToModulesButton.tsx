import React from 'react';
import { useAppNavigation } from '../../hooks/useAppNavigation';
import { APP_STATES } from '../../utils/constants';
import { tracking } from '../../services/tracking';
import { hapticFeedback } from '../../utils/telegram';

interface BackToModulesButtonProps {
  moduleRef?: string;
  level?: string;
}

export const BackToModulesButton: React.FC<BackToModulesButtonProps> = ({
  moduleRef = '',
  level
}) => {
  const { navigateTo } = useAppNavigation();

  const handleClick = () => {
    hapticFeedback.impact('light');
    tracking.custom('bottom_back_to_modules_clicked', { 
      page: 'lessons_list',
      module: moduleRef
    });
    navigateTo(APP_STATES.MODULES, level ? { level } : {});
  };

  return (
    <div className="mt-12 mb-6 px-2">
      <div className="relative group">
        {/* Subtle glow effect */}
        <div className="absolute -inset-1 bg-gradient-to-r from-telegram-hint/10 via-telegram-secondary-bg/20 to-telegram-hint/10 rounded-2xl blur-lg opacity-50 group-hover:opacity-80 transition-all duration-500" />
        
        {/* Main button */}
        <button
          onClick={handleClick}
          onMouseEnter={() => hapticFeedback.selection()}
          className="relative w-full flex items-center justify-center gap-2 xs:gap-3 px-4 xs:px-6 py-4 bg-telegram-card-bg hover:bg-telegram-secondary-bg text-telegram-text font-medium text-sm xs:text-base rounded-2xl shadow-md hover:shadow-lg transform hover:scale-[1.01] active:scale-[0.99] transition-all duration-300 ease-out border border-telegram-hint/15 hover:border-telegram-hint/30 backdrop-blur-sm min-w-0"
        >
          {/* Subtle background pattern */}
          <div className="absolute inset-0 rounded-2xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-telegram-hint/5 via-transparent to-telegram-hint/5 transform -skew-x-12 group-hover:animate-shimmer" />
          </div>
          
          {/* Content */}
          <div className="relative flex items-center gap-2 xs:gap-3 min-w-0">
            {/* Back arrow */}
            <div className="flex items-center justify-center w-4 h-4 xs:w-5 xs:h-5 shrink-0">
              <svg 
                className="w-3 h-3 xs:w-4 xs:h-4 transform group-hover:-translate-x-0.5 transition-transform duration-300" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2"
              >
                <path d="M19 12H5"/>
                <path d="M12 19l-7-7 7-7"/>
              </svg>
            </div>
            
            {/* Text */}
            <span className="tracking-wide whitespace-nowrap">
              Вернуться к модулям
            </span>
            
            {/* Modules icon */}
            <div className="flex items-center justify-center w-4 h-4 xs:w-5 xs:h-5 opacity-70 shrink-0">
              <svg 
                className="w-3 h-3 xs:w-4 xs:h-4" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2"
              >
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
              </svg>
            </div>
          </div>
        </button>
      </div>
    </div>
  );
};

