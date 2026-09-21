import { apiClient } from './client';

export type TaskStatus =
  | 'PENDING'
  | 'PLANNING'
  | 'RUNNING'
  | 'WAITING_CONFIRMATION'
  | 'PAUSED'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED';

export interface TaskStep {
  id: string;
  title: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'SKIPPED';
  toolName?: string;
  error?: string;
  startedAt?: string;
  completedAt?: string;
}

export interface TaskItem {
  _id: string;
  id?: string;
  userId: string;
  conversationId?: string;
  title: string;
  description?: string;
  status: TaskStatus;
  progress: number;
  steps: TaskStep[];
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  metadata?: Record<string, unknown>;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export const tasksApi = {
  getAll(limit = 30): Promise<TaskItem[]> {
    return apiClient.get<TaskItem[]>(`/tasks?limit=${limit}`);
  },

  getById(id: string): Promise<TaskItem> {
    return apiClient.get<TaskItem>(`/tasks/${id}`);
  },

  cancel(id: string): Promise<TaskItem> {
    return apiClient.post<TaskItem>(`/tasks/${id}/cancel`);
  },
};
