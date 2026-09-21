import { Router } from 'express';
import { conversationController } from './conversation.controller';
import { requireAuth } from '../../middleware/auth.middleware';

export const conversationRouter = Router();

conversationRouter.use(requireAuth);

conversationRouter.get('/', (req, res, next) => conversationController.getConversations(req, res, next));
conversationRouter.post('/', (req, res, next) => conversationController.createConversation(req, res, next));
conversationRouter.get('/:id', (req, res, next) => conversationController.getConversation(req, res, next));
conversationRouter.delete('/:id', (req, res, next) => conversationController.deleteConversation(req, res, next));
