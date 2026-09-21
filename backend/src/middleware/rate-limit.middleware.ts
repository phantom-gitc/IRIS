import rateLimit from 'express-rate-limit';
import { ApiResponse } from '../shared/types';
import { env } from '../config/env';

const isTest = env.NODE_ENV === 'test';

function createLimiter(windowMs: number, max: number, message: string) {
  return rateLimit({
    windowMs,
    max: isTest ? 10000 : max, // High limit during automated tests
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req, res) => {
      const response: ApiResponse<never> = {
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message,
        },
      };
      res.status(429).json(response);
    },
  });
}

// 100 requests per 15 minutes for general API endpoints
export const generalRateLimiter = createLimiter(
  15 * 60 * 1000,
  100,
  'Too many requests from this IP, please try again after 15 minutes'
);

// 10 requests per 15 minutes for sensitive authentication endpoints
export const authRateLimiter = createLimiter(
  15 * 60 * 1000,
  10,
  'Too many authentication attempts, please try again after 15 minutes'
);

// 30 requests per minute for AI & agent interactions
export const aiRateLimiter = createLimiter(
  60 * 1000,
  30,
  'Too many AI requests, please slow down'
);
