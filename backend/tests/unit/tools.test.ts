import { describe, it, expect } from 'vitest';
import { workspaceManager } from '../../src/features/tools/workspace.manager';
import { CommandPolicy } from '../../src/features/tools/command.policy';
import { toolRegistry } from '../../src/features/tools/tool.registry';

describe('Tools & Security Boundaries', () => {
  describe('WorkspaceManager', () => {
    it('resolves safe sub-paths within workspace root', () => {
      const safe = workspaceManager.resolveSafePath('src/index.ts');
      expect(safe.startsWith(workspaceManager.root)).toBe(true);
    });

    it('blocks path traversal escapes outside workspace', () => {
      expect(() => workspaceManager.resolveSafePath('../../escaped_file.txt')).toThrow(
        /Path traversal denied/
      );
    });

    it('blocks access to sensitive protected files (.env, .git, id_rsa)', () => {
      expect(() => workspaceManager.resolveSafePath('.env')).toThrow(/Access to protected file/);
      expect(() => workspaceManager.resolveSafePath('subfolder/.env.production')).toThrow(
        /Access to protected file/
      );
      expect(() => workspaceManager.resolveSafePath('id_rsa')).toThrow(/Access to protected file/);
    });
  });

  describe('CommandPolicy', () => {
    it('allows permitted commands on the allowlist', () => {
      expect(() => CommandPolicy.validateCommand('npm', ['test'])).not.toThrow();
      expect(() => CommandPolicy.validateCommand('git', ['status'])).not.toThrow();
    });

    it('blocks disallowed commands outside allowlist', () => {
      expect(() => CommandPolicy.validateCommand('curl', ['http://malicious.com'])).toThrow(
        /Command 'curl' is blocked/
      );
      expect(() => CommandPolicy.validateCommand('rm', ['-rf', '/'])).toThrow(
        /Command 'rm' is blocked/
      );
    });

    it('blocks arguments containing dangerous shell metacharacters', () => {
      expect(() => CommandPolicy.validateCommand('npm', ['test; rm -rf /'])).toThrow(
        /forbidden shell token/
      );
      expect(() => CommandPolicy.validateCommand('git', ['commit', '-m', 'test && whoami'])).toThrow(
        /forbidden shell token/
      );
    });
  });

  describe('ToolRegistry', () => {
    it('lists registered tools and retrieves by name', () => {
      const tools = toolRegistry.list();
      expect(tools.length).toBeGreaterThanOrEqual(10);

      const sysInfo = toolRegistry.get('systemInfo');
      expect(sysInfo).toBeDefined();
      expect(sysInfo?.permissionLevel).toBe('SAFE');
    });

    it('executes safe systemInfo tool successfully', async () => {
      const result = await toolRegistry.execute('systemInfo', {}, { userId: 'user_1' });
      expect(result.success).toBe(true);
      expect(result.toolName).toBe('systemInfo');
      expect(result.data).toHaveProperty('platform');
      expect(result.data).toHaveProperty('cpus');
    });

    it('rejects execution of non-existent tool', async () => {
      await expect(
        toolRegistry.execute('nonExistentTool', {}, { userId: 'user_1' })
      ).rejects.toThrow(/not found in registry/);
    });
  });
});
