import type { LessonItem, LessonType, TaskType } from '../../types';
import {
  LESSON_TYPE_ICONS,
  LESSON_TYPE_LABELS,
  TAG_CONFIG,
  type EnhancedTag
} from './constants';

// Utility functions
export const getDefaultTaskTypes = (lessonType: LessonType): TaskType[] => {
  const taskTypesMap: Record<LessonType, TaskType[]> = {
    vocabulary: ['flashcard', 'multiple_choice', 'matching'],
    grammar: ['gap_fill', 'multiple_choice', 'flashcard'],
    listening: ['listening', 'multiple_choice', 'gap_fill'],
    speaking: ['flashcard', 'gap_fill', 'multiple_choice'],
    reading: ['multiple_choice', 'gap_fill', 'flashcard'],
    writing: ['gap_fill', 'multiple_choice', 'flashcard'],
    conversation: ['flashcard', 'listening', 'multiple_choice']
  };

  return taskTypesMap[lessonType] || ['flashcard', 'multiple_choice'];
};

// Map API task types to internal TaskType format
export const mapApiTaskTypes = (apiTaskTypes: string[]): TaskType[] => {
  const taskTypeMapping: Record<string, TaskType> = {
    'choice': 'multiple_choice',
    'translate': 'flashcard', // Assuming translate tasks are flashcards
    'gap': 'gap_fill',
    'listening': 'listening',
    'matching': 'matching',
    'flashcard': 'flashcard',
    'multiple_choice': 'multiple_choice',
    'gap_fill': 'gap_fill'
  };

  const mappedTypes = apiTaskTypes
    .map(type => taskTypeMapping[type])
    .filter((type): type is TaskType => type !== undefined);

  // Debug logging
  if (import.meta.env.VITE_ENABLE_DEBUG_LOGGING) {
    console.log('Mapping API task types:', apiTaskTypes, '->', mappedTypes);
  }

  return mappedTypes;
};

// Get available lesson types from current lessons
export const getAvailableLessonTypes = (lessons: LessonItem[]): Array<{key: LessonType | 'all', label: string, icon: string}> => {
  const availableTypes = new Set<LessonType>();

  lessons.forEach(lesson => {
    if (lesson.type) {
      availableTypes.add(lesson.type);
    }
  });

  const options: Array<{key: LessonType | 'all', label: string, icon: string}> = [
    { key: 'all', label: 'Все', icon: '📚' }
  ];

  // Add available types in a consistent order
  const typeOrder: LessonType[] = ['vocabulary', 'grammar', 'listening', 'speaking', 'reading', 'writing', 'conversation'];

  typeOrder.forEach(type => {
    if (availableTypes.has(type)) {
      options.push({
        key: type,
        label: LESSON_TYPE_LABELS[type],
        icon: LESSON_TYPE_ICONS[type]
      });
    }
  });

  return options;
};

export const getLessonTypeIcon = (type?: LessonType) => {
  if (!type) return "📚";
  return LESSON_TYPE_ICONS[type] || "📚";
};

export const getLessonTypeLabel = (type: LessonType): string => {
  return LESSON_TYPE_LABELS[type] || 'Урок';
};

// Enhanced tag processing functions
export const getEnhancedTags = (lesson: LessonItem): EnhancedTag[] => {
  const tags: EnhancedTag[] = [];

  // Add lesson type tag with enhanced styling
  if (lesson.type) {
    const typeTag: EnhancedTag = {
      id: `type-${lesson.type}`,
      label: getLessonTypeLabel(lesson.type),
      icon: getLessonTypeIcon(lesson.type),
      category: 'skill',
      color: 'text-telegram-accent',
      bgColor: 'bg-telegram-accent/10',
      priority: 10
    };
    tags.push(typeTag);
  }

  // Add media tags based on lesson properties
  if (lesson.hasAudio) {
    tags.push(TAG_CONFIG.audio);
  }
  if (lesson.hasVideo) {
    tags.push(TAG_CONFIG.video);
  }

  // Process original string tags and map them to enhanced tags
  lesson.tags?.forEach(tagString => {
    const enhancedTag = TAG_CONFIG[tagString];
    if (enhancedTag) {
      tags.push(enhancedTag);
    } else {
      // Create fallback tag for unknown tags
      tags.push({
        id: `custom-${tagString}`,
        label: tagString.charAt(0).toUpperCase() + tagString.slice(1),
        icon: '🏷️',
        category: 'general',
        color: 'text-gray-600',
        bgColor: 'bg-gray-50',
        priority: 2
      });
    }
  });

  // Add special tags based on lesson properties
  if (lesson.difficulty === 'easy' || lesson.tags?.includes('basics')) {
    tags.push(TAG_CONFIG.beginner);
  }

  // Add "new" tag for recently added lessons (mock logic)
  if (lesson.order <= 3) {
    tags.push(TAG_CONFIG.new);
  }

  // Add "important" tag for high XP lessons
  if (lesson.xpReward && lesson.xpReward >= 40) {
    tags.push(TAG_CONFIG.important);
  }

  // Remove duplicates and sort by priority
  const uniqueTags = tags.filter((tag, index, self) =>
    index === self.findIndex(t => t.id === tag.id)
  );

  return uniqueTags.sort((a, b) => b.priority - a.priority);
};

export const pluralize = (count: number, forms: [string, string, string]): string => {
  const mod10 = count % 10;
  const mod100 = count % 100;

  if (mod10 === 1 && mod100 !== 11) {
    return forms[0];
  }
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) {
    return forms[1];
  }
  return forms[2];
};
