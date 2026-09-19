import {
  BuffId,
  EvaluatedHand,
  GameState,
  GameUIEvent,
  PlayerBelief,
  PokerAction,
} from '../types';
import { createDeck, dealHands } from '../poker/deck';
import { checkModelBreak } from './model-break';
import { applyModelBreakBuffHooks } from '../buffs/engine';
import { createBuffInstance } from '../buffs/definitions';

export const ANTE = 20;

export function initGame(customGameId?: string): GameState {
  const gameId = customGameId || `run_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const deck = createDeck();
  const { playerCards, aiCards } = dealHands(deck);

  return {
    gameId,
    handIndex: 1,
    totalHands: 5,
    phase: 'PLAYER_TURN',
    pot: ANTE * 2,
    currentBet: ANTE,
    player: {
      chips: 1000 - ANTE,
      currentBet: ANTE,
      cards: playerCards,
      folded: false,
    },
    ai: {
      name: 'THE READER',
      isBoss: false,
      chips: 1000 - ANTE,
      currentBet: ANTE,
      cards: aiCards,
      folded: false,
      visualState: 'IDLE',
    },
    history: [],
    activeBuffs: [],
    aiUnderstanding: 75,
    modelBreaksCount: 0,
  };
}

export function applyModelBreakToGame(
  game: GameState,
  playerEval: EvaluatedHand,
  aiAction: PokerAction,
  belief: PlayerBelief,
  events: GameUIEvent[]
) {
  let modelBreak = checkModelBreak({
    playerHand: playerEval,
    aiAction,
    belief,
    pot: game.pot,
  });

  if (modelBreak) {
    modelBreak = applyModelBreakBuffHooks(modelBreak, game.activeBuffs);
    game.modelBreaksCount += 1;
    game.biggestLie = {
      confidence: modelBreak.aiConfidence,
      cards: modelBreak.actualCards,
      handType: modelBreak.actualHandType,
    };

    game.player.chips += modelBreak.rewardBonus;
    game.aiUnderstanding = Math.max(0, game.aiUnderstanding - modelBreak.understandingDamage);

    events.push({ type: 'MODEL_BREAK', payload: modelBreak });
  }

  return modelBreak;
}

export function createHistoryEntry(
  game: GameState,
  playerAction: PokerAction,
  delayMs: number,
  betAmount: number,
  won: boolean,
  showdown: boolean,
  playerEval: EvaluatedHand | undefined,
  aiAction: PokerAction,
  belief: PlayerBelief | undefined,
  modelBreakTriggered: boolean = false
) {
  return {
    handIndex: game.handIndex,
    playerAction,
    actionDelayMs: delayMs,
    betAmount,
    won,
    showdown,
    revealedHandType: playerEval?.handType,
    revealedHandStrength: playerEval?.strength,
    playerCards: game.player.cards,
    aiCards: game.ai.cards,
    aiAction,
    pot: game.pot,
    belief,
    modelBreakTriggered,
  };
}

export function selectBuffAndNextHand(game: GameState, buffId: BuffId): GameState {
  const updated = { ...game };
  const nextHandIndex = updated.handIndex + 1;

  // Add selected buff
  const buff = createBuffInstance(buffId, updated.handIndex);
  updated.activeBuffs = [...updated.activeBuffs, buff];

  if (nextHandIndex > updated.totalHands) {
    updated.phase = 'RUN_COMPLETE';
    return updated;
  }

  // Start next hand
  updated.handIndex = nextHandIndex;
  const isBossHand = nextHandIndex === updated.totalHands;

  const deck = createDeck();
  const { playerCards, aiCards } = dealHands(deck);

  const ante = ANTE;
  updated.player.cards = playerCards;
  updated.player.folded = false;
  updated.player.chips = Math.max(10, updated.player.chips - ante);
  updated.player.currentBet = ante;

  updated.ai.cards = aiCards;
  updated.ai.folded = false;
  updated.ai.chips = Math.max(10, updated.ai.chips - ante);
  updated.ai.currentBet = ante;
  updated.ai.visualState = 'IDLE';
  updated.ai.lastAction = undefined;

  if (isBossHand) {
    updated.ai.name = 'THE READER Lv. ????';
    updated.ai.isBoss = true;
    updated.aiUnderstanding = 850; // Boss 1000 scale
  }

  updated.pot = ante * 2;
  updated.currentBet = ante;
  updated.phase = 'PLAYER_TURN';

  return updated;
}
