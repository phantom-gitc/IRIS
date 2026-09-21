import express from 'express';
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app/app';
import { requestIdMiddleware } from '../../src/middleware/request-id.middleware';
import { errorMiddleware } from '../../src/middleware/error.middleware';
import { ValidationError, AuthenticationError } from '../../src/shared/errors';

describe('Middleware & Error Handling Integration', () => {
  it('assigns X-Request-Id header to every response', async () => {
    const app = createApp();
    const response = await request(app).get('/health');

    expect(response.headers['x-request-id']).toBeDefined();
    expect(typeof response.headers['x-request-id']).toBe('string');
  });

  it('preserves client-provided X-Request-Id header', async () => {
    const app = createApp();
    const customId = 'test-client-req-999';
    const response = await request(app).get('/health').set('X-Request-Id', customId);

    expect(response.headers['x-request-id']).toBe(customId);
  });

  it('returns 404 with structured ApiResponse for unknown routes', async () => {
    const app = createApp();
    const response = await request(app).get('/api/v1/non-existent-route');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Endpoint GET /api/v1/non-existent-route not found',
      },
    });
  });

  it('formats custom AppError correctly with code and status', async () => {
    const app = createApp();
    // Use an existing route that throws or mount on an express app with errorMiddleware
    const testApp = express();
    testApp.use(requestIdMiddleware);
    testApp.get('/test-error', () => {
      throw new ValidationError('Validation failed for field', { field: 'name' });
    });
    testApp.use(errorMiddleware);

    const response = await request(testApp).get('/test-error');
    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
    expect(response.body.error.details).toEqual({ field: 'name' });
  });

  it('GET /health/ready returns readiness check structure', async () => {
    const app = createApp();
    const response = await request(app).get('/health/ready');

    expect([200, 503]).toContain(response.status);
    expect(response.body.success).toBe(true);
    expect(typeof response.body.data.ready).toBe('boolean');
    expect(response.body.data.dependencies).toBeDefined();
    expect(response.body.data.dependencies.mongodb).toBeDefined();
  });

  it('GET /api/v1 returns API root metadata', async () => {
    const app = createApp();
    const response = await request(app).get('/api/v1');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.version).toBe('v1');
  });
});
