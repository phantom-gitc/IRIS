import { Router } from 'express';
import { confirmationController } from './confirmation.controller';
import { requireAuth } from '../../middleware/auth.middleware';

export const confirmationRouter = Router();

confirmationRouter.use(requireAuth);

confirmationRouter.post('/:token/approve', (req, res, next) =>
  confirmationController.approve(req, res, next)
);

confirmationRouter.post('/:token/reject', (req, res, next) =>
  confirmationController.reject(req, res, next)
);
