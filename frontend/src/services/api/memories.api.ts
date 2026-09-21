import { apiClient } from './client';

export type MemoryType =
  | 'WORKING_MEMORY'
  | 'CONVERSATION_MEMORY'
  | 'EPISODIC_MEMORY'
  | 'PERSONAL_MEMORY'
  | 'PROJECT_MEMORY';

export interface MemoryItem {
  _id: string;
  id?: string;
  userId: string;
  content: string;
  memoryType: MemoryType;
  importance: number;
  tags: string[];
  source: 'user' | 'agent' | 'system';
  sourceId?: string;
  vectorId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMemoryInput {
  content: string;
  memoryType?: MemoryType;
  importance?: number;
  tags?: string[];
}

export interface UpdateMemoryInput {
  content?: string;
  importance?: number;
  tags?: string[];
}

export const memoriesApi = {
  getAll(params?: { memoryType?: MemoryType; query?: string; limit?: number }): Promise<MemoryItem[]> {
    const searchParams = new URLSearchParams();
    if (params?.memoryType) searchParams.append('memoryType', params.memoryType);
    if (params?.query) searchParams.append('query', params.query);
    if (params?.limit) searchParams.append('limit', String(params.limit));
    const qs = searchParams.toString();
    return apiClient.get<MemoryItem[]>(qs ? `/memories?${qs}` : '/memories');
  },

  create(data: CreateMemoryInput): Promise<MemoryItem> {
    return apiClient.post<MemoryItem>('/memories', data);
  },

  update(id: string, data: UpdateMemoryInput): Promise<MemoryItem> {
    return apiClient.patch<MemoryItem>(`/memories/${id}`, data);
  },

  delete(id: string): Promise<{ message: string }> {
    return apiClient.delete<{ message: string }>(`/memories/${id}`);
  },
};
