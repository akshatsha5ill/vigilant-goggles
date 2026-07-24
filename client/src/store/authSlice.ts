import { StateCreator } from 'zustand';
import { StoreState } from './index';

export interface AuthSlice {
  user: any | null; 
  isAuthenticated: boolean;
  isAuthReady: boolean;
  setUser: (user: any) => void;
  setAuthReady: (status: boolean) => void;
  logout: () => void;
}

export const createAuthSlice: StateCreator<StoreState, [], [], AuthSlice> = (set) => ({
  user: null,
  isAuthenticated: false,
  isAuthReady: false,
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  setAuthReady: (status) => set({ isAuthReady: status }),
  logout: () => {
    set({ user: null, isAuthenticated: false, openAiKey: '', anthropicKey: '', geminiKey: '' });
  },
});
