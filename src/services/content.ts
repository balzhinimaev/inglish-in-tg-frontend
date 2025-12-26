import { useQuery } from '@tanstack/react-query';
import apiClient from './api';
import { API_ENDPOINTS, ModuleLevel, SupportedLanguage } from '../utils/constants';
import { Lesson, PaywallProduct, ModulesResponse, LessonsResponse, LessonResponse, ModuleVocabularyResponse, VocabularyItem } from '../types';
import { getUserId } from '../utils/userId';

/**
 * Get lesson data
 */
export const useLesson = (lessonId: number | string) => {
  return useQuery({
    queryKey: ['lesson', lessonId],
    queryFn: async (): Promise<Lesson> => {
      // Отправляем только lessonId, userId извлекается из JWT токена
      const response = await apiClient.post(API_ENDPOINTS.CONTENT.LESSON, {
        lessonId,
      });
      return response.data;
    },
    staleTime: 0, // Disable caching
    gcTime: 0, // Don't keep in cache
  });
};

/**
 * Get paywall data (products, pricing, cohort)
 */
export const usePaywallData = () => {
  return useQuery({
    queryKey: ['paywall', 'data'],
    queryFn: async (): Promise<{
      cohort: string;
      pricing: {
        cohort: string;
        monthlyOriginalPrice: number;
        quarterlyOriginalPrice: number;
        yearlyOriginalPrice: number;
        monthlyPrice: number;
        quarterlyPrice: number;
        yearlyPrice: number;
        discountPercentage: number;
        quarterlyDiscountPercentage: number;
        yearlyDiscountPercentage: number;
        promoCode: string;
      };
      products: PaywallProduct[];
      userStats: {
        lessonCount: number;
        hasActiveSubscription: boolean;
        subscriptionExpired: boolean;
      };
    }> => {
      try {
        // Получаем userId из различных источников
        const userId = getUserId();
        
        // Отправляем GET запрос с userId как query параметр
        const response = await apiClient.get(`${API_ENDPOINTS.CONTENT.PAYWALL}?userId=${userId}`);
        return response.data;
      } catch (error) {
        // Если API недоступен, используем mock данные
        if (import.meta.env.VITE_ENABLE_DEBUG_LOGGING) {
          console.log('Paywall API not available, using mock data:', error);
        }
        return getMockPaywallData();
      }
    },
    staleTime: 0, // Disable caching
    gcTime: 0, // Don't keep in cache
  });
};

/**
 * Get paywall products (legacy - for backward compatibility)
 */
export const usePaywallProducts = () => {
  return useQuery({
    queryKey: ['paywall', 'products'],
    queryFn: async (): Promise<PaywallProduct[]> => {
      try {
        // userId извлекается из JWT токена на бэкенде
        const response = await apiClient.post(API_ENDPOINTS.CONTENT.PAYWALL, {});
        return response.data.products || [];
      } catch (error) {
        // Если API недоступен, используем mock данные
        if (import.meta.env.VITE_ENABLE_DEBUG_LOGGING) {
          console.log('Paywall API not available, using mock data:', error);
        }
        return getMockPaywallProducts();
      }
    },
    staleTime: 0, // Disable caching
    gcTime: 0, // Don't keep in cache
  });
};

/**
 * Get modules list with optional user progress and availability
 * Now supports level filter and pagination
 */
export const useModules = (params?: { level?: ModuleLevel; lang?: SupportedLanguage; page?: number; limit?: number }) => {
  return useQuery({
    queryKey: ['modules', params?.level, params?.lang, params?.page, params?.limit],
    queryFn: async (): Promise<ModulesResponse> => {
      const query = new URLSearchParams();
      if (params?.level) query.set('level', params.level);
      if (params?.lang) query.set('lang', params.lang);
      if (params?.page) query.set('page', params.page.toString());
      if (params?.limit) query.set('limit', params.limit.toString());

      const url = `${API_ENDPOINTS.CONTENT.MODULES}${query.toString() ? `?${query.toString()}` : ''}`;
      const response = await apiClient.get(url);
      
      // Handle both new format (with pagination) and legacy format (array)
      if (response.data?.modules && response.data?.pagination) {
        // New format with pagination
        return response.data as ModulesResponse;
      } else if (Array.isArray(response.data?.modules)) {
        // Format with modules array but no pagination
        return { modules: response.data.modules } as ModulesResponse;
      } else if (Array.isArray(response.data)) {
        // Legacy format: API returns array directly
        return { modules: response.data } as ModulesResponse;
      }
      
      // Fallback
      return { modules: [] } as ModulesResponse;
    },
    staleTime: 0, // Disable caching
    gcTime: 0, // Don't keep in cache
    enabled: params?.level !== undefined, // Only fetch when level is provided
  });
};

/**
 * Get all modules list (without level filter) for backwards compatibility
 */
export const useAllModules = (params?: { lang?: SupportedLanguage }) => {
  return useQuery({
    queryKey: ['modules', 'all', params?.lang],
    queryFn: async (): Promise<ModulesResponse> => {
      const query = new URLSearchParams();
      if (params?.lang) query.set('lang', params.lang);

      const url = `${API_ENDPOINTS.CONTENT.MODULES}${query.toString() ? `?${query.toString()}` : ''}`;
      const response = await apiClient.get(url);
      
      // Handle both new format (with pagination) and legacy format (array)
      if (response.data?.modules) {
        return response.data as ModulesResponse;
      } else if (Array.isArray(response.data)) {
        return { modules: response.data } as ModulesResponse;
      }
      
      return { modules: [] } as ModulesResponse;
    },
    staleTime: 0,
    gcTime: 0,
  });
};

/**
 * Get lessons list for a module
 */
export const useLessons = (params: { moduleRef: string; lang?: SupportedLanguage }) => {
  return useQuery({
    queryKey: ['lessons', params.moduleRef, params.lang],
    queryFn: async (): Promise<LessonsResponse> => {
      // Build query params
      const query = new URLSearchParams();
      if (params.lang) query.set('lang', params.lang);

      // Prefer v2 endpoint shape: GET /content/v2/modules/:moduleRef/lessons → returns array
      const v2Url = `${API_ENDPOINTS.CONTENT.MODULES}/${encodeURIComponent(params.moduleRef)}/lessons${query.toString() ? `?${query.toString()}` : ''}`;
      try {
        const v2Resp = await apiClient.get(v2Url);
        const lessons = Array.isArray(v2Resp.data) ? v2Resp.data : v2Resp.data?.lessons;
        if (Array.isArray(lessons)) {
          return { lessons } as LessonsResponse;
        }
      } catch (_) {
        // fall back to legacy endpoint below
      }

      // Legacy fallback: GET /content/lessons?moduleRef=... → may return {lessons} or array
      const legacyQuery = new URLSearchParams();
      legacyQuery.set('moduleRef', params.moduleRef);
      if (params.lang) legacyQuery.set('lang', params.lang);

      const legacyUrl = `${API_ENDPOINTS.CONTENT.LESSONS}?${legacyQuery.toString()}`;
      const legacyResp = await apiClient.get(legacyUrl);
      const legacyLessons = Array.isArray(legacyResp.data) ? legacyResp.data : legacyResp.data?.lessons;
      return { lessons: legacyLessons || [] } as LessonsResponse;
    },
    staleTime: 0, // Disable caching
    gcTime: 0, // Don't keep in cache
  });
};

/**
 * Get a specific lesson with all its tasks
 */
export const useDetailedLesson = (params: { lessonRef: string; lang?: SupportedLanguage }) => {
  return useQuery({
    queryKey: ['detailedLesson', params.lessonRef, params.lang],
    queryFn: async (): Promise<LessonResponse> => {
      try {
        const query = new URLSearchParams();
        if (params.lang) query.set('lang', params.lang);

        // Prefer v2 detail endpoint
        const v2Url = `${API_ENDPOINTS.CONTENT.LESSON_DETAIL_V2}/${encodeURIComponent(params.lessonRef)}${query.toString() ? `?${query.toString()}` : ''}`;
        try {
          const v2Response = await apiClient.get(v2Url);
          const data = v2Response.data;
          if (data?.lesson) {
            return data as LessonResponse;
          }
          if (data?.lessonRef) {
            return { lesson: data } as LessonResponse;
          }
        } catch (e) {
          // ignore and try legacy below
        }

        // Legacy: GET /content/lessons/:lessonRef
        const legacyUrl = `${API_ENDPOINTS.CONTENT.LESSONS}/${params.lessonRef}${query.toString() ? `?${query.toString()}` : ''}`;
        const legacyResponse = await apiClient.get(legacyUrl);
        const legacyData = legacyResponse.data;
        if (legacyData?.lesson) {
          return legacyData as LessonResponse;
        }
        if (legacyData?.lessonRef) {
          return { lesson: legacyData } as LessonResponse;
        }
        throw new Error('Invalid lesson detail payload');
      } catch (error) {
        if (import.meta.env.VITE_ENABLE_DEBUG_LOGGING) {
          console.log('Failed to load lesson detail:', params.lessonRef, error);
        }
        throw error;
      }
    },
    staleTime: 0, // Disable caching
    gcTime: 0, // Don't keep in cache
  });
};

/**
 * Mock detailed lesson data with rich task content
 */
// function getMockDetailedLesson(lessonRef: string, userId?: number): LessonResponse {
//   console.log('getMockDetailedLesson called with:', { lessonRef, userId });
  
//   const mockLessonsData = {
//     "travel.a0.greetings": {
//       lessonRef: "travel.a0.greetings",
//       moduleRef: "travel.a0",
//       title: "Приветствие и знакомство",
//       description: "Изучите основные фразы для знакомства в аэропорту",
//       estimatedMinutes: 8,
//       order: 1,
//       type: "conversation" as const,
//       difficulty: "easy" as const,
//       tags: ["greetings", "basics", "airport", "beginner"],
//       xpReward: 25,
//       hasAudio: true,
//       hasVideo: false,
//       previewText: "Hello! My name is... Nice to meet you!",
//       taskTypes: ["flashcard", "multiple_choice", "listening"] as TaskType[],
//       progress: {
//         status: "not_started" as const,
//         score: 0,
//         attempts: 0,
//         lastTaskIndex: 0,
//       },
//       tasks: [
//         {
//           ref: "greetings_flashcard_1",
//           type: "flashcard",
//           data: {
//             front: "Hello! How are you?",
//             back: "Привет! Как дела?",
//             pronunciation: "[həˈləʊ haʊ ɑː juː]",
//             example: "Hello! How are you? - I'm fine, thank you!",
//             audio: "/audio/hello-how-are-you.mp3"
//           }
//         },
//         {
//           ref: "greetings_flashcard_2", 
//           type: "flashcard",
//           data: {
//             front: "Nice to meet you",
//             back: "Приятно познакомиться",
//             pronunciation: "[naɪs tuː miːt juː]",
//             example: "Nice to meet you! - Nice to meet you too!",
//             audio: "/audio/nice-to-meet-you.mp3"
//           }
//         },
//         {
//           ref: "greetings_multiple_choice_1",
//           type: "multiple_choice",
//           data: {
//             question: "Как сказать 'Меня зовут...' по-английски?",
//             options: [
//               "My name is...",
//               "I am calling...",
//               "My call is...",
//               "I name..."
//             ],
//             correctAnswer: 0,
//             explanation: "'My name is...' - стандартный способ представиться на английском языке.",
//             audio: "/audio/my-name-is.mp3"
//           }
//         },
//         {
//           ref: "greetings_listening_1",
//           type: "listening",
//           data: {
//             audio: "/audio/airport-greeting-conversation.mp3",
//             transcript: "A: Hello! Are you here for business or pleasure?\nB: Hello! I'm here for vacation. Nice to meet you!\nA: Nice to meet you too! Welcome to London!",
//             question: "Зачем прилетел собеседник?",
//             options: [
//               "По работе",
//               "В отпуск", 
//               "К родственникам",
//               "На учёбу"
//             ],
//             correctAnswer: 1
//           }
//         },
//         {
//           ref: "greetings_gap_fill_1",
//           type: "gap_fill",
//           data: {
//             text: "Hello! {{}} name is John. {{}} to meet you!",
//             blanks: ["My", "Nice"],
//             options: [
//               ["My", "Your", "His", "Her"],
//               ["Nice", "Good", "Bad", "Fine"]
//             ],
//             translation: "Привет! Меня зовут Джон. Приятно познакомиться!"
//           }
//         }
//       ]
//     },

//     "travel.a0.security": {
//       lessonRef: "travel.a0.security",
//       moduleRef: "travel.a0", 
//       title: "Досмотр безопасности",
//       description: "Пройдите контроль безопасности без проблем",
//       estimatedMinutes: 12,
//       order: 2,
//       type: "listening" as const,
//       difficulty: "medium" as const,
//       tags: ["security", "airport", "instructions", "important"],
//       xpReward: 35,
//       hasAudio: true,
//       hasVideo: true,
//       previewText: "Please put your belongings in the tray...",
//       taskTypes: ["listening", "gap_fill", "multiple_choice"] as TaskType[],
//       progress: {
//         status: "not_started" as const,
//         score: 0,
//         attempts: 0,
//         lastTaskIndex: 0,
//       },
//       tasks: [
//         {
//           ref: "security_listening_1",
//           type: "listening",
//           data: {
//             audio: "/audio/security-instructions.mp3",
//             transcript: "Please remove your laptop and liquids from your bag. Put them in separate trays. Remove your shoes and belt. Walk through the metal detector.",
//             question: "Что нужно вытащить из сумки?",
//             options: [
//               "Только ноутбук",
//               "Ноутбук и жидкости",
//               "Только жидкости", 
//               "Документы"
//             ],
//             correctAnswer: 1
//           }
//         },
//         {
//           ref: "security_flashcard_1",
//           type: "flashcard", 
//           data: {
//             front: "Remove your shoes",
//             back: "Снимите обувь",
//             pronunciation: "[rɪˈmuːv jɔː ʃuːz]",
//             example: "Please remove your shoes and put them in the tray.",
//             audio: "/audio/remove-shoes.mp3"
//           }
//         },
//         {
//           ref: "security_multiple_choice_1",
//           type: "multiple_choice",
//           data: {
//             question: "Что означает 'Put your belongings in the tray'?",
//             options: [
//               "Положите вещи в лоток",
//               "Уберите вещи в сумку",
//               "Покажите вещи охраннику",
//               "Выбросите ненужные вещи"
//             ],
//             correctAnswer: 0,
//             explanation: "'Tray' - это лоток/поднос для досмотра в аэропорту."
//           }
//         },
//         {
//           ref: "security_gap_fill_1", 
//           type: "gap_fill",
//           data: {
//             text: "Please {{}} your laptop from your bag and put it in a {{}} tray.",
//             blanks: ["remove", "separate"],
//             options: [
//               ["remove", "take", "get", "pull"],
//               ["separate", "different", "new", "clean"]
//             ],
//             translation: "Пожалуйста, достаньте ноутбук из сумки и положите его в отдельный лоток."
//           }
//         },
//         {
//           ref: "security_matching_1",
//           type: "matching",
//           data: {
//             pairs: [
//               { english: "metal detector", russian: "металлоискатель" },
//               { english: "security check", russian: "проверка безопасности" },
//               { english: "boarding pass", russian: "посадочный талон" },
//               { english: "ID card", russian: "удостоверение личности" }
//             ],
//             instructions: "Соотнесите английские термины с их русскими переводами"
//           }
//         }
//       ]
//     },

//     "travel.a0.boarding": {
//       lessonRef: "travel.a0.boarding",
//       moduleRef: "travel.a0",
//       title: "Посадка на самолет",
//       description: "Найдите свой гейт и сядьте в самолет",
//       estimatedMinutes: 10,
//       order: 3,
//       type: "vocabulary" as const,
//       difficulty: "easy" as const,
//       tags: ["boarding", "airport", "gates", "vocabulary"],
//       xpReward: 30,
//       hasAudio: true,
//       hasVideo: false,
//       previewText: "Gate 15, boarding starts in 10 minutes...",
//       taskTypes: ["flashcard", "matching", "multiple_choice"] as TaskType[],
//       progress: {
//         status: "not_started" as const,
//         score: 0,
//         attempts: 0,
//         lastTaskIndex: 0,
//       },
//       tasks: [
//         {
//           ref: "boarding_flashcard_1",
//           type: "flashcard",
//           data: {
//             front: "Boarding gate",
//             back: "Гейт посадки", 
//             pronunciation: "[ˈbɔːdɪŋ ɡeɪt]",
//             example: "Please proceed to boarding gate 15.",
//             audio: "/audio/boarding-gate.mp3"
//           }
//         },
//         {
//           ref: "boarding_flashcard_2",
//           type: "flashcard",
//           data: {
//             front: "Departure time",
//             back: "Время вылета",
//             pronunciation: "[dɪˈpɑːtʃər taɪm]", 
//             example: "The departure time is 3:45 PM.",
//             audio: "/audio/departure-time.mp3"
//           }
//         },
//         {
//           ref: "boarding_multiple_choice_1",
//           type: "multiple_choice",
//           data: {
//             question: "Где найти информацию о гейте вашего рейса?",
//             options: [
//               "На табло в аэропорту",
//               "У стойки регистрации", 
//               "В кафе",
//               "В туалете"
//             ],
//             correctAnswer: 0,
//             explanation: "Информация о гейтах отображается на информационных табло."
//           }
//         },
//         {
//           ref: "boarding_matching_1",
//           type: "matching", 
//           data: {
//             pairs: [
//               { english: "boarding pass", russian: "посадочный талон" },
//               { english: "seat number", russian: "номер места" },
//               { english: "window seat", russian: "место у окна" },
//               { english: "aisle seat", russian: "место у прохода" }
//             ],
//             instructions: "Соотнесите термины с их переводами"
//           }
//         }
//       ]
//     },

//     "travel.a0.flight": {
//       lessonRef: "travel.a0.flight",
//       moduleRef: "travel.a0",
//       title: "Во время полета",
//       description: "Общение с экипажем и пассажирами",
//       estimatedMinutes: 15,
//       order: 4,
//       type: "conversation" as const,
//       difficulty: "medium" as const,
//       tags: ["transport", "ordering", "popular"],
//       xpReward: 40,
//       hasAudio: true,
//       hasVideo: true,
//       previewText: "Excuse me, could I have some water please?",
//       taskTypes: ["flashcard", "gap_fill", "multiple_choice"] as TaskType[],
//       progress: {
//         status: "not_started" as const,
//         score: 0,
//         attempts: 0,
//         lastTaskIndex: 0,
//       },
//       tasks: [
//         {
//           ref: "flight_flashcard_1",
//           type: "flashcard",
//           data: {
//             front: "Could I have some water?",
//             back: "Можно мне немного воды?",
//             pronunciation: "[kʊd aɪ hæv sʌm ˈwɔːtə]",
//             example: "Excuse me, could I have some water, please?",
//             audio: "/audio/could-i-have-water.mp3"
//           }
//         },
//         {
//           ref: "flight_multiple_choice_1",
//           type: "multiple_choice",
//           data: {
//             question: "Как вежливо попросить одеяло в самолете?",
//             options: [
//               "Give me a blanket!",
//               "Could I have a blanket, please?",
//               "I want blanket!",
//               "Blanket me!"
//             ],
//             correctAnswer: 1,
//             explanation: "'Could I have..., please?' - вежливый способ что-то попросить."
//           }
//         },
//         {
//           ref: "flight_gap_fill_1",
//           type: "gap_fill",
//           data: {
//             text: "Excuse me, {{}} I have the {{}} menu, please?",
//             blanks: ["could", "drink"],
//             options: [
//               ["could", "can", "may", "will"],
//               ["drink", "food", "meal", "snack"]
//             ],
//             translation: "Извините, можно мне меню напитков, пожалуйста?"
//           }
//         }
//       ]
//     },

//     "travel.a0.arrival": {
//       lessonRef: "travel.a0.arrival",
//       moduleRef: "travel.a0",
//       title: "Прибытие и паспортный контроль",
//       description: "Пройдите паспортный контроль и получите багаж",
//       estimatedMinutes: 18,
//       order: 5,
//       type: "grammar" as const,
//       difficulty: "hard" as const,
//       tags: ["airport", "passport", "customs", "important"],
//       xpReward: 50,
//       hasAudio: true,
//       hasVideo: true,
//       previewText: "Purpose of visit, duration of stay, customs declaration...",
//       taskTypes: ["matching", "multiple_choice", "listening", "gap_fill"] as TaskType[],
//       progress: {
//         status: "not_started" as const,
//         score: 0,
//         attempts: 0,
//         lastTaskIndex: 0,
//       },
//       tasks: [
//         {
//           ref: "arrival_listening_1",
//           type: "listening",
//           data: {
//             audio: "/audio/passport-control.mp3",
//             transcript: "Officer: What's the purpose of your visit?\nTraveler: I'm here for tourism.\nOfficer: How long will you stay?\nTraveler: Two weeks.",
//             question: "На какой срок приехал путешественник?",
//             options: [
//               "Одну неделю",
//               "Две недели",
//               "Месяц",
//               "Три дня"
//             ],
//             correctAnswer: 1
//           }
//         },
//         {
//           ref: "arrival_multiple_choice_1",
//           type: "multiple_choice",
//           data: {
//             question: "Что означает 'Purpose of visit'?",
//             options: [
//               "Цель визита",
//               "Место визита",
//               "Время визита",
//               "Стоимость визита"
//             ],
//             correctAnswer: 0,
//             explanation: "'Purpose' означает цель или намерение."
//           }
//         },
//         {
//           ref: "arrival_matching_1",
//           type: "matching",
//           data: {
//             pairs: [
//               { english: "customs declaration", russian: "таможенная декларация" },
//               { english: "baggage claim", russian: "получение багажа" },
//               { english: "nothing to declare", russian: "нечего декларировать" },
//               { english: "duty free", russian: "беспошлинная торговля" }
//             ],
//             instructions: "Соотнесите термины с их переводами"
//           }
//         },
//         {
//           ref: "arrival_gap_fill_1",
//           type: "gap_fill",
//           data: {
//             text: "I'm here for {{}} and I will stay for {{}} weeks.",
//             blanks: ["tourism", "two"],
//             options: [
//               ["tourism", "business", "work", "study"],
//               ["two", "three", "one", "four"]
//             ],
//             translation: "Я здесь для туризма и останусь на две недели."
//           }
//         }
//       ]
//     },

//     "travel.a0.hotel": {
//       lessonRef: "travel.a0.hotel",
//       moduleRef: "travel.a0",
//       title: "Заселение в отель",
//       description: "Зарегистрируйтесь в отеле и узнайте о услугах",
//       estimatedMinutes: 14,
//       order: 6,
//       type: "speaking" as const,
//       difficulty: "medium" as const,
//       tags: ["hotel", "check-in", "popular"],
//       xpReward: 35,
//       hasAudio: true,
//       hasVideo: false,
//       previewText: "I have a reservation under the name...",
//       taskTypes: ["flashcard", "multiple_choice", "gap_fill"] as TaskType[],
//       progress: {
//         status: "not_started" as const,
//         score: 0,
//         attempts: 0,
//         lastTaskIndex: 0,
//       },
//       tasks: [
//         {
//           ref: "hotel_flashcard_1",
//           type: "flashcard",
//           data: {
//             front: "I have a reservation",
//             back: "У меня есть бронирование",
//             pronunciation: "[aɪ hæv ə ˌrezəˈveɪʃən]",
//             example: "I have a reservation under the name Smith.",
//             audio: "/audio/i-have-reservation.mp3"
//           }
//         },
//         {
//           ref: "hotel_multiple_choice_1",
//           type: "multiple_choice",
//           data: {
//             question: "Как спросить о времени завтрака в отеле?",
//             options: [
//               "When is breakfast?",
//               "Where is breakfast?",
//               "What is breakfast?",
//               "How is breakfast?"
//             ],
//             correctAnswer: 0,
//             explanation: "'When' используется для вопросов о времени."
//           }
//         },
//         {
//           ref: "hotel_gap_fill_1",
//           type: "gap_fill",
//           data: {
//             text: "Could you please {{}} me to my {{}}?",
//             blanks: ["show", "room"],
//             options: [
//               ["show", "take", "bring", "give"],
//               ["room", "bed", "house", "hotel"]
//             ],
//             translation: "Не могли бы вы проводить меня в мою комнату?"
//           }
//         }
//       ]
//     },

//     "travel.a0.restaurant": {
//       lessonRef: "travel.a0.restaurant",
//       moduleRef: "travel.a0",
//       title: "В ресторане",
//       description: "Закажите еду и пообщайтесь с официантом",
//       estimatedMinutes: 16,
//       order: 7,
//       type: "conversation" as const,
//       difficulty: "medium" as const,
//       tags: ["restaurant", "ordering", "popular"],
//       xpReward: 40,
//       hasAudio: true,
//       hasVideo: true,
//       previewText: "Could I see the menu, please? I'd like to order...",
//       taskTypes: ["flashcard", "multiple_choice", "listening"] as TaskType[],
//       progress: {
//         status: "not_started" as const,
//         score: 0,
//         attempts: 0,
//         lastTaskIndex: 0,
//       },
//       tasks: [
//         {
//           ref: "restaurant_flashcard_1",
//           type: "flashcard",
//           data: {
//             front: "Could I see the menu?",
//             back: "Можно посмотреть меню?",
//             pronunciation: "[kʊd aɪ siː ðə ˈmenjuː]",
//             example: "Could I see the menu, please?",
//             audio: "/audio/could-i-see-menu.mp3"
//           }
//         },
//         {
//           ref: "restaurant_listening_1",
//           type: "listening",
//           data: {
//             audio: "/audio/restaurant-order.mp3",
//             transcript: "Waiter: What would you like to drink?\nCustomer: I'll have a coffee, please.\nWaiter: And for the main course?\nCustomer: I'd like the pasta.",
//             question: "Что заказал клиент из напитков?",
//             options: [
//               "Чай",
//               "Кофе",
//               "Сок",
//               "Воду"
//             ],
//             correctAnswer: 1
//           }
//         },
//         {
//           ref: "restaurant_multiple_choice_1",
//           type: "multiple_choice",
//           data: {
//             question: "Как сказать 'Я буду...' при заказе?",
//             options: [
//               "I want...",
//               "I'll have...",
//               "Give me...",
//               "I need..."
//             ],
//             correctAnswer: 1,
//             explanation: "'I'll have...' - наиболее вежливый способ сделать заказ."
//           }
//         }
//       ]
//     },

//     "travel.a0.directions": {
//       lessonRef: "travel.a0.directions",
//       moduleRef: "travel.a0",
//       title: "Спросить дорогу",
//       description: "Научитесь спрашивать и понимать направления",
//       estimatedMinutes: 12,
//       order: 8,
//       type: "listening" as const,
//       difficulty: "easy" as const,
//       tags: ["city", "directions", "beginner"],
//       xpReward: 30,
//       hasAudio: true,
//       hasVideo: false,
//       previewText: "Excuse me, how do I get to...? Go straight, turn left...",
//       taskTypes: ["flashcard", "multiple_choice", "listening"] as TaskType[],
//       progress: {
//         status: "not_started" as const,
//         score: 0,
//         attempts: 0,
//         lastTaskIndex: 0,
//       },
//       tasks: [
//         {
//           ref: "directions_flashcard_1",
//           type: "flashcard",
//           data: {
//             front: "How do I get to...?",
//             back: "Как мне добраться до...?",
//             pronunciation: "[haʊ duː aɪ ɡet tuː]",
//             example: "Excuse me, how do I get to the train station?",
//             audio: "/audio/how-do-i-get-to.mp3"
//           }
//         },
//         {
//           ref: "directions_listening_1",
//           type: "listening",
//           data: {
//             audio: "/audio/giving-directions.mp3",
//             transcript: "Go straight for two blocks, then turn left at the traffic lights. The museum will be on your right.",
//             question: "Где находится музей?",
//             options: [
//               "Слева после светофора",
//               "Справа после светофора",
//               "Прямо два квартала",
//               "За светофором слева"
//             ],
//             correctAnswer: 1
//           }
//         },
//         {
//           ref: "directions_multiple_choice_1",
//           type: "multiple_choice",
//           data: {
//             question: "Что означает 'Go straight'?",
//             options: [
//               "Поверните направо",
//               "Поверните налево",
//               "Идите прямо",
//               "Вернитесь назад"
//             ],
//             correctAnswer: 2,
//             explanation: "'Go straight' означает идти прямо, не поворачивая."
//           }
//         }
//       ]
//     }
//   };

//   console.log('Available lesson keys:', Object.keys(mockLessonsData));
//   const mockLesson = mockLessonsData[lessonRef as keyof typeof mockLessonsData];
//   console.log('Found lesson for key:', lessonRef, ':', !!mockLesson);
  
//   if (!mockLesson) {
//     // Return a generic lesson if specific mock not found
//     return {
//       lesson: {
//         lessonRef,
//         moduleRef: "unknown",
//         title: "Урок не найден",
//         description: "Данный урок временно недоступен",
//         estimatedMinutes: 0,
//         order: 1,
//         tasks: [],
//         progress: {
//           status: "not_started" as const,
//           score: 0,
//           attempts: 0,
//         }
//       }
//     };
//   }

//   return {
//     lesson: mockLesson
//   };
// }

/**
 * Get vocabulary for a module
 */
export const useModuleVocabulary = (params: { moduleRef: string; lang?: SupportedLanguage }) => {
  return useQuery({
    queryKey: ['vocabulary', params.moduleRef, params.lang],
    queryFn: async (): Promise<ModuleVocabularyResponse> => {
      try {
        const query = new URLSearchParams();
        query.set('moduleRef', params.moduleRef);
        if (params.lang) query.set('lang', params.lang);
        
        const url = `${API_ENDPOINTS.CONTENT.VOCABULARY}?${query.toString()}`;
        const response = await apiClient.get(url);
        return response.data as ModuleVocabularyResponse;
      } catch (error) {
        if (import.meta.env.VITE_ENABLE_DEBUG_LOGGING) {
          console.log('API failed, using mock vocabulary data for module:', params.moduleRef, error);
        }
        return getMockModuleVocabulary(params.moduleRef);
      }
    },
    staleTime: 0, // Disable caching
    gcTime: 0, // Don't keep in cache
  });
};

/**
 * Mock vocabulary data for modules
 */
function getMockModuleVocabulary(moduleRef: string): ModuleVocabularyResponse {
  const mockVocabulary: VocabularyItem[] = [
    {
      id: 'hello',
      word: 'Hello',
      translation: 'Привет',
      transcription: '[həˈləʊ]',
      pronunciation: 'https://englishintg.ru/audio/a0.basics.001.t1.hello.mp3',
      partOfSpeech: 'interjection',
      difficulty: 'easy',
      examples: [
        {
          original: 'Hello, nice to meet you!',
          translation: 'Привет, приятно познакомиться!'
        }
      ],
      tags: ['greetings', 'basics'],
      lessonRefs: ['travel.a0.greetings'],
      isLearned: true
    },
    {
      id: 'airport',
      word: 'Airport',
      translation: 'Аэропорт',
      transcription: '[ˈeəpɔːt]',
      pronunciation: 'https://englishintg.ru/audio/a0.basics.001.t1.hello.mp3',
      partOfSpeech: 'noun',
      difficulty: 'easy',
      examples: [
        {
          original: 'I am at the airport',
          translation: 'Я в аэропорту'
        },
        {
          original: 'Where is the airport?',
          translation: 'Где аэропорт?'
        }
      ],
      tags: ['travel', 'places'],
      lessonRefs: ['travel.a0.greetings', 'travel.a0.directions'],
      isLearned: false
    },
    {
      id: 'ticket',
      word: 'Ticket',
      translation: 'Билет',
      transcription: '[ˈtɪkɪt]',
      pronunciation: 'https://englishintg.ru/audio/a0.basics.001.t1.hello.mp3',
      partOfSpeech: 'noun',
      difficulty: 'easy',
      examples: [
        {
          original: 'Can I see your ticket please?',
          translation: 'Можно посмотреть ваш билет?'
        }
      ],
      tags: ['travel', 'documents'],
      lessonRefs: ['travel.a0.check_in'],
      isLearned: false
    },
    {
      id: 'boarding_pass',
      word: 'Boarding pass',
      translation: 'Посадочный талон',
      transcription: '[ˈbɔːdɪŋ pɑːs]',
      pronunciation: 'https://englishintg.ru/audio/a0.basics.001.t1.hello.mp3',
      partOfSpeech: 'noun',
      difficulty: 'medium',
      examples: [
        {
          original: 'Here is your boarding pass',
          translation: 'Вот ваш посадочный талон'
        }
      ],
      tags: ['travel', 'documents'],
      lessonRefs: ['travel.a0.check_in'],
      isLearned: false
    },
    {
      id: 'gate',
      word: 'Gate',
      translation: 'Выход на посадку',
      transcription: '[ɡeɪt]',
      pronunciation: 'https://englishintg.ru/audio/a0.basics.001.t1.hello.mp3',
      partOfSpeech: 'noun',
      difficulty: 'easy',
      examples: [
        {
          original: 'Flight 123 is boarding at gate A5',
          translation: 'Рейс 123 производит посадку у выхода A5'
        }
      ],
      tags: ['travel', 'airport'],
      lessonRefs: ['travel.a0.directions'],
      isLearned: false
    },
    {
      id: 'departure',
      word: 'Departure',
      translation: 'Отправление',
      transcription: '[dɪˈpɑːtʃə]',
      pronunciation: 'https://englishintg.ru/audio/a0.basics.001.t1.hello.mp3',
      partOfSpeech: 'noun',
      difficulty: 'medium',
      examples: [
        {
          original: 'What time is departure?',
          translation: 'Во сколько отправление?'
        }
      ],
      tags: ['travel', 'time'],
      lessonRefs: ['travel.a0.schedule'],
      isLearned: false
    },
    {
      id: 'arrival',
      word: 'Arrival',
      translation: 'Прибытие',
      transcription: '[əˈraɪvəl]',
      pronunciation: 'https://englishintg.ru/audio/a0.basics.001.t1.hello.mp3',
      partOfSpeech: 'noun',
      difficulty: 'medium',
      examples: [
        {
          original: 'The arrival time is 3 PM',
          translation: 'Время прибытия 15:00'
        }
      ],
      tags: ['travel', 'time'],
      lessonRefs: ['travel.a0.schedule'],
      isLearned: false
    },
    {
      id: 'luggage',
      word: 'Luggage',
      translation: 'Багаж',
      transcription: '[ˈlʌɡɪdʒ]',
      pronunciation: 'https://englishintg.ru/audio/a0.basics.001.t1.hello.mp3',
      partOfSpeech: 'noun',
      difficulty: 'easy',
      examples: [
        {
          original: 'Where can I collect my luggage?',
          translation: 'Где я могу забрать свой багаж?'
        }
      ],
      tags: ['travel', 'belongings'],
      lessonRefs: ['travel.a0.baggage'],
      isLearned: false
    },
    {
      id: 'passport',
      word: 'Passport',
      translation: 'Паспорт',
      transcription: '[ˈpɑːspɔːt]',
      pronunciation: 'https://englishintg.ru/audio/a0.basics.001.t1.hello.mp3',
      partOfSpeech: 'noun',
      difficulty: 'easy',
      examples: [
        {
          original: 'May I see your passport?',
          translation: 'Можно посмотреть ваш паспорт?'
        }
      ],
      tags: ['travel', 'documents'],
      lessonRefs: ['travel.a0.check_in', 'travel.a0.customs'],
      isLearned: false
    },
    {
      id: 'customs',
      word: 'Customs',
      translation: 'Таможня',
      transcription: '[ˈkʌstəmz]',
      pronunciation: 'https://englishintg.ru/audio/a0.basics.001.t1.hello.mp3',
      partOfSpeech: 'noun',
      difficulty: 'medium',
      examples: [
        {
          original: 'Please proceed to customs',
          translation: 'Пожалуйста, проходите в таможню'
        }
      ],
      tags: ['travel', 'procedures'],
      lessonRefs: ['travel.a0.customs'],
      isLearned: false
    },
    {
      id: 'security',
      word: 'Security',
      translation: 'Безопасность',
      transcription: '[sɪˈkjʊərəti]',
      pronunciation: 'https://englishintg.ru/audio/a0.basics.001.t1.hello.mp3',
      partOfSpeech: 'noun',
      difficulty: 'medium',
      examples: [
        {
          original: 'Please go through security',
          translation: 'Пожалуйста, пройдите контроль безопасности'
        }
      ],
      tags: ['travel', 'procedures'],
      lessonRefs: ['travel.a0.security'],
      isLearned: false
    },
    {
      id: 'excuse_me',
      word: 'Excuse me',
      translation: 'Извините',
      transcription: '[ɪkˈskjuːz miː]',
      pronunciation: 'https://englishintg.ru/audio/a0.basics.001.t1.hello.mp3',
      partOfSpeech: 'interjection',
      difficulty: 'easy',
      examples: [
        {
          original: 'Excuse me, where is the bathroom?',
          translation: 'Извините, где туалет?'
        }
      ],
      tags: ['politeness', 'basics'],
      lessonRefs: ['travel.a0.greetings', 'travel.a0.directions'],
      isLearned: false
    },
    {
      id: 'thank_you',
      word: 'Thank you',
      translation: 'Спасибо',
      transcription: '[θæŋk juː]',
      pronunciation: 'https://englishintg.ru/audio/a0.basics.001.t1.hello.mp3',
      partOfSpeech: 'interjection',
      difficulty: 'easy',
      examples: [
        {
          original: 'Thank you very much!',
          translation: 'Большое спасибо!'
        }
      ],
      tags: ['politeness', 'basics'],
      lessonRefs: ['travel.a0.greetings'],
      isLearned: true
    },
    {
      id: 'please',
      word: 'Please',
      translation: 'Пожалуйста',
      transcription: '[pliːz]',
      pronunciation: 'https://englishintg.ru/audio/a0.basics.001.t1.hello.mp3',
      partOfSpeech: 'adverb',
      difficulty: 'easy',
      examples: [
        {
          original: 'Could you help me, please?',
          translation: 'Не могли бы вы помочь мне, пожалуйста?'
        }
      ],
      tags: ['politeness', 'basics'],
      lessonRefs: ['travel.a0.greetings'],
      isLearned: false
    },
    {
      id: 'where',
      word: 'Where',
      translation: 'Где',
      transcription: '[weə]',
      pronunciation: 'https://englishintg.ru/audio/a0.basics.001.t1.hello.mp3',
      partOfSpeech: 'adverb',
      difficulty: 'easy',
      examples: [
        {
          original: 'Where is the exit?',
          translation: 'Где выход?'
        }
      ],
      tags: ['questions', 'directions'],
      lessonRefs: ['travel.a0.directions'],
      isLearned: false
    }
  ];

  return {
    vocabulary: mockVocabulary,
    totalCount: mockVocabulary.length,
    moduleRef
  };
}

/**
 * Mock paywall data (full response)
 */
function getMockPaywallData() {
  return {
    cohort: 'default',
    pricing: {
      cohort: 'default',
      monthlyOriginalPrice: 99000, // 990₽ in kopecks
      quarterlyOriginalPrice: 149000, // 1490₽ in kopecks
      yearlyOriginalPrice: 299000, // 2990₽ in kopecks
      monthlyPrice: 89900, // 899₽ in kopecks
      quarterlyPrice: 119900, // 1199₽ in kopecks
      yearlyPrice: 248900, // 2489₽ in kopecks
      discountPercentage: 10,
      quarterlyDiscountPercentage: 20,
      yearlyDiscountPercentage: 17,
      promoCode: 'DEFAULT10'
      // Telegram Stars prices will be calculated automatically if not provided
    },
    products: [
      {
        id: 'monthly',
        name: 'Месяц',
        description: 'Полный доступ ко всем урокам',
        price: 89900, // 899₽ in kopecks
        originalPrice: 99000, // 990₽ in kopecks
        currency: 'RUB',
        duration: 'month' as const,
        discount: 10,
        isPopular: true,
        // Telegram Stars prices will be calculated automatically if not provided
      },
      {
        id: 'quarterly',
        name: '3 месяца',
        description: 'Экономия 56% против помесячки • ~400₽/месяц',
        price: 119900, // 1199₽ in kopecks
        originalPrice: 149000, // 1490₽ in kopecks
        currency: 'RUB',
        duration: 'quarter' as const,
        discount: 20,
        monthlyEquivalent: 39967, // ~400₽ in kopecks
        savingsPercentage: 56,
        // Telegram Stars prices will be calculated automatically if not provided
      },
      {
        id: 'yearly',
        name: 'Год',
        description: 'Экономия 77% против помесячки • ~207₽/месяц',
        price: 248900, // 2489₽ in kopecks
        originalPrice: 299000, // 2990₽ in kopecks
        currency: 'RUB',
        duration: 'year' as const,
        discount: 17,
        monthlyEquivalent: 20742, // ~207₽ in kopecks
        savingsPercentage: 77,
        // Telegram Stars prices will be calculated automatically if not provided
      }
    ],
    userStats: {
      lessonCount: 0,
      hasActiveSubscription: false,
      subscriptionExpired: false
    }
  };
}

/**
 * Mock paywall products data (legacy)
 */
function getMockPaywallProducts(): PaywallProduct[] {
  return [
    {
      id: 'monthly',
      name: 'Месячная подписка',
      description: 'Полный доступ на 1 месяц',
      price: 599,
      currency: 'RUB',
      duration: 'month'
    },
    {
      id: 'quarterly', 
      name: 'Подписка на 3 месяца',
      description: 'Полный доступ на 3 месяца',
      price: 1490,
      currency: 'RUB',
      duration: 'quarter',
      discount: 16,
      isPopular: true
    },
    {
      id: 'yearly',
      name: 'Годовая подписка',
      description: 'Полный доступ на 1 год', 
      price: 2890,
      currency: 'RUB',
      duration: 'year',
      discount: 58
    }
  ];
}
