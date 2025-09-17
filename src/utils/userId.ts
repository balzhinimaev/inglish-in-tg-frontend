/**
 * Get user ID from various sources
 */
export const getUserId = (): string => {
  // 1. Из Telegram WebApp API
  if (window.Telegram?.WebApp?.initDataUnsafe?.user?.id) {
    return window.Telegram.WebApp.initDataUnsafe.user.id.toString();
  }
  
  // 2. Из localStorage
  if (localStorage.getItem('userId')) {
    return localStorage.getItem('userId')!;
  }
  
  // 3. Из JWT токена (если есть)
  if (localStorage.getItem('token')) {
    try {
      const token = localStorage.getItem('token');
      const payload = JSON.parse(atob(token!.split('.')[1]));
      return payload.userId || payload.sub || 'telegram_user_id';
    } catch (e) {
      console.warn('Failed to parse JWT token:', e);
    }
  }
  
  // 4. Fallback
  return 'telegram_user_id';
};
