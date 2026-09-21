import { AccessToken } from 'livekit-server-sdk';
import { env } from '../../config/env';
import { ConfigurationError } from '../../shared/errors';
import { logger } from '../../config/logger';
import { RealtimeSessionResponse } from './realtime.types';

export class LiveKitService {
  private get credentials() {
    if (!env.LIVEKIT_API_KEY || !env.LIVEKIT_API_SECRET || !env.LIVEKIT_URL) {
      throw new ConfigurationError('LiveKit credentials or URL are missing from configuration');
    }
    return {
      apiKey: env.LIVEKIT_API_KEY,
      apiSecret: env.LIVEKIT_API_SECRET,
      url: env.LIVEKIT_URL,
    };
  }

  async createSessionToken(
    userId: string,
    requestedRoomName?: string,
    metadata?: Record<string, unknown>
  ): Promise<RealtimeSessionResponse> {
    const { apiKey, apiSecret, url } = this.credentials;
    const roomName = requestedRoomName || `iris-room-${userId}-${Date.now()}`;
    const participantIdentity = `user-${userId}`;

    const token = new AccessToken(apiKey, apiSecret, {
      identity: participantIdentity,
      name: `User-${userId.substring(0, 6)}`,
      metadata: JSON.stringify(metadata || {}),
      ttl: '1h',
    });

    token.addGrant({
      roomJoin: true,
      room: roomName,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    });

    const participantToken = await token.toJwt();
    logger.info({ userId, roomName }, 'Generated LiveKit participant access token');

    return {
      serverUrl: url,
      roomName,
      participantToken,
      participantIdentity,
      expiresIn: 3600,
    };
  }
}

export const liveKitService = new LiveKitService();
