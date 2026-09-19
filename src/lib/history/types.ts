import { Card, HandType, PublicGameState } from '../../game/types';
import { JokerInstance } from '../../game/jokers/types';
import { AutopilotDecision } from '../../game/autopilot/types';
import { HandLevelConfig } from '../../game/poker/hands-levels';
import { ShopItem } from '../../game/shop/types';

export type ReplayActionType =
  | 'GAME_INIT'      // Game started / initial cards dealt
  | 'SELECT_CARDS'   // Card selection changed
  | 'PLAY_HAND'      // Played 3 cards & evaluated score
  | 'DISCARD'        // Discarded cards and drew new cards
  | 'BUY_ITEM'       // Bought an item in the darknet shop
  | 'SELL_JOKER'     // Sold a joker for cash
  | 'NEXT_BLIND'     // Advanced to the next blind / ante
  | 'MODEL_BREAK'    // Deceived AI and broke its model
  | 'GAME_OVER'      // Defeat (hands exhausted before target)
  | 'RUN_COMPLETE';  // Victory (completed final boss)

export interface ReplayScoreResult {
  handType: string;
  handTypeZh?: string;
  handLevel: number;
  baseChips: number;
  baseMult: number;
  totalChips: number;
  totalMult: number;
  finalScore: number;
  isModelBreak?: boolean;
  jokerTriggers?: Array<{
    jokerKey: string;
    jokerName: string;
    message?: string;
    chipsAdded?: number;
    multAdded?: number;
    xMult?: number;
  }>;
}

export interface ReplayStateSnapshot {
  ante: number;
  blindName: string;
  blindType: 'SMALL' | 'BIG' | 'BOSS';
  targetScore: number;
  currentRoundScore: number;
  handsLeft: number;
  discardsLeft: number;
  money: number;
  playerCards: Card[];
  selectedCardIds: string[];
  jokers: JokerInstance[];
  handLevels?: Record<HandType, HandLevelConfig>;
  shopInventory?: ShopItem[];
}

export interface AutopilotThoughtLogItem {
  timestamp?: string;
  zh: string;
  en: string;
}

export type AutopilotThoughtLogEntry = string | AutopilotThoughtLogItem;

export interface ReplayAutopilotSnapshot {
  isEnabled: boolean;
  speed: '1x' | '2x';
  decisions: AutopilotDecision[];
  thoughtLogs: AutopilotThoughtLogEntry[];
  topDecisionConfidence?: number;
  topDecisionTitle?: string;
}

export interface GameReplayStep {
  stepIndex: number;
  timestamp: number;
  actionType: ReplayActionType;
  actionTitle: string;
  actionTitleZh: string;
  description: string;
  descriptionZh: string;
  stateSnapshot: ReplayStateSnapshot;
  publicStateSnapshot?: PublicGameState;
  autopilotSnapshot?: ReplayAutopilotSnapshot;
  payload?: {
    playedCards?: Card[];
    discardedCards?: Card[];
    scoreResult?: ReplayScoreResult;
    boughtItem?: {
      name: string;
      nameZh?: string;
      itemType: string;
      cost: number;
    };
    soldJoker?: {
      name: string;
      nameZh?: string;
      sellPrice: number;
    };
    modelBreak?: {
      confidence: number;
      actualStrength: number;
      reward: number;
    };
  };
}

export interface GameRunSummary {
  finalAnte: number;
  finalBlind: string;
  totalScore: number;
  peakRoundScore: number;
  totalHandsPlayed: number;
  totalDiscards: number;
  totalPurchases: number;
  finalMoney: number;
  jokersCount: number;
  modelBreaksCount: number;
  jokersSnapshot: JokerInstance[];
}

export interface GameRunRecord {
  id: string;                      // Unique run ID e.g. "run_1710000000000_abc"
  startTime: number;               // Timestamp in ms
  endTime?: number;
  durationMs?: number;
  mode: 'roguelike' | 'classic';
  status: 'IN_PROGRESS' | 'VICTORY' | 'DEFEAT';
  summary: GameRunSummary;
  steps: GameReplayStep[];
  version: number;                 // Schema version (e.g. 1)
}

export interface ActiveGameSession {
  gameId: string;
  publicState: PublicGameState;
  sequence: number;
  replayRun: GameRunRecord;
  lastUpdated: number;
}
