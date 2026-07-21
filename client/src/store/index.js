import { create } from 'zustand';

export const useStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  isAuthReady: false,
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  setAuthReady: (status) => set({ isAuthReady: status }),
  logout: () => set({ user: null, isAuthenticated: false }),
  openAiKey: '',
  anthropicKey: '',
  setOpenAiKey: (key) => set({ openAiKey: key }),
  setAnthropicKey: (key) => set({ anthropicKey: key })
}));
