import { Types } from 'mongoose';
import { Session, ISession } from './session.model';
import { hashToken } from '../auth/auth.security';
import { AuthenticationError } from '../../shared/errors';
import { logger } from '../../config/logger';

export class SessionService {
  async createSession(
    userId: Types.ObjectId | string,
    refreshToken: string,
    metadata?: { deviceId?: string; userAgent?: string; ipAddress?: string }
  ): Promise<ISession> {
    const refreshTokenHash = hashToken(refreshToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const session = await Session.create({
      userId,
      refreshTokenHash,
      deviceId: metadata?.deviceId || 'default',
      userAgent: metadata?.userAgent || '',
      ipAddress: metadata?.ipAddress || '',
      expiresAt,
      isRevoked: false,
    });

    return session;
  }

  async validateAndRotateSession(
    sessionId: string,
    presentedToken: string,
    newRefreshToken: string
  ): Promise<ISession> {
    const session = await Session.findById(sessionId).select('+refreshTokenHash');

    if (!session) {
      throw new AuthenticationError('Session not found or expired');
    }

    if (session.isRevoked) {
      // Possible token reuse attack! Invalidate all sessions for user.
      await this.revokeAllUserSessions(session.userId.toString());
      logger.warn({ userId: session.userId, sessionId }, 'Detected refresh token reuse on revoked session! Revoked all sessions.');
      throw new AuthenticationError('Session has been revoked');
    }

    const presentedTokenHash = hashToken(presentedToken);
    if (session.refreshTokenHash !== presentedTokenHash) {
      // Token mismatch indicates old or forged token! Revoke session.
      await this.revokeSession(sessionId, session.userId.toString());
      logger.warn({ userId: session.userId, sessionId }, 'Refresh token hash mismatch! Revoked session.');
      throw new AuthenticationError('Invalid refresh token');
    }

    // Rotate token
    session.refreshTokenHash = hashToken(newRefreshToken);
    session.lastUsedAt = new Date();
    session.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await session.save();

    return session;
  }

  async revokeSession(sessionId: string, userId: string): Promise<boolean> {
    const result = await Session.updateOne(
      { _id: sessionId, userId },
      { $set: { isRevoked: true } }
    );
    return result.modifiedCount > 0;
  }

  async revokeAllUserSessions(userId: string): Promise<number> {
    const result = await Session.updateMany(
      { userId, isRevoked: false },
      { $set: { isRevoked: true } }
    );
    return result.modifiedCount;
  }

  async getUserSessions(userId: string): Promise<ISession[]> {
    return Session.find({ userId, isRevoked: false }).sort({ lastUsedAt: -1 }).exec();
  }
}

export const sessionService = new SessionService();
