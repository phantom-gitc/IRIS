import { Request, Response, NextFunction } from 'express';
import { WebhookReceiver } from 'livekit-server-sdk';
import { env } from '../../config/env';
import { logger } from '../../config/logger';
import { ApiResponse } from '../../shared/types';
import { AuthenticationError } from '../../shared/errors';

export class LiveKitWebhookController {
  private receiver: WebhookReceiver;

  constructor() {
    this.receiver = new WebhookReceiver(env.LIVEKIT_API_KEY, env.LIVEKIT_API_SECRET);
  }

  async handleWebhook(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        throw new AuthenticationError('LiveKit webhook requires Authorization header');
      }

      // Convert body to string if parsed by JSON middleware
      const rawBody = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);

      const event = await this.receiver.receive(rawBody, authHeader);

      logger.info(
        {
          livekitEvent: event.event,
          room: event.room?.name,
          participant: event.participant?.identity,
        },
        'LiveKit webhook event processed'
      );

      const response: ApiResponse<{ processed: boolean; event: string }> = {
        success: true,
        data: {
          processed: true,
          event: event.event,
        },
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }
}

export const liveKitWebhookController = new LiveKitWebhookController();
