// API endpoints
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.example.com';

export const API_ENDPOINTS = {
  AUTH: {
    VERIFY: '/auth/verify',
    ONBOARDING_STATUS: '/auth/onboarding/status',
  },
  PROFILE: {
    GET: '/profile',
    ONBOARDING_COMPLETE: '/profile/onboarding/complete',
    LEARNING_GOALS: '/profile/learning-goals',
    DAILY_GOAL: '/profile/daily-goal',
    REMINDER_SETTINGS: '/profile/reminder-settings',
  },
  CONTENT: {
    LESSON: '/content/lesson1',
    LESSONS: '/content/lessons', // legacy list endpoint (may return {lessons} wrapper)
    LESSON_DETAIL_V2: '/content/v2/lessons', // detail by lessonRef
    MODULES: '/content/v2/modules', // Updated to match backend
    VOCABULARY: '/content/vocabulary',
    PAYWALL: '/paywall', // Updated to match new API endpoint
    ONBOARDING: '/content/onboarding',
  },
  VOCABULARY: {
    STATS: '/vocabulary/stats',
  },
  ENTITLEMENTS: {
    GET: '/entitlements',
  },
  EVENTS: {
    TRACK: '/events',
  },
  PAYMENTS: {
    CREATE: '/payments/create',
    STATUS: '/payments/status',
    WEBHOOK: '/payments/webhook',
  },
  LEADS: {
    BOT_START: '/leads/bot_start',
  },
  PROGRESS: {
    SESSION: '/progress/session',
  },
} as const;

// App states
export const APP_STATES = {
  LOADING: 'loading',
  DESKTOP_BRIDGE: 'desktop_bridge', // For desktop users - show QR code
  ONBOARDING: 'onboarding',
  MODULES: 'modules',
  LESSONS_LIST: 'lessons_list',
  LESSON: 'lesson',
  VOCABULARY_TEST: 'vocabulary_test', // Vocabulary testing screen
  PAYWALL: 'paywall',
  PROFILE: 'profile',
  ERROR: 'error',
} as const;

// Event names for tracking
export const TRACKING_EVENTS = {
  START_LESSON: 'start_lesson',
  COMPLETE_LESSON_1: 'complete_lesson_1',
  MODULE_VIEW: 'module_view',
  MODULE_CLICK: 'module_click',
  PAYWALL_VIEW: 'paywall_view',
  PURCHASE_INITIATED: 'purchase_initiated',
  ONBOARDING_STARTED: 'onboarding_started',
  ONBOARDING_COMPLETED: 'onboarding_completed',
} as const;

// Proficiency levels
export const PROFICIENCY_LEVELS = {
  BEGINNER: 'beginner',
  INTERMEDIATE: 'intermediate',
  ADVANCED: 'advanced',
} as const;

export type ProficiencyLevel = typeof PROFICIENCY_LEVELS[keyof typeof PROFICIENCY_LEVELS];

// Module levels (CEFR)
export const MODULE_LEVELS = {
  A0: 'A0',
  A1: 'A1',
  A2: 'A2',
  B1: 'B1',
  B2: 'B2',
  C1: 'C1',
  C2: 'C2',
} as const;

export type ModuleLevel = typeof MODULE_LEVELS[keyof typeof MODULE_LEVELS];

// Supported languages
export const SUPPORTED_LANGUAGES = {
  RU: 'ru',
  EN: 'en',
} as const;

export type SupportedLanguage = typeof SUPPORTED_LANGUAGES[keyof typeof SUPPORTED_LANGUAGES];

// Learning goals
export const LEARNING_GOALS = {
  WORK_CAREER: 'work_career',
  STUDY_EXAMS: 'study_exams', 
  TRAVEL: 'travel',
  COMMUNICATION: 'communication',
  ENTERTAINMENT: 'entertainment',
  RELOCATION: 'relocation',
  CURIOSITY: 'curiosity'
} as const;

export type LearningGoal = typeof LEARNING_GOALS[keyof typeof LEARNING_GOALS];

// Daily goals (minutes per day)
export const DAILY_GOALS = {
  LIGHT: 5,
  NORMAL: 10,
  SERIOUS: 15,
  MAXIMUM: 20
} as const;

export type DailyGoal = typeof DAILY_GOALS[keyof typeof DAILY_GOALS];