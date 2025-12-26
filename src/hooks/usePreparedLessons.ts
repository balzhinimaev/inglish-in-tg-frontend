import { useMemo } from 'react';
import type { LessonDifficulty, LessonItem, LessonType, TaskType } from '../types';
import { getDefaultTaskTypes, mapApiTaskTypes } from '../features/LessonsListScreen/utils';

interface UsePreparedLessonsParams {
  lessons?: LessonItem[];
  moduleRef?: string;
}

const applyLessonDefaults = (lesson: LessonItem): LessonItem => ({
  ...lesson,
  type: lesson.type || ('vocabulary' as LessonType),
  difficulty: lesson.difficulty || ('medium' as LessonDifficulty),
  tags: lesson.tags || [],
  xpReward: lesson.xpReward || 20,
  hasAudio: lesson.hasAudio || false,
  hasVideo: lesson.hasVideo || false,
  taskTypes: lesson.taskTypes
    ? mapApiTaskTypes(lesson.taskTypes)
    : getDefaultTaskTypes(lesson.type || 'vocabulary')
});

const buildMockLessons = (moduleRef?: string): LessonItem[] => [
  {
    lessonRef: 'travel.a0.greetings',
    moduleRef: moduleRef || 'travel.a0',
    title: 'Приветствие и знакомство',
    description: 'Изучите основные фразы для знакомства в аэропорту',
    estimatedMinutes: 8,
    order: 1,
    type: 'conversation' as LessonType,
    difficulty: 'easy' as LessonDifficulty,
    tags: ['greetings', 'basics', 'airport', 'beginner'],
    xpReward: 25,
    hasAudio: true,
    hasVideo: false,
    previewText: 'Hello! My name is... Nice to meet you!',
    taskTypes: ['flashcard', 'multiple_choice', 'listening'] as TaskType[],
    progress: {
      status: 'completed' as const,
      score: 95,
      attempts: 2,
      completedAt: '2024-01-15T10:30:00Z',
      timeSpent: 480
    }
  },
  {
    lessonRef: 'travel.a0.security',
    moduleRef: moduleRef || 'travel.a0',
    title: 'Досмотр безопасности',
    description: 'Пройдите контроль безопасности без проблем',
    estimatedMinutes: 12,
    order: 2,
    type: 'listening' as LessonType,
    difficulty: 'medium' as LessonDifficulty,
    tags: ['security', 'airport', 'instructions', 'important'],
    xpReward: 35,
    hasAudio: true,
    hasVideo: true,
    previewText: 'Please put your belongings in the tray...',
    taskTypes: ['listening', 'gap_fill', 'multiple_choice'] as TaskType[],
    progress: {
      status: 'in_progress' as const,
      score: 67,
      attempts: 1,
      timeSpent: 420
    }
  },
  {
    lessonRef: 'travel.a0.boarding',
    moduleRef: moduleRef || 'travel.a0',
    title: 'Посадка на самолет',
    description: 'Найдите свое место и подготовьтесь к полету',
    estimatedMinutes: 10,
    order: 3,
    type: 'vocabulary' as LessonType,
    difficulty: 'easy' as LessonDifficulty,
    tags: ['transport', 'airport', 'vocabulary'],
    xpReward: 30,
    hasAudio: true,
    hasVideo: false,
    previewText: 'Boarding pass, seat number, overhead compartment...',
    taskTypes: ['flashcard', 'matching', 'gap_fill', 'multiple_choice', 'listening'] as TaskType[],
    progress: {
      status: 'not_started' as const,
      score: 0,
      attempts: 0
    }
  },
  {
    lessonRef: 'travel.a0.flight',
    moduleRef: moduleRef || 'travel.a0',
    title: 'Во время полета',
    description: 'Общение с экипажем и пассажирами',
    estimatedMinutes: 15,
    order: 4,
    type: 'conversation' as LessonType,
    difficulty: 'medium' as LessonDifficulty,
    tags: ['transport', 'ordering', 'popular'],
    xpReward: 40,
    hasAudio: true,
    hasVideo: true,
    previewText: 'Excuse me, could I have some water please?',
    taskTypes: ['flashcard', 'gap_fill'] as TaskType[],
    isLocked: true,
    unlockCondition: 'Завершите урок "Посадка на самолет"'
  },
  {
    lessonRef: 'travel.a0.arrival',
    moduleRef: moduleRef || 'travel.a0',
    title: 'Прибытие и паспортный контроль',
    description: 'Пройдите паспортный контроль и получите багаж',
    estimatedMinutes: 18,
    order: 5,
    type: 'grammar' as LessonType,
    difficulty: 'hard' as LessonDifficulty,
    tags: ['airport', 'passport', 'customs', 'important'],
    xpReward: 50,
    hasAudio: true,
    hasVideo: true,
    previewText: 'Purpose of visit, duration of stay, customs declaration...',
    taskTypes: ['matching', 'multiple_choice', 'listening'] as TaskType[],
    isLocked: true,
    unlockCondition: 'Завершите урок "Во время полета"'
  },
  {
    lessonRef: 'travel.a0.hotel',
    moduleRef: moduleRef || 'travel.a0',
    title: 'Заселение в отель',
    description: 'Зарегистрируйтесь в отеле и узнайте о услугах',
    estimatedMinutes: 14,
    order: 6,
    type: 'speaking' as LessonType,
    difficulty: 'medium' as LessonDifficulty,
    tags: ['hotel', 'check-in', 'popular'],
    xpReward: 35,
    hasAudio: true,
    hasVideo: false,
    previewText: 'I have a reservation under the name...',
    isLocked: true,
    unlockCondition: 'Завершите урок "Прибытие и паспортный контроль"'
  },
  {
    lessonRef: 'travel.a0.restaurant',
    moduleRef: moduleRef || 'travel.a0',
    title: 'В ресторане',
    description: 'Закажите еду и пообщайтесь с официантом',
    estimatedMinutes: 16,
    order: 7,
    type: 'conversation' as LessonType,
    difficulty: 'medium' as LessonDifficulty,
    tags: ['restaurant', 'ordering', 'popular'],
    xpReward: 40,
    hasAudio: true,
    hasVideo: true,
    previewText: "Could I see the menu, please? I'd like to order...",
    isLocked: true,
    unlockCondition: 'Завершите урок "Заселение в отель"'
  },
  {
    lessonRef: 'travel.a0.directions',
    moduleRef: moduleRef || 'travel.a0',
    title: 'Спросить дорогу',
    description: 'Научитесь спрашивать и понимать направления',
    estimatedMinutes: 12,
    order: 8,
    type: 'listening' as LessonType,
    difficulty: 'easy' as LessonDifficulty,
    tags: ['city', 'directions', 'beginner'],
    xpReward: 30,
    hasAudio: true,
    hasVideo: false,
    previewText: 'Excuse me, how do I get to...? Go straight, turn left...',
    isLocked: true,
    unlockCondition: 'Завершите урок "В ресторане"'
  }
];

export const usePreparedLessons = ({ lessons, moduleRef }: UsePreparedLessonsParams) => {
  return useMemo(() => {
    const apiLessons = (lessons || []).map(applyLessonDefaults);
    const shouldUseMock = !lessons || lessons.length === 0;
    const mockLessons = shouldUseMock ? buildMockLessons(moduleRef) : [];
    const allLessons = [...apiLessons, ...mockLessons];

    const sortedLessons = [...allLessons].sort((a, b) => a.order - b.order);

    return sortedLessons.map((lesson, index, orderedLessons) => {
      if (index === 0) {
        return { ...lesson, isLocked: false };
      }

      const previousLesson = orderedLessons[index - 1];
      const isPreviousCompleted = previousLesson?.progress?.status === 'completed';

      return {
        ...lesson,
        isLocked: !isPreviousCompleted,
        unlockCondition: !isPreviousCompleted
          ? `Завершите урок "${previousLesson?.title}"`
          : lesson.unlockCondition
      };
    });
  }, [lessons, moduleRef]);
};
