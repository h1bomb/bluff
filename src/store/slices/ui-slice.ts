import { GameStoreState } from '../game-store';

export interface UiSlice {
  dismissScoreTally: () => void;
  dismissModelBreak: () => void;
  clearLatestToast: () => void;
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
});
