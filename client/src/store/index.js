import { create } from 'zustand';

export const useStore = create((set) => ({
  // Auth
  user: null,
  isAuthenticated: false,
  isAuthReady: false,
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  setAuthReady: (status) => set({ isAuthReady: status }),
  logout: () => set({ user: null, isAuthenticated: false, openAiKey: '', anthropicKey: '' }),

  // API Keys (decrypted, in-memory only)
  openAiKey: '',
  anthropicKey: '',
  setOpenAiKey: (key) => set({ openAiKey: key }),
  setAnthropicKey: (key) => set({ anthropicKey: key }),

  // Loading/Error
  isLoading: false,
  error: null,
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),
}));
