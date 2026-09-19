import { GameStoreState } from '../game-store';
import { sendGameAction } from '../../services/game-api';
import { captureCurrentAutopilotSnapshot, syncRunProgress, updateAutopilotState } from '../helpers/run-recorder-sync';
import { createDiscardStep, createPlayHandStep } from '@/lib/history/recorder';
import { Card, GameUIEvent } from '@/game/types';
import { resolveCardIdsToPlay } from '../helpers/card-selection';

export interface CardSlice {
  toggleSelectCard: (cardId: string) => Promise<void>;
  setSelectedCards: (cardIds: string[]) => Promise<void>;
  discardCards: (cardIds?: string[]) => Promise<boolean>;
  playHand: (cardIds?: string[]) => Promise<boolean>;
}

export const createCardSlice = (
  set: (partial: Partial<GameStoreState> | ((state: GameStoreState) => Partial<GameStoreState>)) => void,
  get: () => GameStoreState
): CardSlice => ({
  toggleSelectCard: async (cardId: string) => {
    const { publicState, sequence } = get();
    if (!publicState) return;
    try {
      const data = await sendGameAction({
        gameId: publicState.gameId,
        sequence,
        action: 'TOGGLE_SELECT',
        cardId,
        clientState: publicState,
      });
      if (data.success && data.publicState) {
        set({ publicState: data.publicState, sequence: data.sequence ?? sequence + 1 });
      }
    } catch (err) {
      console.error('Failed to toggle select card:', err);
    }
  },

  setSelectedCards: async (cardIds: string[]) => {
    const { publicState, sequence } = get();
    if (!publicState) return;
    set((state: GameStoreState) => ({
      publicState: state.publicState ? { ...state.publicState, selectedCardIds: cardIds } : null,
    }));
    try {
      const data = await sendGameAction({
        gameId: publicState.gameId,
        sequence,
        action: 'SET_SELECTED_CARDS',
        cardIds,
        clientState: publicState,
      });
      if (data.success && data.publicState) {
        set({ publicState: data.publicState, sequence: data.sequence ?? sequence + 1 });
      }
    } catch (err) {
      console.error('Failed to set selected cards:', err);
    }
  },

  discardCards: async (customCardIds?: string[]): Promise<boolean> => {
    const { publicState, sequence, replayStepIndex } = get();
    if (!publicState) return false;
    set({ loading: true });

    const availableCardIds = (publicState.playerCards || []).map((c: Card) => c.id);
    const rawIds = customCardIds && customCardIds.length > 0 ? customCardIds : (publicState.selectedCardIds || []);
    const cardIdsToDiscard = rawIds.filter((id) => availableCardIds.includes(id));
    const discardedCards = publicState.playerCards.filter((c: Card) => cardIdsToDiscard.includes(c.id));

    try {
      const data = await sendGameAction({
        gameId: publicState.gameId,
        sequence,
        action: 'DISCARD',
        cardIds: cardIdsToDiscard,
        clientState: publicState,
      });
      if (data.success && data.publicState) {
        const nextStepIndex = (replayStepIndex || 1) + 1;
        const apSnapshot = captureCurrentAutopilotSnapshot(data.publicState);
        const step = createDiscardStep(nextStepIndex, discardedCards, data.publicState, apSnapshot);
        syncRunProgress(get, set, step, data.publicState, data.sequence ?? sequence + 1, {
          totalDiscards: 1,
        });

        set({
          publicState: data.publicState,
          loading: false,
          sequence: data.sequence ?? sequence + 1,
          replayStepIndex: nextStepIndex,
        });

        updateAutopilotState(data.publicState);

        return true;
      } else {
        console.error('DISCARD failed:', data.error);
        set({ loading: false });
        return false;
      }
    } catch (err) {
      console.error('Failed to discard:', err);
      set({ loading: false });
      return false;
    }
  },

  playHand: async (customCardIds?: string[]): Promise<boolean> => {
    const { publicState, actionStartTime, sequence, replayStepIndex } = get();
    if (!publicState) return false;

    if (publicState.phase !== 'PLAYER_TURN' || (publicState.handsLeft ?? 0) <= 0) {
      return false;
    }

    const cardIdsToPlay = resolveCardIdsToPlay(publicState, customCardIds);

    if (cardIdsToPlay.length < 1 || cardIdsToPlay.length > 5) {
      return false;
    }

    const delayMs = Date.now() - actionStartTime;
    set({ loading: true });

    const playedCards = publicState.playerCards.filter((c: Card) =>
      cardIdsToPlay.includes(c.id)
    );

    try {
      const data = await sendGameAction({
        gameId: publicState.gameId,
        sequence,
        action: 'PLAY_HAND',
        delayMs,
        cardIds: cardIdsToPlay,
        clientState: publicState,
      });
      if (data.success && data.publicState) {
        const events: GameUIEvent[] = data.events || [];
        const modelBreakEvent = events.find((e) => e.type === 'MODEL_BREAK');
        const scoreGain = data.scoreResult?.finalScore || 0;

        const nextStepIndex = (replayStepIndex || 1) + 1;
        const isVictory = data.publicState.phase === 'RUN_COMPLETE';
        const isDefeat = data.publicState.phase === 'GAME_OVER';
        const isGameOver = isVictory || isDefeat;
        const apSnapshot = captureCurrentAutopilotSnapshot(data.publicState);
        const step = createPlayHandStep(nextStepIndex, playedCards, data.scoreResult, data.publicState, apSnapshot);

        syncRunProgress(
          get,
          set,
          step,
          data.publicState,
          data.sequence ?? sequence + 1,
          {
            totalScore: scoreGain,
            peakRoundScore: scoreGain,
            totalHandsPlayed: 1,
            modelBreaksCount: modelBreakEvent ? 1 : 0,
          },
          isGameOver,
          isVictory
        );

        set({
          publicState: data.publicState,
          loading: false,
          sequence: data.sequence ?? sequence + 1,
          actionStartTime: Date.now(),
          showScoreTally: true,
          lastScoreResult: data.scoreResult,
          replayStepIndex: isGameOver ? nextStepIndex + 1 : nextStepIndex,
        });

        if (modelBreakEvent && modelBreakEvent.type === 'MODEL_BREAK') {
          set({
            showModelBreak: true,
            currentModelBreakPayload: modelBreakEvent.payload,
          });
        }

        updateAutopilotState(data.publicState);

        return true;
      } else {
        console.error('PLAY_HAND failed:', data.error);
        set({ loading: false });
        return false;
      }
    } catch (err) {
      console.error('Failed to play hand:', err);
      set({ loading: false });
      return false;
    }
  },
});
