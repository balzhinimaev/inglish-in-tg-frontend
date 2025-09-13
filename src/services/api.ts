import axios, { AxiosError, AxiosResponse } from 'axios';
import { API_BASE_URL } from '../utils/constants';
import { getTelegramInitData } from '../utils/telegram';

// Create axios instance
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add Telegram auth (except for /auth/verify where initData goes in query)
apiClient.interceptors.request.use(
  (config) => {
    const isAuthVerify = (config.url || '').startsWith('/auth/verify');
    if (!isAuthVerify) {
      const initData = getTelegramInitData();
      if (initData) {
        config.headers.Authorization = `TWA ${initData}`;
        (config.headers as any)['X-Telegram-Init-Data'] = initData;
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
      console.warn('Unauthorized');
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
