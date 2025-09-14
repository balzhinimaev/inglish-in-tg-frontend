import axios, { AxiosError, AxiosResponse } from 'axios';
import { API_BASE_URL } from '../utils/constants';
import { getTelegramInitData } from '../utils/telegram';
import { jwtUtils } from './auth';

// Create axios instance
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add JWT auth or Telegram auth
apiClient.interceptors.request.use(
  (config) => {
    const isAuthVerify = (config.url || '').startsWith('/auth/verify');
    const isPublicEndpoint = (config.url || '').startsWith('/auth/onboarding/status') || 
                           (config.url || '').startsWith('/leads/bot_start') ||
                           (config.url || '').startsWith('/content/onboarding') ||
                           (config.url || '').startsWith('/payments/webhook');

    // For auth/verify, use Telegram initData in query params
    if (isAuthVerify) {
      const initData = getTelegramInitData();
      if (initData) {
        // Add initData directly to URL to avoid double encoding
        const separator = config.url?.includes('?') ? '&' : '?';
        config.url = `${config.url}${separator}initData=${encodeURIComponent(initData)}`;
      }
    }
    // For public endpoints, no auth needed
    else if (isPublicEndpoint) {
      // No auth headers needed
    }
    // For protected endpoints, use JWT token
    else {
      const token = jwtUtils.getStoredToken();
      if (token && !jwtUtils.isTokenExpired(token)) {
        config.headers.Authorization = `Bearer ${token}`;
      } else if (token && jwtUtils.isTokenExpired(token)) {
        // Token expired, remove it and let the app handle re-authentication
        jwtUtils.removeToken();
        console.warn('JWT token expired, removed from storage');
      }
    }

    (config.headers as any)['X-Timestamp'] = Date.now().toString();
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    // Log error for debugging
    console.error('API Error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      message: error.message,
    });

    // Handle different error types
    if (error.response?.status === 401) {
      console.warn('Unauthorized - JWT token may be invalid or expired');
      // Remove invalid token
      jwtUtils.removeToken();
    } else if (error.response?.status === 403) {
      console.warn('Access forbidden');
    } else if (error.response && error.response.status >= 500) {
      console.error('Server error occurred');
    } else if (!error.response) {
      console.error('Network error - check connection');
    }

    return Promise.reject(error);
  }
);

export default apiClient;
