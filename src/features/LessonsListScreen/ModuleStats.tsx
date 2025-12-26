import React from 'react';
import { pluralize } from './utils';

interface ModuleStatsData {
  completed: number;
  inProgress: number;
  total: number;
  totalXP: number;
  avgScore: number;
}

interface ModuleStatsProps {
  moduleTitle: string;
  moduleStats: ModuleStatsData;
  animatedProgress: number;
  animatedCompleted: number;
  animatedXP: number;
}

export const ModuleStats: React.FC<ModuleStatsProps> = ({
  moduleTitle,
  moduleStats,
  animatedProgress,
  animatedCompleted,
  animatedXP
}) => {
  return (
    <div className="text-center mb-3">
      <h1 className="text-2xl font-bold text-telegram-text mb-2">{moduleTitle}</h1>
      
      <div className="bg-telegram-secondary-bg rounded-xl p-4 mb-4">
        <div className="grid grid-cols-2 gap-4 text-center">
          <div className="group">
            <div className="text-2xl font-bold text-telegram-accent transition-all duration-300 group-hover:scale-110">
              {animatedCompleted}
              {animatedCompleted === moduleStats.completed && moduleStats.completed > 0 && (
                <span className="inline-block ml-1 animate-bounce">🎯</span>
              )}
            </div>
            <div className="text-xs text-telegram-hint">Завершено</div>
          </div>
          <div className="group">
            <div className="text-2xl font-bold text-telegram-button transition-all duration-300 group-hover:scale-110">
              {animatedXP}
              {animatedXP === moduleStats.totalXP && moduleStats.totalXP > 0 && (
                <span className="inline-block ml-1 animate-pulse">⚡</span>
              )}
            </div>
            <div className="text-xs text-telegram-hint">XP получено</div>
          </div>
        </div>
        
        <div className="mt-3">
          <div className="flex justify-between text-xs text-telegram-hint mb-1">
            <span>Прогресс модуля</span>
            <span className="font-medium">{Math.round(animatedProgress)}%</span>
          </div>
          <div className="relative w-full h-3 bg-telegram-card-bg rounded-full overflow-hidden shadow-inner">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-pulse opacity-30"></div>
            
            <div 
              className="relative h-full bg-gradient-to-r from-telegram-accent via-blue-500 to-green-500 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${animatedProgress}%` }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer-progress" style={{animationDuration: '2s', animationIterationCount: 'infinite'}}></div>
              
              <div className="absolute inset-0 bg-gradient-to-r from-telegram-accent to-green-500 rounded-full blur-sm opacity-50"></div>
            </div>
            
            <div className="absolute inset-0 flex items-center">
              {[25, 50, 75].map(milestone => (
                <div
                  key={milestone}
                  className={`absolute w-0.5 h-full bg-white/30 transition-opacity duration-300 ${
                    animatedProgress >= milestone ? 'opacity-0' : 'opacity-100'
                  }`}
                  style={{ left: `${milestone}%` }}
                />
              ))}
            </div>
            
            {animatedProgress >= 100 && (
              <div className="absolute -inset-1 rounded-full">
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-green-500 to-blue-500 rounded-full animate-ping opacity-30"></div>
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-6">
                  <div className="flex space-x-1 animate-bounce">
                    <span className="text-lg">🎉</span>
                    <span className="text-lg">🏆</span>
                    <span className="text-lg">🎉</span>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div className="mt-2 text-center">
            {animatedProgress === 0 && (
              <p className="text-xs text-telegram-hint">Начните первый урок!</p>
            )}
            {animatedProgress > 0 && animatedProgress < 100 && (
              <p className="text-xs text-telegram-hint">
                Осталось {moduleStats.total - moduleStats.completed}{' '}
                {pluralize(moduleStats.total - moduleStats.completed, 'урок', 'урока', 'уроков')}
              </p>
            )}
            {animatedProgress >= 100 && (
              <p className="text-xs text-green-600 font-medium animate-pulse">
                🏆 Модуль завершен! Поздравляем!
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
