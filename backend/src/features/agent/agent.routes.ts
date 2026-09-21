import { Router } from 'express';
import { agentController } from './agent.controller';
import { requireAuth } from '../../middleware/auth.middleware';
import { aiRateLimiter } from '../../middleware/rate-limit.middleware';

export const agentRouter = Router();

agentRouter.use(requireAuth);

agentRouter.post('/chat', aiRateLimiter, (req, res, next) =>
  agentController.chat(req, res, next)
);

agentRouter.post('/voice-command', aiRateLimiter, (req, res, next) =>
  agentController.voiceCommand(req, res, next)
);

agentRouter.post('/voice-stream', (req, res, next) =>
  agentController.voiceStream(req, res, next)
);

agentRouter.post('/interrupt', (req, res, next) =>
  agentController.interrupt(req, res, next)
);

