import { create } from 'zustand';
import type { AgentState, PersonalityMode } from '../types/agent.types';

interface AgentStoreState {
  status: AgentState;
  personalityMode: PersonalityMode;
  currentMessage: string | null;
  currentAction: string | null;
  activeProject: string;
  activeFile: string;
  conversationId: string;
  isProcessing: boolean;

  setStatus: (status: AgentState) => void;
  setPersonalityMode: (mode: PersonalityMode) => void;
  setCurrentAction: (action: string | null) => void;
  setCurrentMessage: (message: string | null) => void;
  setActiveProject: (project: string) => void;
  setActiveFile: (file: string) => void;
  setConversationId: (conversationId: string) => void;
  setIsProcessing: (isProcessing: boolean) => void;
  reset: () => void;
}

export const useAgentStore = create<AgentStoreState>((set) => ({
  status: 'IDLE',
  personalityMode: 'WARM',
  currentMessage: null,
  currentAction: null,
  activeProject: 'IRIS',
  activeFile: 'workspace.ts',
  conversationId: '',
  isProcessing: false,

  setStatus: (status) => set({ status }),
  setPersonalityMode: (personalityMode) => set({ personalityMode }),
  setCurrentAction: (currentAction) => set({ currentAction }),
  setCurrentMessage: (currentMessage) => set({ currentMessage }),
  setActiveProject: (activeProject) => set({ activeProject }),
  setActiveFile: (activeFile) => set({ activeFile }),
  setConversationId: (conversationId) => set({ conversationId }),
  setIsProcessing: (isProcessing) => set({ isProcessing }),
  reset: () =>
    set({
      status: 'IDLE',
      currentMessage: null,
      currentAction: null,
      isProcessing: false,
    }),
}));
