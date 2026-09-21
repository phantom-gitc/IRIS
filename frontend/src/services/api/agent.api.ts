import { apiClient } from './client';
import { useAuthStore } from '../../stores/auth.store';
import type { AgentState } from '../../types/agent.types';

export interface ChatResponse {
  response: string;
  state: AgentState;
  conversationId?: string;
  toolExecuted?: {
    toolName: string;
    summary: string;
    success: boolean;
  };
  requiresConfirmation?: {
    toolName: string;
    token: string;
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  };
}

export interface VoiceCommandResponse extends ChatResponse {
  userTranscript?: string;
  audioBase64?: string;
}

export interface VoiceStreamEvents {
  onTranscription?: (data: { text: string }) => void;
  onAcknowledgment?: (data: { text: string; audioBase64?: string; actionType?: string }) => void;
  onAnswer?: (data: {
    response: string;
    audioBase64?: string;
    toolExecuted?: {
      toolName: string;
      summary: string;
      success: boolean;
    };
    requiresConfirmation?: {
      toolName: string;
      token: string;
      riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    };
  }) => void;
  onDone?: (data: { success: boolean }) => void;
  onError?: (err: Error) => void;
}

const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      const base64 = result.includes(',') ? result.split(',')[1] : result;
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

export const agentApi = {
  chat(data: {
    conversationId: string;
    prompt: string;
    confirmationToken?: string;
    taskId?: string;
  }): Promise<ChatResponse> {
    return apiClient.post<ChatResponse>('/agent/chat', data);
  },

  async voiceCommand(data: {
    conversationId: string;
    audioBlob?: Blob;
    audioInputBase64?: string;
    prompt?: string;
    confirmationToken?: string;
    taskId?: string;
  }): Promise<VoiceCommandResponse> {
    let base64Audio = data.audioInputBase64;
    if (!base64Audio && data.audioBlob) {
      base64Audio = await blobToBase64(data.audioBlob);
    }

    return apiClient.post<VoiceCommandResponse>(
      '/agent/voice-command',
      {
        conversationId: data.conversationId,
        audioInputBase64: base64Audio,
        prompt: data.prompt,
        confirmationToken: data.confirmationToken,
        taskId: data.taskId,
      },
      undefined,
      { timeout: 60000 }
    );
  },

  async voiceStream(
    data: {
      conversationId: string;
      audioBlob?: Blob;
      audioInputBase64?: string;
      prompt?: string;
      confirmationToken?: string;
      taskId?: string;
    },
    events: VoiceStreamEvents,
    signal?: AbortSignal
  ): Promise<void> {
    let base64Audio = data.audioInputBase64;
    if (!base64Audio && data.audioBlob) {
      base64Audio = await blobToBase64(data.audioBlob);
    }

    const token = useAuthStore.getState().accessToken;
    const response = await fetch('/api/v1/agent/voice-stream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      credentials: 'include',
      body: JSON.stringify({
        conversationId: data.conversationId,
        audioInputBase64: base64Audio,
        prompt: data.prompt,
        confirmationToken: data.confirmationToken,
        taskId: data.taskId,
      }),
      signal,
    });

    if (!response.ok) {
      const errText = await response.text();
      let msg = 'Failed to connect to voice stream';
      try {
        const json = JSON.parse(errText);
        msg = json.message || json.error?.message || msg;
      } catch {}
      throw new Error(msg);
    }

    if (!response.body) {
      throw new Error('Response body is null');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';
    let currentEvent = 'message';
    let currentData = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Process full lines separated by newlines
        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);

          if (line.endsWith('\r')) {
            line = line.slice(0, -1);
          }

          if (line.startsWith('event:')) {
            currentEvent = line.slice(6).trim();
          } else if (line.startsWith('data:')) {
            const dataContent = line.slice(5).trim();
            currentData = currentData ? currentData + '\n' + dataContent : dataContent;
          } else if (line === '') {
            // Empty line marks end of an event block
            if (currentData) {
              try {
                const parsed = JSON.parse(currentData);
                if (currentEvent === 'transcription') {
                  events.onTranscription?.(parsed);
                } else if (currentEvent === 'acknowledgment') {
                  events.onAcknowledgment?.(parsed);
                } else if (currentEvent === 'answer') {
                  events.onAnswer?.(parsed);
                } else if (currentEvent === 'done') {
                  events.onDone?.(parsed);
                } else if (currentEvent === 'error') {
                  events.onError?.(new Error(parsed.message || 'Voice stream encountered an error'));
                }
              } catch (parseErr) {
                console.warn('Error parsing voice stream SSE data:', parseErr, 'event:', currentEvent);
              }
            }
            currentEvent = 'message';
            currentData = '';
          }
        }
      }

      // Handle any trailing data if stream finished without trailing newline
      if (currentData) {
        try {
          const parsed = JSON.parse(currentData);
          if (currentEvent === 'answer') {
            events.onAnswer?.(parsed);
          } else if (currentEvent === 'done') {
            events.onDone?.(parsed);
          }
        } catch {}
      }
    } finally {
      reader.releaseLock();
    }
  },

  interrupt(conversationId: string): Promise<{ interrupted: boolean; conversationId: string }> {
    return apiClient.post<{ interrupted: boolean; conversationId: string }>('/agent/interrupt', {
      conversationId,
    });
  },
};
