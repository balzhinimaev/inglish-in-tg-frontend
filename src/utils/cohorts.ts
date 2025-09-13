import type { UserCohort, CohortPricing, PromoCode, UserCohortData } from '../types';

// Default pricing for different cohorts
export const COHORT_PRICING: Record<UserCohort, CohortPricing> = {
  new_user: {
    cohort: 'new_user',
    monthlyPrice: 790,
    monthlyOriginalPrice: 990,
    quarterlyPrice: 1190,
    quarterlyOriginalPrice: 1490,
    yearlyPrice: 2490,
    yearlyOriginalPrice: 2990,
    promoCode: 'WELCOME25',
    discountPercentage: 25
  },
  returning_user: {
    cohort: 'returning_user',
    monthlyPrice: 840,
    monthlyOriginalPrice: 990,
    quarterlyPrice: 1290,
    quarterlyOriginalPrice: 1490,
    yearlyPrice: 2690,
    yearlyOriginalPrice: 2990,
    promoCode: 'COMEBACK15',
    discountPercentage: 15
  },
  premium_trial: {
    cohort: 'premium_trial',
    monthlyPrice: 690,
    monthlyOriginalPrice: 990,
    quarterlyPrice: 990,
    quarterlyOriginalPrice: 1490,
    yearlyPrice: 1990,
    yearlyOriginalPrice: 2990,
    promoCode: 'TRIAL50',
    discountPercentage: 50
  },
  high_engagement: {
    cohort: 'high_engagement',
    monthlyPrice: 790,
    monthlyOriginalPrice: 990,
    quarterlyPrice: 1190,
    quarterlyOriginalPrice: 1490,
    yearlyPrice: 2290,
    yearlyOriginalPrice: 2990,
    promoCode: 'ACTIVE20',
    discountPercentage: 20
  },
  low_engagement: {
    cohort: 'low_engagement',
    monthlyPrice: 590,
    monthlyOriginalPrice: 990,
    quarterlyPrice: 890,
    quarterlyOriginalPrice: 1490,
    yearlyPrice: 1690,
    yearlyOriginalPrice: 2990,
    promoCode: 'BOOST40',
    discountPercentage: 40
  },
  churned: {
    cohort: 'churned',
    monthlyPrice: 490,
    monthlyOriginalPrice: 990,
    quarterlyPrice: 690,
    quarterlyOriginalPrice: 1490,
    yearlyPrice: 1290,
    yearlyOriginalPrice: 2990,
    promoCode: 'WINBACK60',
    discountPercentage: 60
  },
  default: {
    cohort: 'default',
    monthlyPrice: 890,
    monthlyOriginalPrice: 990,
    quarterlyPrice: 1390,
    quarterlyOriginalPrice: 1490,
    yearlyPrice: 2890,
    yearlyOriginalPrice: 2990,
    discountPercentage: 10
  }
};

// Sample promo codes for different cohorts
export const PROMO_CODES: PromoCode[] = [
  {
    code: 'WELCOME25',
    discountType: 'percentage',
    discountValue: 25,
    validUntil: '2024-12-31',
    maxUses: 1000,
    currentUses: 0,
    applicablePlans: ['monthly', 'quarterly', 'yearly'],
    cohorts: ['new_user'],
    isActive: true
  },
  {
    code: 'COMEBACK15',
    discountType: 'percentage',
    discountValue: 15,
    validUntil: '2024-12-31',
    maxUses: 500,
    currentUses: 0,
    applicablePlans: ['quarterly', 'yearly'],
    cohorts: ['returning_user'],
    isActive: true
  },
  {
    code: 'TRIAL50',
    discountType: 'percentage',
    discountValue: 50,
    validUntil: '2024-12-31',
    maxUses: 200,
    currentUses: 0,
    applicablePlans: ['yearly'],
    cohorts: ['premium_trial'],
    isActive: true
  },
  {
    code: 'WINBACK60',
    discountType: 'percentage',
    discountValue: 60,
    validUntil: '2024-12-31',
    maxUses: 100,
    currentUses: 0,
    applicablePlans: ['yearly'],
    cohorts: ['churned'],
    isActive: true
  }
];

// Determine user cohort based on behavior data
export const determineUserCohort = (userData: {
  isFirstOpen?: boolean;
  lastActiveDate?: string;
  lessonCount?: number;
  hasSubscription?: boolean;
  subscriptionExpired?: boolean;
}): UserCohort => {
  const { isFirstOpen, lastActiveDate, lessonCount = 0, subscriptionExpired } = userData;

  // New user
  if (isFirstOpen) {
    return 'new_user';
  }

  // Premium trial or expired subscription
  if (subscriptionExpired) {
    return 'premium_trial';
  }

  // Churned user (inactive for 30+ days)
  if (lastActiveDate) {
    const daysSinceActive = Math.floor((Date.now() - new Date(lastActiveDate).getTime()) / (1000 * 60 * 60 * 24));
    if (daysSinceActive > 30) {
      return 'churned';
    }
  }

  // High engagement (completed many lessons)
  if (lessonCount > 20) {
    return 'high_engagement';
  }

  // Low engagement (few lessons completed)
  if (lessonCount < 5 && !isFirstOpen) {
    return 'low_engagement';
  }

  // Returning user
  if (!isFirstOpen && lessonCount > 0) {
    return 'returning_user';
  }

  return 'default';
};

// Get pricing for specific cohort
export const getCohortPricing = (cohort: UserCohort): CohortPricing => {
  return COHORT_PRICING[cohort] || COHORT_PRICING.default;
};

// Get special offer for cohort
export const getCohortOffer = (cohort: UserCohort): UserCohortData['specialOffer'] => {
  const offers: Record<UserCohort, UserCohortData['specialOffer']> = {
    new_user: {
      title: 'Добро пожаловать!',
      description: 'Специальная скидка для новых пользователей',
      urgency: 'Только первые 24 часа',
      badge: '🎉 ДОБРО ПОЖАЛОВАТЬ'
    },
    returning_user: {
      title: 'Рады видеть снова!',
      description: 'Скидка для возвращающихся пользователей',
      badge: '👋 С ВОЗВРАЩЕНИЕМ'
    },
    premium_trial: {
      title: 'Попробуйте Premium!',
      description: 'Огромная скидка на годовую подписку',
      urgency: 'Предложение ограничено',
      badge: '🔥 СУПЕР СКИДКА'
    },
    high_engagement: {
      title: 'Для активных учеников!',
      description: 'Бонус за вашу активность',
      badge: '⭐ ДЛЯ АКТИВНЫХ'
    },
    low_engagement: {
      title: 'Вернитесь к изучению!',
      description: 'Мотивационная скидка для продолжения',
      urgency: 'Не упустите момент',
      badge: '💪 МОТИВАЦИЯ'
    },
    churned: {
      title: 'Мы скучали!',
      description: 'Максимальная скидка для возвращения',
      urgency: 'Последний шанс',
      badge: '💝 ВОЗВРАЩАЙТЕСЬ'
    },
    default: undefined
  };

  return offers[cohort];
};

// Validate promo code
export const validatePromoCode = (code: string, cohort: UserCohort, planType: string): PromoCode | null => {
  const promoCode = PROMO_CODES.find(promo => 
    promo.code === code && 
    promo.isActive &&
    promo.applicablePlans.includes(planType) &&
    (!promo.cohorts || promo.cohorts.includes(cohort)) &&
    (!promo.maxUses || promo.currentUses! < promo.maxUses) &&
    (!promo.validUntil || new Date(promo.validUntil) > new Date())
  );

  return promoCode || null;
};

// Apply discount to price
export const applyDiscount = (originalPrice: number, promoCode: PromoCode): number => {
  if (promoCode.discountType === 'percentage') {
    return Math.round(originalPrice * (1 - promoCode.discountValue / 100));
  } else {
    return Math.max(0, originalPrice - promoCode.discountValue);
  }
};
