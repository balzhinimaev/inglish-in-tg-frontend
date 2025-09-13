import React from 'react';
import { Chart } from './Chart';

interface ProgressChartProps {
  className?: string;
}

export const ProgressChart: React.FC<ProgressChartProps> = ({ className = '' }) => {
  // Mock data for progress chart - можно заменить на реальные данные
  const progressData = {
    labels: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'],
    datasets: [
      {
        label: 'Уроки завершены',
        data: [2, 3, 1, 4, 2, 1, 3],
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        border: {
          display: false,
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(156, 163, 175, 0.2)',
        },
        border: {
          display: false,
        },
        ticks: {
          stepSize: 1,
          font: {
            size: 12,
          },
        },
      },
    },
    elements: {
      point: {
        radius: 4,
        hoverRadius: 6,
      },
    },
  };

  return (
    <div className={`bg-white rounded-2xl p-4 shadow-sm ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Прогресс за неделю</h3>
        <div className="flex items-center gap-2 text-sm text-green-600">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          Уроки
        </div>
      </div>
      <div className="h-48">
        <Chart type="line" data={progressData} options={options} />
      </div>
    </div>
  );
};

export const LearningStatsChart: React.FC<ProgressChartProps> = ({ className = '' }) => {
  // Mock data for learning stats
  const statsData = {
    labels: ['Завершено', 'В процессе', 'Не начато'],
    datasets: [
      {
        data: [65, 25, 10],
        backgroundColor: [
          'rgba(34, 197, 94, 0.8)',
          'rgba(251, 191, 36, 0.8)',
          'rgba(156, 163, 175, 0.8)',
        ],
        borderColor: [
          'rgba(34, 197, 94, 1)',
          'rgba(251, 191, 36, 1)',
          'rgba(156, 163, 175, 1)',
        ],
        borderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          padding: 20,
          font: {
            size: 12,
          },
        },
      },
    },
    cutout: '60%',
  };

  return (
    <div className={`bg-white rounded-2xl p-4 shadow-sm ${className}`}>
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Общая статистика</h3>
      <div className="h-48">
        <Chart type="doughnut" data={statsData} options={options} />
      </div>
    </div>
  );
};
