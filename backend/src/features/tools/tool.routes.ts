import { Router } from 'express';
import { toolController } from './tool.controller';
import { requireAuth } from '../../middleware/auth.middleware';

export const toolRouter = Router();

toolRouter.use(requireAuth);

toolRouter.get('/', (req, res, next) => toolController.list(req, res, next));
