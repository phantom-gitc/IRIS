import { create } from 'zustand';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  preferences?: Record<string, unknown>;
  createdAt?: string;
}

interface AuthState {
  user: User | null;
  status: 'unknown' | 'authenticated' | 'unauthenticated';
  accessToken: string | null;
  setUser: (user: User | null) => void;
  setAccessToken: (token: string | null) => void;
  setStatus: (status: 'unknown' | 'authenticated' | 'unauthenticated') => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  status: 'unknown',
  accessToken: null,
  setUser: (user) => set({ user, status: user ? 'authenticated' : 'unauthenticated' }),
  setAccessToken: (accessToken) => set({ accessToken }),
  setStatus: (status) => set({ status }),
  logout: () => set({ user: null, accessToken: null, status: 'unauthenticated' }),
}));
