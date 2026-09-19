import { GameStoreState, initialState } from '../game-store';
import { sendGameAction, startGameApi, pickBuffApi } from '../../services/game-api';
import { captureCurrentAutopilotSnapshot, syncRunProgress, updateAutopilotState } from '../helpers/run-recorder-sync';
import { createNextBlindStep, createInitialRunRecord, formatBlindName } from '@/lib/history/recorder';
import { saveActiveSession, getActiveSession, clearActiveSession } from '@/lib/history/db';
import { BuffId, PokerAction, GameUIEvent } from '@/game/types';

export interface LifecycleSlice {
  startGame: (mode?: 'classic' | 'roguelike') => Promise<void>;
  resumeActiveGame: () => Promise<boolean>;
  playAction: (action: PokerAction) => Promise<void>;
  pickBuff: (buffId: BuffId) => Promise<void>;
  nextBlind: () => Promise<void>;
  resetGame: () => void;
}

export const createLifecycleSlice = (
  set: (partial: Partial<GameStoreState> | ((state: GameStoreState) => Partial<GameStoreState>)) => void,
  get: () => GameStoreState
): LifecycleSlice => ({
  resumeActiveGame: async (): Promise<boolean> => {
    try {
      const session = await getActiveSession();
      if (session && session.publicState) {
        if (session.publicState.phase !== 'GAME_OVER' && session.publicState.phase !== 'RUN_COMPLETE') {
          set({
            publicState: session.publicState,
            sequence: session.sequence,
            currentRunId: session.gameId,
            currentRunRecord: session.replayRun,
            replayStepIndex: session.replayRun?.steps?.length || 1,
            loading: false,
            actionStartTime: Date.now(),
          });
          return true;
        }
      }
      return false;
    } catch (err) {
      console.warn('Failed to resume active session from IndexedDB:', err);
      return false;
    }
  },

  startGame: async (mode = 'roguelike') => {
    set({ loading: true, eventsQueue: [], showModelBreak: false, showScoreTally: false, lastScoreResult: null });
    try {
      const data = await startGameApi(mode);
      if (data.success && data.publicState) {
        const apSnapshot = captureCurrentAutopilotSnapshot(data.publicState);
        const runRecord = createInitialRunRecord(data.publicState, mode, apSnapshot);
        
        saveActiveSession({
          gameId: data.publicState.gameId,
          publicState: data.publicState,
          sequence: 1,
          replayRun: runRecord,
          lastUpdated: Date.now(),
        }).catch((err) =>
          console.warn('Failed to save active session to IndexedDB:', err)
        );

        set({
          publicState: data.publicState,
          loading: false,
          actionStartTime: Date.now(),
          sequence: 1,
          currentRunId: data.publicState.gameId,
          currentRunRecord: runRecord,
          replayStepIndex: 1,
        });

        updateAutopilotState(data.publicState);
      } else {
        set({ loading: false });
      }
    } catch (err) {
      console.error('Failed to start game:', err);
      set({ loading: false });
    }
  },

  playAction: async (action: PokerAction) => {
    const { publicState, actionStartTime, sequence } = get();
    if (!publicState || publicState.phase !== 'PLAYER_TURN') return;

    const delayMs = Date.now() - actionStartTime;
    set({ loading: true });

    set((state: GameStoreState) => ({
      publicState: state.publicState
        ? { ...state.publicState, phase: 'AI_READING', aiVisualState: 'READING' }
        : null,
    }));

    try {
      const data = await sendGameAction({
        gameId: publicState.gameId,
        sequence,
        action,
        delayMs,
        clientState: publicState,
      });

      if (data.success && data.publicState) {
        const events: GameUIEvent[] = data.events || [];
        const modelBreakEvent = events.find(e => e.type === 'MODEL_BREAK');
        const patternEvent = events.find(e => e.type === 'PATTERN_DETECTED');

        set({
          publicState: data.publicState,
          loading: false,
          sequence: data.sequence ?? sequence + 1,
          eventsQueue: events,
          latestToast: patternEvent ? patternEvent.pattern : null,
        });

        if (modelBreakEvent && modelBreakEvent.type === 'MODEL_BREAK') {
          set({
            showModelBreak: true,
            currentModelBreakPayload: modelBreakEvent.payload,
          });
        }
      } else {
        set({ loading: false });
      }
    } catch (err) {
      console.error('Failed to execute player action:', err);
      set({ loading: false });
    }
  },

  pickBuff: async (buffId: BuffId) => {
    const { publicState } = get();
    if (!publicState) return;

    set({ loading: true });
    try {
      const data = await pickBuffApi(publicState.gameId, buffId);
      if (data.success && data.publicState) {
        set({
          publicState: data.publicState,
          loading: false,
          actionStartTime: Date.now(),
        });
      } else {
        set({ loading: false });
      }
    } catch (err) {
      console.error('Failed to pick buff:', err);
      set({ loading: false });
    }
  },

  nextBlind: async () => {
    const { publicState, sequence, replayStepIndex } = get();
    if (!publicState) return;
    set({ loading: true });

    try {
      const data = await sendGameAction({
        gameId: publicState.gameId,
        sequence,
        action: 'NEXT_BLIND',
        clientState: publicState,
      });
      if (data.success && data.publicState) {
        const nextStepIndex = (replayStepIndex || 1) + 1;
        const apSnapshot = captureCurrentAutopilotSnapshot(data.publicState);
        const step = createNextBlindStep(nextStepIndex, data.publicState, apSnapshot);
        syncRunProgress(get, set, step, data.publicState, data.sequence ?? sequence + 1, {
          finalAnte: data.publicState.ante,
          finalBlind: formatBlindName(data.publicState.blind, 'zh'),
        });

        set({
          publicState: data.publicState,
          loading: false,
          sequence: data.sequence ?? sequence + 1,
          actionStartTime: Date.now(),
          replayStepIndex: nextStepIndex,
        });

        updateAutopilotState(data.publicState);
      } else {
        set({ loading: false });
      }
    } catch (err) {
      console.error('Failed to advance next blind:', err);
      set({ loading: false });
    }
  },

  resetGame: () => {
    clearActiveSession().catch(() => {});
    set({ ...initialState });
  },
});
