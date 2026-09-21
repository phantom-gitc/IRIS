import { Router } from 'express';
import { taskController } from './task.controller';
import { requireAuth } from '../../middleware/auth.middleware';

export const taskRouter = Router();

taskRouter.use(requireAuth);

taskRouter.get('/', (req, res, next) => taskController.getTasks(req, res, next));
taskRouter.get('/:id', (req, res, next) => taskController.getTask(req, res, next));
taskRouter.post('/:id/cancel', (req, res, next) => taskController.cancelTask(req, res, next));
