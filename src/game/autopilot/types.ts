import { Card } from '../types';
import { ShopItem } from '../shop/types';

export type DecisionCategory = 'BEST' | 'SAFE' | 'BLUFF' | 'SYNERGY' | 'GREED';

export type DecisionType =
  | 'PLAY_HAND'
  | 'DISCARD'
  | 'BUY_ITEM'
  | 'SELL_JOKER'
  | 'REROLL_SHOP'
  | 'NEXT_BLIND'
  | 'DISMISS_TALLY';

export interface AutopilotDecision {
  id: string;
  type: DecisionType;
  category: DecisionCategory;
  title: string;
  titleZh: string;
  subtitle: string;
  subtitleZh: string;
  confidence: number; // 0 to 100
  simulatedDelayMs: number; // Simulated thinking time (e.g., 450ms for Pavlov, 3800ms for Phantom)
  reasoning: string;
  reasoningZh: string;

  // Metadata for action execution
  cards?: Card[];
  cardIds?: string[];
  item?: ShopItem;
  jokerId?: string;
  expectedScore?: number;
}
