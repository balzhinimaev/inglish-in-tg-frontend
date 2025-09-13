import React from 'react';
import { ProficiencyLevel } from '../utils/constants';

interface ProficiencyLevelOption {
  value: ProficiencyLevel;
  label: string;
  emoji: string;
  description: string;
}

interface ProficiencyLevelSelectorProps {
  value: ProficiencyLevel | null;
  onChange: (value: ProficiencyLevel) => void;
}

const proficiencyLevelOptions: ProficiencyLevelOption[] = [
  {
    value: 'beginner',
    label: 'Начинающий',
    emoji: '🌱',
    description: 'Я только начинаю изучать язык'
  },
  {
    value: 'intermediate',
    label: 'Средний уровень',
    emoji: '📈',
    description: 'Я понимаю основы и хочу улучшить навыки'
  },
  {
    value: 'advanced',
    label: 'Продвинутый',
    emoji: '🚀',
    description: 'Я хорошо владею языком и хочу совершенствоваться'
  }
];

export const ProficiencyLevelSelector: React.FC<ProficiencyLevelSelectorProps> = ({
  value,
  onChange,
}) => {
  return (
    <div className="space-y-3">
      {proficiencyLevelOptions.map((option) => (
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
