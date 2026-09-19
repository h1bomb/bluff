import { Card, EvaluatedHand, HandType, PlayerBelief } from '../types';
import { HandLevelConfig } from '../poker/hands-levels';
import { JokerInstance } from '../jokers/types';

export interface ScoreTallyStep {
  type: 'HAND_BASE' | 'CARD_BONUS' | 'TELL_BONUS' | 'JOKER_TRIGGER' | 'COGNITIVE_MULT' | 'TOTAL';
  source: string;
  chipsAdded?: number;
  multAdded?: number;
  xMult?: number;
  cognitiveMult?: number;
  currentChips: number;
  currentMult: number;
  currentCognitiveMult: number;
  message: string;
  messageZh?: string;
  isModelBreak?: boolean;
}

export interface ScoreCalculationResult {
  evaluatedHand: EvaluatedHand;
  handLevel: number;
  baseChips: number;
  baseMult: number;
  totalChips: number;
  totalMult: number;
  cognitiveMult: number;
  isModelBreak: boolean;
  modelBreakBonus: number;
  finalScore: number;
  tallySteps: ScoreTallyStep[];
}

export interface ScoreCalculationParams {
  handCards: Card[];
  handLevels?: Record<HandType, HandLevelConfig>;
  jokers?: JokerInstance[];
  belief?: PlayerBelief;
  actionDelayMs?: number;
  consecutiveActions?: string[];
  discardedHistory?: Card[];
}
