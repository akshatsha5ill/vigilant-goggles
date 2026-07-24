import { StateCreator } from 'zustand';
import { StoreState } from './index';

export interface KeySlice {
  openAiKey: string;
  anthropicKey: string;
  geminiKey: string;
  resendKey: string;
  setOpenAiKey: (key: string) => void;
  setAnthropicKey: (key: string) => void;
  setGeminiKey: (key: string) => void;
  setResendKey: (key: string) => void;
}

export const createKeySlice: StateCreator<StoreState, [], [], KeySlice> = (set) => ({
  openAiKey: '',
  anthropicKey: '',
  geminiKey: '',
  resendKey: '',
  setOpenAiKey: (key) => set({ openAiKey: key }),
  setAnthropicKey: (key) => set({ anthropicKey: key }),
  setGeminiKey: (key) => set({ geminiKey: key }),
  setResendKey: (key) => set({ resendKey: key }),
});
