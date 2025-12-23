import { useMutation } from '@tanstack/react-query';
import apiClient from './api';
import { API_ENDPOINTS } from '../utils/constants';

// Payment types
export interface CreatePaymentRequest {
  product: 'monthly' | 'quarterly' | 'yearly';
  returnUrl: string;
  currency?: 'RUB' | 'STARS'; // Optional currency parameter
}

export interface CreatePaymentResponse {
  paymentUrl: string;
  paymentId: string;
}

export interface Payment {
  userId: string;
  provider: string;
  providerId: string;
  idempotencyKey: string;
  product: string;
  amount: number;
  currency: string;
  status: 'succeeded' | 'pending' | 'failed';
}

/**
 * Create payment for subscription
 */
export const useCreatePayment = () => {
  return useMutation({
    mutationFn: async (data: CreatePaymentRequest): Promise<CreatePaymentResponse> => {
      const response = await apiClient.post(API_ENDPOINTS.PAYMENTS.CREATE, data);
      return response.data;
    },
  });
};

/**
 * Get payment status
 */
export const useGetPaymentStatus = () => {
  return useMutation({
    mutationFn: async (paymentId: string): Promise<Payment> => {
      const response = await apiClient.get(`${API_ENDPOINTS.PAYMENTS.STATUS}/${paymentId}`);
      return response.data;
    },
  });
};
