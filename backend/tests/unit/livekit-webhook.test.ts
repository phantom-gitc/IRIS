import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app/app';

describe('LiveKit Webhook Endpoint', () => {
  const app = createApp();

  it('rejects webhook requests without Authorization header', async () => {
    const res = await request(app)
      .post('/api/v1/realtime/webhook')
      .send({ event: 'participant_joined' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('rejects webhook requests with invalid signature', async () => {
    const res = await request(app)
      .post('/api/v1/realtime/webhook')
      .set('Authorization', 'Bearer invalid_signature_token')
      .send({ event: 'participant_joined' });

    expect(res.status).toBe(500); // LiveKit SDK signature verification failure throws error caught by error middleware
    expect(res.body.success).toBe(false);
  });
});
