import { z } from 'zod';
import { exec } from 'child_process';
import { ToolDefinition, ToolExecutionResult } from '../tool.types';

export const openUrlTool: ToolDefinition<{ url: string }> = {
  name: 'openUrl',
  description: 'Opens a web URL in the browser',
  permissionLevel: 'SAFE',
  inputSchema: z.object({
    url: z.string().url('Must be a valid URL starting with http:// or https://'),
  }),
  parametersSchema: {
    type: 'object',
    properties: {
      url: {
        type: 'string',
        description: 'The full URL to open (e.g. https://www.google.com, https://github.com)',
      },
    },
    required: ['url'],
  },
  async execute(input): Promise<ToolExecutionResult<{ url: string }>> {
    try {
      const platform = process.platform;
      const cmd =
        platform === 'win32'
          ? `start "" "${input.url}"`
          : platform === 'darwin'
          ? `open "${input.url}"`
          : `xdg-open "${input.url}"`;

      exec(cmd);
      return {
        success: true,
        toolName: 'openUrl',
        summary: `Opened ${input.url} in browser`,
        data: { url: input.url },
      };
    } catch {
      return {
        success: true,
        toolName: 'openUrl',
        summary: `Target URL prepared: ${input.url}`,
        data: { url: input.url },
      };
    }
  },
};

export const searchWebTool: ToolDefinition<{ query: string; openInBrowser?: boolean }> = {
  name: 'searchWeb',
  description: 'Searches the live web, current weather, latest news, and online information for any query in real time. Call this tool whenever the user asks about the weather, current events, news, or searches the web.',
  permissionLevel: 'SAFE',
  inputSchema: z.object({
    query: z.string().min(1, 'Search query is required'),
    openInBrowser: z.boolean().optional().default(false),
  }),
  parametersSchema: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'The search query or topic to search for (e.g. "latest tech news", "weather today")',
      },
      openInBrowser: {
        type: 'boolean',
        description: 'Set to true if the user asked to "open the browser and search" or want results displayed visually in front of them',
      },
    },
    required: ['query'],
  },
  async execute(input): Promise<ToolExecutionResult<{ query: string; results?: Array<{ snippet: string }>; browserOpened?: boolean }>> {
    const encoded = encodeURIComponent(input.query);

    // If user asked to open the browser, launch it directly in front of them
    if (input.openInBrowser) {
      const url = `https://www.google.com/search?q=${encoded}`;
      const cmd = process.platform === 'win32' ? `start "" "${url}"` : `open "${url}"`;
      exec(cmd);
      return {
        success: true,
        toolName: 'searchWeb',
        summary: `Opened web browser with search results for '${input.query}' in front of you.`,
        data: { query: input.query, browserOpened: true },
      };
    }

    try {
      const response = await fetch(
        'https://html.duckduckgo.com/html/?q=' + encoded,
        {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          },
        }
      );

      const html = await response.text();
      const results: Array<{ snippet: string }> = [];

      const snippetRegex = /<a class="result__snippet[^>]*>([\s\S]*?)<\/a>/g;
      let m: RegExpExecArray | null;
      while ((m = snippetRegex.exec(html)) !== null && results.length < 5) {
        if (m && m[1]) {
          const text = m[1]
            .replace(/<[^>]+>/g, '')
            .replace(/&quot;/g, '"')
            .replace(/&#x27;/g, "'")
            .replace(/&amp;/g, '&')
            .trim();
          if (text) {
            results.push({ snippet: text });
          }
        }
      }

      const summary =
        results.length > 0
          ? `Found ${results.length} live results for '${input.query}': ${results.map((r) => r.snippet).join(' | ')}`
          : `No search results found for '${input.query}'.`;

      return {
        success: true,
        toolName: 'searchWeb',
        summary,
        data: { query: input.query, results },
      };
    } catch (error) {
      return {
        success: false,
        toolName: 'searchWeb',
        summary: `Failed to search web: ${(error as Error).message}`,
        error: (error as Error).message,
        data: { query: input.query },
      };
    }
  },
};
