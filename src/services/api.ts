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

    // For auth/verify, parse initData and add individual parameters
    if (isAuthVerify) {
      const initData = getTelegramInitData();
      if (initData) {
        // Parse initData string into individual parameters
        const params = new URLSearchParams(initData);
        const queryParams = new URLSearchParams();
        
        // Add individual parameters that backend expects
        if (params.has('hash')) queryParams.set('hash', params.get('hash')!);
        if (params.has('user')) queryParams.set('user', params.get('user')!);
        if (params.has('query_id')) queryParams.set('query_id', params.get('query_id')!);
        if (params.has('auth_date')) queryParams.set('auth_date', params.get('auth_date')!);
        if (params.has('start_param')) queryParams.set('start_param', params.get('start_param')!);
        
        // Add parameters to URL
        const separator = config.url?.includes('?') ? '&' : '?';
        config.url = `${config.url}${separator}${queryParams.toString()}`;
        
        console.log('Auth verify request:', {
          url: config.url,
          parsedParams: Object.fromEntries(queryParams),
          baseURL: config.baseURL
        });
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
      console.log('401 Error details:', {
        url: error.config?.url,
        status: error.response.status,
        data: error.response.data,
        headers: error.response.headers
      });
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
