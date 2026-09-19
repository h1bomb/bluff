import { GameState } from '../types';
import { createDeck, dealRoguelikeHand } from '../poker/deck';
import { getBlindInfo, getNextBlind } from './blinds';
import { createJokerInstance } from '../jokers/definitions';
import { DEFAULT_HAND_LEVELS } from '../poker/hands-levels';

export function initRoguelikeGame(customGameId?: string): GameState {
  const gameId = customGameId || `rogue_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const deck = createDeck();
  const { hand, remainingDeck } = dealRoguelikeHand(deck, 8);
  const blind = getBlindInfo(1, 'SMALL');

  return {
    gameId,
    handIndex: 1,
    totalHands: 5,
    phase: 'PLAYER_TURN',
    pot: 0,
    currentBet: 0,
    player: {
      chips: 0,
      currentBet: 0,
      cards: hand,
      folded: false,
    },
    ai: {
      name: 'THE READER',
      isBoss: false,
      chips: 1000,
      currentBet: 0,
      cards: [],
      folded: false,
      visualState: 'IDLE',
    },
    history: [],
    activeBuffs: [],
    aiUnderstanding: 75,
    modelBreaksCount: 0,
    ante: 1,
    blind,
    currentRoundScore: 0,
    targetScore: blind.targetScore,
    handsLeft: 4,
    discardsLeft: 3,
    money: 4,
    jokers: [],
    maxJokers: 5,
    handLevels: { ...DEFAULT_HAND_LEVELS },
    drawDeck: remainingDeck,
    discardPile: [],
    selectedCardIds: [],
    consecutiveActions: [],
    rerollCost: 2,
  };
}

export function advanceFromShopToNextBlind(game: GameState): GameState {
  const currentAnte = game.ante ?? 1;
  const currentBlindType = game.blind?.blindType ?? 'SMALL';
  const { nextAnte, nextBlind } = getNextBlind(currentAnte, currentBlindType);
  const blindInfo = getBlindInfo(nextAnte, nextBlind);

  const fullDeck = createDeck();
  const { hand, remainingDeck } = dealRoguelikeHand(fullDeck, 8);

  return {
    ...game,
    ante: nextAnte,
    blind: blindInfo,
    targetScore: blindInfo.targetScore,
    currentRoundScore: 0,
    handsLeft: 4,
    discardsLeft: 3,
    phase: 'PLAYER_TURN',
    player: {
      ...game.player,
      cards: hand,
    },
    drawDeck: remainingDeck,
    discardPile: [],
    selectedCardIds: [],
    lastScoreResult: undefined,
    shopInventory: undefined,
    consecutiveActions: game.consecutiveActions ?? [],
    rerollCost: 2,
  };
}
