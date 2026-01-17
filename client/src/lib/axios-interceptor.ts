import api from './api';
import { AxiosRequestConfig, AxiosResponse, AxiosError, InternalAxiosRequestConfig } from 'axios';

// Types for better type safety
interface QueuedRequest {
  resolve: (value: AxiosResponse) => void;
  reject: (reason: unknown) => void;
  config: AxiosRequestConfig;
}

interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
  _skipAuth?: boolean; // Flag to skip auth for certain requests
}

// State management
let isRefreshing = false;
let failedQueue: QueuedRequest[] = [];

/**
 * Process the queue of failed requests
 * @param error - Error to reject all requests with, if any
 */
const processQueue = (error?: unknown): void => {
  const requests = [...failedQueue]; // Create a copy to avoid race conditions
  failedQueue = []; // Clear the queue immediately

  requests.forEach(async ({ resolve, reject, config }) => {
    if (error) {
      reject(error);
      return;
    }

    try {
      // Retry the original request with fresh auth cookies
      const response = await api.request(config);
      resolve(response);
    } catch (retryError) {
      // If retry fails, reject with the retry error
      reject(retryError);
    }
  });
};

/**
 * Handle logout and cleanup
 */
const handleLogout = async (): Promise<void> => {
  try {
    // Attempt to logout on server
    await api.post('/auth/logout', {}, { 
      _skipAuth: true // Skip auth for logout request to avoid infinite loop
    } as CustomAxiosRequestConfig);
  } catch (logoutError) {
    // Ignore logout errors - user might already be logged out
    console.warn('Logout request failed:', logoutError);
  }

  // Clear any remaining queued requests
  const logoutError = new Error('Authentication failed - user logged out');
  processQueue(logoutError);
};

/**
 * Attempt to refresh authentication
 * @returns Promise that resolves on successful refresh
 */
const refreshAuth = async (): Promise<void> => {
  try {
    await api.post('/auth/refresh', {}, {
      _skipAuth: true // Skip auth for refresh request
    } as CustomAxiosRequestConfig);
  } catch (refreshError) {
    // If refresh fails, we need to logout
    await handleLogout();
    throw refreshError;
  }
};

// Request interceptor - add any default headers or preprocessing
api.interceptors.request.use(
  (config: CustomAxiosRequestConfig) => {
    // You can add default headers, auth tokens, etc. here if needed
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle auth errors and token refresh
api.interceptors.response.use(
  (response: AxiosResponse) => {
    // Success response - return as is
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as CustomAxiosRequestConfig;

    // Skip auth handling for certain requests
    if (originalRequest?._skipAuth) {
      return Promise.reject(error);
    }

    // Handle 401 Unauthorized errors
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      
      // If we're already refreshing, queue this request
      if (isRefreshing) {
        return new Promise<AxiosResponse>((resolve, reject) => {
          failedQueue.push({
            resolve,
            reject,
            config: originalRequest
          });
        });
      }

      // Mark this request as retried to prevent infinite loops
      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Attempt to refresh authentication
        await refreshAuth();
        
        // If refresh succeeds, process the queue of failed requests
        processQueue();
        
        // Retry the original request that triggered the refresh
        return api.request(originalRequest);
        
      } catch (refreshError) {
        // If refresh fails, reject all queued requests and logout
        processQueue(refreshError);
        return Promise.reject(refreshError);
      } finally {
        // Always reset the refreshing flag
        isRefreshing = false;
      }
    }

    // Handle other error status codes if needed
    if (error.response?.status === 403) {
      // Forbidden - user doesn't have permission
      console.warn('Access forbidden:', error.response.data);
    } else if (error.response && error.response.status >= 500) {
      // Server errors
      console.error('Server error:', error.response.status, error.response.data);
    } else if (!error.response) {
      // Network error
      console.error('Network error:', error.message);
    }

    // For all other errors, reject normally
    return Promise.reject(error);
  }
);
