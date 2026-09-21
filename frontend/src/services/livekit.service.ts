import { Room, RoomEvent, Track, RemoteTrack } from 'livekit-client';
import { realtimeApi } from './api/realtime.api';
import { useRealtimeStore } from '../stores/realtime.store';
import { useVoiceStore } from '../stores/voice.store';
import { useAgentStore } from '../stores/agent.store';

class LiveKitService {
  private room: Room | null = null;
  private audioElement: HTMLAudioElement | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.audioElement = new Audio();
      this.audioElement.autoplay = true;
    }
  }

  async connect(): Promise<Room> {
    if (this.room && this.room.state === 'connected') {
      return this.room;
    }

    const realtimeStore = useRealtimeStore.getState();
    realtimeStore.setConnectionState('CONNECTING');
    realtimeStore.setError(null);

    try {
      // 1. Request real session token from IRIS backend
      const session = await realtimeApi.createSession();
      realtimeStore.setRoomDetails(session.roomName, session.participantIdentity);

      // 2. Initialize LiveKit Room
      const room = new Room({
        adaptiveStream: true,
        dynacast: true,
        audioCaptureDefaults: {
          autoGainControl: true,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });

      this.room = room;

      // 3. Register Event Listeners
      room.on(RoomEvent.Connected, () => {
        realtimeStore.setConnectionState('CONNECTED');
      });

      room.on(RoomEvent.Disconnected, () => {
        realtimeStore.setConnectionState('DISCONNECTED');
        useVoiceStore.getState().setListening(false);
        useVoiceStore.getState().setSpeaking(false);
      });

      room.on(RoomEvent.Reconnecting, () => {
        realtimeStore.setConnectionState('RECONNECTING');
      });

      room.on(RoomEvent.Reconnected, () => {
        realtimeStore.setConnectionState('CONNECTED');
      });

      // Handle remote audio from agent
      room.on(RoomEvent.TrackSubscribed, (track: RemoteTrack) => {
        if (track.kind === Track.Kind.Audio && this.audioElement) {
          track.attach(this.audioElement);
          useVoiceStore.getState().setSpeaking(true);
          useAgentStore.getState().setStatus('SPEAKING');

          track.on('ended', () => {
            useVoiceStore.getState().setSpeaking(false);
            useAgentStore.getState().setStatus('IDLE');
          });
        }
      });

      room.on(RoomEvent.TrackUnsubscribed, (track: RemoteTrack) => {
        if (track.kind === Track.Kind.Audio && this.audioElement) {
          track.detach(this.audioElement);
          useVoiceStore.getState().setSpeaking(false);
          useAgentStore.getState().setStatus('IDLE');
        }
      });

      // 4. Connect to LiveKit server URL
      await room.connect(session.wsUrl, session.token);

      return room;
    } catch (err: unknown) {
      const errorMsg = (err as Error)?.message || 'Failed to connect to LiveKit';
      realtimeStore.setConnectionState('FAILED');
      realtimeStore.setError(errorMsg);
      throw err;
    }
  }

  async enableMicrophone(enable = true): Promise<void> {
    if (!this.room) {
      await this.connect();
    }

    if (this.room && this.room.localParticipant) {
      await this.room.localParticipant.setMicrophoneEnabled(enable);
      useVoiceStore.getState().setListening(enable);
      if (enable) {
        useAgentStore.getState().setStatus('LISTENING');
      } else {
        useAgentStore.getState().setStatus('IDLE');
      }
    }
  }

  async disconnect(): Promise<void> {
    if (this.room) {
      await this.room.disconnect();
      this.room = null;
    }
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement.src = '';
    }
    useRealtimeStore.getState().reset();
    useVoiceStore.getState().setListening(false);
    useVoiceStore.getState().setSpeaking(false);
  }

  getRoom(): Room | null {
    return this.room;
  }
}

export const liveKitService = new LiveKitService();
