import { Request, Response, NextFunction } from 'express';
import { taskService } from './task.service';
import { ApiResponse } from '../../shared/types';
import { ITask } from './task.model';
import { AuthenticationError } from '../../shared/errors';

export class TaskController {
  async getTasks(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AuthenticationError('Authentication required');
      const limit = Number(req.query.limit) || 20;
      const tasks = await taskService.getTasks(req.user.id, limit);

      const response: ApiResponse<ITask[]> = {
        success: true,
        data: tasks,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  async getTask(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AuthenticationError('Authentication required');
      const task = await taskService.getTask(req.user.id, req.params.id as string);

      const response: ApiResponse<ITask> = {
        success: true,
        data: task,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  async cancelTask(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AuthenticationError('Authentication required');
      const task = await taskService.cancelTask(req.user.id, req.params.id as string);

      const response: ApiResponse<ITask> = {
        success: true,
        data: task,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }
}

export const taskController = new TaskController();
