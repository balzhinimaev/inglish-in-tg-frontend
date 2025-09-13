import React from 'react';
import clsx from 'clsx';
import { hapticFeedback } from '../utils/telegram';

interface GoalOption {
  value: number;
  label: string;
  emoji: string;
  description: string;
}

interface GoalSelectorProps {
  options: GoalOption[];
  value: number | null;
  onChange: (value: number) => void;
  className?: string;
}

export const GoalSelector: React.FC<GoalSelectorProps> = ({
  options,
  value,
  onChange,
  className,
}) => {
  const handleChange = (optionValue: number) => {
    hapticFeedback.selection();
    onChange(optionValue);
  };

  return (
    <div className={clsx('space-y-2', className)}>
      {options.map((option) => {
        const isSelected = value === option.value;
        
        return (
          <button
            key={option.value}
            onClick={() => handleChange(option.value)}
            className={clsx(
              'w-full flex items-center gap-4 py-4 px-4 rounded-xl cursor-pointer transition-all duration-200',
              'border-2 text-left',
              isSelected
                ? 'border-telegram-accent bg-telegram-accent/10 scale-105'
                : 'border-telegram-hint/20 bg-transparent hover:border-telegram-accent/40 hover:bg-telegram-card-bg/10'
            )}
          >
            {/* Emoji */}
            <div className="text-2xl">
              {option.emoji}
            </div>
            
            {/* Content */}
            <div className="flex-1">
              <div className={clsx(
                "font-semibold text-base transition-colors",
                isSelected ? "text-telegram-accent" : "text-telegram-text"
              )}>
                {option.label}
              </div>
              <div className={clsx(
                "text-sm mt-0.5 transition-colors",
                "text-telegram-hint/80"
              )}>
                {option.description}
              </div>
            </div>
            
            {/* Selection indicator */}
            <div className={clsx(
              'w-5 h-5 rounded-full border-2 transition-all duration-200',
              isSelected
                ? 'border-telegram-accent bg-telegram-accent'
                : 'border-telegram-hint/40 bg-transparent'
            )}>
              {isSelected && (
                <div className="w-full h-full rounded-full bg-white/90 scale-40 transition-all duration-200" />
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
};
