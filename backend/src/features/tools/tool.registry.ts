import { ToolDefinition, ToolExecutionContext, ToolExecutionResult } from './tool.types';
import { NotFoundError, ValidationError } from '../../shared/errors';
import { createFolderTool, createFileTool, readFileTool, updateFileTool, searchFilesTool } from './filesystem/filesystem.tools';
import { npmInstallTool, npmScriptTool, gitStatusTool, gitDiffTool } from './developer/developer.tools';
import { openUrlTool, searchWebTool } from './browser/browser.tools';
import { systemInfoTool, notificationTool } from './system/system.tools';
import {
  openAppTool,
  playMusicTool,
  openGitHubTool,
  initWorkspaceSetupTool,
  reviewCodeTool,
} from './desktop/desktop.tools';

export class ToolRegistry {
  private tools = new Map<string, ToolDefinition>();

  constructor() {
    this.registerDefaults();
  }

  private registerDefaults(): void {
    const defaultTools: ToolDefinition[] = [
      createFolderTool,
      createFileTool,
      readFileTool,
      updateFileTool,
      searchFilesTool,
      npmInstallTool,
      npmScriptTool,
      gitStatusTool,
      gitDiffTool,
      openUrlTool,
      searchWebTool,
      systemInfoTool,
      notificationTool,
      openAppTool,
      playMusicTool,
      openGitHubTool,
      initWorkspaceSetupTool,
      reviewCodeTool,
    ];

    for (const tool of defaultTools) {
      this.register(tool);
    }
  }

  register(tool: ToolDefinition): void {
    this.tools.set(tool.name, tool);
  }

  get(name: string): ToolDefinition | undefined {
    return this.tools.get(name);
  }

  list(): ToolDefinition[] {
    return Array.from(this.tools.values());
  }

  async execute(
    name: string,
    rawInput: unknown,
    context: ToolExecutionContext
  ): Promise<ToolExecutionResult> {
    const tool = this.get(name);
    if (!tool) {
      throw new NotFoundError(`Tool '${name}' not found in registry`);
    }

    // Zod validation
    const parsed = tool.inputSchema.safeParse(rawInput);
    if (!parsed.success) {
      throw new ValidationError(
        `Invalid input for tool '${name}': ${parsed.error.issues.map((i) => i.message).join(', ')}`,
        parsed.error.issues
      );
    }

    return tool.execute(parsed.data, context);
  }

  getLLMTools(): Array<{
    type: 'function';
    function: { name: string; description: string; parameters: Record<string, unknown> };
  }> {
    return this.list().map((tool) => ({
      type: 'function',
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.parametersSchema || {
          type: 'object',
          properties: {},
        },
      },
    }));
  }
}

export const toolRegistry = new ToolRegistry();
