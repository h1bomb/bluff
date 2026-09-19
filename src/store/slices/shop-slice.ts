import { GameStoreState } from '../game-store';
import { sendGameAction } from '../../services/game-api';
import { captureCurrentAutopilotSnapshot, syncRunProgress } from '../helpers/run-recorder-sync';
import { createBuyItemStep, createSellJokerStep } from '@/lib/history/recorder';
import { ShopItem } from '@/game/shop/types';
import { JokerInstance } from '@/game/jokers/types';

export interface ShopSlice {
  buyShopItem: (item: ShopItem) => Promise<boolean>;
  sellJoker: (jokerId: string) => Promise<void>;
  rerollShop: () => Promise<boolean>;
}

export const createShopSlice = (
  set: (partial: Partial<GameStoreState> | ((state: GameStoreState) => Partial<GameStoreState>)) => void,
  get: () => GameStoreState
): ShopSlice => ({
  buyShopItem: async (item: ShopItem): Promise<boolean> => {
    const { publicState, sequence, replayStepIndex } = get();
    if (!publicState) return false;

    try {
      const data = await sendGameAction({
        gameId: publicState.gameId,
        sequence,
        action: 'BUY_ITEM',
        item,
        clientState: publicState,
      });
      if (data.success && data.publicState) {
        const nextStepIndex = (replayStepIndex || 1) + 1;
        const apSnapshot = captureCurrentAutopilotSnapshot(data.publicState);
        const step = createBuyItemStep(nextStepIndex, item, data.publicState, apSnapshot);
        syncRunProgress(get, set, step, data.publicState, data.sequence ?? sequence + 1, {
          totalPurchases: 1,
        });

        set({
          publicState: data.publicState,
          sequence: data.sequence ?? sequence + 1,
          replayStepIndex: nextStepIndex,
        });
        return true;
      }
      return false;
    } catch (err) {
      console.error('Failed to buy shop item:', err);
      return false;
    }
  },

  sellJoker: async (jokerId: string) => {
    const { publicState, sequence, replayStepIndex } = get();
    if (!publicState) return;

    const jokerToSell = (publicState.jokers || []).find((j: JokerInstance) => j.id === jokerId);
    if (!jokerToSell) return;

    try {
      const data = await sendGameAction({
        gameId: publicState.gameId,
        sequence,
        action: 'SELL_JOKER',
        jokerId,
        clientState: publicState,
      });
      if (data.success && data.publicState) {
        const nextStepIndex = (replayStepIndex || 1) + 1;
        const apSnapshot = captureCurrentAutopilotSnapshot(data.publicState);
        const step = createSellJokerStep(nextStepIndex, jokerToSell, data.publicState, apSnapshot);
        syncRunProgress(get, set, step, data.publicState, data.sequence ?? sequence + 1);

        set({
          publicState: data.publicState,
          sequence: data.sequence ?? sequence + 1,
          replayStepIndex: nextStepIndex,
        });
      }
    } catch (err) {
      console.error('Failed to sell joker:', err);
    }
  },

  rerollShop: async () => {
    const { publicState, sequence } = get();
    if (!publicState) return false;

    try {
      const data = await sendGameAction({
        gameId: publicState.gameId,
        sequence,
        action: 'REROLL_SHOP',
        clientState: publicState,
      });
      if (data.success && data.publicState) {
        set({
          publicState: data.publicState,
          sequence: data.sequence ?? sequence + 1,
        });
        return true;
      }
      return false;
    } catch (err) {
      console.error('Failed to reroll shop:', err);
      return false;
    }
  },
});
