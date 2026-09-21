import { Request, Response, NextFunction } from 'express';
import { confirmationService } from './confirmation.service';
import { ApiResponse } from '../../shared/types';
import { AuthenticationError } from '../../shared/errors';

export class ConfirmationController {
  async approve(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AuthenticationError('Authentication required');
      const conf = await confirmationService.approveConfirmation(req.user.id, req.params.token as string);

      const response: ApiResponse<typeof conf> = {
        success: true,
        data: conf,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  async reject(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AuthenticationError('Authentication required');
      const conf = await confirmationService.rejectConfirmation(req.user.id, req.params.token as string);

      const response: ApiResponse<typeof conf> = {
        success: true,
        data: conf,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }
}

export const confirmationController = new ConfirmationController();
