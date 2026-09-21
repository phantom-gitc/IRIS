import { create } from 'zustand';

interface VoiceStoreState {
  isListening: boolean;
  isSpeaking: boolean;
  isMuted: boolean;
  isInterrupted: boolean;
  isContinuous: boolean;
  audioLevel: number;

  setListening: (isListening: boolean) => void;
  setSpeaking: (isSpeaking: boolean) => void;
  toggleMute: () => void;
  setInterrupted: (isInterrupted: boolean) => void;
  setContinuous: (isContinuous: boolean) => void;
  setAudioLevel: (audioLevel: number) => void;
}

export const useVoiceStore = create<VoiceStoreState>((set) => ({
  isListening: false,
  isSpeaking: false,
  isMuted: false,
  isInterrupted: false,
  isContinuous: false,
  audioLevel: 0,

  setListening: (isListening) => set({ isListening }),
  setSpeaking: (isSpeaking) => set({ isSpeaking }),
  toggleMute: () => set((state) => ({ isMuted: !state.isMuted })),
  setInterrupted: (isInterrupted) => set({ isInterrupted }),
  setContinuous: (isContinuous) => set({ isContinuous }),
  setAudioLevel: (audioLevel) => set({ audioLevel }),
}));
