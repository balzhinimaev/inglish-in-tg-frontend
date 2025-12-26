import type { LessonItem, LessonType, TaskType } from '../../types';
import { LESSON_TYPE_ICONS, LESSON_TYPE_LABELS, TAG_CONFIG, type EnhancedTag } from './constants';

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

export const mapApiTaskTypes = (apiTaskTypes: string[]): TaskType[] => {
  const taskTypeMapping: Record<string, TaskType> = {
    choice: 'multiple_choice',
    translate: 'flashcard',
    gap: 'gap_fill',
    listening: 'listening',
    matching: 'matching',
    flashcard: 'flashcard',
    multiple_choice: 'multiple_choice',
    gap_fill: 'gap_fill'
  };

  const mappedTypes = apiTaskTypes
    .map(type => taskTypeMapping[type])
    .filter((type): type is TaskType => type !== undefined);

  if (import.meta.env.VITE_ENABLE_DEBUG_LOGGING) {
    console.log('Mapping API task types:', apiTaskTypes, '->', mappedTypes);
  }

  return mappedTypes;
};

export const getAvailableLessonTypes = (
  lessons: LessonItem[]
): Array<{ key: LessonType | 'all'; label: string; icon: string }> => {
  const availableTypes = new Set<LessonType>();

  lessons.forEach(lesson => {
    if (lesson.type) {
      availableTypes.add(lesson.type);
    }
  });

  const options: Array<{ key: LessonType | 'all'; label: string; icon: string }> = [
    { key: 'all', label: 'Все', icon: '📚' }
  ];

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
  if (!type) return '📚';
  return LESSON_TYPE_ICONS[type] || '📚';
};

export const getLessonTypeLabel = (type: LessonType): string => {
  return LESSON_TYPE_LABELS[type] || 'Урок';
};

export const getEnhancedTags = (lesson: LessonItem): EnhancedTag[] => {
  const tags: EnhancedTag[] = [];

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

  if (lesson.hasAudio) {
    tags.push(TAG_CONFIG.audio);
  }
  if (lesson.hasVideo) {
    tags.push(TAG_CONFIG.video);
  }

  lesson.tags?.forEach(tagString => {
    const enhancedTag = TAG_CONFIG[tagString];
    if (enhancedTag) {
      tags.push(enhancedTag);
    } else {
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

  if (lesson.difficulty === 'easy' || lesson.tags?.includes('basics')) {
    tags.push(TAG_CONFIG.beginner);
  }

  if (lesson.order <= 3) {
    tags.push(TAG_CONFIG.new);
  }

  if (lesson.xpReward && lesson.xpReward >= 40) {
    tags.push(TAG_CONFIG.important);
  }

  const uniqueTags = tags.filter((tag, index, self) => index === self.findIndex(t => t.id === tag.id));

  return uniqueTags.sort((a, b) => b.priority - a.priority);
};

export const pluralize = (count: number, one: string, few: string, many: string): string => {
  if (count === 1) return one;
  if (count < 5) return few;
  return many;
};
