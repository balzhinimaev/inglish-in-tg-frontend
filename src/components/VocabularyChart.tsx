import React, { useState, useEffect } from 'react';
import { Chart } from './Chart';
import { useVocabularyStats } from '../services/vocabularyStats';
import { Loader } from './Loader';

interface VocabularyChartProps {
  className?: string;
}

export const VocabularyChart: React.FC<VocabularyChartProps> = ({ className = '' }) => {
  const { data: vocabularyStats, isLoading, error } = useVocabularyStats();
  const [animatedStats, setAnimatedStats] = useState({ learned: 0, total: 0 });

  useEffect(() => {
    if (!vocabularyStats) return;

    const summary = vocabularyStats.summary;

    // Animate the numbers
    let start = 0;
    const duration = 2000;
    const increment = summary.learned / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= summary.learned) {
        setAnimatedStats({ learned: summary.learned, total: summary.total });
        clearInterval(timer);
      } else {
        setAnimatedStats({ learned: Math.floor(start), total: summary.total });
      }
    }, 16);

    return () => clearInterval(timer);
  }, [vocabularyStats]);

  if (isLoading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-2xl p-6 shadow-sm border border-green-200">
          <Loader size="md" text="Загрузка статистики..." />
        </div>
      </div>
    );
  }

  if (error || !vocabularyStats) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="bg-red-50 rounded-2xl p-6 shadow-sm border border-red-200">
          <p className="text-red-600 text-center">Не удалось загрузить статистику словаря</p>
        </div>
      </div>
    );
  }

  const stats = vocabularyStats.summary;
  const byDifficulty = vocabularyStats.byDifficulty;
  const byCategory = vocabularyStats.byCategory;

  // Progress ring data
  const progressData = {
    labels: ['Выучено', 'Изучается', 'Не начато'],
    datasets: [
      {
        data: [stats.learned, stats.learning, stats.notStarted],
        backgroundColor: [
          'rgba(34, 197, 94, 0.8)',   // Green for learned
          'rgba(59, 130, 246, 0.8)',  // Blue for learning  
          'rgba(229, 231, 235, 0.8)', // Gray for not started
        ],
        borderColor: [
          'rgba(34, 197, 94, 1)',
          'rgba(59, 130, 246, 1)',
          'rgba(229, 231, 235, 1)',
        ],
        borderWidth: 3,
      },
    ],
  };

  const progressOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const label = context.label;
            const value = context.parsed;
            const percentage = ((value / stats.total) * 100).toFixed(1);
            return `${label}: ${value} слов (${percentage}%)`;
          },
        },
      },
    },
    cutout: '75%',
  };

  // Difficulty breakdown data
  const difficultyData = {
    labels: ['Легкие', 'Средние', 'Сложные'],
    datasets: [
      {
        label: 'Выучено',
        data: [
          byDifficulty.easy.learned,
          byDifficulty.medium.learned,
          byDifficulty.hard.learned,
        ],
        backgroundColor: 'rgba(34, 197, 94, 0.8)',
        borderColor: 'rgba(34, 197, 94, 1)',
        borderWidth: 2,
        borderRadius: 8,
      },
      {
        label: 'Всего',
        data: [
          byDifficulty.easy.total - byDifficulty.easy.learned,
          byDifficulty.medium.total - byDifficulty.medium.learned,
          byDifficulty.hard.total - byDifficulty.hard.learned,
        ],
        backgroundColor: 'rgba(229, 231, 235, 0.8)',
        borderColor: 'rgba(229, 231, 235, 1)',
        borderWidth: 2,
        borderRadius: 8,
      },
    ],
  };

  const difficultyOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          padding: 15,
          font: { size: 12 },
        },
      },
    },
    scales: {
      x: {
        stacked: true,
        grid: { display: false },
        border: { display: false },
      },
      y: {
        stacked: true,
        beginAtZero: true,
        grid: { color: 'rgba(156, 163, 175, 0.2)' },
        border: { display: false },
        ticks: { stepSize: 1, font: { size: 11 } },
      },
    },
  };

  const learnedPercentage = Math.round((stats.learned / stats.total) * 100);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Main Vocabulary Progress Card */}
      <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-2xl p-4 sm:p-6 shadow-sm border border-green-200 overflow-hidden">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold text-green-800 mb-1">Словарный запас</h3>
            <p className="text-green-600 text-sm">Ваш прогресс в изучении слов</p>
          </div>
          <div className="w-12 h-12 bg-green-500 rounded-2xl flex items-center justify-center shadow-lg">
            <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
              <polyline points="14,2 14,8 20,8"/>
              <path d="M16 13H8"/>
              <path d="M16 17H8"/>
              <path d="M10 9H8"/>
            </svg>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-8">
          {/* Progress Ring */}
          <div className="relative w-40 h-40 sm:w-32 sm:h-32 flex-shrink-0">
            <div className="w-full h-full">
              <Chart type="doughnut" data={progressData} options={progressOptions} />
            </div>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <div className="text-2xl font-bold text-green-800">{animatedStats.learned}</div>
              <div className="text-xs text-green-600">из {animatedStats.total}</div>
            </div>
          </div>

          {/* Stats */}
          <div className="flex-1 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-green-700 font-medium">Прогресс</span>
              <span className="text-green-800 font-bold">{learnedPercentage}%</span>
            </div>
            
            <div className="w-full h-3 bg-green-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full transition-all duration-2000 ease-out"
                style={{ width: `${learnedPercentage}%` }}
              />
            </div>

            <div className="grid grid-cols-3 gap-2 sm:gap-3 mt-4">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
                  <span className="text-xs text-green-600 truncate">Выучено</span>
                </div>
                <div className="text-base sm:text-lg font-bold text-green-800">{stats.learned}</div>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                  <span className="text-xs text-green-600 truncate">Изучается</span>
                </div>
                <div className="text-base sm:text-lg font-bold text-green-800">{stats.learning}</div>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full flex-shrink-0"></div>
                  <span className="text-xs text-green-600 truncate">Осталось</span>
                </div>
                <div className="text-base sm:text-lg font-bold text-green-800">{stats.notStarted}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Difficulty Breakdown */}
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <h4 className="text-lg font-semibold text-gray-800 mb-4">По уровню сложности</h4>
        <div className="h-48 w-full">
          <Chart type="bar" data={difficultyData} options={difficultyOptions} />
        </div>
      </div>

      {/* Categories Overview */}
      {Object.keys(byCategory).length > 0 && (
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <h4 className="text-lg font-semibold text-gray-800 mb-4">По категориям</h4>
          <div className="space-y-3">
            {Object.entries(byCategory)
              .sort(([, a], [, b]) => b.learnedPercentage - a.learnedPercentage) // Sort by progress
              .slice(0, 10) // Show top 10 categories
              .map(([categoryKey, categoryData]) => {
                const percentage = Math.round(categoryData.learnedPercentage);
                
                return (
                  <div key={categoryKey} className="flex items-center justify-between py-2 min-w-0">
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                      <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex-shrink-0"></div>
                      <span className="font-medium text-gray-700 truncate text-sm sm:text-base">
                        {categoryData.categoryName || categoryKey}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                      <div className="w-16 sm:w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-1000"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-xs sm:text-sm font-semibold text-gray-600 w-10 sm:w-12 text-right">
                        {categoryData.learned}/{categoryData.total}
                      </span>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
};
