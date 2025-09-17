/**
 * Convert kopecks to rubles for display
 */
export const formatPrice = (kopecks: number): string => {
  const rubles = Math.round(kopecks / 100);
  return rubles.toLocaleString('ru-RU');
};

/**
 * Convert kopecks to rubles (number)
 */
export const kopecksToRubles = (kopecks: number): number => {
  return Math.round(kopecks / 100);
};

/**
 * Convert rubles to kopecks
 */
export const rublesToKopecks = (rubles: number): number => {
  return Math.round(rubles * 100);
};

/**
 * Format price with currency symbol
 */
export const formatPriceWithCurrency = (kopecks: number, _currency: string = 'RUB'): string => {
  const rubles = kopecksToRubles(kopecks);
  return `${rubles.toLocaleString('ru-RU')}₽`;
};

/**
 * Calculate monthly equivalent price
 */
export const calculateMonthlyEquivalent = (price: number, duration: 'month' | 'quarter' | 'year'): number => {
  switch (duration) {
    case 'month':
      return price;
    case 'quarter':
      return Math.round(price / 3);
    case 'year':
      return Math.round(price / 12);
    default:
      return price;
  }
};

/**
 * Calculate savings percentage compared to monthly plan
 */
export const calculateSavingsPercentage = (monthlyPrice: number, planPrice: number, duration: 'month' | 'quarter' | 'year'): number => {
  if (duration === 'month') return 0;
  
  const monthlyEquivalent = calculateMonthlyEquivalent(planPrice, duration);
  const savings = monthlyPrice - monthlyEquivalent;
  return Math.round((savings / monthlyPrice) * 100);
};
