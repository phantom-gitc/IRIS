import { apiClient, axiosInstance } from './client';
import { useAuthStore, type User } from '../../stores/auth.store';

export interface AuthResponse {
  user: User;
  accessToken: string;
  expiresIn: number;
}

export const authApi = {
  async register(data: { name: string; email: string; password: string }): Promise<AuthResponse> {
    const res = await apiClient.post<AuthResponse>('/auth/register', data);
    useAuthStore.getState().setUser(res.user);
    useAuthStore.getState().setAccessToken(res.accessToken);
    return res;
  },

  async login(data: { email: string; password: string }): Promise<AuthResponse> {
    const res = await apiClient.post<AuthResponse>('/auth/login', data);
    useAuthStore.getState().setUser(res.user);
    useAuthStore.getState().setAccessToken(res.accessToken);
    return res;
  },

  async refresh(): Promise<string> {
    const res = await axiosInstance.post<{ success: boolean; data: { accessToken: string } }>(
      '/auth/refresh',
      {}
    );
    const token = res.data.data?.accessToken;
    if (!token) {
      useAuthStore.getState().logout();
      throw new Error('Session expired');
    }
    useAuthStore.getState().setAccessToken(token);
    return token;
  },

  async getMe(): Promise<User> {
    const res = await apiClient.get<{ user: User }>('/auth/me');
    useAuthStore.getState().setUser(res.user);
    return res.user;
  },

  async updateMe(data: Partial<User>): Promise<User> {
    const res = await apiClient.patch<{ user: User }>('/auth/me', data);
    useAuthStore.getState().setUser(res.user);
    return res.user;
  },

  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout');
    } finally {
      useAuthStore.getState().logout();
    }
  },

  async logoutAll(): Promise<void> {
    try {
      await apiClient.post('/auth/logout-all');
    } finally {
      useAuthStore.getState().logout();
    }
  },

  async forgotPassword(email: string): Promise<{ message: string }> {
    return apiClient.post<{ message: string }>('/auth/forgot-password', { email });
  },

  async resetPassword(data: { token: string; newPassword: string }): Promise<{ message: string }> {
    return apiClient.post<{ message: string }>('/auth/reset-password', data);
  },

  async changePassword(data: { currentPassword: string; newPassword: string }): Promise<void> {
    return apiClient.post<void>('/auth/change-password', data);
  },
};
