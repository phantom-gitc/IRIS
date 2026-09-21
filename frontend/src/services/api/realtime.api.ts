import { apiClient } from './client';

export interface RealtimeSessionResponse {
  token: string;
  roomName: string;
  wsUrl: string;
  participantIdentity: string;
  participantName: string;
}

export const realtimeApi = {
  createSession(): Promise<RealtimeSessionResponse> {
    return apiClient.post<RealtimeSessionResponse>('/realtime/session');
  },

  synthesize(text: string, voice?: string): Promise<{ audioBase64: string; format: string }> {
    return apiClient.post<{ audioBase64: string; format: string }>('/realtime/tts', { text, voice });
  },

  transcribe(audioBlob: Blob): Promise<{ text: string; confidence: number }> {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.webm');
    return apiClient.post<{ text: string; confidence: number }>('/realtime/stt', formData);
  },
};
