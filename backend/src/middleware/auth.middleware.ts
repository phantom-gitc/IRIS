import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../features/auth/auth.tokens';
import { AuthenticationError, AuthorizationError } from '../shared/errors';

export async function requireAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AuthenticationError('Authorization header missing or invalid format'));
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return next(new AuthenticationError('Bearer token is missing'));
  }

  try {
    const payload = await verifyAccessToken(token);
    req.user = {
      id: payload.sub,
      sessionId: payload.sessionId,
      email: payload.email,
      roles: payload.roles,
    };
    next();
  } catch (error) {
    next(error);
  }
}

export function requireRole(role: string) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AuthenticationError('Authentication required'));
    }
    if (!req.user.roles.includes(role)) {
      return next(new AuthorizationError(`Access denied: Requires '${role}' role`));
    }
    next();
  };
}
