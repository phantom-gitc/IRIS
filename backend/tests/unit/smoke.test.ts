import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app/app';

describe('Phase 1: Backend Foundation Smoke Test', () => {
  it('creates Express app instance successfully', () => {
    const app = createApp();
    expect(app).toBeDefined();
  });

  it('GET /health returns healthy status and standard ApiResponse structure', async () => {
    const app = createApp();
    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('success', true);
    expect(response.body).toHaveProperty('data');
    expect(response.body.data).toHaveProperty('status', 'healthy');
    expect(response.body.data).toHaveProperty('environment');
    expect(response.body.data).toHaveProperty('uptime');
  });
});
