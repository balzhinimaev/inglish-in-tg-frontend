import React from 'react';
import clsx from 'clsx';
import { hapticFeedback } from '../utils/telegram';

interface RadioOption {
  value: string;
  label: string;
  description?: string;
}

interface RadioGroupProps {
  options: RadioOption[];
  value: string | null;
  onChange: (value: string) => void;
  name: string;
  className?: string;
}

export const RadioGroup: React.FC<RadioGroupProps> = ({
  options,
  value,
  onChange,
  name,
  className,
}) => {
  const handleChange = (optionValue: string) => {
    hapticFeedback.selection();
    onChange(optionValue);
  };

  return (
    <div className={clsx('space-y-1.5', className)}>
      {options.map((option) => {
        const isSelected = value === option.value;
        
        return (
          <label
            key={option.value}
            className={clsx(
              'flex items-start gap-3 py-2 px-1 cursor-pointer transition-colors duration-200',
              'hover:bg-telegram-card-bg/20 rounded-lg'
            )}
          >
            <div className="relative flex items-center justify-center mt-1">
              <input
                type="radio"
                name={name}
                value={option.value}
                checked={isSelected}
                onChange={() => handleChange(option.value)}
                className="sr-only"
              />
              <div
                className={clsx(
                  'w-5 h-5 rounded-full border-2 transition-all duration-200',
                  isSelected
                    ? 'border-telegram-accent bg-telegram-accent'
                    : 'border-telegram-hint/40 bg-transparent hover:border-telegram-accent/50'
                )}
              >
                {isSelected && (
                  <div className="w-full h-full rounded-full bg-white/90 scale-40 transition-all duration-200" />
                )}
              </div>
            </div>
            
            <div className="flex-1">
              <div className={clsx(
                "font-medium transition-colors",
                "text-telegram-text"
              )}>
                {option.label}
              </div>
              {option.description && (
                <div className={clsx(
                  "text-sm mt-0.5 transition-colors",
                  "text-telegram-hint/80"
                )}>
                  {option.description}
                </div>
              )}
            </div>
          </label>
        );
      })}
    </div>
  );
};
