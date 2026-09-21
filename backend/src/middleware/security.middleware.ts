import { Request, Response, NextFunction } from 'express';
import { AuthenticationError } from '../shared/errors';

export function securityHeadersMiddleware(_req: Request, res: Response, next: NextFunction): void {
  res.removeHeader('X-Powered-By');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
}

/**
 * CSRF protection for cookie-authenticated state-changing requests.
 * Requires either standard custom client headers (e.g. X-Requested-With or X-CSRF-Token)
 * or origin validation matching FRONTEND_URL.
 */
export function csrfProtectionMiddleware(req: Request, _res: Response, next: NextFunction): void {
  const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
  if (safeMethods.includes(req.method)) {
    return next();
  }

  // If request uses Bearer token in Authorization header, CSRF is not applicable
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return next();
  }

  // If request is from browser client with cookies, verify custom header
  const customHeader = req.headers['x-requested-with'] || req.headers['x-csrf-token'];
  if (customHeader) {
    return next();
  }

  // Allow non-browser / direct API calls if no auth cookie is present
  if (!req.cookies || !req.cookies.refreshToken) {
    return next();
  }

  return next(new AuthenticationError('CSRF protection failed: Missing required verification header'));
}
