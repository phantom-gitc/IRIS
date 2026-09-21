import { Router } from 'express';
import { memoryController } from './memory.controller';
import { requireAuth } from '../../middleware/auth.middleware';

export const memoryRouter = Router();

// All memory operations are strictly user-authenticated
memoryRouter.use(requireAuth);

memoryRouter.get('/', (req, res, next) => memoryController.getMemories(req, res, next));
memoryRouter.post('/', (req, res, next) => memoryController.createMemory(req, res, next));
memoryRouter.patch('/:id', (req, res, next) => memoryController.updateMemory(req, res, next));
memoryRouter.delete('/:id', (req, res, next) => memoryController.deleteMemory(req, res, next));
