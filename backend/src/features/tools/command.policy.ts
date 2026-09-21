import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { PermissionDeniedError, ToolExecutionError } from '../../shared/errors';
import { workspaceManager } from './workspace.manager';

const execFileAsync = promisify(execFile);

export interface CommandExecutionResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  durationMs: number;
}

export class CommandPolicy {
  // Strict allowlist of allowed base executables
  private static readonly ALLOWED_COMMANDS = new Set(['npm', 'npx', 'git', 'node', 'code']);

  // Dangerous argument patterns to block command injection
  private static readonly FORBIDDEN_TOKENS = [';', '&&', '||', '|', '`', '$(', '<', '>', '\n', '\r'];

  static validateCommand(command: string, args: string[]): void {
    if (!this.ALLOWED_COMMANDS.has(command.toLowerCase())) {
      throw new PermissionDeniedError(
        `Command '${command}' is blocked. Allowed commands: ${Array.from(this.ALLOWED_COMMANDS).join(', ')}`
      );
    }

    for (const arg of args) {
      for (const token of this.FORBIDDEN_TOKENS) {
        if (arg.includes(token)) {
          throw new PermissionDeniedError(`Command argument contains forbidden shell token: '${token}'`);
        }
      }
    }
  }

  static async executeSafe(
    command: string,
    args: string[],
    options?: { cwd?: string; timeoutMs?: number; signal?: AbortSignal }
  ): Promise<CommandExecutionResult> {
    this.validateCommand(command, args);

    const cwd = options?.cwd ? workspaceManager.resolveSafePath(options.cwd) : workspaceManager.root;
    const timeout = options?.timeoutMs || 30000;
    const start = Date.now();

    // On Windows, resolve npm / npx through shell if needed
    const isWindows = process.platform === 'win32';
    const cmd = isWindows && (command === 'npm' || command === 'npx') ? `${command}.cmd` : command;

    try {
      const result = await execFileAsync(cmd, args, {
        cwd,
        timeout,
        signal: options?.signal,
        maxBuffer: 10 * 1024 * 1024,
      });

      const durationMs = Date.now() - start;
      const stdout = (result.stdout || '').substring(0, 4000);
      const stderr = (result.stderr || '').substring(0, 2000);

      return {
        stdout,
        stderr,
        exitCode: 0,
        durationMs,
      };
    } catch (error: unknown) {
      const err = error as { code?: number | string; stdout?: string; stderr?: string; message?: string };
      const durationMs = Date.now() - start;

      if (typeof err.code === 'number') {
        return {
          stdout: (err.stdout || '').substring(0, 4000),
          stderr: (err.stderr || err.message || '').substring(0, 2000),
          exitCode: err.code,
          durationMs,
        };
      }

      throw new ToolExecutionError(`Command execution error: ${err.message || String(error)}`);
    }
  }
}
