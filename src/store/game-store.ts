import { create } from 'zustand';
import {
  GameUIEvent,
  ModelBreakPayload,
  PublicGameState,
} from '@/game/types';
import { ScoreCalculationResult } from '@/game/scoring/calculator';
import { GameRunRecord } from '@/lib/history/types';

import { createCardSlice, CardSlice } from './slices/card-slice';
import { createShopSlice, ShopSlice } from './slices/shop-slice';
import { createLifecycleSlice, LifecycleSlice } from './slices/lifecycle-slice';
import { createUiSlice, UiSlice } from './slices/ui-slice';

export interface GameStoreState extends CardSlice, ShopSlice, LifecycleSlice, UiSlice {
  publicState: PublicGameState | null;
  loading: boolean;
  actionStartTime: number;
  sequence: number;
  showModelBreak: boolean;
  currentModelBreakPayload: ModelBreakPayload | null;
  showScoreTally: boolean;
  lastScoreResult: ScoreCalculationResult | null;
  eventsQueue: GameUIEvent[];
  latestToast: string | null;
  currentRunId: string | null;
  currentRunRecord: GameRunRecord | null;
  replayStepIndex: number;
}

export const initialState = {
  publicState: null,
  loading: false,
  showModelBreak: false,
  currentModelBreakPayload: null,
  showScoreTally: false,
  lastScoreResult: null,
  eventsQueue: [],
  latestToast: null,
  currentRunId: null,
  currentRunRecord: null,
  replayStepIndex: 1,
};

export const useGameStore = create<GameStoreState>((set, get) => ({
  ...initialState,
  actionStartTime: Date.now(),
  sequence: 1,
  
  ...createCardSlice(set, get),
  ...createShopSlice(set, get),
  ...createLifecycleSlice(set, get),
  ...createUiSlice(set),
}));
