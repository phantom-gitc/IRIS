import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../shared/errors';
import { ApiResponse } from '../shared/types';
import { logger } from '../config/logger';
import { env } from '../config/env';

export function errorMiddleware(
  err: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void {
  const isProduction = env.NODE_ENV === 'production';
  let statusCode = 500;
  let errorCode = 'INTERNAL_SERVER_ERROR';
  let message = 'An unexpected internal server error occurred.';
  let details: unknown = undefined;

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    errorCode = err.code;
    message = err.message;
    details = err.details;
  } else if (err instanceof ZodError) {
    statusCode = 400;
    errorCode = 'VALIDATION_ERROR';
    message = 'Request validation failed';
    details = err.issues.map((i) => ({
      field: i.path.join('.'),
      message: i.message,
    }));
  } else if (!isProduction) {
    message = err.message || message;
    details = err.stack;
  }

  // Log error with request ID and contextual metadata
  if (statusCode >= 500) {
    logger.error(
      {
        requestId: req.id,
        method: req.method,
        url: req.originalUrl,
        statusCode,
        errorCode,
        errorName: err.name,
        errorMessage: err.message,
        ...(isProduction ? {} : { stack: err.stack }),
      },
      'Server error caught by error middleware'
    );
  } else {
    logger.warn(
      {
        requestId: req.id,
        method: req.method,
        url: req.originalUrl,
        statusCode,
        errorCode,
        errorMessage: err.message,
      },
      'Client error caught by error middleware'
    );
  }

  const response: ApiResponse<never> = {
    success: false,
    error: {
      code: errorCode,
      message,
      ...(details ? { details } : {}),
    },
  };

  res.status(statusCode).json(response);
}

export function notFoundMiddleware(req: Request, res: Response): void {
  const response: ApiResponse<never> = {
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Endpoint ${req.method} ${req.originalUrl} not found`,
    },
  };
  res.status(404).json(response);
}
