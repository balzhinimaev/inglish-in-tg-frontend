import React from 'react';
import { ReminderTime } from '../types';

interface ReminderTimeOption {
  value: ReminderTime;
  label: string;
  emoji: string;
  timeRange: string;
}

interface ReminderTimeSelectorProps {
  value: ReminderTime | null;
  onChange: (value: ReminderTime) => void;
}

const reminderTimeOptions: ReminderTimeOption[] = [
  {
    value: 'morning',
    label: 'Утром',
    emoji: '🌅',
    timeRange: '8:00 - 10:00'
  },
  {
    value: 'afternoon',
    label: 'Днём',
    emoji: '☀️',
    timeRange: '12:00 - 14:00'
  },
  {
    value: 'evening',
    label: 'Вечером',
    emoji: '🌙',
    timeRange: '18:00 - 21:00'
  }
];

export const ReminderTimeSelector: React.FC<ReminderTimeSelectorProps> = ({
  value,
  onChange,
}) => {
  return (
    <div className="space-y-3">
      {reminderTimeOptions.map((option) => (
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
                  {option.timeRange}
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
