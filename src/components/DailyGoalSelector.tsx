import React from 'react';
import { DailyGoal } from '../utils/constants';

interface DailyGoalOption {
  value: DailyGoal;
  label: string;
  emoji: string;
  description: string;
}

interface DailyGoalSelectorProps {
  value: DailyGoal | null;
  onChange: (value: DailyGoal) => void;
}

const dailyGoalOptions: DailyGoalOption[] = [
  {
    value: 5,
    label: '5 минут в день',
    emoji: '🥱',
    description: 'Лёгкий старт для формирования привычки'
  },
  {
    value: 10,
    label: '10 минут в день',
    emoji: '🙂',
    description: 'Оптимально для большинства пользователей'
  },
  {
    value: 15,
    label: '15 минут в день',
    emoji: '💪',
    description: 'Серьёзная цель для мотивированных'
  },
  {
    value: 20,
    label: '20+ минут в день',
    emoji: '🚀',
    description: 'Максимальная прокачка для целеустремлённых'
  }
];

export const DailyGoalSelector: React.FC<DailyGoalSelectorProps> = ({
  value,
  onChange,
}) => {
  return (
    <div className="space-y-3">
      {dailyGoalOptions.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={`
            w-full p-4 rounded-xl border-2 transition-all duration-200 text-left
            ${
              value === option.value
                ? 'border-telegram-button bg-telegram-button/10 shadow-lg'
                : 'border-telegram-secondary-bg hover:border-telegram-button/50 bg-telegram-secondary-bg'
            }
          `}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="text-2xl" role="img" aria-label={option.label}>
                {option.emoji}
              </span>
              <div>
                <div className="font-medium text-telegram-text">
                  {option.label}
                </div>
                <div className="text-sm text-telegram-hint">
                  {option.description}
                </div>
              </div>
            </div>
            <div
              className={`
                w-5 h-5 rounded-full border-2 transition-colors duration-200 flex items-center justify-center
                ${
                  value === option.value
                    ? 'border-telegram-button bg-telegram-button'
                    : 'border-telegram-hint'
                }
              `}
            >
              {value === option.value && (
                <div className="w-2 h-2 rounded-full bg-white" />
              )}
            </div>
          </div>
        </button>
      ))}
    </div>
  );
};
