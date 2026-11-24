import axios from 'axios';
import { STORAGE_KEYS } from '../constants';
import { storage } from '../utils/storage';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

/**
 * Axios instance with centralized configurations
 */
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Flag and queue to avoid multiple simultaneous refresh requests
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else {
      promise.resolve(token);
    }
  });
  failedQueue = [];
};

/**
 * Request Interceptor: Attach Bearer Access Token
 */
apiClient.interceptors.request.use(
  (config) => {
    const accessToken = storage.get(STORAGE_KEYS.ACCESS_TOKEN);
    if (accessToken && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * Response Interceptor: Normalize responses and handle 401 token refresh
 */
apiClient.interceptors.response.use(
  (response) => {
    // Backend standard ApiResponse returns { success: true, statusCode, message, data }
    return response.data;
  },
  async (error) => {
    const originalRequest = error.config;

    // Normalize error payload from Backend ApiError
    const normalizedError = {
      statusCode: error.response?.status || 500,
      message:
        error.response?.data?.message ||
        error.message ||
        'Đã xảy ra lỗi không xác định. Vui lòng thử lại sau.',
      errors: error.response?.data?.errors || [],
      raw: error,
    };

    // If 401 Unauthorized and not already retrying
    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !originalRequest.url.includes('/auth/login') &&
      !originalRequest.url.includes('/auth/register') &&
      !originalRequest.url.includes('/auth/refresh')
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = storage.get(STORAGE_KEYS.REFRESH_TOKEN);

      if (!refreshToken) {
        isRefreshing = false;
        // Clean up storage and emit session expired event
        storage.remove(STORAGE_KEYS.ACCESS_TOKEN);
        storage.remove(STORAGE_KEYS.REFRESH_TOKEN);
        storage.remove(STORAGE_KEYS.USER);
        window.dispatchEvent(new CustomEvent('auth:expired'));
        return Promise.reject(normalizedError);
      }

      try {
        // Direct axios post to avoid interceptor loop
        const refreshResponse = await axios.post(`${API_BASE_URL}/auth/refresh-token`, {
          refreshToken,
        });

        const newAccessToken =
          refreshResponse.data?.data?.accessToken || refreshResponse.data?.accessToken;

        if (!newAccessToken) {
          throw new Error('Refresh token did not return a new access token');
        }

        storage.set(STORAGE_KEYS.ACCESS_TOKEN, newAccessToken);
        apiClient.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`;
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

        processQueue(null, newAccessToken);
        return apiClient(originalRequest);
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        // Clear auth on refresh failure
        storage.remove(STORAGE_KEYS.ACCESS_TOKEN);
        storage.remove(STORAGE_KEYS.REFRESH_TOKEN);
        storage.remove(STORAGE_KEYS.USER);
        window.dispatchEvent(new CustomEvent('auth:expired'));
        return Promise.reject(normalizedError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(normalizedError);
  }
);

export default apiClient;
