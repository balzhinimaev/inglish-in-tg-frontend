import React from 'react';
import clsx from 'clsx';
import { hapticFeedback } from '../utils/telegram';

interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
  onStepClick?: (step: number) => void;
  allowNavigation?: boolean;
  className?: string;
}

export const StepIndicator: React.FC<StepIndicatorProps> = ({
  currentStep,
  totalSteps,
  onStepClick,
  allowNavigation = false,
  className
}) => {
  const handleStepClick = (stepNumber: number) => {
    if (allowNavigation && onStepClick) {
      hapticFeedback.selection();
      onStepClick(stepNumber);
    }
  };

  return (
    <div className={clsx('flex flex-col items-center mb-8', className)}>
      {/* Step bars */}
      <div className="flex items-center gap-2 mb-3">
        {Array.from({ length: totalSteps }, (_, index) => {
          const stepNumber = index + 1;
          const isCompleted = stepNumber < currentStep;
          const isCurrent = stepNumber === currentStep;
          const isClickable = allowNavigation && onStepClick;
          
          return (
            <div
              key={stepNumber}
              onClick={() => handleStepClick(stepNumber)}
              className={clsx(
                'h-1 rounded-full transition-all duration-300',
                'w-12', // Fixed width for all steps
                isCompleted && 'bg-telegram-accent shadow-glow',
                isCurrent && 'bg-telegram-accent shadow-glow scale-105',
                !isCompleted && !isCurrent && 'bg-telegram-secondary-bg border border-telegram-hint/60',
                isClickable && 'cursor-pointer hover:scale-105 hover:bg-telegram-accent/80',
                !isClickable && 'cursor-default'
              )}
            />
          );
        })}
      </div>
      
      {/* Step counter */}
      <div className="text-xs text-telegram-hint font-medium">
        {currentStep} / {totalSteps}
      </div>
    </div>
  );
};
