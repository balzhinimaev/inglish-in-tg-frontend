import type { DetailedLesson, LessonItem, Task } from '../types';

const TASK_TYPE_MAP: Record<string, string> = {
  choice: 'multiple_choice',
  multiple_choice: 'multiple_choice',
  gap: 'gap_fill',
  gap_fill: 'gap_fill',
  listen: 'listening',
  listening: 'listening',
  match: 'matching',
  matching: 'matching',
  flashcard: 'flashcard',
  translate: 'flashcard',
};

export function normalizeTaskType(type: string): string {
  return TASK_TYPE_MAP[type] || type;
}

function normalizeMatchingData(data: Record<string, any>): Record<string, any> {
  const pairs = Array.isArray(data?.pairs) ? data.pairs : [];
  return {
    ...data,
    pairs: pairs.map((p: any) => ({
      english: p?.english ?? p?.left ?? '',
      russian: p?.russian ?? p?.right ?? '',
    })),
    instructions: data?.instructions ?? data?.instruction,
  };
}

function normalizeTask(task: Task): Task {
  const normalizedType = normalizeTaskType(task.type);

  let data = task.data || {};
  if (normalizedType === 'matching') {
    data = normalizeMatchingData(data);
  }

  return {
    ...task,
    type: normalizedType,
    data,
  };
}

export function normalizeLessonItem(lesson: LessonItem): LessonItem {
  const taskTypes = Array.isArray(lesson.taskTypes)
    ? lesson.taskTypes.map((t) => normalizeTaskType(String(t))) as any
    : lesson.taskTypes;

  return {
    ...lesson,
    taskTypes,
  };
}

export function normalizeDetailedLesson(lesson: DetailedLesson): DetailedLesson {
  return {
    ...normalizeLessonItem(lesson),
    tasks: Array.isArray(lesson.tasks) ? lesson.tasks.map((t) => normalizeTask(t)) : [],
  };
}
