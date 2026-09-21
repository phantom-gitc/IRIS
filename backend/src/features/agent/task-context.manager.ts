export interface ActiveContext {
  activeProject?: string;
  activeFile?: string;
  activeApp?: string;
  activeTaskId?: string;
  lastToolName?: string;
  lastToolResultSummary?: string;
  lastIntent?: string;
  updatedAt: number;
}

export class TaskContextManager {
  private static contexts = new Map<string, ActiveContext>();

  /**
   * Retrieves current conversation context.
   */
  static getContext(conversationId: string): ActiveContext {
    let ctx = this.contexts.get(conversationId);
    if (!ctx) {
      ctx = { updatedAt: Date.now() };
      this.contexts.set(conversationId, ctx);
    }
    return ctx;
  }

  /**
   * Updates fields in the active conversation context.
   */
  static updateContext(
    conversationId: string,
    partial: Partial<ActiveContext>,
  ): ActiveContext {
    const existing = this.getContext(conversationId);
    const updated = {
      ...existing,
      ...partial,
      updatedAt: Date.now(),
    };
    this.contexts.set(conversationId, updated);
    return updated;
  }

  /**
   * Resolves references such as "the project", "the file", "the dashboard", or "it".
   */
  static resolveContextReferences(
    conversationId: string,
    prompt: string,
  ): string {
    const ctx = this.getContext(conversationId);
    let resolved = prompt;

    // Detect project mention like "Open Avenya" or "Work on Avenya" to store active project
    const projectMatch = prompt.match(
      /\b(?:open|work\s+on|in|project)\s+([A-Za-z0-9_-]+)\b/i,
    );
    if (projectMatch && projectMatch[1]) {
      this.updateContext(conversationId, { activeProject: projectMatch[1] });
    }

    // Detect file mention like "index.ts" or "App.tsx"
    const fileMatch = prompt.match(/\b([a-zA-Z0-9_\-./]+\.[a-z]{1,4})\b/);
    if (fileMatch && fileMatch[1]) {
      this.updateContext(conversationId, { activeFile: fileMatch[1] });
    }

    // If active project is known and prompt refers to "the dashboard" or "the frontend" or "the project"
    if (ctx.activeProject) {
      if (/\bthe\s+dashboard\b/i.test(prompt)) {
        resolved = resolved.replace(
          /\bthe\s+dashboard\b/gi,
          `${ctx.activeProject}'s dashboard`,
        );
      } else if (/\bthe\s+frontend\b/i.test(prompt)) {
        resolved = resolved.replace(
          /\bthe\s+frontend\b/gi,
          `${ctx.activeProject}'s frontend`,
        );
      } else if (/\bthe\s+project\b/i.test(prompt)) {
        resolved = resolved.replace(
          /\bthe\s+project\b/gi,
          `the project ${ctx.activeProject}`,
        );
      }
    }

    // If active file is known and prompt refers to "that file" or "this file"
    if (ctx.activeFile) {
      if (/\b(?:that|this)\s+file\b/i.test(prompt)) {
        resolved = resolved.replace(
          /\b(?:that|this)\s+file\b/gi,
          `the file '${ctx.activeFile}'`,
        );
      }
    }

    return resolved;
  }

  /**
   * Generates a context summary string suitable for inclusion in the LLM system prompt.
   */
  static getContextPromptSnippet(conversationId: string): string | null {
    const ctx = this.getContext(conversationId);
    const snippets: string[] = [];

    if (ctx.activeProject)
      snippets.push(`Active Project: ${ctx.activeProject}`);
    if (ctx.activeFile) snippets.push(`Active File: ${ctx.activeFile}`);
    if (ctx.activeApp) snippets.push(`Active Application: ${ctx.activeApp}`);
    if (ctx.lastToolName)
      snippets.push(
        `Recent Tool: ${ctx.lastToolName} (${ctx.lastToolResultSummary || "Executed"})`,
      );
    if (ctx.activeTaskId) snippets.push(`Active Task ID: ${ctx.activeTaskId}`);

    if (snippets.length === 0) return null;
    return `Current Context Awareness:\n${snippets.join("\n")}`;
  }

  static clearContext(conversationId: string): void {
    this.contexts.delete(conversationId);
  }
}
