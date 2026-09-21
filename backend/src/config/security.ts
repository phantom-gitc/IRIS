import { CookieOptions } from 'express';
import argon2 from 'argon2';
import { env } from './env';

export const isProduction = env.NODE_ENV === 'production';

export const cookieConfig = {
  refreshToken: {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? ('none' as const) : ('lax' as const),
    path: '/api/v1/auth',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  } satisfies CookieOptions,
  csrfToken: {
    httpOnly: false, // Accessible to client to read and pass in custom headers
    secure: isProduction,
    sameSite: isProduction ? ('none' as const) : ('lax' as const),
    path: '/',
    maxAge: 24 * 60 * 60 * 1000,
  } satisfies CookieOptions,
};

export const corsOptions = {
  origin: env.FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id', 'X-CSRF-Token'],
  exposedHeaders: ['X-Request-Id'],
};

// OWASP Recommended Argon2id parameters
export const argon2Options: argon2.HashOptions = {
  type: argon2.argon2id,
  memoryCost: 19456, // 19 MiB
  timeCost: 2,
  parallelism: 1,
};
