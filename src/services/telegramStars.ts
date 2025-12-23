import { useMutation } from '@tanstack/react-query';
import { hapticFeedback } from '../utils/telegram';

// Telegram Stars API types
export interface CreateStarsPaymentRequest {
  product: 'monthly' | 'quarterly' | 'yearly';
  priceInStars: number;
  description: string;
}

export interface CreateStarsPaymentResponse {
  success: boolean;
  paymentUrl?: string;
  error?: string;
}

/**
 * Create Telegram Stars payment
 * This would typically call your backend API which then uses Telegram Bot API
 */
export const useCreateStarsPayment = () => {
  return useMutation({
    mutationFn: async (data: CreateStarsPaymentRequest): Promise<CreateStarsPaymentResponse> => {
      try {
        // Check if we're in Telegram WebApp
        if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
          const tg = window.Telegram.WebApp;
          
          // For now, we'll simulate the payment creation
          // In real implementation, this would call your backend API
          // which would then use Telegram Bot API to create the payment
          
          // Simulate API call to your backend
          const response = await fetch('/api/telegram-stars/payment', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              product: data.product,
              priceInStars: data.priceInStars,
              description: data.description,
              userId: tg.initDataUnsafe.user?.id
            })
          });

          if (!response.ok) {
            throw new Error('Failed to create Telegram Stars payment');
          }

          const result = await response.json();
          
          // If successful, open Telegram payment interface
          if (result.success && result.paymentUrl) {
            // In Telegram WebApp, you would use:
            // tg.openLink(result.paymentUrl);
            // For now, we'll open in new tab
            window.open(result.paymentUrl, '_blank');
          }
          
          return result;
        } else {
          throw new Error('Telegram WebApp not available');
        }
      } catch (error) {
        console.error('Telegram Stars payment error:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    },
    onSuccess: () => {
      hapticFeedback.notification('success');
    },
    onError: () => {
      hapticFeedback.notification('error');
    }
  });
};

/**
 * Check if Telegram Stars are available
 */
export const isTelegramStarsAvailable = (): boolean => {
  return typeof window !== 'undefined' && 
         window.Telegram?.WebApp !== undefined &&
         window.Telegram.WebApp.initDataUnsafe?.user !== undefined;
};

/**
 * Get user's Telegram Stars balance (if available)
 */
export const getUserStarsBalance = (): Promise<number> => {
  return new Promise((resolve) => {
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      // This would typically call Telegram API to get user's stars balance
      // For now, return a mock value
      resolve(1000);
    } else {
      resolve(0);
    }
  });
};
