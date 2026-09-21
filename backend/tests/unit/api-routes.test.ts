import { describe, it, expect, vi, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app/app';
import { generateAuthTokens } from '../../src/features/auth/auth.tokens';

describe('API Routes Integration & Introspection', () => {
  const app = createApp();
  let authToken: string;

  beforeAll(async () => {
    const tokens = await generateAuthTokens({
      sub: '507f1f77bcf86cd799439011',
      sessionId: 'sess_123',
      email: 'test@iris.dev',
      roles: ['user'],
    });
    authToken = tokens.accessToken;
  });

  it('GET /health returns healthy system status', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('healthy');
  });

  it('GET /api/v1 returns API metadata', async () => {
    const res = await request(app).get('/api/v1');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.version).toBe('v1');
  });

  it('GET /api/v1/tools rejects unauthenticated requests', async () => {
    const res = await request(app).get('/api/v1/tools');
    expect(res.status).toBe(401);
  });

  it('GET /api/v1/tools returns list of available tools and security metadata', async () => {
    const res = await request(app)
      .get('/api/v1/tools')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
    
    // Check required fields on tools
    const firstTool = res.body.data[0];
    expect(firstTool).toHaveProperty('name');
    expect(firstTool).toHaveProperty('description');
    expect(firstTool).toHaveProperty('permissionLevel');
  });

  it('GET /api/v1/audit rejects unauthenticated requests', async () => {
    const res = await request(app).get('/api/v1/audit');
    expect(res.status).toBe(401);
  });

  it('GET /api/v1/auth/me rejects unauthenticated requests', async () => {
    const res = await request(app).get('/api/v1/auth/me');
    expect(res.status).toBe(401);
  });
});
