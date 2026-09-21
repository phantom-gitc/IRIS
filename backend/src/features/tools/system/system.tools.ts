import os from 'os';
import { z } from 'zod';
import { ToolDefinition, ToolExecutionResult } from '../tool.types';

export const systemInfoTool: ToolDefinition<Record<string, never>> = {
  name: 'systemInfo',
  description: 'Gathers safe operating system metrics and platform details',
  permissionLevel: 'SAFE',
  inputSchema: z.object({}),
  parametersSchema: {
    type: 'object',
    properties: {},
  },
  async execute(): Promise<ToolExecutionResult<{ platform: string; arch: string; cpus: number; freeMemMb: number }>> {
    const freeMemMb = Math.round(os.freemem() / (1024 * 1024));
    return {
      success: true,
      toolName: 'systemInfo',
      summary: `System: ${os.platform()} (${os.arch()}), ${os.cpus().length} CPUs, ${freeMemMb} MB free RAM`,
      data: {
        platform: os.platform(),
        arch: os.arch(),
        cpus: os.cpus().length,
        freeMemMb,
      },
    };
  },
};

export const notificationTool: ToolDefinition<{ title: string; message: string }> = {
  name: 'notification',
  description: 'Sends a system notification to the user',
  permissionLevel: 'SAFE',
  inputSchema: z.object({
    title: z.string().min(1),
    message: z.string().min(1),
  }),
  parametersSchema: {
    type: 'object',
    properties: {
      title: {
        type: 'string',
        description: 'Notification title',
      },
      message: {
        type: 'string',
        description: 'Notification message body',
      },
    },
    required: ['title', 'message'],
  },
  async execute(input): Promise<ToolExecutionResult<{ title: string; message: string }>> {
    return {
      success: true,
      toolName: 'notification',
      summary: `Notification dispatched: ${input.title}`,
      data: { title: input.title, message: input.message },
    };
  },
};
