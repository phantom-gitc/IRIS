import { apiClient } from './client';

export interface ConversationMessage {
  id?: string;
  _id?: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: string;
  toolExecuted?: {
    toolName: string;
    summary: string;
    success: boolean;
  };
}

export interface Conversation {
  id?: string;
  _id: string;
  title: string;
  summary?: string;
  messageCount: number;
  lastMessageAt: string;
  createdAt: string;
  messages?: ConversationMessage[];
}

export const conversationsApi = {
  getAll(params?: { limit?: number; offset?: number }): Promise<{ conversations: Conversation[]; total: number }> {
    const query = new URLSearchParams();
    if (params?.limit) query.set('limit', params.limit.toString());
    if (params?.offset) query.set('offset', params.offset.toString());
    const qs = query.toString();
    return apiClient.get<{ conversations: Conversation[]; total: number }>(`/conversations${qs ? `?${qs}` : ''}`);
  },

  getById(id: string): Promise<Conversation> {
    return apiClient.get<Conversation>(`/conversations/${id}`);
  },

  create(input?: string | { title?: string }): Promise<Conversation> {
    const title = typeof input === 'string' ? input : input?.title;
    return apiClient.post<Conversation>('/conversations', { title });
  },

  delete(id: string): Promise<{ success: boolean }> {
    return apiClient.delete<{ success: boolean }>(`/conversations/${id}`);
  },
};
