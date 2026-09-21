import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword, hashToken } from '../../src/features/auth/auth.security';
import { generateAuthTokens, verifyAccessToken, verifyRefreshToken } from '../../src/features/auth/auth.tokens';
import { registerSchema } from '../../src/features/auth/auth.validation';

describe('Authentication & Security Unit Tests', () => {
  it('hashes and verifies password using Argon2id', async () => {
    const plain = 'StrongPass123!';
    const hash = await hashPassword(plain);

    expect(hash).toContain('$argon2id$');
    expect(await verifyPassword(hash, plain)).toBe(true);
    expect(await verifyPassword(hash, 'WrongPassword123!')).toBe(false);
  });

  it('generates consistent SHA-256 token hash', () => {
    const token = 'my-unique-refresh-token';
    const hash1 = hashToken(token);
    const hash2 = hashToken(token);

    expect(hash1).toBe(hash2);
    expect(hash1).toHaveLength(64); // sha256 hex length
  });

  it('signs and verifies Jose access and refresh tokens', async () => {
    const payload = {
      sub: 'user_123',
      sessionId: 'session_456',
      email: 'test@iris.ai',
      roles: ['user'],
    };

    const tokens = await generateAuthTokens(payload);
    expect(tokens.accessToken).toBeDefined();
    expect(tokens.refreshToken).toBeDefined();

    const accessPayload = await verifyAccessToken(tokens.accessToken);
    expect(accessPayload.sub).toBe(payload.sub);
    expect(accessPayload.sessionId).toBe(payload.sessionId);
    expect(accessPayload.tokenType).toBe('access');

    const refreshPayload = await verifyRefreshToken(tokens.refreshToken);
    expect(refreshPayload.sub).toBe(payload.sub);
    expect(refreshPayload.sessionId).toBe(payload.sessionId);
    expect(refreshPayload.tokenType).toBe('refresh');
  });

  it('rejects access token when verified with verifyRefreshToken', async () => {
    const tokens = await generateAuthTokens({
      sub: 'user_123',
      sessionId: 'session_456',
      email: 'test@iris.ai',
      roles: ['user'],
    });

    await expect(verifyRefreshToken(tokens.accessToken)).rejects.toThrow();
  });

  it('rejects refresh token when verified with verifyAccessToken', async () => {
    const tokens = await generateAuthTokens({
      sub: 'user_123',
      sessionId: 'session_456',
      email: 'test@iris.ai',
      roles: ['user'],
    });

    await expect(verifyAccessToken(tokens.refreshToken)).rejects.toThrow();
  });

  it('registerSchema rejects weak passwords and accepts strong passwords', () => {
    const weak1 = registerSchema.safeParse({
      email: 'test@example.com',
      password: 'weak',
      name: 'Test',
    });
    expect(weak1.success).toBe(false);

    const strong = registerSchema.safeParse({
      email: 'test@example.com',
      password: 'SecurePassword123!',
      name: 'Test User',
    });
    expect(strong.success).toBe(true);
  });
});
