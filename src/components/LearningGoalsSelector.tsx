import React from 'react';
import { LearningGoal } from '../utils/constants';

interface LearningGoalOption {
  value: LearningGoal;
  label: string;
  emoji: string;
  description?: string;
}

interface LearningGoalsSelectorProps {
  values: LearningGoal[];
  onChange: (values: LearningGoal[]) => void;
}

const learningGoalOptions: LearningGoalOption[] = [
  {
    value: 'work_career',
    label: 'Для работы и карьеры',
    emoji: '💼',
    description: 'Повышение, собеседования, деловое общение'
  },
  {
    value: 'study_exams',
    label: 'Для учёбы / экзамена',
    emoji: '🎓',
    description: 'IELTS, TOEFL и другие экзамены'
  },
  {
    value: 'travel',
    label: 'Для путешествий',
    emoji: '✈️',
    description: 'Общение в поездках и отпуске'
  },
  {
    value: 'communication',
    label: 'Для общения с людьми',
    emoji: '💬',
    description: 'Социальные сети, знакомства, дружба'
  },
  {
    value: 'entertainment',
    label: 'Для фильмов, игр и хобби',
    emoji: '🎮',
    description: 'Понимание контента без субтитров'
  },
  {
    value: 'relocation',
    label: 'Для переезда / жизни за границей',
    emoji: '🏠',
    description: 'Эмиграция, учёба или работа за рубежом'
  },
  {
    value: 'curiosity',
    label: 'Просто интересно',
    emoji: '🤔',
    description: 'Саморазвитие и расширение кругозора'
  }
];

export const LearningGoalsSelector: React.FC<LearningGoalsSelectorProps> = ({
  values,
  onChange,
}) => {
  const handleToggle = (value: LearningGoal) => {
    if (values.includes(value)) {
      onChange(values.filter(v => v !== value));
    } else {
      onChange([...values, value]);
    }
  };

  return (
    <div className="space-y-3">
      {learningGoalOptions.map((option) => {
        const isSelected = values.includes(option.value);
        
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => handleToggle(option.value)}
            className={`
              w-full p-4 rounded-xl border-2 transition-all duration-200 text-left
              ${
                isSelected
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
                <div className="flex-1">
                  <div className="font-medium text-telegram-text">
                    {option.label}
                  </div>
                  {option.description && (
                    <div className="text-sm text-telegram-hint">
                      {option.description}
                    </div>
                  )}
                </div>
              </div>
              <div
                className={`
                  w-5 h-5 rounded border-2 transition-colors duration-200 flex items-center justify-center
                  ${
                    isSelected
                      ? 'border-telegram-button bg-telegram-button'
                      : 'border-telegram-hint'
                  }
                `}
              >
                {isSelected && (
                  <svg 
                    className="w-3 h-3 text-white" 
                    fill="currentColor" 
                    viewBox="0 0 20 20"
                  >
                    <path 
                      fillRule="evenodd" 
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" 
                      clipRule="evenodd" 
                    />
                  </svg>
                )}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
};
