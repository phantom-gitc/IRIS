import { z } from 'zod';

export const createMemorySchema = z.object({
  content: z.string().min(1, 'Memory content is required').max(5000),
  memoryType: z.enum([
    'WORKING_MEMORY',
    'CONVERSATION_MEMORY',
    'EPISODIC_MEMORY',
    'PERSONAL_MEMORY',
    'PROJECT_MEMORY',
  ]).default('PERSONAL_MEMORY'),
  importance: z.number().min(1).max(10).default(5),
  tags: z.array(z.string()).default([]),
  source: z.enum(['user', 'agent', 'system']).default('user'),
  sourceId: z.string().optional(),
});

export const updateMemorySchema = z.object({
  content: z.string().min(1).max(5000).optional(),
  importance: z.number().min(1).max(10).optional(),
  tags: z.array(z.string()).optional(),
});

export const queryMemorySchema = z.object({
  query: z.string().optional(),
  memoryType: z.string().optional(),
  limit: z.coerce.number().min(1).max(50).default(10),
});

export type CreateMemoryInput = z.infer<typeof createMemorySchema>;
export type UpdateMemoryInput = z.infer<typeof updateMemorySchema>;
export type QueryMemoryInput = z.infer<typeof queryMemorySchema>;
