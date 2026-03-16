# Lesson Runtime Telemetry Map

This document describes runtime events emitted by `LessonScreen`.

## Events

- `task_seen`
  - `lessonRef`, `taskIndex`
- `task_completed`
  - `lessonRef`, `taskRef`, `taskType`, `taskIndex`
- `task_answer_result`
  - `lessonRef`, `taskRef`, `taskIndex`, `isCorrect`, `score`, `durationMs`
- `task_skipped`
  - `lessonRef`, `taskRef`, `taskType`, `taskIndex`
- `lesson_runtime_error`
  - `lessonRef`, optional `taskRef`/`taskIndex`/`stage`, `message`
- `lesson_runtime_recovered`
  - `lessonRef`, `recoveredTaskIndex`
- `lesson_completed_detailed`
  - `lessonRef`, `duration`, `score`, `completedTasks`, `totalTasks`

## Recovery snapshot

Runtime snapshot is persisted to `localStorage` key:

- `lesson_runtime:<lessonRef>`

Payload:

```json
{
  "lessonRef": "a0.basics.001",
  "currentTaskIndex": 2,
  "sessionId": "...",
  "updatedAt": 1710000000000
}
```

Snapshot is cleared on successful lesson completion and on manual lesson restart.
