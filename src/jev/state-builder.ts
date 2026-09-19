import { GameState, ObservablePlayerState, PokerAction } from '../game/types';
import { extractPlayerPatterns } from '../game/patterns/extractor';
import { applyObservableBuffHooks } from '../game/buffs/engine';

export function buildObservableState(
  gameState: GameState,
  currentAction: PokerAction,
  actionDelayMs: number,
  betAmount: number
): ObservablePlayerState {
  // Convert full history into observable history (strictly strip player's private cards unless revealed at showdown)
  const recentHands = gameState.history.map(h => ({
    handIndex: h.handIndex,
    playerAction: h.playerAction,
    actionDelayMs: h.actionDelayMs,
    betAmount: h.betAmount,
    won: h.won,
    showdown: h.showdown,
    revealedHandType: h.showdown ? h.revealedHandType : undefined,
    revealedHandStrength: h.showdown ? h.revealedHandStrength : undefined,
  }));

  const patterns = extractPlayerPatterns(recentHands, currentAction, actionDelayMs);

  let observable: ObservablePlayerState = {
    handIndex: gameState.handIndex,
    pot: gameState.pot + betAmount,
    currentBet: gameState.currentBet + betAmount,
    player: {
      chips: gameState.player.chips - betAmount,
      currentAction,
      betAmount,
      actionDelayMs,
    },
    recentHands,
    patterns,
    visiblePrediction: gameState.currentBelief
      ? {
          prediction: gameState.currentBelief.behavior.value,
          probability: Math.round(
            (gameState.currentBelief.behavior.probabilities[gameState.currentBelief.behavior.value] ||
              gameState.currentBelief.behavior.confidence) * 100
          ),
        }
      : undefined,
  };

  // Apply buff modifications to the observable state (e.g., False Tell strengthens patterns, Memory Poison amplifies history)
  observable = applyObservableBuffHooks(observable, gameState.activeBuffs);

  return observable;
}
