// User types
export interface User {
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
  price: number;
  currency: string;
  duration: 'month' | 'quarter' | 'year';
  discount?: number;
  isPopular?: boolean;
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

// App State types
export type AppState = 'loading' | 'desktop_bridge' | 'onboarding' | 'modules' | 'lessons_list' | 'lesson' | 'paywall' | 'profile' | 'error';

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

export interface ModulesResponse {
  modules: ModuleItem[];
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
  pronunciation?: string; // URL to audio file
  partOfSpeech?: 'noun' | 'verb' | 'adjective' | 'adverb' | 'preposition' | 'conjunction' | 'interjection' | 'other';
  difficulty?: 'easy' | 'medium' | 'hard';
  examples?: {
    original: string;
    translation: string;
  }[];
  tags?: string[];
  lessonRefs?: string[]; // Which lessons this word appears in
  imageUrl?: string;
  isLearned?: boolean;
}

export interface ModuleVocabularyResponse {
  vocabulary: VocabularyItem[];
  totalCount: number;
  moduleRef: string;
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
