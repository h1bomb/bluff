import { z } from 'zod';

export const ActionSchema = z.object({
  gameId: z.string(),
  sequence: z.number().default(1),
  action: z.enum([
    'FOLD',
    'CALL',
    'RAISE',
    'ALL_IN',
    'TOGGLE_SELECT',
    'SET_SELECTED_CARDS',
    'DISCARD',
    'PLAY_HAND',
    'BUY_ITEM',
    'SELL_JOKER',
    'REROLL_SHOP',
    'NEXT_BLIND',
  ]),
  delayMs: z.number().optional(),
  cardId: z.string().optional(),
  cardIds: z.array(z.string()).optional(),
  item: z.any().optional(),
  jokerId: z.string().optional(),
  clientState: z.any().optional(),
});
