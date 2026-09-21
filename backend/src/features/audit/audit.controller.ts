import { Request, Response, NextFunction } from 'express';
import { auditService } from './audit.service';
import { ApiResponse } from '../../shared/types';

export class AuditController {
  async listLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
      const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;

      const result = await auditService.listLogs(userId, { limit, offset });

      const response: ApiResponse<typeof result> = {
        success: true,
        data: result,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }
}

export const auditController = new AuditController();
