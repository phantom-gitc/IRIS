import { Request, Response, NextFunction } from 'express';
import { conversationService } from './conversation.service';
import { ApiResponse } from '../../shared/types';
import { IConversation } from './conversation.model';
import { IMessage } from './message.model';
import { AuthenticationError } from '../../shared/errors';

export class ConversationController {
  async getConversations(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AuthenticationError('Authentication required');
      const conversations = await conversationService.getUserConversations(req.user.id);

      const response: ApiResponse<IConversation[]> = {
        success: true,
        data: conversations,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  async getConversation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AuthenticationError('Authentication required');
      const result = await conversationService.getConversationWithMessages(
        req.user.id,
        req.params.id as string
      );

      const response: ApiResponse<{ conversation: IConversation; messages: IMessage[] }> = {
        success: true,
        data: result,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  async createConversation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AuthenticationError('Authentication required');
      const { title } = req.body || {};
      const conversation = await conversationService.createConversation(req.user.id, title);

      const response: ApiResponse<IConversation> = {
        success: true,
        data: conversation,
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }

  async deleteConversation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AuthenticationError('Authentication required');
      await conversationService.deleteConversation(req.user.id, req.params.id as string);

      const response: ApiResponse<{ message: string }> = {
        success: true,
        data: { message: 'Conversation deleted successfully' },
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }
}

export const conversationController = new ConversationController();
