import { z } from 'zod';

// Enumerations aligned with FE usage
export const LessonTypeEnum = z.enum([
  'vocabulary',
  'grammar',
  'listening',
  'speaking',
  'reading',
  'writing',
  'conversation',
]);

export const LessonDifficultyEnum = z.enum(['easy', 'medium', 'hard']);

export const TaskTypeEnum = z.enum([
  'flashcard',
  'multiple_choice',
  'matching',
  'gap_fill',
  'listening',
]);

// Summary shown in lessons list
export const LessonSummarySchema = z.object({
  lessonRef: z.string(),
  moduleRef: z.string(),
  title: z.string(),
  description: z.string(),
  estimatedMinutes: z.number().int().nonnegative(),
  order: z.number().int().nonnegative(),
  type: LessonTypeEnum.optional(),
  difficulty: LessonDifficultyEnum.optional(),
  tags: z.array(z.string()).optional(),
  xpReward: z.number().int().nonnegative().optional(),
  hasAudio: z.boolean().optional(),
  hasVideo: z.boolean().optional(),
  previewText: z.string().optional(),
  taskTypes: z.array(TaskTypeEnum).optional(),
  // Gating (recommended for per-user summary)
  isLocked: z.boolean().optional(),
  unlockCondition: z.string().optional(),
  prerequisiteRefs: z.array(z.string()).optional(),
  // Progress (recommended if userId provided)
  progress: z
    .object({
      status: z.enum(['completed', 'in_progress', 'not_started']),
      score: z.number().int().min(0).max(100),
      attempts: z.number().int().nonnegative(),
      completedAt: z.string().datetime().optional(),
      timeSpent: z.number().int().nonnegative().optional(),
    })
    .optional(),
});

export type LessonSummary = z.infer<typeof LessonSummarySchema>;

// Task union for lesson detail
const FlashcardTaskDataSchema = z.object({
  front: z.string(),
  back: z.string(),
  pronunciation: z.string().optional(),
  example: z.string().optional(),
  audio: z.string().url().or(z.string().startsWith('/')).optional(),
  image: z.string().url().optional(),
});

const MultipleChoiceTaskDataSchema = z.object({
  question: z.string(),
  options: z.array(z.string()).min(2),
  correctAnswer: z.number().int().nonnegative(),
  explanation: z.string().optional(),
  audio: z.string().url().or(z.string().startsWith('/')).optional(),
});

const ListeningTaskDataSchema = z.object({
  audio: z.string().url().or(z.string().startsWith('/')),
  transcript: z.string().optional(),
  question: z.string().optional(),
  options: z.array(z.string()).optional(),
  correctAnswer: z.number().int().nonnegative().optional(),
});

const GapFillTaskDataSchema = z.object({
  text: z.string(),
  blanks: z.array(z.string()).min(1),
  options: z.array(z.array(z.string())).min(1),
  translation: z.string().optional(),
});

const MatchingTaskDataSchema = z.object({
  pairs: z.array(
    z.object({
      english: z.string(),
      russian: z.string(),
    })
  ).min(1),
  instructions: z.string().optional(),
});

export const TaskSchema = z.discriminatedUnion('type', [
  z.object({
    ref: z.string(),
    type: z.literal('flashcard'),
    data: FlashcardTaskDataSchema,
  }),
  z.object({
    ref: z.string(),
    type: z.literal('multiple_choice'),
    data: MultipleChoiceTaskDataSchema,
  }),
  z.object({
    ref: z.string(),
    type: z.literal('listening'),
    data: ListeningTaskDataSchema,
  }),
  z.object({
    ref: z.string(),
    type: z.literal('gap_fill'),
    data: GapFillTaskDataSchema,
  }),
  z.object({
    ref: z.string(),
    type: z.literal('matching'),
    data: MatchingTaskDataSchema,
  }),
]);

export type Task = z.infer<typeof TaskSchema>;

export const LessonDetailSchema = LessonSummarySchema.extend({
  // Override: in detail, these should exist
  type: LessonTypeEnum.optional(),
  difficulty: LessonDifficultyEnum.optional(),
  taskTypes: z.array(TaskTypeEnum).optional(),
  progress: z
    .object({
      status: z.enum(['completed', 'in_progress', 'not_started']),
      score: z.number().int().min(0).max(100),
      attempts: z.number().int().nonnegative(),
      completedAt: z.string().datetime().optional(),
      timeSpent: z.number().int().nonnegative().optional(),
      lastTaskIndex: z.number().int().nonnegative().optional(),
    })
    .nullable()
    .optional(),
  tasks: z.array(TaskSchema),
});

export type LessonDetail = z.infer<typeof LessonDetailSchema>;

// Utilities
export const LessonsArraySchema = z.array(LessonSummarySchema);
export type LessonsArray = z.infer<typeof LessonsArraySchema>;

// Strongly-recommended fields for a frictionless FE experience on Summary
export const LessonSummaryRequiredForFE = [
  'lessonRef',
  'moduleRef',
  'title',
  'description',
  'estimatedMinutes',
  'order',
  'type',
  'difficulty',
  'tags',
  'xpReward',
  'hasAudio',
  'hasVideo',
  'previewText',
  'taskTypes',
  // Gating
  'isLocked',
  // Provide either unlockCondition or prerequisiteRefs
  // 'unlockCondition' or 'prerequisiteRefs'
] as const;


