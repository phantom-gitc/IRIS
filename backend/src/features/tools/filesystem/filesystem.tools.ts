import fs from 'fs/promises';
import path from 'path';
import fg from 'fast-glob';
import { z } from 'zod';
import { ToolDefinition, ToolExecutionResult } from '../tool.types';
import { workspaceManager } from '../workspace.manager';

export const createFolderTool: ToolDefinition<{ path?: string; name?: string; folderName?: string }> = {
  name: 'createFolder',
  description: 'Creates a new folder or directory inside the workspace',
  permissionLevel: 'SAFE',
  inputSchema: z.object({
    path: z.string().optional(),
    name: z.string().optional(),
    folderName: z.string().optional(),
  }),
  parametersSchema: {
    type: 'object',
    properties: {
      path: {
        type: 'string',
        description: 'Folder name or path to create (e.g. "my-project", "src/components")',
      },
      name: {
        type: 'string',
        description: 'Alternative folder name',
      },
    },
    required: ['path'],
  },
  async execute(input, _context): Promise<ToolExecutionResult<{ path: string }>> {
    const rawTarget = (input.path || input.name || input.folderName || '').trim();
    if (!rawTarget) {
      return {
        success: false,
        toolName: 'createFolder',
        summary: 'Folder name or path is required',
        error: 'Folder name or path is required',
      };
    }
    const safePath = workspaceManager.resolveSafePath(rawTarget);
    await fs.mkdir(safePath, { recursive: true });
    return {
      success: true,
      toolName: 'createFolder',
      summary: `Directory created: ${path.relative(workspaceManager.root, safePath) || rawTarget}`,
      data: { path: safePath },
    };
  },
};

export const createFileTool: ToolDefinition<{ path: string; content?: string }> = {
  name: 'createFile',
  description: 'Creates a new file with optional content inside the workspace',
  permissionLevel: 'SAFE',
  inputSchema: z.object({
    path: z.string().min(1, 'File path is required'),
    content: z.string().optional().default(''),
  }),
  parametersSchema: {
    type: 'object',
    properties: {
      path: {
        type: 'string',
        description: 'Relative file path to create (e.g. "notes.txt", "src/index.js")',
      },
      content: {
        type: 'string',
        description: 'Initial file content',
      },
    },
    required: ['path'],
  },
  async execute(input, _context): Promise<ToolExecutionResult<{ path: string; bytesWritten: number }>> {
    const safePath = workspaceManager.resolveSafePath(input.path);
    await fs.mkdir(path.dirname(safePath), { recursive: true });
    await fs.writeFile(safePath, input.content || '', 'utf-8');
    return {
      success: true,
      toolName: 'createFile',
      summary: `File created: ${path.relative(workspaceManager.root, safePath)}`,
      data: { path: safePath, bytesWritten: Buffer.byteLength(input.content || '', 'utf-8') },
    };
  },
};

export const readFileTool: ToolDefinition<{ path: string; maxBytes?: number }> = {
  name: 'readFile',
  description: 'Reads content of a file within the workspace',
  permissionLevel: 'SAFE',
  inputSchema: z.object({
    path: z.string().min(1, 'File path is required'),
    maxBytes: z.number().optional().default(50000),
  }),
  parametersSchema: {
    type: 'object',
    properties: {
      path: {
        type: 'string',
        description: 'Relative path of the file to read',
      },
      maxBytes: {
        type: 'number',
        description: 'Maximum characters to read (default 50000)',
      },
    },
    required: ['path'],
  },
  async execute(input, _context): Promise<ToolExecutionResult<{ path: string; content: string; truncated: boolean }>> {
    const safePath = workspaceManager.resolveSafePath(input.path);
    const content = await fs.readFile(safePath, 'utf-8');
    const maxBytes = input.maxBytes ?? 50000;
    const isTruncated = content.length > maxBytes;
    const returnContent = isTruncated ? content.substring(0, maxBytes) : content;

    return {
      success: true,
      toolName: 'readFile',
      summary: `Read ${returnContent.length} characters from ${path.relative(workspaceManager.root, safePath)}`,
      data: { path: safePath, content: returnContent, truncated: isTruncated },
    };
  },
};

export const updateFileTool: ToolDefinition<{ path: string; content: string }> = {
  name: 'updateFile',
  description: 'Overwrites or updates an existing file with new content',
  permissionLevel: 'SAFE',
  inputSchema: z.object({
    path: z.string().min(1, 'File path is required'),
    content: z.string(),
  }),
  parametersSchema: {
    type: 'object',
    properties: {
      path: {
        type: 'string',
        description: 'Relative path of the file to update',
      },
      content: {
        type: 'string',
        description: 'New file content to write',
      },
    },
    required: ['path', 'content'],
  },
  async execute(input, _context): Promise<ToolExecutionResult<{ path: string; bytesWritten: number }>> {
    const safePath = workspaceManager.resolveSafePath(input.path);
    await fs.writeFile(safePath, input.content, 'utf-8');
    return {
      success: true,
      toolName: 'updateFile',
      summary: `Updated file: ${path.relative(workspaceManager.root, safePath)}`,
      data: { path: safePath, bytesWritten: Buffer.byteLength(input.content, 'utf-8') },
    };
  },
};

export const searchFilesTool: ToolDefinition<{ pattern: string; cwd?: string }> = {
  name: 'searchFiles',
  description: 'Searches for files in workspace matching a glob pattern',
  permissionLevel: 'SAFE',
  inputSchema: z.object({
    pattern: z.string().min(1, 'Search pattern is required'),
    cwd: z.string().optional(),
  }),
  parametersSchema: {
    type: 'object',
    properties: {
      pattern: {
        type: 'string',
        description: 'Glob search pattern (e.g. "**/*.ts", "*.json")',
      },
      cwd: {
        type: 'string',
        description: 'Optional subdirectory to search within',
      },
    },
    required: ['pattern'],
  },
  async execute(input, _context): Promise<ToolExecutionResult<{ files: string[] }>> {
    const searchRoot = input.cwd ? workspaceManager.resolveSafePath(input.cwd) : workspaceManager.root;
    const files = await fg(input.pattern, {
      cwd: searchRoot,
      ignore: ['**/node_modules/**', '**/.git/**', '**/dist/**'],
      onlyFiles: true,
    });

    return {
      success: true,
      toolName: 'searchFiles',
      summary: `Found ${files.length} matching files`,
      data: { files: files.slice(0, 100) },
    };
  },
};
