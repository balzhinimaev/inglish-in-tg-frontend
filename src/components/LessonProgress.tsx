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
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                isCompleted
                  ? 'bg-gradient-to-br from-green-400 to-emerald-600 scale-100 shadow-lg shadow-green-500/30 border border-green-300/50'
                  : isCurrent
                  ? 'bg-gradient-to-br from-telegram-accent via-blue-500 to-purple-600 scale-125 shadow-glow shadow-telegram-accent/40 border border-white/20'
                  : isUpcoming
                  ? 'bg-gradient-to-br from-slate-600 to-slate-700 scale-100 border-2 border-slate-400/60 shadow-md shadow-slate-500/20 hover:from-slate-500 hover:to-slate-600'
                  : 'bg-gradient-to-br from-slate-600 to-slate-700 scale-100 border-2 border-slate-400/60 shadow-md shadow-slate-500/20 hover:from-slate-500 hover:to-slate-600'
              }`}
            />
          );
        })}
      </div>
    </div>
  );
};
