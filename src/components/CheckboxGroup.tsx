import React from 'react';
import clsx from 'clsx';
import { hapticFeedback } from '../utils/telegram';

interface CheckboxOption {
  value: string;
  label: string;
  description?: string;
}

interface CheckboxGroupProps {
  options: CheckboxOption[];
  values: string[];
  onChange: (values: string[]) => void;
  name: string;
  className?: string;
  maxSelections?: number;
}

export const CheckboxGroup: React.FC<CheckboxGroupProps> = ({
  options,
  values,
  onChange,
  name,
  className,
  maxSelections,
}) => {
  const handleChange = (optionValue: string, checked: boolean) => {
    hapticFeedback.selection();
    
    let newValues: string[];
    if (checked) {
      // Check max selections limit
      if (maxSelections && values.length >= maxSelections) {
        return;
      }
      newValues = [...values, optionValue];
    } else {
      newValues = values.filter(v => v !== optionValue);
    }
    
    onChange(newValues);
  };

  return (
    <div className={clsx('space-y-1.5', className)}>
      {options.map((option) => {
        const isSelected = values.includes(option.value);
        const isDisabled = maxSelections && !isSelected && values.length >= maxSelections;
        
        return (
          <label
            key={option.value}
            className={clsx(
              'flex items-start gap-3 py-2 px-1 cursor-pointer transition-colors duration-200',
              'hover:bg-telegram-card-bg/20 rounded-lg',
              isDisabled && 'opacity-60 cursor-not-allowed'
            )}
          >
            <div className="relative flex items-center justify-center mt-1">
              <input
                type="checkbox"
                name={name}
                value={option.value}
                checked={isSelected}
                disabled={!!isDisabled}
                onChange={(e) => handleChange(option.value, e.target.checked)}
                className="sr-only"
              />
              <div
                className={clsx(
                  'w-5 h-5 rounded border-2 transition-all duration-200',
                  isSelected
                    ? 'border-telegram-accent bg-telegram-accent'
                    : 'border-telegram-hint/40 bg-transparent hover:border-telegram-accent/50',
                  isDisabled && 'opacity-50'
                )}
              >
                {isSelected && (
                  <div className="w-full h-full flex items-center justify-center">
                    <svg
                      className="w-3 h-3 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2.5}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex-1">
              <div className={clsx(
                "font-medium transition-colors",
                "text-telegram-text",
                isDisabled && "opacity-60"
              )}>
                {option.label}
              </div>
              {option.description && (
                <div className={clsx(
                  "text-sm mt-0.5 transition-colors",
                  "text-telegram-hint/80",
                  isDisabled && "opacity-60"
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
