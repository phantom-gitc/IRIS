import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import pinoHttp from 'pino-http';
import { corsOptions } from '../config/security';
import { logger } from '../config/logger';
import { requestIdMiddleware } from '../middleware/request-id.middleware';
import { securityHeadersMiddleware, csrfProtectionMiddleware } from '../middleware/security.middleware';
import { generalRateLimiter } from '../middleware/rate-limit.middleware';

export function setupMiddleware(app: Express): void {
  // Request ID first so it is available to logger and all downstream middleware
  app.use(requestIdMiddleware);

  // Security headers & helmet
  app.use(helmet());
  app.use(securityHeadersMiddleware);

  // Cross-Origin Resource Sharing
  app.use(cors(corsOptions));

  // Cookie parsing
  app.use(cookieParser());

  // Body parsers with safe limits for voice audio base64 payloads (25mb)
  app.use(express.json({ limit: '25mb' }));
  app.use(express.urlencoded({ extended: true, limit: '25mb' }));

  // CSRF protection for cookie sessions
  app.use(csrfProtectionMiddleware);

  // General rate limiting
  app.use(generalRateLimiter);

  // Structured request logging via Pino (silent in test)
  if (process.env.NODE_ENV !== 'test') {
    app.use(
      pinoHttp({
        logger,
        genReqId: (req) => (req as any).id,
        customLogLevel: (_req, res, err) => {
          if (res.statusCode >= 500 || err) return 'error';
          if (res.statusCode >= 400) return 'warn';
          return 'info';
        },
      })
    );
  }
}
