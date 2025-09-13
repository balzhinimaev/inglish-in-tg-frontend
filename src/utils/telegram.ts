import { TelegramWebApp } from '../types';

/**
 * Get Telegram WebApp instance
 */
export const getTelegramWebApp = (): TelegramWebApp | null => {
  if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
    return window.Telegram.WebApp;
  }
  return null;
};

/**
 * Initialize Telegram WebApp
 */
export const initTelegramWebApp = (): TelegramWebApp | null => {
  const tg = getTelegramWebApp();
  
  if (!tg) {
    console.warn('Telegram WebApp not available');
    return null;
  }

  // Initialize WebApp
  tg.ready();
  tg.expand();

  // Force override theme parameters immediately and after ready
  const forceTheme = () => {
    const tgAny = tg as any;
    
    // Override theme parameters
    if (tgAny.themeParams) {
      Object.assign(tgAny.themeParams, {
        bg_color: '#121212',
        text_color: '#ffffff',
        hint_color: '#b0b0b0',
        link_color: '#3ddc97',
        button_color: '#3ddc97',
        button_text_color: '#121212',
        secondary_bg_color: '#1e1e1e',
        header_bg_color: '#121212',
        accent_text_color: '#3ddc97',
        section_bg_color: '#1e1e1e',
        section_header_text_color: '#3ddc97',
        subtitle_text_color: '#b0b0b0',
        destructive_text_color: '#ff6b6b',
      });
    }

    // Force set colors via API if available
    if (tgAny.setHeaderColor) {
      tgAny.setHeaderColor('#121212');
    }
    if (tgAny.setBackgroundColor) {
      tgAny.setBackgroundColor('#121212');
    }

    // Force update CSS variables
    document.documentElement.style.setProperty('--tg-theme-bg-color', '#121212');
    document.documentElement.style.setProperty('--tg-theme-text-color', '#ffffff');
    document.documentElement.style.setProperty('--tg-theme-hint-color', '#b0b0b0');
    document.documentElement.style.setProperty('--tg-theme-secondary-bg-color', '#1e1e1e');
  };

  // Apply theme immediately
  forceTheme();
  
  // Apply theme again after a delay to override any async theme loading
  setTimeout(forceTheme, 100);

  return tg;
};

/**
 * Get Telegram initData for API authentication
 */
export const getTelegramInitData = (): string => {
  const tg = getTelegramWebApp();
  return tg?.initData || '';
};

/**
 * Get user data from Telegram
 */
export const getTelegramUser = () => {
  const tg = getTelegramWebApp();
  return tg?.initDataUnsafe?.user || null;
};

/**
 * Show Telegram MainButton
 */
export const showMainButton = (text: string, onClick: () => void) => {
  const tg = getTelegramWebApp();
  if (tg) {
    tg.MainButton.setText(text);
    tg.MainButton.onClick(onClick);
    tg.MainButton.show();
  }
};

/**
 * Hide Telegram MainButton
 */
export const hideMainButton = () => {
  const tg = getTelegramWebApp();
  if (tg) {
    tg.MainButton.hide();
  }
};


/**
 * Show Telegram BackButton
 */
export const showBackButton = (onClick: () => void) => {
  const tg = getTelegramWebApp();
  if (tg) {
    tg.BackButton.onClick(onClick);
    tg.BackButton.show();
  }
};

/**
 * Hide Telegram BackButton
 */
export const hideBackButton = () => {
  const tg = getTelegramWebApp();
  if (tg) {
    tg.BackButton.hide();
  }
};

/**
 * Trigger haptic feedback
 */
export const hapticFeedback = {
  impact: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft' = 'medium') => {
    const tg = getTelegramWebApp();
    tg?.HapticFeedback.impactOccurred(style);
  },
  notification: (type: 'error' | 'success' | 'warning') => {
    const tg = getTelegramWebApp();
    tg?.HapticFeedback.notificationOccurred(type);
  },
  selection: () => {
    const tg = getTelegramWebApp();
    tg?.HapticFeedback.selectionChanged();
  },
};

/**
 * Request write access for sending messages
 */
export const requestWriteAccess = (): Promise<boolean> => {
  return new Promise((resolve) => {
    const tg = getTelegramWebApp();
    
    if (!tg) {
      console.warn('Telegram WebApp not available');
      resolve(false);
      return;
    }

    // Check if requestWriteAccess method exists (newer Telegram versions)
    const tgAny = tg as any;
    if (typeof tgAny.requestWriteAccess === 'function') {
      tgAny.requestWriteAccess((granted: boolean) => {
        resolve(granted);
      });
    } else {
      // Fallback: assume granted for older versions
      console.warn('requestWriteAccess not available, assuming granted');
      resolve(true);
    }
  });
};

/**
 * Close Telegram WebApp
 */
export const closeTelegramWebApp = () => {
  const tg = getTelegramWebApp();
  tg?.close();
};
