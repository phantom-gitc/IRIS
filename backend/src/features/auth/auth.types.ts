export interface TokenPayload {
  sub: string; // userId
  sessionId: string;
  email: string;
  roles: string[];
  tokenType: 'access' | 'refresh';
  jti?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // in seconds
}

export interface AuthenticatedUser {
  id: string;
  sessionId: string;
  email: string;
  roles: string[];
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}
