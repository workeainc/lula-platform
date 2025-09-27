import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Backend API Configuration
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3002/api';
const WS_BASE_URL = process.env.EXPO_PUBLIC_WS_URL || 'ws://localhost:3002';

class BackendService {
  constructor() {
    this.apiClient = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor to include auth token
    this.apiClient.interceptors.request.use(
      async (config) => {
        const token = await AsyncStorage.getItem('authToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Add response interceptor for error handling
    this.apiClient.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          // Token expired or invalid, clear storage
          await AsyncStorage.removeItem('authToken');
          await AsyncStorage.removeItem('loggedInUserId');
        }
        return Promise.reject(error);
      }
    );
  }

  // Generic API methods
  async get(endpoint, params = {}) {
    try {
      const response = await this.apiClient.get(endpoint, { params });
      return { error: false, data: response.data };
    } catch (error) {
      return this.handleError(error);
    }
  }

  async post(endpoint, data = {}) {
    try {
      const response = await this.apiClient.post(endpoint, data);
      return { error: false, data: response.data };
    } catch (error) {
      return this.handleError(error);
    }
  }

  async put(endpoint, data = {}) {
    try {
      const response = await this.apiClient.put(endpoint, data);
      return { error: false, data: response.data };
    } catch (error) {
      return this.handleError(error);
    }
  }

  async delete(endpoint) {
    try {
      const response = await this.apiClient.delete(endpoint);
      return { error: false, data: response.data };
    } catch (error) {
      return this.handleError(error);
    }
  }

  // Get WebSocket URL
  static getWebSocketUrl() {
    return WS_BASE_URL;
  }

  // Get API Base URL
  static getApiBaseUrl() {
    return API_BASE_URL;
  }

  // Handle API errors
  handleError(error) {
    console.error('BackendService Error:', error);
    
    if (error.response) {
      // Server responded with error status
      return {
        error: true,
        message: error.response.data?.message || 'Server error occurred',
        status: error.response.status,
        data: error.response.data
      };
    } else if (error.request) {
      // Request was made but no response received
      return {
        error: true,
        message: 'Network error. Please check your connection.',
        status: 0
      };
    } else {
      // Something else happened
      return {
        error: true,
        message: error.message || 'An unexpected error occurred',
        status: 0
      };
    }
  }

  // Health check
  async healthCheck() {
    return this.get('/health');
  }

  // Get WebSocket URL
  getWebSocketUrl() {
    return WS_BASE_URL;
  }
}

export default new BackendService();
