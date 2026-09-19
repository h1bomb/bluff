import { GameState, GameUIEvent, PublicGameState } from '../types';
import { evaluateHand, compareHands } from '../poker/evaluator';
import { getRandomBuffSelection } from '../buffs/definitions';
import { getBlindInfo } from './blinds';
import { DEFAULT_HAND_LEVELS } from '../poker/hands-levels';
import { createDeck } from '../poker/deck';

export function sanitizePublicState(game: GameState, events: GameUIEvent[] = []): PublicGameState {
  const isShowdown =
    game.phase === 'SHOWDOWN' ||
    game.phase === 'MODEL_BREAK' ||
    game.phase === 'BUFF_SELECTION' ||
    game.phase === 'RUN_COMPLETE';

  const lastHistory = game.history[game.history.length - 1];
  let handResult: PublicGameState['handResult'];

  if (lastHistory) {
    if (lastHistory.playerCards?.length === 3 && lastHistory.aiCards?.length === 3) {
      const playerEval = evaluateHand(lastHistory.playerCards);
      const aiEval = evaluateHand(lastHistory.aiCards);
      const comp = compareHands(playerEval, aiEval);

      const winner = lastHistory.aiAction === 'FOLD'
        ? 'PLAYER'
        : lastHistory.playerAction === 'FOLD'
        ? 'AI'
        : comp > 0
        ? 'PLAYER'
        : comp < 0
        ? 'AI'
        : 'TIE';

      handResult = {
        winner,
        amount: lastHistory.pot,
        reason:
          lastHistory.aiAction === 'FOLD'
            ? 'AI FOLDED'
            : lastHistory.playerAction === 'FOLD'
            ? 'PLAYER FOLDED'
            : `${playerEval.description} vs ${aiEval.description}`,
      };
    } else if (lastHistory.playerCards?.length === 3) {
      const playerEval = evaluateHand(lastHistory.playerCards);
      handResult = {
        winner: lastHistory.won ? 'PLAYER' : 'AI',
        amount: lastHistory.pot,
        reason: playerEval.description,
      };
    }
  }

  const existingBuffIds = game.activeBuffs.map(b => b.id);
  const availableBuffs =
    game.phase === 'BUFF_SELECTION'
      ? getRandomBuffSelection(existingBuffIds, 3, game.handIndex)
      : undefined;

  return {
    gameId: game.gameId,
    handIndex: game.handIndex,
    totalHands: game.totalHands,
    phase: game.phase,
    pot: game.pot,
    currentBet: game.currentBet,
    playerChips: game.player.chips,
    playerCards: game.player.cards,
    playerFolded: game.player.folded,
    aiName: game.ai.name,
    aiIsBoss: game.ai.isBoss,
    aiChips: game.ai.chips,
    aiCurrentBet: game.ai.currentBet,
    aiCards: isShowdown ? game.ai.cards : null, // Shields AI hole cards from player until hand finishes!
    aiFolded: game.ai.folded,
    aiVisualState: game.ai.visualState,
    aiLastAction: game.ai.lastAction,
    aiUnderstanding: game.aiUnderstanding,
    belief: game.currentBelief,
    activeBuffs: game.activeBuffs,
    pendingEvents: events,
    modelBreaksCount: game.modelBreaksCount,
    availableBuffs,
    handResult,
    // Roguelike Additions
    ante: game.ante ?? 1,
    blind: game.blind ?? getBlindInfo(1, 'SMALL'),
    currentRoundScore: game.currentRoundScore ?? 0,
    targetScore: game.targetScore ?? (game.blind?.targetScore ?? 300),
    handsLeft: game.handsLeft ?? 4,
    discardsLeft: game.discardsLeft ?? 3,
    money: game.money ?? 4,
    jokers: game.jokers ?? [],
    maxJokers: game.maxJokers ?? 5,
    handLevels: game.handLevels ?? DEFAULT_HAND_LEVELS,
    selectedCardIds: game.selectedCardIds ?? [],
    deckCardsCount: game.drawDeck ? game.drawDeck.length : 46,
    lastScoreResult: game.lastScoreResult,
    shopInventory: game.shopInventory,
    consecutiveActions: game.consecutiveActions ?? [],
    rerollCost: game.rerollCost ?? 2,
  };
}

export function restoreGameStateFromPublic(client: PublicGameState): GameState {
  const fullDeck = createDeck();
  return {
    gameId: client.gameId,
    handIndex: client.handIndex,
    totalHands: client.totalHands,
    phase: client.phase,
    pot: client.pot,
    currentBet: client.currentBet,
    player: {
      chips: client.playerChips,
      currentBet: client.currentBet,
      cards: client.playerCards || [],
      folded: client.playerFolded,
    },
    ai: {
      name: client.aiName,
      isBoss: client.aiIsBoss,
      chips: client.aiChips,
      currentBet: client.aiCurrentBet,
      cards: client.aiCards || [],
      folded: client.aiFolded,
      visualState: client.aiVisualState,
      lastAction: client.aiLastAction,
    },
    history: [],
    activeBuffs: client.activeBuffs || [],
    currentBelief: client.belief,
    aiUnderstanding: client.aiUnderstanding,
    modelBreaksCount: client.modelBreaksCount,
    ante: client.ante,
    blind: client.blind,
    currentRoundScore: client.currentRoundScore,
    targetScore: client.targetScore,
    handsLeft: client.handsLeft,
    discardsLeft: client.discardsLeft,
    money: client.money,
    jokers: client.jokers || [],
    maxJokers: client.maxJokers || 5,
    handLevels: client.handLevels || DEFAULT_HAND_LEVELS,
    drawDeck: fullDeck,
    discardPile: [],
    selectedCardIds: client.selectedCardIds || [],
    shopInventory: client.shopInventory,
    consecutiveActions: client.consecutiveActions || [],
    rerollCost: client.rerollCost ?? 2,
  };
}
