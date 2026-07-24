import { StateCreator } from 'zustand';
import { StoreState } from './index';

export interface UiSlice {
  isLoading: boolean;
  error: string | null;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

export const createUiSlice: StateCreator<StoreState, [], [], UiSlice> = (set) => ({
  isLoading: false,
  error: null,
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),
});
