import { Card, HandType, PlayerBelief } from '../types';

export type JokerRarity = 'COMMON' | 'UNCOMMON' | 'RARE' | 'LEGENDARY';

export interface JokerScoringContext {
  handCards: Card[];
  handType: HandType;
  baseChips: number;
  baseMult: number;
  chips: number;
  mult: number;
  cognitiveMult: number;
  belief?: PlayerBelief;
  isModelBreak: boolean;
  consecutiveActions?: string[];
  actionDelayMs?: number;
  discardedCardsHistory?: Card[];
}

export interface JokerScoringResult {
  chipsAdded?: number;
  multAdded?: number;
  xMult?: number; // Multiplicative mult: mult *= xMult
  cognitiveMultMultiplier?: number; // Multiply the cognitive mult
  message?: string;
  messageZh?: string;
}

export interface JokerInstance {
  id: string; // Unique instance ID
  jokerKey: string; // Key in definitions
  name: string;
  nameZh: string;
  description: string;
  descriptionZh: string;
  rarity: JokerRarity;
  cost: number;
  sellValue: number;
  icon: string;
  extraData?: Record<string, unknown>; // e.g. for scaling jokers
}

export interface JokerDefinition {
  key: string;
  name: string;
  nameZh: string;
  description: string;
  descriptionZh: string;
  rarity: JokerRarity;
  cost: number;
  icon: string;
  onPlayHand?: (context: JokerScoringContext, joker: JokerInstance) => JokerScoringResult;
  onDiscard?: (discardedCards: Card[], joker: JokerInstance) => { message?: string; messageZh?: string; chipsAdded?: number };
  onModelBreak?: (context: JokerScoringContext, joker: JokerInstance) => JokerScoringResult;
}
