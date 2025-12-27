// User types
export interface User {
  _id: string;                       // MongoDB document ID
  userId: number;                    // Telegram User ID
  firstName?: string;                // Имя из Telegram
  lastName?: string;                 // Фамилия из Telegram  
  username?: string;                 // Username из Telegram
  languageCode?: string;             // Код языка из Telegram
  photoUrl?: string;                 // URL фото из Telegram
  onboardingCompletedAt?: Date;      // Дата завершения онбординга
  proficiencyLevel?: 'beginner' | 'intermediate' | 'advanced';  // Уровень владения языком
  firstUtm?: Record<string, string>; // UTM метки первого визита
  lastUtm?: Record<string, string>;  // UTM метки последнего визита
  isFirstOpen?: boolean;             // Первый ли это визит (deprecated, will be removed)
  learningGoals?: string[];          // Array of learning goals
  notificationsAllowed?: boolean;    // Notification settings
  tz?: string;                       // Timezone
  xpTotal?: number;                  // Total XP points
  dailyGoalMinutes?: number;         // Daily goal in minutes
  reminderSettings?: {               // Reminder settings
    enabled: boolean;
    time: 'morning' | 'afternoon' | 'evening';
  };
  createdAt?: Date;                  // Creation date
  updatedAt?: Date;                  // Last update date
  __v?: number;                      // MongoDB version key
}

// JWT Token types
export interface JwtPayload {
  userId: number;
  iat: number;
  exp: number;
}

// Auth state types
export interface AuthState {
  isAuthenticated: boolean;
  accessToken: string | null;
  user: User | null;
  isLoading: boolean;
  error: string | null;
}

// Entitlement types
export interface Entitlement {
  userId: number;
  endsAt: string;
  productId: string;
  status: 'active' | 'expired' | 'cancelled';
}

// Content types
export interface Lesson {
  id: number;
  title: string;
  content: {
    audio?: string;
    text?: string;
    transliteration?: string;
  };
  duration?: number;
  isCompleted?: boolean;
}

export interface PaywallProduct {
  id: string;
  name: string;
  description: string;
  price: number; // Price in kopecks
  originalPrice?: number; // Original price in kopecks
  currency: string;
  duration: 'month' | 'quarter' | 'year';
  discount?: number;
  isPopular?: boolean;
  monthlyEquivalent?: number; // Monthly equivalent price in kopecks
  savingsPercentage?: number; // Savings percentage compared to monthly
  // Telegram Stars support
  priceInStars?: number; // Price in Telegram Stars
  originalPriceInStars?: number; // Original price in Telegram Stars
  monthlyEquivalentInStars?: number; // Monthly equivalent price in Telegram Stars
}

// Promo code and cohort system
export type UserCohort = 'new_user' | 'returning_user' | 'premium_trial' | 'high_engagement' | 'low_engagement' | 'churned' | 'default';

export interface PromoCode {
  code: string;
  discountType: 'percentage' | 'fixed_amount';
  discountValue: number;
  validUntil?: string;
  maxUses?: number;
  currentUses?: number;
  applicablePlans: string[];
  cohorts?: UserCohort[];
  isActive: boolean;
}

export interface CohortPricing {
  cohort: UserCohort;
  monthlyPrice: number;
  monthlyOriginalPrice: number;
  quarterlyPrice: number;
  quarterlyOriginalPrice: number;
  yearlyPrice: number;
  yearlyOriginalPrice: number;
  promoCode?: string;
  discountPercentage?: number;
  // Telegram Stars support
  monthlyPriceInStars?: number;
  monthlyOriginalPriceInStars?: number;
  quarterlyPriceInStars?: number;
  quarterlyOriginalPriceInStars?: number;
  yearlyPriceInStars?: number;
  yearlyOriginalPriceInStars?: number;
}

export interface UserCohortData {
  cohort: UserCohort;
  assignedAt: string;
  promoCode?: string;
  specialOffer?: {
    title: string;
    description: string;
    urgency?: string;
    badge?: string;
  };
}

// Payment currency types
export type PaymentCurrency = 'RUB' | 'STARS';

// App State types
export type AppState = 'loading' | 'desktop_bridge' | 'onboarding' | 'levels' | 'modules' | 'lessons_list' | 'lesson' | 'vocabulary_test' | 'paywall' | 'profile' | 'error';

// API Response types
export interface AuthVerifyResponse {
  userId: number; // Frontend expects number
  accessToken: string;
  user: ApiUser;
  isFirstOpen: boolean;
  utm?: Record<string, string>;
  onboardingCompleted: boolean;
  proficiencyLevel?: 'beginner' | 'intermediate' | 'advanced' | null; // Frontend uses proficiencyLevel
  learningGoals?: string[]; // Backend returns learningGoals array
}

// Backend response format (what we actually receive)
export interface BackendAuthVerifyResponse {
  userId: string; // Backend returns string
  accessToken: string;
  user: ApiUser;
  isFirstOpen: boolean;
  utm?: Record<string, string>;
  onboardingCompleted: boolean;
  englishLevel?: 'beginner' | 'intermediate' | 'advanced' | null; // Backend uses englishLevel
  learningGoals?: string[]; // Backend returns learningGoals array
}

export interface OnboardingStatusResponse {
  onboardingCompleted: boolean;
  proficiencyLevel?: 'beginner' | 'intermediate' | 'advanced' | null;
  onboardingRequired: boolean;
}

// API Response User type (dates come as strings from API)
export interface ApiUser {
  _id: string;                       // MongoDB document ID
  userId: number;                    
  firstName?: string;                
  lastName?: string;                 
  username?: string;                 
  languageCode?: string;             
  photoUrl?: string;                 
  onboardingCompletedAt?: string;    // API returns string, we convert to Date
  proficiencyLevel?: 'beginner' | 'intermediate' | 'advanced';  
  firstUtm?: Record<string, string>; 
  lastUtm?: Record<string, string>;  
  isFirstOpen?: boolean;             
  learningGoals?: string[];          // Array of learning goals
  notificationsAllowed?: boolean;    // Notification settings
  tz?: string;                       // Timezone
  xpTotal?: number;                  // Total XP points
  dailyGoalMinutes?: number;         // Daily goal in minutes
  reminderSettings?: {               // Reminder settings
    enabled: boolean;
    time: 'morning' | 'afternoon' | 'evening';
  };
  createdAt?: string;                // Creation date
  updatedAt?: string;                // Last update date
  __v?: number;                      // MongoDB version key
}

export interface ProfileResponse {
  user: ApiUser;
}

export interface OnboardingCompleteRequest {
  userId: number;
  proficiencyLevel: 'beginner' | 'intermediate' | 'advanced';
}

// Modules API types
export interface ModuleProgress {
  completed: number;
  total: number;
  inProgress: number;
}

export interface ModuleItem {
  moduleRef: string;
  level: 'A0' | 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'; // Уровни сложности
  title: string;
  description: string;
  tags: string[];
  order: number;
  progress?: ModuleProgress; // present only if userId provided
  requiresPro: boolean;
  isAvailable: boolean;
}

// Pagination types
export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface ModulesResponse {
  modules: ModuleItem[];
  pagination?: PaginationInfo;
}

// Lessons API types from /content/lessons
export interface LessonProgress {
  status: 'completed' | 'in_progress' | 'not_started';
  score: number;
  attempts: number;
  completedAt?: string;
  timeSpent?: number; // in seconds
}

export type LessonType = 'vocabulary' | 'grammar' | 'listening' | 'speaking' | 'reading' | 'writing' | 'conversation';
export type LessonDifficulty = 'easy' | 'medium' | 'hard';

// Task types for lessons
export type TaskType = 'flashcard' | 'multiple_choice' | 'matching' | 'gap_fill' | 'listening';

export interface TaskTypeInfo {
  type: TaskType;
  label: string;
  icon: string;
  color: string;
  description: string;
}

export interface LessonItem {
  lessonRef: string;
  moduleRef: string;
  title: string;
  description: string;
  estimatedMinutes: number;
  order: number;
  progress?: LessonProgress;
  type?: LessonType;
  difficulty?: LessonDifficulty;
  tags?: string[];
  isLocked?: boolean;
  unlockCondition?: string;
  xpReward?: number;
  hasAudio?: boolean;
  hasVideo?: boolean;
  previewText?: string;
  taskTypes?: TaskType[]; // Types of tasks in this lesson
}

export interface LessonsResponse {
  lessons: LessonItem[];
}

// Vocabulary types
export interface VocabularyItem {
  id: string;
  word: string;
  translation: string;
  transcription?: string;
  pronunciation?: string; // Transliteration (e.g., "хэллоу") or URL (for backward compatibility)
  partOfSpeech?: 'noun' | 'verb' | 'adjective' | 'adverb' | 'preposition' | 'conjunction' | 'interjection' | 'other';
  difficulty?: 'easy' | 'medium' | 'hard';
  examples?: {
    original: string;
    translation: string;
  }[];
  tags?: string[];
  lessonRefs?: string[]; // Which lessons this word appears in
  moduleRefs?: string[]; // Which modules this word appears in
  audioKey?: string; // Key for audio file pronunciation
  occurrenceCount?: number; // Number of occurrences of the word in the module
  imageUrl?: string;
  isLearned?: boolean; // Computed client-side from progress, if available
}

// Vocabulary Statistics API types
export interface VocabularyStatsResponse {
  summary: {
    learned: number;
    learning: number;
    notStarted: number;
    total: number;
    learnedPercentage: number;
  };
  byDifficulty: {
    easy: VocabularyDifficultyStats;
    medium: VocabularyDifficultyStats;
    hard: VocabularyDifficultyStats;
  };
  byCategory: {
    [categoryKey: string]: VocabularyCategoryStats;
  };
  byPartOfSpeech: {
    [partOfSpeech: string]: VocabularyPartOfSpeechStats;
  };
  recentActivity: VocabularyActivityItem[];
  streak: {
    current: number;
    longest: number;
    lastLearnedAt?: string; // ISO date string
  };
  weeklyProgress: {
    week: string; // YYYY-WW format
    learned: number;
    reviewed: number;
    totalTimeSpent: number; // in minutes
  }[];
}

export interface VocabularyDifficultyStats {
  learned: number;
  learning: number;
  notStarted: number;
  total: number;
  learnedPercentage: number;
  averageTimeToLearn?: number; // in minutes
}

export interface VocabularyCategoryStats {
  categoryKey: string;
  categoryName: string; // Localized name
  learned: number;
  learning: number;
  notStarted: number;
  total: number;
  learnedPercentage: number;
  priority: 'high' | 'medium' | 'low'; // Based on user's learning goals
}

export interface VocabularyPartOfSpeechStats {
  partOfSpeech: string;
  learned: number;
  total: number;
  learnedPercentage: number;
}

export interface VocabularyActivityItem {
  id: string;
  wordId: string;
  word: string;
  action: 'learned' | 'reviewed' | 'forgot';
  timestamp: string; // ISO date string
  difficulty: 'easy' | 'medium' | 'hard';
  timeSpent: number; // in seconds
  score?: number; // 0-100, for reviews
}

export interface ModuleVocabularyProgress {
  totalWords: number;
  learnedWords: number;
  learningWords: number;
  notStartedWords: number;
  progressPercentage: number; // 0-100
}

export interface ModuleVocabularyResponse {
  moduleRef: string;
  vocabulary: VocabularyItem[];
  progress?: ModuleVocabularyProgress; // Only present if user is authenticated
}

// Detailed Lesson API types from /content/lessons/:lessonRef
export interface Task {
  ref: string;
  type: string;
  data: Record<string, any>;
}

export interface DetailedLessonProgress extends LessonProgress {
  lastTaskIndex?: number;
}

export interface DetailedLesson extends LessonItem {
  tasks: Task[];
  progress?: DetailedLessonProgress;
}

export interface LessonResponse {
  lesson: DetailedLesson;
}

// Event tracking types
export interface TrackingEvent {
  userId: number; // userId на верхнем уровне, обязательное поле
  name: string;
  properties?: Record<string, any>;
  timestamp?: string;
}

// Reminder types
export type ReminderTime = 'morning' | 'afternoon' | 'evening';

export interface ReminderSettings {
  enabled: boolean;
  time: ReminderTime;
  allowsNotifications: boolean;
}

export interface SaveReminderSettingsRequest {
  userId: number;
  reminderSettings: ReminderSettings;
}

// Telegram types
export interface TelegramWebApp {
  initData: string;
  initDataUnsafe: {
    user?: {
      id: number;
      first_name?: string;
      last_name?: string;
      username?: string;
      language_code?: string;
    };
  };
  MainButton: {
    text: string;
    color: string;
    textColor: string;
    isVisible: boolean;
    isActive: boolean;
    setText: (text: string) => void;
    onClick: (callback: () => void) => void;
    show: () => void;
    hide: () => void;
    enable: () => void;
    disable: () => void;
  };
  BackButton: {
    isVisible: boolean;
    onClick: (callback: () => void) => void;
    show: () => void;
    hide: () => void;
  };
  HapticFeedback: {
    impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
    notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
    selectionChanged: () => void;
  };
  close: () => void;
  ready: () => void;
  expand: () => void;
  isExpanded: boolean;
}

declare global {
  interface Window {
    Telegram: {
      WebApp: TelegramWebApp;
    };
  }
}
