import { create } from 'zustand';

export type RealtimeConnectionState =
  | 'DISCONNECTED'
  | 'CONNECTING'
  | 'CONNECTED'
  | 'RECONNECTING'
  | 'FAILED';

interface RealtimeStoreState {
  connectionState: RealtimeConnectionState;
  roomName: string | null;
  participantIdentity: string | null;
  error: string | null;
  setConnectionState: (state: RealtimeConnectionState) => void;
  setRoomDetails: (roomName: string, participantIdentity: string) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export const useRealtimeStore = create<RealtimeStoreState>((set) => ({
  connectionState: 'DISCONNECTED',
  roomName: null,
  participantIdentity: null,
  error: null,
  setConnectionState: (connectionState) => set({ connectionState }),
  setRoomDetails: (roomName, participantIdentity) => set({ roomName, participantIdentity }),
  setError: (error) => set({ error }),
  reset: () =>
    set({
      connectionState: 'DISCONNECTED',
      roomName: null,
      participantIdentity: null,
      error: null,
    }),
}));
