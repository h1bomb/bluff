import { GameStoreState } from '../game-store';
import { JevQuotaInfo } from '@/services/game-api';

export interface UiSlice {
  dismissScoreTally: () => void;
  dismissModelBreak: () => void;
  clearLatestToast: () => void;
  setJevQuota: (quota: JevQuotaInfo | null) => void;
}

export const createUiSlice = (
  set: (partial: Partial<GameStoreState> | ((state: GameStoreState) => Partial<GameStoreState>)) => void
): UiSlice => ({
  dismissScoreTally: () => {
    set({ showScoreTally: false });
  },

  dismissModelBreak: () => {
    set({ showModelBreak: false });
  },

  clearLatestToast: () => {
    set({ latestToast: null });
  },

  setJevQuota: (quota) => {
    set({ jevQuota: quota });
  },
});
