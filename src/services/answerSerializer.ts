import type { Task } from '../types';

export function serializeAnswer(task: Task, rawAnswer: any): string {
  const type = String(task.type || '');

  if (type === 'matching' || type === 'match') {
    if (rawAnswer && typeof rawAnswer === 'object' && !Array.isArray(rawAnswer)) {
      const pairs = Object.entries(rawAnswer)
        .filter(([left, right]) => typeof left === 'string' && typeof right === 'string')
        .map(([left, right]) => ({ left, right: right as string }));
      return JSON.stringify(pairs);
    }
    return JSON.stringify(rawAnswer);
  }

  if (type === 'flashcard') {
    if (rawAnswer === 'correct') {
      const expected = task.data?.back || (Array.isArray(task.data?.expected) ? task.data.expected[0] : undefined);
      return String(expected || 'correct');
    }
    if (rawAnswer === 'incorrect') {
      return '__incorrect__';
    }
  }

  if (type === 'gap_fill' || type === 'gap') {
    if (Array.isArray(rawAnswer)) {
      if (rawAnswer.length <= 1) return String(rawAnswer[0] ?? '');
      return rawAnswer.map((x) => String(x)).join(' ').trim();
    }
    return String(rawAnswer ?? '');
  }

  if (type === 'order') {
    return JSON.stringify(Array.isArray(rawAnswer) ? rawAnswer : []);
  }

  if (typeof rawAnswer === 'number') return String(rawAnswer);
  if (typeof rawAnswer === 'string') return rawAnswer;
  if (Array.isArray(rawAnswer) || (rawAnswer && typeof rawAnswer === 'object')) {
    return JSON.stringify(rawAnswer);
  }

  return String(rawAnswer ?? '');
}
