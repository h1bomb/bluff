import type { JokerInstance } from './jokers/types';
import type { HandLevelConfig } from './poker/hands-levels';
import type { ShopItem } from './shop/types';
import type { ScoreCalculationResult, ScoreTallyStep } from './scoring/types';
export type { ScoreCalculationResult, ScoreTallyStep };

export type Suit = '♠' | '♥' | '♣' | '♦';
export type CardModifier = 'FOIL' | 'HOLO' | 'POLY';

export interface Card {
  id: string;
  suit: Suit;
  rank: number; // 2..14 (11=J, 12=Q, 13=K, 14=A)
  modifier?: CardModifier;
  extraChips?: number;
}

export type HandType =
  | 'STRAIGHT_FLUSH' // 同花顺
  | 'FOUR_OF_A_KIND' // 四条
  | 'FULL_HOUSE' // 葫芦
  | 'FLUSH' // 同花
  | 'STRAIGHT' // 顺子
  | 'THREE_OF_A_KIND' // 三条
  | 'TWO_PAIR' // 两对
  | 'PAIR' // 对子
  | 'HIGH_CARD'; // 高牌

export interface EvaluatedHand {
  handType: HandType;
  score: number; // For exact comparison
  strength: number; // Normalized 0.0 to 1.0
  description: string;
  descriptionZh?: string;
  cards: Card[];
  scoringCards?: Card[];
}

export type PokerAction = 'FOLD' | 'CALL' | 'RAISE' | 'ALL_IN';

export type GamePhase =
  | 'DEAL'
  | 'PLAYER_TURN'
  | 'DISCARDING'
  | 'SCORING'
  | 'AI_READING'
  | 'AI_TURN'
  | 'SHOWDOWN'
  | 'MODEL_BREAK'
  | 'BUFF_SELECTION'
  | 'SHOP'
  | 'GAME_OVER'
  | 'RUN_COMPLETE';

export type AIVisualState =
  | 'IDLE'
  | 'READING'
  | 'CONFIDENT'
  | 'UNCERTAIN'
  | 'BROKEN';

export type BehaviorType =
  // Legacy 7-class (preserved for backward compat)
  | 'STRONG_REPRESENTATION'
  | 'BLUFF_REPRESENTATION'
  | 'BAIT'
  | 'PROBE'
  | 'DEFENSIVE'
  | 'TILT'
  | 'UNCLEAR'
  // New 4-class roguelike intents
  | 'GENUINE_STRONG'
  | 'CALCULATED_BLUFF'
  | 'TEMPO_MANIPULATION'
  | 'DESPERATION_DIG';

export interface PlayerBelief {
  behavior: {
    value: BehaviorType;
    probabilities: Partial<Record<BehaviorType, number>>;
    confidence: number;
  };
  bluff: number; // 0.0 - 1.0
  baiting: number; // 0.0 - 1.0
  reversePrediction: number; // 0.0 - 1.0
  aggression: number; // 0.0 - 1.0
  predictability: number; // 0.0 - 1.0
  tilt: number; // 0.0 - 1.0
}

export interface PlayerPatternStats {
  raiseRate: number;
  foldRate: number;
  allInRate: number;
  fastRaiseRate: number;
  raisesAfterLoss: number;
  successfulBluffs: number;
  failedBluffs: number;
  repeatedSequences: string[];
}

export interface ObservableHandHistory {
  handIndex: number;
  playerAction: PokerAction;
  actionDelayMs: number;
  betAmount: number;
  won: boolean;
  showdown: boolean;
  revealedHandType?: HandType;
  revealedHandStrength?: number;
}

export interface ObservablePlayerState {
  handIndex: number;
  pot: number;
  currentBet: number;
  player: {
    chips: number;
    currentAction: PokerAction;
    betAmount: number;
    actionDelayMs: number;
  };
  recentHands: ObservableHandHistory[];
  patterns: PlayerPatternStats;
  visiblePrediction?: {
    prediction: string;
    probability: number;
  };
}

export type BuffId =
  | 'FALSE_TELL'
  | 'MEMORY_POISON'
  | 'COUNTER_READ'
  | 'MIND_READ';

export interface BuffDefinition {
  name: string;
  tagline: string;
  description: string;
  icon: string;
  modifyObservableState?: (state: ObservablePlayerState) => ObservablePlayerState;
  modifyModelBreak?: (payload: ModelBreakPayload) => ModelBreakPayload;
}

export interface BuffInstance {
  id: BuffId;
  name: string;
  tagline: string;
  description: string;
  icon: string;
  acquiredAtHand: number;
}

export interface ModelBreakPayload {
  aiConfidence: number;
  aiPredicted: string;
  actualCards: Card[];
  actualHandType: HandType;
  actualStrength: number;
  rewardBonus: number;
  understandingDamage: number;
}

export type GameUIEvent =
  | { type: 'AI_READING' }
  | { type: 'BELIEF_UPDATED'; belief: PlayerBelief }
  | { type: 'PATTERN_DETECTED'; pattern: string; patterns?: string[] }
  | { type: 'MODEL_BREAK'; payload: ModelBreakPayload }
  | { type: 'BUFF_TRIGGERED'; buffId: BuffId; message: string }
  | { type: 'BOSS_TAUNT'; message: string }
  | { type: 'STATUS_MESSAGE'; message: string };

export interface PlayerState {
  chips: number;
  currentBet: number;
  cards: Card[];
  folded: boolean;
}

export interface AIState {
  name: string;
  isBoss: boolean;
  chips: number;
  currentBet: number;
  cards: Card[];
  folded: boolean;
  visualState: AIVisualState;
  lastAction?: PokerAction;
}

export type BlindType = 'SMALL' | 'BIG' | 'BOSS';

export interface BlindInfo {
  ante: number;
  blindType: BlindType;
  targetScore: number;
  rewardMoney: number;
  bossName?: string;
  bossNameZh?: string;
  bossAbility?: string;
  bossAbilityZh?: string;
}

export interface HandHistory extends ObservableHandHistory {
  playerCards: Card[];
  aiCards: Card[];
  aiAction: PokerAction;
  pot: number;
  belief?: PlayerBelief;
  modelBreakTriggered?: boolean;
}

export interface GameState {
  gameId: string;
  handIndex: number; // 1 to 5
  totalHands: number; // 5
  phase: GamePhase;
  pot: number;
  currentBet: number;
  player: PlayerState;
  ai: AIState;
  history: HandHistory[];
  activeBuffs: BuffInstance[];
  currentBelief?: PlayerBelief;
  aiUnderstanding: number; // 0 to 1000 (Boss) or 0 to 100 (%)
  modelBreaksCount: number;
  biggestLie?: {
    confidence: number;
    cards: Card[];
    handType: HandType;
  };
  // Balatro Roguelike Additions
  ante?: number;
  blind?: BlindInfo;
  currentRoundScore?: number;
  targetScore?: number;
  handsLeft?: number;
  discardsLeft?: number;
  money?: number;
  jokers?: JokerInstance[];
  maxJokers?: number;
  handLevels?: Record<HandType, HandLevelConfig>;
  drawDeck?: Card[];
  discardPile?: Card[];
  selectedCardIds?: string[];
  lastScoreResult?: ScoreCalculationResult;
  shopInventory?: ShopItem[];
  consecutiveActions?: string[];
  rerollCost?: number;
}

export interface PublicGameState {
  gameId: string;
  handIndex: number;
  totalHands: number;
  phase: GamePhase;
  pot: number;
  currentBet: number;
  playerChips: number;
  playerCards: Card[];
  playerFolded: boolean;
  aiName: string;
  aiIsBoss: boolean;
  aiChips: number;
  aiCurrentBet: number;
  aiCards: Card[] | null; // null if face-down, revealed on showdown/fold
  aiFolded: boolean;
  aiVisualState: AIVisualState;
  aiLastAction?: PokerAction;
  aiUnderstanding: number;
  belief?: PlayerBelief;
  activeBuffs: BuffInstance[];
  pendingEvents: GameUIEvent[];
  modelBreaksCount: number;
  availableBuffs?: BuffInstance[];
  handResult?: {
    winner: 'PLAYER' | 'AI' | 'TIE';
    amount: number;
    reason: string;
    modelBreak?: ModelBreakPayload;
  };
  // Balatro Roguelike Additions
  ante?: number;
  blind?: BlindInfo;
  currentRoundScore?: number;
  targetScore?: number;
  handsLeft?: number;
  discardsLeft?: number;
  money?: number;
  jokers?: JokerInstance[];
  maxJokers?: number;
  handLevels?: Record<HandType, HandLevelConfig>;
  selectedCardIds?: string[];
  deckCardsCount?: number;
  lastScoreResult?: ScoreCalculationResult;
  shopInventory?: ShopItem[];
  consecutiveActions?: string[];
  rerollCost?: number;
}

export interface DecisionTelemetry {
  gameId: string;
  handIndex: number;
  sequence: number;
  model: string;
  latency: number;
  observableState: ObservablePlayerState;
  belief: PlayerBelief;
  aiAction: PokerAction;
  finalTruth?: {
    actualHandStrength: number;
    bluffSucceeded: boolean;
  };
}
