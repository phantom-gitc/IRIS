import * as jose from 'jose';
import { nanoid } from 'nanoid';
import { env } from '../../config/env';
import { AuthenticationError } from '../../shared/errors';
import { TokenPayload, AuthTokens } from './auth.types';

const ACCESS_SECRET = new TextEncoder().encode(env.JWT_ACCESS_SECRET);
const REFRESH_SECRET = new TextEncoder().encode(env.JWT_REFRESH_SECRET);

export async function generateAuthTokens(payload: Omit<TokenPayload, 'tokenType' | 'jti'>): Promise<AuthTokens> {
  const jti = nanoid(24);

  // Convert to plain primitives & plain array so jose's internal structuredClone doesn't fail on Mongoose arrays/prototypes
  const plainRoles = Array.isArray(payload.roles)
    ? Array.from(payload.roles).map(String)
    : [];

  const baseClaims = {
    sub: String(payload.sub),
    sessionId: String(payload.sessionId),
    email: String(payload.email),
    roles: plainRoles,
  };

  const accessToken = await new jose.SignJWT({
    ...baseClaims,
    tokenType: 'access',
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(env.JWT_ACCESS_EXPIRES_IN)
    .sign(ACCESS_SECRET);

  const refreshToken = await new jose.SignJWT({
    ...baseClaims,
    tokenType: 'refresh',
    jti,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(env.JWT_REFRESH_EXPIRES_IN)
    .sign(REFRESH_SECRET);

  return {
    accessToken,
    refreshToken,
    expiresIn: 15 * 60, // 15 minutes in seconds
  };
}

export async function verifyAccessToken(token: string): Promise<TokenPayload> {
  try {
    const { payload } = await jose.jwtVerify(token, ACCESS_SECRET);
    if (payload.tokenType !== 'access') {
      throw new AuthenticationError('Invalid token type');
    }
    return payload as unknown as TokenPayload;
  } catch (error) {
    if (error instanceof AuthenticationError) throw error;
    throw new AuthenticationError('Invalid or expired access token');
  }
}

export async function verifyRefreshToken(token: string): Promise<TokenPayload> {
  try {
    const { payload } = await jose.jwtVerify(token, REFRESH_SECRET);
    if (payload.tokenType !== 'refresh') {
      throw new AuthenticationError('Invalid token type');
    }
    return payload as unknown as TokenPayload;
  } catch (error) {
    if (error instanceof AuthenticationError) throw error;
    throw new AuthenticationError('Invalid or expired refresh token');
  }
}
