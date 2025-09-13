import React from 'react';

interface LessonProgressProps {
  currentTask: number;
  totalTasks: number;
  className?: string;
}

export const LessonProgress: React.FC<LessonProgressProps> = ({
  currentTask,
  totalTasks,
  className = ''
}) => {
  const progress = totalTasks > 0 ? (currentTask / totalTasks) * 100 : 0;

  return (
    <div className={`w-full ${className}`}>
      {/* Progress Bar */}
      <div className="flex items-center gap-3 mb-2">
        <div className="flex-1 h-2 bg-telegram-secondary-bg rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-telegram-accent to-blue-500 transition-all duration-300 ease-out"
            style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
          />
        </div>
        <span className="text-sm font-medium text-telegram-text min-w-[3rem] text-right">
          {Math.round(progress)}%
        </span>
      </div>

      {/* Task Counter */}
      <div className="flex items-center justify-between text-xs text-telegram-hint">
        <span>
          Задание {Math.min(currentTask + 1, totalTasks)} из {totalTasks}
        </span>
        <span>
          Осталось: {Math.max(0, totalTasks - currentTask - 1)}
        </span>
      </div>

      {/* Progress Dots */}
      <div className="flex items-center justify-center gap-1 mt-3">
        {Array.from({ length: Math.min(totalTasks, 10) }, (_, index) => {
          let dotIndex = index;
          
          // Smart pagination for many tasks
          if (totalTasks > 10) {
            const start = Math.max(0, currentTask - 4);
            const end = Math.min(totalTasks, start + 10);
            dotIndex = start + index;
            if (dotIndex >= end) return null;
          }
          
          const isCompleted = dotIndex < currentTask;
          const isCurrent = dotIndex === currentTask;
          const isUpcoming = dotIndex > currentTask;
          
          return (
            <div
              key={dotIndex}
              className={`w-2 h-2 rounded-full transition-all duration-200 ${
                isCompleted
                  ? 'bg-green-500 scale-100'
                  : isCurrent
                  ? 'bg-telegram-accent scale-125 shadow-glow'
                  : isUpcoming
                  ? 'bg-telegram-hint/30 scale-75'
                  : 'bg-telegram-hint/30 scale-75'
              }`}
            />
          );
        })}
      </div>
    </div>
  );
};
