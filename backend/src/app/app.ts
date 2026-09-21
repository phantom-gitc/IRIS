import express, { Express, Request, Response } from 'express';
import { setupMiddleware } from './middleware';
import { v1Router } from './routes';
import { notFoundMiddleware, errorMiddleware } from '../middleware/error.middleware';
import { checkDatabaseHealth } from '../config/database';
import { ApiResponse, HealthStatus } from '../shared/types';
import { env } from '../config/env';

export function createApp(): Express {
  const app: Express = express();

  // Wire all core security, logging, parsing, and limiters
  setupMiddleware(app);

  // Liveness probe (process is running)
  app.get('/health', (_req: Request, res: Response) => {
    const response: ApiResponse<HealthStatus> = {
      success: true,
      data: {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: env.NODE_ENV,
        version: '1.0.0',
      },
    };
    res.status(200).json(response);
  });

  // Readiness probe (checks critical system dependencies)
  app.get('/health/ready', async (_req: Request, res: Response) => {
    const mongoHealth = await checkDatabaseHealth();
    const dependencies = {
      mongodb: {
        status: mongoHealth.status,
        readyState: mongoHealth.readyState,
        latencyMs: mongoHealth.latencyMs,
      },
      qdrant: { status: 'configured' },
    };

    const isReady = mongoHealth.status === 'connected';

    const response: ApiResponse<{
      ready: boolean;
      dependencies: typeof dependencies;
    }> = {
      success: true,
      data: {
        ready: isReady,
        dependencies,
      },
    };

    res.status(isReady ? 200 : 503).json(response);
  });

  // Mount API v1
  app.use('/api/v1', v1Router);

  // 404 handler for unmatched routes
  app.use(notFoundMiddleware);

  // Centralized error handler
  app.use(errorMiddleware);

  return app;
}
