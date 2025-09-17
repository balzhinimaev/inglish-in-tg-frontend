# Использование Vocabulary Statistics API

## В VocabularyChart компоненте

```typescript
import { useVocabularyStats } from '../services/vocabularyStats';

export const VocabularyChart: React.FC<VocabularyChartProps> = ({ className = '' }) => {
  const { data: stats, isLoading, error } = useVocabularyStats();

  if (isLoading) {
    return <div className="animate-pulse bg-gray-200 rounded-2xl h-64"></div>;
  }

  if (error || !stats) {
    return <div className="text-red-500">Ошибка загрузки статистики</div>;
  }

  // Используем данные из API
  const progressData = {
    labels: ['Выучено', 'Изучается', 'Не начато'],
    datasets: [{
      data: [
        stats.summary.learned,
        stats.summary.learning,
        stats.summary.notStarted
      ],
      backgroundColor: [
        'rgba(34, 197, 94, 0.8)',
        'rgba(59, 130, 246, 0.8)',
        'rgba(229, 231, 235, 0.8)',
      ],
      borderColor: [
        'rgba(34, 197, 94, 1)',
        'rgba(59, 130, 246, 1)',
        'rgba(229, 231, 235, 1)',
      ],
      borderWidth: 3,
    }],
  };

  // Диаграмма по сложности
  const difficultyData = {
    labels: ['Легкие', 'Средние', 'Сложные'],
    datasets: [
      {
        label: 'Выучено',
        data: [
          stats.byDifficulty.easy.learned,
          stats.byDifficulty.medium.learned,
          stats.byDifficulty.hard.learned,
        ],
        backgroundColor: 'rgba(34, 197, 94, 0.8)',
      },
      {
        label: 'Всего',
        data: [
          stats.byDifficulty.easy.total - stats.byDifficulty.easy.learned,
          stats.byDifficulty.medium.total - stats.byDifficulty.medium.learned,
          stats.byDifficulty.hard.total - stats.byDifficulty.hard.learned,
        ],
        backgroundColor: 'rgba(229, 231, 235, 0.8)',
      },
    ],
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Основная карточка прогресса */}
      <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-2xl p-4 sm:p-6 shadow-sm border border-green-200 overflow-hidden">
        <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-8">
          {/* Круговая диаграмма */}
          <div className="relative w-40 h-40 sm:w-32 sm:h-32 flex-shrink-0">
            <div className="w-full h-full">
              <Chart type="doughnut" data={progressData} options={progressOptions} />
            </div>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <div className="text-2xl font-bold text-green-800">
                {stats.summary.learned}
              </div>
              <div className="text-xs text-green-600">
                из {stats.summary.total}
              </div>
            </div>
          </div>

          {/* Статистика */}
          <div className="flex-1 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-green-700 font-medium">Прогресс</span>
              <span className="text-green-800 font-bold">
                {stats.summary.learnedPercentage.toFixed(1)}%
              </span>
            </div>
            
            {/* Прогресс-бар */}
            <div className="w-full h-3 bg-green-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full transition-all duration-2000 ease-out"
                style={{ width: `${stats.summary.learnedPercentage}%` }}
              />
            </div>

            {/* Статистика по статусам */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3 mt-4">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
                  <span className="text-xs text-green-600 truncate">Выучено</span>
                </div>
                <div className="text-base sm:text-lg font-bold text-green-800">
                  {stats.summary.learned}
                </div>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                  <span className="text-xs text-green-600 truncate">Изучается</span>
                </div>
                <div className="text-base sm:text-lg font-bold text-green-800">
                  {stats.summary.learning}
                </div>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full flex-shrink-0"></div>
                  <span className="text-xs text-green-600 truncate">Осталось</span>
                </div>
                <div className="text-base sm:text-lg font-bold text-green-800">
                  {stats.summary.notStarted}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Диаграмма по сложности */}
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <h4 className="text-lg font-semibold text-gray-800 mb-4">По уровню сложности</h4>
        <div className="h-48 w-full">
          <Chart type="bar" data={difficultyData} options={difficultyOptions} />
        </div>
      </div>

      {/* Категории */}
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <h4 className="text-lg font-semibold text-gray-800 mb-4">По категориям</h4>
        <div className="space-y-3">
          {Object.entries(stats.byCategory).map(([categoryKey, categoryStats]) => (
            <div key={categoryKey} className="flex items-center justify-between py-2 min-w-0">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex-shrink-0"></div>
                <span className="font-medium text-gray-700 truncate text-sm sm:text-base">
                  {categoryStats.categoryName}
                </span>
                {categoryStats.priority === 'high' && (
                  <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full">
                    Приоритет
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                <div className="w-16 sm:w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-1000"
                    style={{ width: `${categoryStats.learnedPercentage}%` }}
                  />
                </div>
                <span className="text-xs sm:text-sm font-semibold text-gray-600 w-10 sm:w-12 text-right">
                  {categoryStats.learned}/{categoryStats.total}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Недавняя активность */}
      {stats.recentActivity.length > 0 && (
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <h4 className="text-lg font-semibold text-gray-800 mb-4">Недавняя активность</h4>
          <div className="space-y-2">
            {stats.recentActivity.slice(0, 5).map((activity) => (
              <div key={activity.id} className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${
                    activity.action === 'learned' ? 'bg-green-500' :
                    activity.action === 'reviewed' ? 'bg-blue-500' : 'bg-red-500'
                  }`}></div>
                  <span className="font-medium text-gray-700">{activity.word}</span>
                  <span className="text-xs text-gray-500">
                    {activity.action === 'learned' ? 'изучено' :
                     activity.action === 'reviewed' ? 'повторено' : 'забыто'}
                  </span>
                </div>
                <div className="text-xs text-gray-500">
                  {new Date(activity.timestamp).toLocaleDateString('ru-RU')}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Серия дней */}
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <h4 className="text-lg font-semibold text-gray-800 mb-4">Серия дней</h4>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-2xl font-bold text-blue-600">{stats.streak.current}</div>
            <div className="text-sm text-gray-600">текущая серия</div>
          </div>
          <div className="text-right">
            <div className="text-lg font-semibold text-gray-800">{stats.streak.longest}</div>
            <div className="text-sm text-gray-600">рекорд</div>
          </div>
        </div>
      </div>
    </div>
  );
};
```

## В ProfileScreen

```typescript
import { useVocabularyStats } from '../services/vocabularyStats';

export const ProfileScreen: React.FC = () => {
  const { data: vocabularyStats, isLoading: vocabularyLoading } = useVocabularyStats();
  
  // ... остальной код
  
  return (
    <Screen>
      {/* ... другие компоненты */}
      
      {/* Vocabulary Progress */}
      <div className="mb-6">
        <VocabularyChart />
      </div>
      
      {/* ... остальные компоненты */}
    </Screen>
  );
};
```

## Обработка ошибок

```typescript
const { data: stats, isLoading, error } = useVocabularyStats();

if (error) {
  console.error('Ошибка загрузки статистики словарного запаса:', error);
  // Показать fallback UI или сообщение об ошибке
}
```

## Кэширование

Статистика кэшируется на 5 минут, что обеспечивает:
- Быстрое отображение при повторных посещениях
- Актуальность данных
- Снижение нагрузки на сервер
