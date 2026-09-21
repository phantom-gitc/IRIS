import { z } from 'zod';

export type PermissionLevel = 'SAFE' | 'CONFIRM' | 'HIGH_RISK';

export interface ToolExecutionContext {
  userId: string;
  taskId?: string;
  conversationId?: string;
  abortSignal?: AbortSignal;
}

export interface ToolExecutionResult<T = unknown> {
  success: boolean;
  toolName: string;
  summary: string;
  data?: T;
  error?: string;
}

export interface ToolDefinition<TInput = any, TOutput = any> {
  name: string;
  description: string;
  permissionLevel: PermissionLevel;
  inputSchema: z.ZodType<TInput>;
  parametersSchema?: Record<string, unknown>;
  execute(input: TInput, context: ToolExecutionContext): Promise<ToolExecutionResult<TOutput>>;
}
