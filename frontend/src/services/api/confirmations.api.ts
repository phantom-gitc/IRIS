import { apiClient } from './client';

export const confirmationsApi = {
  approve(token: string): Promise<{ success: boolean; message: string }> {
    return apiClient.post<{ success: boolean; message: string }>(`/confirmations/${token}/approve`);
  },

  reject(token: string): Promise<{ success: boolean; message: string }> {
    return apiClient.post<{ success: boolean; message: string }>(`/confirmations/${token}/reject`);
  },
};
