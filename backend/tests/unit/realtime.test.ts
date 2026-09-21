import { describe, it, expect } from 'vitest';
import { liveKitService } from '../../src/features/realtime/livekit.service';

describe('LiveKit Realtime Service', () => {
  it('generates signed participant access token and room details', async () => {
    const session = await liveKitService.createSessionToken('user_test_123', 'custom-room-abc');

    expect(session).toBeDefined();
    expect(session.roomName).toBe('custom-room-abc');
    expect(session.participantIdentity).toBe('user-user_test_123');
    expect(typeof session.participantToken).toBe('string');
    expect(session.participantToken.length).toBeGreaterThan(50);
    expect(session.expiresIn).toBe(3600);
  });
});
