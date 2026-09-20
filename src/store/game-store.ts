import { create } from 'zustand';
import {
  GameUIEvent,
  ModelBreakPayload,
  PublicGameState,
} from '@/game/types';
import { ScoreCalculationResult } from '@/game/scoring/calculator';
import { GameRunRecord } from '@/lib/history/types';
import { JevQuotaInfo } from '@/services/game-api';

import { createCardSlice, CardSlice } from './slices/card-slice';
import { createShopSlice, ShopSlice } from './slices/shop-slice';
import { createLifecycleSlice, LifecycleSlice } from './slices/lifecycle-slice';
import { createUiSlice, UiSlice } from './slices/ui-slice';

export interface GameStoreState extends CardSlice, ShopSlice, LifecycleSlice, UiSlice {
  publicState: PublicGameState | null;
  loading: boolean;
  /** True while a shop mutation (buy/sell/reroll) is awaiting the server. */
  shopPending: boolean;
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
  /** Set once the server reports Jev quota exhaustion (heuristic fallback active). */
  jevThrottled: boolean;
  /** Latest known Jev daily quota for the current identity (guest or user). */
  jevQuota: JevQuotaInfo | null;
}

export const initialState = {
  publicState: null,
  loading: false,
  shopPending: false,
  showModelBreak: false,
  currentModelBreakPayload: null,
  showScoreTally: false,
  lastScoreResult: null,
  eventsQueue: [],
  latestToast: null,
  currentRunId: null,
  currentRunRecord: null,
  replayStepIndex: 1,
  jevThrottled: false,
  jevQuota: null,
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
