import type { DetailedLesson, LessonItem, Task } from '../types';

export type NormalizerTelemetryEvent = {
  type: 'unknown_task_type' | 'invalid_task_payload';
  taskRef?: string;
  taskType?: string;
  reason?: string;
};

type TelemetryReporter = (event: NormalizerTelemetryEvent) => void;

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
  translate: 'translate',
  speak: 'speak',
  order: 'order',
};

const KNOWN_TASK_TYPES = new Set([
  'multiple_choice',
  'gap_fill',
  'listening',
  'matching',
  'flashcard',
  'translate',
  'speak',
  'order',
]);

function emitTelemetry(event: NormalizerTelemetryEvent, report?: TelemetryReporter) {
  report?.(event);
  if (import.meta.env.VITE_ENABLE_DEBUG_LOGGING) {
    console.warn('[task-normalizer]', event);
  }
}

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

function normalizeTask(task: Task, report?: TelemetryReporter): Task {
  const normalizedType = normalizeTaskType(task.type);

  if (!KNOWN_TASK_TYPES.has(normalizedType)) {
    emitTelemetry({
      type: 'unknown_task_type',
      taskRef: task.ref,
      taskType: task.type,
      reason: 'Unsupported task type passed to renderer',
    }, report);
  }

  let data = task.data || {};
  if (normalizedType === 'matching') {
    data = normalizeMatchingData(data);
    const hasInvalidPairs = (data.pairs || []).some((p: any) => !p.english || !p.russian);
    if (hasInvalidPairs) {
      emitTelemetry({
        type: 'invalid_task_payload',
        taskRef: task.ref,
        taskType: normalizedType,
        reason: 'Matching task has empty pair fields after normalization',
      }, report);
    }
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

export function normalizeDetailedLesson(
  lesson: DetailedLesson,
  report?: TelemetryReporter,
): DetailedLesson {
  return {
    ...normalizeLessonItem(lesson),
    tasks: Array.isArray(lesson.tasks) ? lesson.tasks.map((t) => normalizeTask(t, report)) : [],
  };
}
