export interface RealtimeSessionResponse {
  serverUrl: string;
  roomName: string;
  participantToken: string;
  participantIdentity: string;
  expiresIn: number;
}

export interface CreateRealtimeSessionInput {
  roomName?: string;
  metadata?: Record<string, unknown>;
}
