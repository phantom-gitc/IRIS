import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi } from '../services/api/auth.api';
import { conversationsApi } from '../services/api/conversations.api';
import { tasksApi } from '../services/api/tasks.api';
import { memoriesApi, type MemoryType, type CreateMemoryInput } from '../services/api/memories.api';
import { confirmationsApi } from '../services/api/confirmations.api';

// Query Keys
export const queryKeys = {
  user: ['users', 'me'] as const,
  conversations: ['conversations'] as const,
  conversation: (id: string) => ['conversations', id] as const,
  tasks: (limit?: number) => ['tasks', limit ?? 30] as const,
  task: (id: string) => ['tasks', id] as const,
  memories: (memoryType?: string, query?: string) => ['memories', memoryType ?? 'all', query ?? ''] as const,
};

// User Queries
export const useCurrentUser = () => {
  return useQuery({
    queryKey: queryKeys.user,
    queryFn: () => authApi.getMe(),
    staleTime: 1000 * 60 * 5,
  });
};

export const useUpdateUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { name?: string; email?: string; avatar?: string }) => authApi.updateMe(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.user });
    },
  });
};

export const useChangePassword = () => {
  return useMutation({
    mutationFn: (data: { currentPassword: string; newPassword: string }) => authApi.changePassword(data),
  });
};

// Conversations Queries
export const useConversations = (params?: { limit?: number; offset?: number }) => {
  return useQuery({
    queryKey: queryKeys.conversations,
    queryFn: () => conversationsApi.getAll(params),
  });
};

export const useConversation = (id: string) => {
  return useQuery({
    queryKey: queryKeys.conversation(id),
    queryFn: () => conversationsApi.getById(id),
    enabled: !!id,
  });
};

export const useDeleteConversation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => conversationsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.conversations });
    },
  });
};

// Tasks Queries
export const useTasks = (limit = 30) => {
  return useQuery({
    queryKey: queryKeys.tasks(limit),
    queryFn: () => tasksApi.getAll(limit),
    refetchInterval: 4000, // Polling for active execution updates
  });
};

export const useTask = (id: string) => {
  return useQuery({
    queryKey: queryKeys.task(id),
    queryFn: () => tasksApi.getById(id),
    enabled: !!id,
  });
};

export const useCancelTask = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => tasksApi.cancel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
};

// Memories Queries
export const useMemories = (params?: { memoryType?: MemoryType; query?: string }) => {
  return useQuery({
    queryKey: queryKeys.memories(params?.memoryType, params?.query),
    queryFn: () => memoriesApi.getAll(params),
  });
};

export const useCreateMemory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateMemoryInput) => memoriesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['memories'] });
    },
  });
};

export const useDeleteMemory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => memoriesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['memories'] });
    },
  });
};

// Confirmations Mutations
export const useApproveConfirmation = () => {
  return useMutation({
    mutationFn: (token: string) => confirmationsApi.approve(token),
  });
};

export const useRejectConfirmation = () => {
  return useMutation({
    mutationFn: (token: string) => confirmationsApi.reject(token),
  });
};
