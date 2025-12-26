import React from 'react';
import type { EnhancedTag } from '../features/LessonsListScreen/constants';

interface TagDisplayProps {
  tag: EnhancedTag;
  compact?: boolean;
}

export const TagDisplay: React.FC<TagDisplayProps> = ({ tag, compact = false }) => {
  return (
    <span 
      className={`
        inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium
        ${tag.color} ${tag.bgColor}
        transition-all duration-200 hover:scale-105 cursor-default
        ${compact ? 'px-1.5 py-0.5' : ''}
      `}
      title={`${tag.label} (${tag.category})`}
    >
      <span className={compact ? 'text-xs' : ''}>{tag.icon}</span>
      {!compact && <span>{tag.label}</span>}
    </span>
  );
};
