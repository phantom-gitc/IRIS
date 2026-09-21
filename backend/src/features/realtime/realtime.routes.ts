import { Router } from 'express';
import { realtimeController } from './realtime.controller';
import { liveKitWebhookController } from './livekit-webhook.controller';
import { requireAuth } from '../../middleware/auth.middleware';
import { aiRateLimiter } from '../../middleware/rate-limit.middleware';

export const realtimeRouter = Router();

// Public server-to-server webhook verified by LiveKit HMAC signature
realtimeRouter.post('/webhook', (req, res, next) =>
  liveKitWebhookController.handleWebhook(req, res, next)
);

// Authenticated user realtime endpoints
realtimeRouter.post('/session', requireAuth, aiRateLimiter, (req, res, next) =>
  realtimeController.createSession(req, res, next)
);

realtimeRouter.post('/tts', requireAuth, aiRateLimiter, (req, res, next) =>
  realtimeController.synthesize(req, res, next)
);

realtimeRouter.post('/stt', requireAuth, aiRateLimiter, (req, res, next) =>
  realtimeController.transcribe(req, res, next)
);


