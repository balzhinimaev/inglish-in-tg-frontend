import React from 'react';
import type { TaskType } from '../types';
import { TASK_TYPES_CONFIG } from '../features/LessonsListScreen/constants';

interface TaskCardsRowProps {
  taskTypes: TaskType[];
  isLocked?: boolean;
}

export const TaskCardsRow: React.FC<TaskCardsRowProps> = ({ taskTypes, isLocked = false }) => {
  if (!taskTypes || taskTypes.length === 0) return null;

  // Limit to first 6 task types for horizontal layout
  const displayTypes = taskTypes.slice(0, 6);
  
  return (
    <div className="task-cards-row">
      {displayTypes.map((taskType, index) => {
        const config = TASK_TYPES_CONFIG[taskType];
        if (!config) return null;
        
        const opacity = isLocked ? 0.4 : 1;
        
        return (
          <div
            key={`${taskType}-${index}`}
            className={`task-card ${taskType}`}
            style={{
              opacity,
              pointerEvents: isLocked ? 'none' : 'auto'
            }}
          >
            <span>{config.icon}</span>
            <div className="task-card-tooltip">
              {config.label}
            </div>
          </div>
        );
      })}
      
      {/* Show count if more than 6 types */}
      {taskTypes.length > 6 && (
        <div
          className="task-card-count"
          style={{
            opacity: isLocked ? 0.4 : 1
          }}
        >
          +{taskTypes.length - 6}
        </div>
      )}
    </div>
  );
};
