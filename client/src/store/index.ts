import { create } from 'zustand';
import { disconnectSocket } from '../hooks/useWebSocket';
import { createAuthSlice, AuthSlice } from './authSlice';
import { createKeySlice, KeySlice } from './keySlice';
import { createUiSlice, UiSlice } from './uiSlice';

export type StoreState = AuthSlice & KeySlice & UiSlice;

export const useStore = create<StoreState>()((set, get, api) => ({
  ...createAuthSlice(set, get, api),
  ...createKeySlice(set, get, api),
  ...createUiSlice(set, get, api),
  
  logout: () => {
    disconnectSocket();
    set({ user: null, isAuthenticated: false, openAiKey: '', anthropicKey: '', geminiKey: '' });
  }
}));
