import { Request, Response, NextFunction } from 'express';
import { memoryService } from './memory.service';
import { createMemorySchema, updateMemorySchema, queryMemorySchema } from './memory.validation';
import { ApiResponse } from '../../shared/types';
import { IMemory } from './memory.model';
import { AuthenticationError } from '../../shared/errors';

export class MemoryController {
  async createMemory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AuthenticationError('Authentication required');
      const input = createMemorySchema.parse(req.body);
      const memory = await memoryService.createMemory(req.user.id, input);

      const response: ApiResponse<IMemory> = {
        success: true,
        data: memory,
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }

  async getMemories(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AuthenticationError('Authentication required');
      const query = queryMemorySchema.parse(req.query);
      const memories = await memoryService.getMemories(req.user.id, query);

      const response: ApiResponse<IMemory[]> = {
        success: true,
        data: memories,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  async updateMemory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AuthenticationError('Authentication required');
      const input = updateMemorySchema.parse(req.body);
      const memory = await memoryService.updateMemory(req.user.id, req.params.id as string, input);

      const response: ApiResponse<IMemory> = {
        success: true,
        data: memory,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  async deleteMemory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AuthenticationError('Authentication required');
      await memoryService.deleteMemory(req.user.id, req.params.id as string);

      const response: ApiResponse<{ message: string }> = {
        success: true,
        data: { message: 'Memory deleted successfully' },
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }
}

export const memoryController = new MemoryController();
