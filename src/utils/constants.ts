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
    MODULES: '/content/v2/modules', // modules root; lessons list: /content/v2/modules/:moduleRef/lessons
    VOCABULARY: '/content/vocabulary',
    PAYWALL: '/content/paywall',
    ONBOARDING: '/content/onboarding',
  },
  ENTITLEMENTS: {
    GET: '/entitlements',
  },
  EVENTS: {
    TRACK: '/events',
  },
  PAYMENTS: {
    WEBHOOK: '/payments/webhook',
  },
} as const;

// App states
export const APP_STATES = {
  LOADING: 'loading',
  ONBOARDING: 'onboarding',
  MODULES: 'modules',
  LESSONS_LIST: 'lessons_list',
  LESSON: 'lesson',
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