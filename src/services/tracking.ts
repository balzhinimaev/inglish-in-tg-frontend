import apiClient from './api';
import { API_ENDPOINTS, TRACKING_EVENTS } from '../utils/constants';
import { TrackingEvent } from '../types';
import { useUserStore } from '../store/user';

/**
 * Track event to analytics
 */
export const trackEvent = async (
  name: string, 
  properties: Record<string, any> = {}
): Promise<void> => {
  try {
    // Получаем userId из store
    const userId = useUserStore.getState().user?.userId;
    
    if (!userId) {
      console.warn('Cannot track event: User ID is not available', name);
      return;
    }

    const event: TrackingEvent = {
      userId, // userId на верхнем уровне объекта
      name,
      properties: {
        ...properties,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        platform: 'telegram-mini-app',
      },
      timestamp: new Date().toISOString(),
    };

    await apiClient.post(API_ENDPOINTS.EVENTS.TRACK, event);
  } catch (error) {
    // Don't throw on tracking errors - just log them
    console.warn('Failed to track event:', name, error);
  }
};

/**
 * Predefined tracking functions for common events
 */
export const tracking = {
  // Onboarding events
  onboardingStarted: () => trackEvent(TRACKING_EVENTS.ONBOARDING_STARTED),
  onboardingCompleted: (proficiencyLevel: string) => 
    trackEvent(TRACKING_EVENTS.ONBOARDING_COMPLETED, { proficiencyLevel }),

  // Lesson events  
  lessonStarted: (lessonId: number | string) => 
    trackEvent(TRACKING_EVENTS.START_LESSON, { lessonId }),
  lessonCompleted: (lessonId: number | string, duration?: number) => 
    trackEvent(TRACKING_EVENTS.COMPLETE_LESSON_1, { lessonId, duration }),

  // Paywall events
  paywallViewed: (products: any[]) => 
    trackEvent(TRACKING_EVENTS.PAYWALL_VIEW, { 
      productsCount: products.length,
      products: products.map(p => ({ id: p.id, price: p.price }))
    }),
  purchaseInitiated: (productId: string, price: number, currency: string) => 
    trackEvent(TRACKING_EVENTS.PURCHASE_INITIATED, { productId, price, currency }),
  
  // Payment events
  paymentCreated: (productId: string, paymentId: string) =>
    trackEvent('payment_created', { productId, paymentId }),
  paymentError: (productId: string, error: string) =>
    trackEvent('payment_error', { productId, error }),
  paymentCompleted: (paymentId: string, amount: number, currency: string) =>
    trackEvent('payment_completed', { paymentId, amount, currency }),
  paymentFailed: (paymentId: string, reason: string) =>
    trackEvent('payment_failed', { paymentId, reason }),

  // Generic custom event
  custom: (name: string, properties?: Record<string, any>) => 
    trackEvent(name, properties),

  // Module-specific helpers
  moduleView: (moduleRef: string, requiresPro: boolean, isAvailable: boolean) =>
    trackEvent(TRACKING_EVENTS.MODULE_VIEW, { moduleRef, requiresPro, isAvailable }),
  moduleClick: (moduleRef: string, requiresPro: boolean, isAvailable: boolean, action: 'module_opened' | 'paywall_shown') =>
    trackEvent(TRACKING_EVENTS.MODULE_CLICK, { moduleRef, requiresPro, isAvailable, action }),
};
