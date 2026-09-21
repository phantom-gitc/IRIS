import { Router } from 'express';
import { auditController } from './audit.controller';
import { requireAuth } from '../../middleware/auth.middleware';

export const auditRouter = Router();

auditRouter.use(requireAuth);

auditRouter.get('/', (req, res, next) => auditController.listLogs(req, res, next));
