import { Request, Response, NextFunction } from 'express';
import { toolRegistry } from './tool.registry';
import { ApiResponse } from '../../shared/types';

export class ToolController {
  list(_req: Request, res: Response, next: NextFunction): void {
    try {
      const tools = toolRegistry.list().map((t) => ({
        name: t.name,
        description: t.description,
        permissionLevel: t.permissionLevel,
      }));

      const response: ApiResponse<typeof tools> = {
        success: true,
        data: tools,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }
}

export const toolController = new ToolController();
