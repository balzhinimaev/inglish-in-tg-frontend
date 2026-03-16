import type { LessonDifficulty, LessonType, TaskType, TaskTypeInfo } from '../../types';

// Enhanced tag system types
export type TagCategory = 'context' | 'skill' | 'function' | 'media' | 'level' | 'general';

export interface EnhancedTag {
  id: string;
  label: string;
  icon: string;
  category: TagCategory;
  color: string;
  bgColor: string;
  priority: number; // Higher number = higher priority for display
}

// Task types configuration
export const TASK_TYPES_CONFIG: Record<TaskType, TaskTypeInfo> = {
  flashcard: {
    type: 'flashcard',
    label: 'Карточки',
    icon: '📚',
    color: 'rgba(139, 69, 19, 0.8)',
    description: 'Изучение слов и фраз'
  },
  multiple_choice: {
    type: 'multiple_choice',
    label: 'Тест',
    icon: '✓',
    color: 'rgba(59, 130, 246, 0.8)',
    description: 'Выбор правильного ответа'
  },
  matching: {
    type: 'matching',
    label: 'Соединить',
    icon: '⚡',
    color: 'rgba(168, 85, 247, 0.8)',
    description: 'Соединение слов с переводом'
  },
  gap_fill: {
    type: 'gap_fill',
    label: 'Вставить',
    icon: '✎',
    color: 'rgba(34, 197, 94, 0.8)',
    description: 'Заполнение пропусков'
  },
  listening: {
    type: 'listening',
    label: 'Слушать',
    icon: '🔊',
    color: 'rgba(245, 101, 101, 0.8)',
    description: 'Аудирование'
  },
  choice: {
    type: 'choice',
    label: 'Тест',
    icon: '✓',
    color: 'rgba(59, 130, 246, 0.8)',
    description: 'Выбор правильного ответа'
  },
  match: {
    type: 'match',
    label: 'Соединить',
    icon: '⚡',
    color: 'rgba(168, 85, 247, 0.8)',
    description: 'Соединение слов с переводом'
  },
  gap: {
    type: 'gap',
    label: 'Вставить',
    icon: '✎',
    color: 'rgba(34, 197, 94, 0.8)',
    description: 'Заполнение пропусков'
  },
  listen: {
    type: 'listen',
    label: 'Слушать',
    icon: '🔊',
    color: 'rgba(245, 101, 101, 0.8)',
    description: 'Аудирование'
  },
  speak: {
    type: 'speak',
    label: 'Говорить',
    icon: '🎤',
    color: 'rgba(244, 114, 182, 0.8)',
    description: 'Произношение и речь'
  },
  order: {
    type: 'order',
    label: 'Порядок',
    icon: '🧩',
    color: 'rgba(14, 165, 233, 0.8)',
    description: 'Сборка предложения'
  },
  translate: {
    type: 'translate',
    label: 'Перевод',
    icon: '🌐',
    color: 'rgba(99, 102, 241, 0.8)',
    description: 'Перевод фраз'
  }
};

// Professional tag configuration
export const TAG_CONFIG: Record<string, EnhancedTag> = {
  // Context tags (places/situations)
  'airport': { id: 'airport', label: 'Аэропорт', icon: '✈️', category: 'context', color: 'text-blue-700', bgColor: 'bg-blue-100', priority: 8 },
  'hotel': { id: 'hotel', label: 'Отель', icon: '🏨', category: 'context', color: 'text-purple-700', bgColor: 'bg-purple-100', priority: 7 },
  'restaurant': { id: 'restaurant', label: 'Ресторан', icon: '🍽️', category: 'context', color: 'text-orange-700', bgColor: 'bg-orange-100', priority: 7 },
  'city': { id: 'city', label: 'Город', icon: '🏙️', category: 'context', color: 'text-gray-700', bgColor: 'bg-gray-100', priority: 6 },
  'transport': { id: 'transport', label: 'Транспорт', icon: '🚌', category: 'context', color: 'text-green-700', bgColor: 'bg-green-100', priority: 6 },

  // Skill tags (what is being learned)
  'greetings': { id: 'greetings', label: 'Приветствие', icon: '👋', category: 'skill', color: 'text-yellow-700', bgColor: 'bg-yellow-100', priority: 9 },
  'basics': { id: 'basics', label: 'Основы', icon: '📚', category: 'skill', color: 'text-indigo-700', bgColor: 'bg-indigo-100', priority: 8 },
  'pronunciation': { id: 'pronunciation', label: 'Произношение', icon: '🗣️', category: 'skill', color: 'text-pink-700', bgColor: 'bg-pink-100', priority: 7 },
  'vocabulary': { id: 'vocabulary', label: 'Словарь', icon: '📖', category: 'skill', color: 'text-teal-700', bgColor: 'bg-teal-100', priority: 6 },

  // Function tags (purpose/goal)
  'ordering': { id: 'ordering', label: 'Заказ', icon: '📝', category: 'function', color: 'text-red-700', bgColor: 'bg-red-100', priority: 7 },
  'directions': { id: 'directions', label: 'Направления', icon: '🧭', category: 'function', color: 'text-blue-700', bgColor: 'bg-blue-100', priority: 7 },
  'check-in': { id: 'check-in', label: 'Регистрация', icon: '🏨', category: 'function', color: 'text-purple-700', bgColor: 'bg-purple-100', priority: 6 },
  'security': { id: 'security', label: 'Безопасность', icon: '🔒', category: 'function', color: 'text-gray-700', bgColor: 'bg-gray-100', priority: 8 },
  'customs': { id: 'customs', label: 'Таможня', icon: '🛂', category: 'function', color: 'text-indigo-700', bgColor: 'bg-indigo-100', priority: 6 },
  'passport': { id: 'passport', label: 'Паспорт', icon: '📘', category: 'function', color: 'text-blue-700', bgColor: 'bg-blue-100', priority: 7 },

  // Media tags (content format)
  'audio': { id: 'audio', label: 'Аудио', icon: '🎵', category: 'media', color: 'text-green-600', bgColor: 'bg-green-50', priority: 5 },
  'video': { id: 'video', label: 'Видео', icon: '🎬', category: 'media', color: 'text-red-600', bgColor: 'bg-red-50', priority: 5 },
  'interactive': { id: 'interactive', label: 'Интерактив', icon: '🎮', category: 'media', color: 'text-purple-600', bgColor: 'bg-purple-50', priority: 4 },

  // Level tags (special markers)
  'beginner': { id: 'beginner', label: 'Новичок', icon: '🌱', category: 'level', color: 'text-green-600', bgColor: 'bg-green-50', priority: 6 },
  'popular': { id: 'popular', label: 'Популярный', icon: '🔥', category: 'level', color: 'text-orange-600', bgColor: 'bg-orange-50', priority: 9 },
  'important': { id: 'important', label: 'Важный', icon: '⭐', category: 'level', color: 'text-yellow-600', bgColor: 'bg-yellow-50', priority: 10 },
  'new': { id: 'new', label: 'Новый', icon: '✨', category: 'level', color: 'text-blue-600', bgColor: 'bg-blue-50', priority: 8 },

  // General tags (fallback)
  'general': { id: 'general', label: 'Общее', icon: '🏷️', category: 'general', color: 'text-gray-600', bgColor: 'bg-gray-50', priority: 1 }
};

export const LESSON_TYPE_LABELS: Record<LessonType, string> = {
  conversation: 'Разговор',
  vocabulary: 'Словарь',
  listening: 'Аудирование',
  grammar: 'Грамматика',
  speaking: 'Говорение',
  reading: 'Чтение',
  writing: 'Письмо'
};

export const LESSON_TYPE_ICONS: Record<LessonType, string> = {
  conversation: '💬',
  vocabulary: '📚',
  listening: '🎧',
  grammar: '📝',
  speaking: '🎤',
  reading: '📖',
  writing: '✍️'
};

export const LESSON_DIFFICULTY_COLORS: Record<LessonDifficulty, string> = {
  easy: 'text-green-600 bg-green-50',
  medium: 'text-yellow-600 bg-yellow-50',
  hard: 'text-red-600 bg-red-50'
};

export const LESSON_DIFFICULTY_LABELS: Record<LessonDifficulty, string> = {
  easy: 'Легко',
  medium: 'Средне',
  hard: 'Сложно'
};

export const LESSONS_PER_PAGE = 5;
