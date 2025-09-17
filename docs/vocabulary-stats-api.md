# Vocabulary Statistics API

## Endpoint
`GET /api/v2/vocabulary/stats`

## Response Structure

```json
{
  "summary": {
    "learned": 45,
    "learning": 12,
    "notStarted": 38,
    "total": 95,
    "learnedPercentage": 47.4
  },
  "byDifficulty": {
    "easy": {
      "learned": 25,
      "learning": 5,
      "notStarted": 15,
      "total": 45,
      "learnedPercentage": 55.6,
      "averageTimeToLearn": 3.2
    },
    "medium": {
      "learned": 18,
      "learning": 6,
      "notStarted": 16,
      "total": 40,
      "learnedPercentage": 45.0,
      "averageTimeToLearn": 5.8
    },
    "hard": {
      "learned": 2,
      "learning": 1,
      "notStarted": 7,
      "total": 10,
      "learnedPercentage": 20.0,
      "averageTimeToLearn": 12.5
    }
  },
  "byCategory": {
    "travel": {
      "categoryKey": "travel",
      "categoryName": "Путешествия",
      "learned": 15,
      "learning": 4,
      "notStarted": 8,
      "total": 27,
      "learnedPercentage": 55.6,
      "priority": "high"
    },
    "food": {
      "categoryKey": "food",
      "categoryName": "Еда",
      "learned": 12,
      "learning": 3,
      "notStarted": 10,
      "total": 25,
      "learnedPercentage": 48.0,
      "priority": "medium"
    },
    "accommodation": {
      "categoryKey": "accommodation",
      "categoryName": "Размещение",
      "learned": 8,
      "learning": 2,
      "notStarted": 5,
      "total": 15,
      "learnedPercentage": 53.3,
      "priority": "high"
    },
    "politeness": {
      "categoryKey": "politeness",
      "categoryName": "Вежливость",
      "learned": 6,
      "learning": 2,
      "notStarted": 7,
      "total": 15,
      "learnedPercentage": 40.0,
      "priority": "medium"
    },
    "questions": {
      "categoryKey": "questions",
      "categoryName": "Вопросы",
      "learned": 4,
      "learning": 1,
      "notStarted": 8,
      "total": 13,
      "learnedPercentage": 30.8,
      "priority": "low"
    }
  },
  "byPartOfSpeech": {
    "noun": {
      "partOfSpeech": "noun",
      "learned": 20,
      "total": 45,
      "learnedPercentage": 44.4
    },
    "verb": {
      "partOfSpeech": "verb",
      "learned": 15,
      "total": 30,
      "learnedPercentage": 50.0
    },
    "adjective": {
      "partOfSpeech": "adjective",
      "learned": 8,
      "total": 15,
      "learnedPercentage": 53.3
    },
    "adverb": {
      "partOfSpeech": "adverb",
      "learned": 2,
      "total": 5,
      "learnedPercentage": 40.0
    }
  },
  "recentActivity": [
    {
      "id": "activity_1",
      "wordId": "word_123",
      "word": "airport",
      "action": "learned",
      "timestamp": "2025-01-15T14:30:00.000Z",
      "difficulty": "easy",
      "timeSpent": 180,
      "score": 85
    },
    {
      "id": "activity_2",
      "wordId": "word_124",
      "word": "boarding_pass",
      "action": "reviewed",
      "timestamp": "2025-01-15T13:45:00.000Z",
      "difficulty": "medium",
      "timeSpent": 120,
      "score": 92
    },
    {
      "id": "activity_3",
      "wordId": "word_125",
      "word": "customs",
      "action": "forgot",
      "timestamp": "2025-01-15T12:20:00.000Z",
      "difficulty": "hard",
      "timeSpent": 300,
      "score": 45
    }
  ],
  "streak": {
    "current": 5,
    "longest": 12,
    "lastLearnedAt": "2025-01-15T14:30:00.000Z"
  },
  "weeklyProgress": [
    {
      "week": "2025-03",
      "learned": 8,
      "reviewed": 15,
      "totalTimeSpent": 45
    },
    {
      "week": "2025-02",
      "learned": 12,
      "reviewed": 22,
      "totalTimeSpent": 68
    },
    {
      "week": "2025-01",
      "learned": 15,
      "reviewed": 18,
      "totalTimeSpent": 52
    }
  ]
}
```

## Field Descriptions

### Summary
- `learned`: Количество полностью изученных слов
- `learning`: Количество слов в процессе изучения
- `notStarted`: Количество слов, которые еще не начаты
- `total`: Общее количество слов в словаре пользователя
- `learnedPercentage`: Процент изученных слов (0-100)

### By Difficulty
- `easy/medium/hard`: Статистика по уровням сложности
- `averageTimeToLearn`: Среднее время изучения слова в минутах (опционально)

### By Category
- `categoryKey`: Уникальный ключ категории (например, "travel")
- `categoryName`: Локализованное название категории
- `priority`: Приоритет категории на основе целей обучения пользователя

### By Part of Speech
- Статистика по частям речи (существительные, глаголы, прилагательные и т.д.)

### Recent Activity
- `action`: Тип действия ("learned", "reviewed", "forgot")
- `timeSpent`: Время, потраченное на действие в секундах
- `score`: Оценка за повторение (0-100, только для "reviewed")

### Streak
- `current`: Текущая серия дней изучения
- `longest`: Самая длинная серия дней изучения
- `lastLearnedAt`: Дата последнего изученного слова

### Weekly Progress
- `week`: Неделя в формате YYYY-WW
- `learned`: Количество изученных слов за неделю
- `reviewed`: Количество повторенных слов за неделю
- `totalTimeSpent`: Общее время изучения за неделю в минутах

## Notes
- Все даты в формате ISO 8601
- Проценты округляются до 1 знака после запятой
- Время всегда в секундах для активности, в минутах для статистики
- Категории должны быть локализованы на основе языка пользователя
