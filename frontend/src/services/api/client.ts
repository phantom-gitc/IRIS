import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '../../stores/auth.store';

export class ApiError extends Error {
  status: number;
  code?: string;
  retryAfter?: number;
  details?: unknown;

  constructor(status: number, message: string, code?: string, retryAfter?: number, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.retryAfter = retryAfter;
    this.details = details;
  }
}

export const axiosInstance = axios.create({
  baseURL: '/api/v1',
  withCredentials: true,
  timeout: 45000,
  headers: {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
});

// Attach bearer token & CSRF verification header to outgoing requests
axiosInstance.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (config.headers) {
    config.headers['X-Requested-With'] = 'XMLHttpRequest';
    const token = useAuthStore.getState().accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Automatic 401 refresh token queue
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else if (token) {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    const url = originalRequest?.url || '';

    // Auth endpoints (/auth/login, /auth/register, /auth/refresh, etc.) must NEVER trigger token refresh
    const isAuthEndpoint =
      url.includes('/auth/login') ||
      url.includes('/auth/register') ||
      url.includes('/auth/refresh') ||
      url.includes('/auth/forgot-password') ||
      url.includes('/auth/reset-password');

    // If 401 on an authenticated resource and not already retried
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry && !isAuthEndpoint) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: (token: string) => {
              if (originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${token}`;
              }
              resolve(axiosInstance(originalRequest));
            },
            reject: (err: unknown) => reject(err),
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshResponse = await axios.post(
          '/api/v1/auth/refresh',
          {},
          {
            withCredentials: true,
            headers: { 'X-Requested-With': 'XMLHttpRequest' },
          }
        );
        const data = refreshResponse.data;
        const newToken = data.data?.accessToken;

        if (newToken) {
          useAuthStore.getState().setAccessToken(newToken);
          processQueue(null, newToken);
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
          }
          return axiosInstance(originalRequest);
        } else {
          throw new Error('No access token in refresh response');
        }
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        useAuthStore.getState().logout();
        return Promise.reject(new ApiError(401, 'Session expired. Please log in again.'));
      } finally {
        isRefreshing = false;
      }
    }

    // Normalize error details
    const status = error.response?.status || 0;
    const resData = error.response?.data as
      | {
          error?: {
            message?: string;
            code?: string;
            details?: Array<{ field?: string; message?: string }>;
          };
          message?: string;
        }
      | undefined;

    const retryAfter = error.response?.headers['retry-after']
      ? parseInt(error.response.headers['retry-after'], 10)
      : undefined;

    let message = resData?.error?.message || resData?.message;

    // Format validation issues if details are provided
    if (resData?.error?.details && Array.isArray(resData.error.details) && resData.error.details.length > 0) {
      message = resData.error.details
        .map((d) => d.message)
        .filter(Boolean)
        .join('. ');
    }

    if (!message) {
      if (status === 401) message = 'Invalid credentials or session expired.';
      else if (status === 403) message = "You don't have permission to do that.";
      else if (status === 404) message = 'Requested resource not found.';
      else if (status === 409) message = 'An account with this email already exists.';
      else if (status === 429) message = "Too many attempts. Please wait a moment and try again.";
      else if (status >= 500) message = 'IRIS server error. Please retry shortly.';
      else if (error.code === 'ECONNABORTED') message = 'Request timed out. Please try again.';
      else message = navigator.onLine ? 'Network error. Please verify backend is running on port 5000.' : 'You appear to be offline.';
    }

    return Promise.reject(new ApiError(status, message, resData?.error?.code, retryAfter, resData?.error?.details));
  }
);

export const apiClient = {
  async get<T>(url: string, params?: Record<string, unknown>): Promise<T> {
    const res = await axiosInstance.get(url, { params });
    const data = res.data;
    return (data && typeof data === 'object' && 'data' in data && 'success' in data ? data.data : data) as T;
  },

  async post<T>(url: string, body?: unknown, headers?: Record<string, string>, config?: { timeout?: number }): Promise<T> {
    const res = await axiosInstance.post(url, body, { headers, ...config });
    const data = res.data;
    return (data && typeof data === 'object' && 'data' in data && 'success' in data ? data.data : data) as T;
  },

  async patch<T>(url: string, body?: unknown): Promise<T> {
    const res = await axiosInstance.patch(url, body);
    const data = res.data;
    return (data && typeof data === 'object' && 'data' in data && 'success' in data ? data.data : data) as T;
  },

  async delete<T>(url: string): Promise<T> {
    const res = await axiosInstance.delete(url);
    const data = res.data;
    return (data && typeof data === 'object' && 'data' in data && 'success' in data ? data.data : data) as T;
  },
};
