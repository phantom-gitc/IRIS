import { z } from 'zod';
import { ToolDefinition, ToolExecutionResult } from '../tool.types';
import { CommandPolicy } from '../command.policy';

export const npmInstallTool: ToolDefinition<{ packages?: string[]; isDev?: boolean }> = {
  name: 'npmInstall',
  description: 'Installs dependencies in the current workspace using npm',
  permissionLevel: 'SAFE',
  inputSchema: z.object({
    packages: z.array(z.string()).optional(),
    isDev: z.boolean().optional().default(false),
  }),
  parametersSchema: {
    type: 'object',
    properties: {
      packages: {
        type: 'array',
        items: { type: 'string' },
        description: 'Package names to install (optional, runs npm install if omitted)',
      },
      isDev: {
        type: 'boolean',
        description: 'Install as devDependencies (-D)',
      },
    },
  },
  async execute(input, context): Promise<ToolExecutionResult<{ stdout: string; exitCode: number }>> {
    const args = ['install'];
    if (input.isDev) args.push('-D');
    if (input.packages && input.packages.length > 0) {
      args.push(...input.packages);
    }

    const res = await CommandPolicy.executeSafe('npm', args, {
      signal: context.abortSignal,
    });

    return {
      success: res.exitCode === 0,
      toolName: 'npmInstall',
      summary: res.exitCode === 0 ? 'Dependencies installed successfully' : 'npm install failed',
      data: { stdout: res.stdout, exitCode: res.exitCode },
    };
  },
};

export const npmScriptTool: ToolDefinition<{ script: string; args?: string[] }> = {
  name: 'npmScript',
  description: 'Executes an approved npm script from package.json (e.g. test, build, lint, dev)',
  permissionLevel: 'SAFE',
  inputSchema: z.object({
    script: z.enum(['test', 'build', 'lint', 'typecheck', 'dev']),
    args: z.array(z.string()).optional().default([]),
  }),
  parametersSchema: {
    type: 'object',
    properties: {
      script: {
        type: 'string',
        enum: ['test', 'build', 'lint', 'typecheck', 'dev'],
        description: 'The npm script name to execute',
      },
      args: {
        type: 'array',
        items: { type: 'string' },
        description: 'Optional additional arguments to pass',
      },
    },
    required: ['script'],
  },
  async execute(input, context): Promise<ToolExecutionResult<{ stdout: string; exitCode: number }>> {
    const extraArgs = input.args || [];
    const args = ['run', input.script, '--', ...extraArgs];
    const res = await CommandPolicy.executeSafe('npm', args, {
      signal: context.abortSignal,
    });

    return {
      success: res.exitCode === 0,
      toolName: 'npmScript',
      summary: `npm run ${input.script} exited with code ${res.exitCode}`,
      data: { stdout: res.stdout, exitCode: res.exitCode },
    };
  },
};

export const gitStatusTool: ToolDefinition<Record<string, never>> = {
  name: 'gitStatus',
  description: 'Inspects the current git working tree status',
  permissionLevel: 'SAFE',
  inputSchema: z.object({}),
  parametersSchema: {
    type: 'object',
    properties: {},
  },
  async execute(_input, context): Promise<ToolExecutionResult<{ status: string }>> {
    const res = await CommandPolicy.executeSafe('git', ['status', '--short'], {
      signal: context.abortSignal,
    });

    return {
      success: res.exitCode === 0,
      toolName: 'gitStatus',
      summary: 'Git status retrieved',
      data: { status: res.stdout || 'Clean working tree' },
    };
  },
};

export const gitDiffTool: ToolDefinition<{ path?: string }> = {
  name: 'gitDiff',
  description: 'Inspects git diff in the workspace',
  permissionLevel: 'SAFE',
  inputSchema: z.object({
    path: z.string().optional(),
  }),
  parametersSchema: {
    type: 'object',
    properties: {
      path: {
        type: 'string',
        description: 'Optional file path to inspect diff',
      },
    },
  },
  async execute(input, context): Promise<ToolExecutionResult<{ diff: string }>> {
    const args = ['diff'];
    if (input.path) args.push(input.path);

    const res = await CommandPolicy.executeSafe('git', args, {
      signal: context.abortSignal,
    });

    return {
      success: res.exitCode === 0,
      toolName: 'gitDiff',
      summary: 'Git diff retrieved',
      data: { diff: res.stdout || 'No changes' },
    };
  },
};
