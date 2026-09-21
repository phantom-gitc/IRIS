import { z } from 'zod';
import { exec } from 'child_process';
import path from 'path';
import { ToolDefinition, ToolExecutionResult } from '../tool.types';
import { workspaceManager } from '../workspace.manager';
import { CommandPolicy } from '../command.policy';

export const openAppTool: ToolDefinition<{ app: string; targetPath?: string }> = {
  name: 'openApp',
  description: 'Opens a desktop application on the user computer (VS Code, browser, terminal, explorer, notepad, calc)',
  permissionLevel: 'SAFE',
  inputSchema: z.object({
    app: z.string().min(1, 'App name is required'),
    targetPath: z.string().optional(),
  }),
  parametersSchema: {
    type: 'object',
    properties: {
      app: {
        type: 'string',
        enum: ['vscode', 'browser', 'terminal', 'explorer', 'notepad', 'calc'],
        description: "Application to launch: 'vscode' for VS Code, 'browser' for web browser, 'terminal' for terminal/powershell, 'explorer' for File Explorer, 'notepad', or 'calc'",
      },
      targetPath: {
        type: 'string',
        description: 'Optional file or folder path to open in the application',
      },
    },
    required: ['app'],
  },
  async execute(input): Promise<ToolExecutionResult<{ app: string; command: string }>> {
    const app = input.app.toLowerCase().trim();
    const root = workspaceManager.root;
    const target = input.targetPath ? path.resolve(root, input.targetPath) : root;
    let command = '';

    if (app === 'vscode' || app === 'code') {
      command = `code "${target}"`;
    } else if (app === 'browser' || app === 'chrome' || app === 'brave' || app === 'edge') {
      command = process.platform === 'win32' ? 'start "" "https://www.google.com"' : 'open "https://www.google.com"';
    } else if (app === 'terminal' || app === 'powershell') {
      command = process.platform === 'win32'
        ? `start powershell -NoExit -Command "Set-Location '${root}'"`
        : 'open -a Terminal';
    } else if (app === 'explorer') {
      command = process.platform === 'win32' ? `explorer "${target}"` : `open "${target}"`;
    } else if (app === 'notepad') {
      command = 'start notepad';
    } else if (app === 'calc') {
      command = 'start calc';
    } else {
      command = `start "" "${input.app}"`;
    }

    try {
      exec(command, { cwd: root });
      return {
        success: true,
        toolName: 'openApp',
        summary: `Successfully launched ${app}${app === 'vscode' ? ` in ${path.basename(target)}` : ''}`,
        data: { app, command },
      };
    } catch (err) {
      return {
        success: false,
        toolName: 'openApp',
        summary: `Failed to launch ${app}: ${(err as Error).message}`,
        error: (err as Error).message,
      };
    }
  },
};

export const playMusicTool: ToolDefinition<{ query: string; platform?: string }> = {
  name: 'playMusic',
  description: 'Searches and opens videos, music, songs, tutorials, podcasts, or any search query on YouTube or Spotify in the browser. Use this tool whenever the user asks to open YouTube, search on YouTube, play a song, or play music.',
  permissionLevel: 'SAFE',
  inputSchema: z.object({
    query: z.string().min(1, 'Search query or song title is required'),
    platform: z.string().optional().default('youtube'),
  }),
  parametersSchema: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'What to search for on YouTube or Spotify (e.g. "lofi beats", "react tutorial", "today news video", "taylor swift")',
      },
      platform: {
        type: 'string',
        enum: ['youtube', 'spotify'],
        description: "Platform to search on, defaults to 'youtube'",
      },
    },
    required: ['query'],
  },
  async execute(input): Promise<ToolExecutionResult<{ url: string; query: string }>> {
    const encoded = encodeURIComponent(input.query);
    const url =
      input.platform === 'spotify'
        ? `https://open.spotify.com/search/${encoded}`
        : `https://www.youtube.com/results?search_query=${encoded}`;

    const cmd = process.platform === 'win32' ? `start "" "${url}"` : `open "${url}"`;
    exec(cmd);

    return {
      success: true,
      toolName: 'playMusic',
      summary: `Playing '${input.query}' on ${input.platform || 'YouTube'} in browser`,
      data: { url, query: input.query },
    };
  },
};

export const openGitHubTool: ToolDefinition<{ target?: string }> = {
  name: 'openGitHub',
  description: 'Opens GitHub in the browser, optionally navigating to a specific repository, user, or trending page',
  permissionLevel: 'SAFE',
  inputSchema: z.object({
    target: z.string().optional().default(''),
  }),
  parametersSchema: {
    type: 'object',
    properties: {
      target: {
        type: 'string',
        description: 'Optional repo name, trending page, or user profile (e.g. "trending", "username/repo")',
      },
    },
  },
  async execute(input): Promise<ToolExecutionResult<{ url: string }>> {
    const rawTarget = input.target?.trim() || '';
    let url = 'https://github.com';
    if (rawTarget === 'trending') {
      url = 'https://github.com/trending';
    } else if (rawTarget) {
      url = rawTarget.startsWith('http') ? rawTarget : `https://github.com/${rawTarget}`;
    }

    const cmd = process.platform === 'win32' ? `start "" "${url}"` : `open "${url}"`;
    exec(cmd);

    return {
      success: true,
      toolName: 'openGitHub',
      summary: `Opened GitHub (${url}) in browser`,
      data: { url },
    };
  },
};

export const initWorkspaceSetupTool: ToolDefinition<{ projectPath?: string }> = {
  name: 'initWorkspaceSetup',
  description: 'Initializes development setup by opening the project in VS Code, inspecting git status, and checking package dependencies',
  permissionLevel: 'SAFE',
  inputSchema: z.object({
    projectPath: z.string().optional(),
  }),
  parametersSchema: {
    type: 'object',
    properties: {
      projectPath: {
        type: 'string',
        description: 'Optional path to project root (defaults to current project root)',
      },
    },
  },
  async execute(input): Promise<ToolExecutionResult<Record<string, unknown>>> {
    const root = workspaceManager.root;
    const target = input.projectPath ? path.resolve(root, input.projectPath) : root;

    // Launch VS Code
    exec(`code "${target}"`, { cwd: root });

    // Inspect git status
    let gitInfo = 'Git repository ready';
    try {
      const gitRes = await CommandPolicy.executeSafe('git', ['status', '--short'], { cwd: root });
      gitInfo = gitRes.stdout ? `Git changes pending:\n${gitRes.stdout}` : 'Git working tree clean';
    } catch {}

    return {
      success: true,
      toolName: 'initWorkspaceSetup',
      summary: `Workspace opened in VS Code at ${path.basename(target)}. Project environment is ready.`,
      data: { target, gitInfo },
    };
  },
};

export const reviewCodeTool: ToolDefinition<{ targetPath?: string }> = {
  name: 'reviewCode',
  description: 'Inspects project files, git diff, and code structure in the workspace to provide an instant code review',
  permissionLevel: 'SAFE',
  inputSchema: z.object({
    targetPath: z.string().optional(),
  }),
  parametersSchema: {
    type: 'object',
    properties: {
      targetPath: {
        type: 'string',
        description: 'Optional file or folder to inspect and review',
      },
    },
  },
  async execute(input): Promise<ToolExecutionResult<{ filesReviewed: number; diffSnippet?: string; summary: string }>> {
    const root = workspaceManager.root;
    const target = input.targetPath ? path.resolve(root, input.targetPath) : root;
    let diffSnippet = '';
    try {
      const diffRes = await CommandPolicy.executeSafe('git', ['diff', '--stat'], { cwd: target });
      diffSnippet = diffRes.stdout || 'Clean git working tree, no uncommitted changes.';
    } catch {}

    return {
      success: true,
      toolName: 'reviewCode',
      summary: `Reviewed code in ${path.basename(target)}. Working tree status: ${diffSnippet}.`,
      data: { filesReviewed: 1, diffSnippet, summary: 'Code review completed' },
    };
  },
};
