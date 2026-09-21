import path from 'path';
import fs from 'fs/promises';
import { PermissionDeniedError, ValidationError } from '../../shared/errors';

export class WorkspaceManager {
  private workspaceRoot: string;

  private static readonly BLOCKED_FILES = [
    /^\.env/i,
    /^\.git/i,
    /^id_rsa/i,
    /\.pem$/i,
    /\.key$/i,
    /credentials/i,
  ];

  constructor(customRoot?: string) {
    if (customRoot) {
      this.workspaceRoot = path.resolve(customRoot);
    } else {
      const cwd = process.cwd();
      const parent = path.resolve(cwd, '..');
      const isBackendSubdir = path.basename(cwd).toLowerCase() === 'backend';
      this.workspaceRoot = isBackendSubdir ? parent : path.resolve(cwd);
    }
  }

  get root(): string {
    return this.workspaceRoot;
  }

  resolveSafePath(targetPath: string): string {
    if (!targetPath || typeof targetPath !== 'string') {
      throw new ValidationError('File path is required');
    }

    // Resolve absolute path
    const resolved = path.isAbsolute(targetPath)
      ? path.normalize(targetPath)
      : path.normalize(path.join(this.workspaceRoot, targetPath));

    // Path traversal defense: ensure resolved path starts with workspace root
    if (!resolved.startsWith(this.workspaceRoot)) {
      throw new PermissionDeniedError(
        `Path traversal denied: Access outside approved workspace (${this.workspaceRoot}) is blocked`
      );
    }

    // Check against sensitive blocked files
    const basename = path.basename(resolved);
    for (const pattern of WorkspaceManager.BLOCKED_FILES) {
      if (pattern.test(basename)) {
        throw new PermissionDeniedError(`Access to protected file '${basename}' is prohibited by security policy`);
      }
    }

    return resolved;
  }

  async ensureDirectoryExists(dirPath: string): Promise<void> {
    const safePath = this.resolveSafePath(dirPath);
    await fs.mkdir(safePath, { recursive: true });
  }
}

export const workspaceManager = new WorkspaceManager();
