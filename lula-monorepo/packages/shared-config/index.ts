import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

// Environment configuration
export interface AppConfig {
  API_BASE_URL: string;
  SOCKET_URL: string;
  STREAM_API_KEY?: string;
  STREAM_API_SECRET?: string;
  ENVIRONMENT: 'development' | 'production' | 'testing';
}

// Default configuration
export const defaultConfig: AppConfig = {
  API_BASE_URL: 'http://localhost:3002/api',
  SOCKET_URL: 'http://localhost:3002',
  ENVIRONMENT: 'development',
};

// Create axios instance factory
export const createAxiosInstance = (config: Partial<AppConfig> = {}): AxiosInstance => {
  const finalConfig = { ...defaultConfig, ...config };
  
  const instance = axios.create({
    baseURL: finalConfig.API_BASE_URL,
    timeout: 60000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Request interceptor
  instance.interceptors.request.use(
    (config: AxiosRequestConfig) => {
      // Add auth token if available
      const token = getAuthToken();
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      // Handle FormData
      if (config.data instanceof FormData && config.headers) {
        config.headers['Content-Type'] = 'multipart/form-data';
      }

      return config;
    },
    (error) => Promise.reject(error)
  );

  // Response interceptor
  instance.interceptors.response.use(
    (response: AxiosResponse) => response,
    (error) => {
      if (error.response?.status === 401) {
        // Handle unauthorized access
        clearAuthToken();
        // Redirect to login if in browser
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      }
      return Promise.reject(error);
    }
  );

  return instance;
};

// Auth token utilities
export const getAuthToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('auth_token');
  }
  return null;
};

export const setAuthToken = (token: string): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('auth_token', token);
  }
};

export const clearAuthToken = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
  }
};

// API endpoints configuration
export const API_ROUTES = {
  // Auth
  LOGIN: '/auth/login',
  VERIFY_OTP: '/auth/verify-otp',
  LOGOUT: '/auth/logout',
  REFRESH_TOKEN: '/auth/refresh',

  // Users
  GET_PROFILE: '/users/profile',
  UPDATE_PROFILE: '/users/profile',
  UPLOAD_AVATAR: '/users/avatar',
  GET_USERS: '/users',

  // Calls
  INITIATE_CALL: '/calls/initiate',
  ACCEPT_CALL: '/calls/accept',
  REJECT_CALL: '/calls/reject',
  END_CALL: '/calls/end',
  CALL_HISTORY: '/calls/history',

  // Chat
  GET_CHATS: '/chat',
  GET_MESSAGES: '/chat/:chatId/messages',
  SEND_MESSAGE: '/chat/:chatId/messages',

  // Transactions
  GET_TRANSACTIONS: '/transactions',
  PURCHASE_COINS: '/transactions/purchase',
  
  // Admin
  ADMIN_DASHBOARD: '/admin/dashboard',
  ADMIN_USERS: '/admin/users',
  ADMIN_TRANSACTIONS: '/admin/transactions',
} as const;

// Socket events
export const SOCKET_EVENTS = {
  // Connection
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  
  // Calls
  INCOMING_CALL: 'incoming_call',
  CALL_ACCEPTED: 'call_accepted',
  CALL_REJECTED: 'call_rejected',
  CALL_ENDED: 'call_ended',
  
  // Chat
  NEW_MESSAGE: 'new_message',
  MESSAGE_DELIVERED: 'message_delivered',
  MESSAGE_READ: 'message_read',
  
  // User status
  USER_ONLINE: 'user_online',
  USER_OFFLINE: 'user_offline',
} as const;

// Error codes
export const ERROR_CODES = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INSUFFICIENT_COINS: 'INSUFFICIENT_COINS',
  CALL_TIMEOUT: 'CALL_TIMEOUT',
  USER_BUSY: 'USER_BUSY',
  NETWORK_ERROR: 'NETWORK_ERROR',
} as const;

// Default axios instance
export const axiosInstance = createAxiosInstance();

export default axiosInstance;
