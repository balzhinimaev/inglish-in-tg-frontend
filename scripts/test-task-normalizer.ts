import assert from 'node:assert/strict';
import { normalizeDetailedLesson, normalizeTaskType, type NormalizerTelemetryEvent } from '../src/services/taskNormalizer';

const baseLesson: any = {
  lessonRef: 'test.lesson.1',
  moduleRef: 'test.module',
  title: 'Test',
  description: 'Test',
  estimatedMinutes: 5,
  order: 1,
  type: 'conversation',
  difficulty: 'easy',
  tags: [],
  xpReward: 10,
  hasAudio: false,
  hasVideo: false,
  taskTypes: ['choice', 'match'],
  tasks: [],
};

function run() {
  assert.equal(normalizeTaskType('choice'), 'multiple_choice');
  assert.equal(normalizeTaskType('listen'), 'listening');
  assert.equal(normalizeTaskType('match'), 'matching');

  const matchingLesson = {
    ...baseLesson,
    tasks: [
      {
        ref: 't1',
        type: 'match',
        data: {
          instruction: 'link words',
          pairs: [{ left: 'cat', right: 'кот' }],
        },
      },
    ],
  };

  const normalizedMatching: any = normalizeDetailedLesson(matchingLesson as any);
  assert.equal(normalizedMatching.tasks[0].type, 'matching');
  assert.equal(normalizedMatching.tasks[0].data.instructions, 'link words');
  assert.equal(normalizedMatching.tasks[0].data.pairs[0].english, 'cat');
  assert.equal(normalizedMatching.tasks[0].data.pairs[0].russian, 'кот');

  const events: NormalizerTelemetryEvent[] = [];
  const unknownLesson = {
    ...baseLesson,
    tasks: [
      {
        ref: 't-unknown',
        type: 'ordering',
        data: {},
      },
    ],
  };

  const normalizedUnknown: any = normalizeDetailedLesson(unknownLesson as any, (e) => events.push(e));
  assert.equal(normalizedUnknown.tasks[0].type, 'ordering');
  assert.equal(events.length, 1);
  assert.equal(events[0].type, 'unknown_task_type');
  assert.equal(events[0].taskRef, 't-unknown');

  console.log('taskNormalizer tests passed');
}

run();
