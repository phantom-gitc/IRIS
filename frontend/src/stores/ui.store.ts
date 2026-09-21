import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type NavTab =
  | 'assistant'
  | 'conversations'
  | 'tasks'
  | 'memory'
  | 'settings';

interface UIStoreState {
  activeTab: NavTab;
  isSidebarExpanded: boolean;
  isCommandBarOpen: boolean;
  theme: 'dark' | 'light';

  setActiveTab: (tab: NavTab) => void;
  toggleSidebar: () => void;
  setCommandBarOpen: (open: boolean) => void;
  toggleTheme: () => void;
  setTheme: (theme: 'dark' | 'light') => void;
}

const applyThemeClass = (theme: 'dark' | 'light') => {
  if (typeof document !== 'undefined') {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    }
  }
};

export const useUIStore = create<UIStoreState>()(
  persist(
    (set) => ({
      activeTab: 'assistant',
      isSidebarExpanded: true,
      isCommandBarOpen: false,
      theme: 'dark',

      setActiveTab: (activeTab) => set({ activeTab }),
      toggleSidebar: () =>
        set((state) => ({ isSidebarExpanded: !state.isSidebarExpanded })),
      setCommandBarOpen: (isCommandBarOpen) => set({ isCommandBarOpen }),
      toggleTheme: () =>
        set((state) => {
          const nextTheme = state.theme === 'dark' ? 'light' : 'dark';
          applyThemeClass(nextTheme);
          return { theme: nextTheme };
        }),
      setTheme: (theme) => {
        applyThemeClass(theme);
        set({ theme });
      },
    }),
    {
      name: 'iris-ui-storage',
      partialize: (state) => ({
        theme: state.theme,
        activeTab: state.activeTab,
        isSidebarExpanded: state.isSidebarExpanded,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          applyThemeClass(state.theme);
        }
      },
    }
  )
);

