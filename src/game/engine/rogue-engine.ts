import { GameState, GameUIEvent, GamePhase } from '../types';
import { evaluateHand } from '../poker/evaluator';
import { buildObservableState } from '../../jev/state-builder';
import { DecisionProvider } from '../../jev/provider';
import { calculateHandScore, ScoreCalculationResult } from '../scoring/calculator';
import { generateShopInventory } from '../shop/definitions';
import { drawCards } from './card-manager';

export { initRoguelikeGame, advanceFromShopToNextBlind } from './rogue-lifecycle';

export async function playSelectedCards(
  game: GameState,
  delayMs: number,
  provider: DecisionProvider
): Promise<{ game: GameState; events: GameUIEvent[]; scoreResult: ScoreCalculationResult }> {
  const events: GameUIEvent[] = [];
  const selectedIds = game.selectedCardIds || [];
  let playedCards = game.player.cards.filter((c) => selectedIds.includes(c.id));

  if (playedCards.length < 1 || playedCards.length > 5) {
    if (game.player.cards && game.player.cards.length >= 1) {
      playedCards = game.player.cards.slice(0, Math.min(3, game.player.cards.length));
      game = {
        ...game,
        selectedCardIds: playedCards.map((c) => c.id),
      };
    } else {
      throw new Error('Must select between 1 and 5 cards to play hand');
    }
  }

  const evaluatedHandPreview = evaluateHand(playedCards);
  const patternKey = evaluatedHandPreview.handType;
  const nextConsecutive = [...(game.consecutiveActions || []), patternKey].slice(-6);

  const observable = buildObservableState(game, 'RAISE', delayMs, 0);
  const belief = await provider.evaluatePlayer(observable);

  events.push({ type: 'BELIEF_UPDATED', belief });

  const scoreResult = calculateHandScore({
    handCards: playedCards,
    handLevels: game.handLevels,
    jokers: game.jokers,
    belief,
    actionDelayMs: delayMs,
    consecutiveActions: nextConsecutive,
    discardedHistory: game.discardPile,
  });

  const newRoundScore = (game.currentRoundScore ?? 0) + scoreResult.finalScore;
  const newHandsLeft = (game.handsLeft ?? 4) - 1;
  const targetScore = game.targetScore ?? (game.blind?.targetScore ?? 300);

  const actualPlayedIds = playedCards.map((c) => c.id);
  const keptCards = game.player.cards.filter((c) => !actualPlayedIds.includes(c.id));

  const { newHand, remainingDeck, newDiscardPile } = drawCards(
    keptCards,
    game.drawDeck || [],
    [...(game.discardPile || []), ...playedCards],
    playedCards.length
  );

  if (scoreResult.isModelBreak) {
    game.modelBreaksCount = (game.modelBreaksCount || 0) + 1;
    events.push({
      type: 'MODEL_BREAK',
      payload: {
        aiConfidence: belief.behavior.confidence,
        aiPredicted: belief.behavior.value,
        actualCards: playedCards,
        actualHandType: scoreResult.evaluatedHand.handType,
        actualStrength: scoreResult.evaluatedHand.strength,
        rewardBonus: scoreResult.modelBreakBonus,
        understandingDamage: 250,
      },
    });
  }

  let nextPhase: GamePhase = 'PLAYER_TURN';
  let earnedMoney = 0;
  let shopInventory = game.shopInventory;

  if (newRoundScore >= targetScore) {
    const baseReward = game.blind?.rewardMoney ?? 3;
    const handBonus = newHandsLeft * 1;
    const interest = Math.min(5, Math.floor((game.money ?? 0) / 5));
    earnedMoney = baseReward + handBonus + interest;
    
    // Conquering Ante 8 Boss triggers Run Complete Victory!
    if (game.ante === 8 && game.blind?.blindType === 'BOSS') {
      nextPhase = 'RUN_COMPLETE';
      events.push({
        type: 'STATUS_MESSAGE',
        message: '🏆 战局通关！你已成功击败 Ante 8 终局首领，达成最终胜局！',
      });
    } else {
      nextPhase = 'SHOP';
      shopInventory = generateShopInventory((game.jokers || []).map((j) => j.jokerKey));
    }
  } else if (newHandsLeft <= 0) {
    nextPhase = 'GAME_OVER';
  }

  const historyEntry = {
    handIndex: (game.history?.length || 0) + 1,
    playerAction: 'RAISE' as const,
    actionDelayMs: delayMs,
    betAmount: 0,
    won: true,
    showdown: true,
    revealedHandType: scoreResult.evaluatedHand.handType,
    revealedHandStrength: scoreResult.evaluatedHand.strength,
    playerCards: playedCards,
    aiCards: [],
    aiAction: 'CALL' as const,
    pot: targetScore,
    belief,
  };
  const nextHistory = [...(game.history || []), historyEntry];

  const updatedGame: GameState = {
    ...game,
    currentRoundScore: newRoundScore,
    handsLeft: newHandsLeft,
    money: (game.money ?? 0) + earnedMoney,
    phase: nextPhase,
    currentBelief: belief,
    lastScoreResult: scoreResult,
    player: {
      ...game.player,
      cards: newHand,
    },
    drawDeck: remainingDeck,
    discardPile: newDiscardPile,
    selectedCardIds: [],
    shopInventory,
    consecutiveActions: nextConsecutive,
    history: nextHistory,
  };

  return {
    game: updatedGame,
    events,
    scoreResult,
  };
}
