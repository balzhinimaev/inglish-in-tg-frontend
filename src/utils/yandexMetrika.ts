// Yandex.Metrika integration for SPA
declare global {
  interface Window {
    ym: (id: number, method: string, ...args: any[]) => void;
  }
}

const YANDEX_METRIKA_ID = 104180061;

// Initialize Yandex.Metrika
export const initYandexMetrika = () => {
  // Check if already initialized
  if (typeof window !== 'undefined' && typeof window.ym === 'function') {
    return;
  }

  // Create and inject the script
  const script = document.createElement('script');
  script.type = 'text/javascript';
  script.async = true;
  script.src = 'https://mc.yandex.ru/metrika/tag.js';
  
  // Add initialization code
  script.onload = () => {
    // Initialize Metrika
    window.ym(YANDEX_METRIKA_ID, 'init', {
      ssr: true,
      clickmap: true,
      ecommerce: 'dataLayer',
      accurateTrackBounce: true,
      trackLinks: true
    });
  };

  // Add to head
  document.head.appendChild(script);

  // Add noscript fallback
  const noscript = document.createElement('noscript');
  const img = document.createElement('img');
  img.src = `https://mc.yandex.ru/watch/${YANDEX_METRIKA_ID}`;
  img.style.position = 'absolute';
  img.style.left = '-9999px';
  img.alt = '';
  noscript.appendChild(img);
  document.head.appendChild(noscript);
};

// Track page view for SPA
export const trackPageView = (url: string, title?: string) => {
  if (typeof window !== 'undefined' && typeof window.ym === 'function') {
    window.ym(YANDEX_METRIKA_ID, 'hit', url, {
      title: title || document.title,
      referer: document.referrer
    });
  }
};

// Track custom events
export const trackEvent = (action: string, category?: string, label?: string, value?: number) => {
  if (typeof window !== 'undefined' && typeof window.ym === 'function') {
    window.ym(YANDEX_METRIKA_ID, 'reachGoal', action, {
      category,
      label,
      value
    });
  }
};

// Track ecommerce events
export const trackEcommerce = (action: string, data: any) => {
  if (typeof window !== 'undefined' && typeof window.ym === 'function') {
    window.ym(YANDEX_METRIKA_ID, 'ecommerce', action, data);
  }
};
