import { create } from 'zustand';
import type { ActiveTask, ConfirmationRequest } from '../types/agent.types';

interface TaskStoreState {
  activeTask: ActiveTask | null;
  confirmation: ConfirmationRequest | null;

  setActiveTask: (task: ActiveTask | null) => void;
  updateTaskProgress: (progress: number, stepIndex?: number) => void;
  setConfirmation: (confirmation: ConfirmationRequest | null) => void;
  clearTask: () => void;
}

export const useTaskStore = create<TaskStoreState>((set) => ({
  activeTask: null,
  confirmation: null,

  setActiveTask: (activeTask) => set({ activeTask }),
  updateTaskProgress: (progress, stepIndex) =>
    set((state) => {
      if (!state.activeTask) return state;
      const steps = [...state.activeTask.steps];
      if (stepIndex !== undefined && steps[stepIndex]) {
        steps[stepIndex] = { ...steps[stepIndex], status: 'COMPLETED' };
      }
      return {
        activeTask: {
          ...state.activeTask,
          progress,
          steps,
        },
      };
    }),
  setConfirmation: (confirmation) => set({ confirmation }),
  clearTask: () => set({ activeTask: null, confirmation: null }),
}));
