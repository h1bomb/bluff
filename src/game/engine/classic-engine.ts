import {
  GameState,
  GameUIEvent,
  PokerAction,
} from '../types';
import { compareHands, evaluateHand } from '../poker/evaluator';
import { buildObservableState } from '../../jev/state-builder';
import { DecisionProvider } from '../../jev/provider';
import { decideAIAction } from '../ai/policy';
import { applyModelBreakToGame, createHistoryEntry } from './classic-helpers';

export {
  initGame,
  selectBuffAndNextHand,
  applyModelBreakToGame,
  createHistoryEntry,
  ANTE,
} from './classic-helpers';

export async function processPlayerAction(
  game: GameState,
  action: PokerAction,
  delayMs: number,
  provider: DecisionProvider
): Promise<{ game: GameState; events: GameUIEvent[] }> {
  const events: GameUIEvent[] = [];
  const updatedGame = { ...game };

  // Calculate player bet increment
  let betIncrement = 0;
  if (action === 'FOLD') {
    updatedGame.player.folded = true;
  } else if (action === 'CALL') {
    const callDiff = Math.max(0, updatedGame.ai.currentBet - updatedGame.player.currentBet);
    betIncrement = Math.min(updatedGame.player.chips, callDiff);
  } else if (action === 'RAISE') {
    const minRaise = Math.max(60, updatedGame.currentBet * 2);
    betIncrement = Math.min(updatedGame.player.chips, minRaise);
  } else if (action === 'ALL_IN') {
    betIncrement = updatedGame.player.chips;
  }

  // Deduct player chips & grow pot
  updatedGame.player.chips -= betIncrement;
  updatedGame.player.currentBet += betIncrement;
  updatedGame.pot += betIncrement;
  updatedGame.currentBet = Math.max(updatedGame.currentBet, updatedGame.player.currentBet);

  // If player folded, AI wins immediately
  if (action === 'FOLD') {
    updatedGame.ai.chips += updatedGame.pot;
    const playerEval = evaluateHand(updatedGame.player.cards);
    updatedGame.history.push(createHistoryEntry(updatedGame, 'FOLD', delayMs, betIncrement, false, false, playerEval, 'CALL', updatedGame.currentBelief));
    updatedGame.phase = updatedGame.handIndex >= updatedGame.totalHands ? 'RUN_COMPLETE' : 'BUFF_SELECTION';
    return { game: updatedGame, events };
  }

  // AI Reading phase
  events.push({ type: 'AI_READING' });
  updatedGame.ai.visualState = 'READING';

  // Build Observable State
  const observableState = buildObservableState(updatedGame, action, delayMs, betIncrement);

  // Evaluate belief using Provider
  const belief = await provider.evaluatePlayer(observableState);
  updatedGame.currentBelief = belief;
  events.push({ type: 'BELIEF_UPDATED', belief });

  // Pattern detection event
  if (observableState.patterns.repeatedSequences.length > 0) {
    events.push({
      type: 'PATTERN_DETECTED',
      pattern: `AI learned: ${observableState.patterns.repeatedSequences.join(', ')}`,
    });
  }

  // AI Policy Decision
  const aiEval = evaluateHand(updatedGame.ai.cards);
  const callAmount = Math.max(0, updatedGame.player.currentBet - updatedGame.ai.currentBet);

  const aiAction = decideAIAction({
    aiHand: aiEval,
    pot: updatedGame.pot,
    currentBet: updatedGame.currentBet,
    callAmount,
    playerAction: action,
    playerBetAmount: betIncrement,
    belief,
    isBoss: updatedGame.ai.isBoss,
  });

  updatedGame.ai.lastAction = aiAction;
  const playerEval = evaluateHand(updatedGame.player.cards);

  if (aiAction === 'FOLD') {
    updatedGame.ai.folded = true;
    updatedGame.ai.visualState = 'BROKEN';
    updatedGame.player.chips += updatedGame.pot;

    const modelBreak = applyModelBreakToGame(updatedGame, playerEval, 'FOLD', belief, events);

    updatedGame.history.push(createHistoryEntry(updatedGame, action, delayMs, betIncrement, true, false, playerEval, 'FOLD', belief, !!modelBreak));

    updatedGame.phase = updatedGame.handIndex >= updatedGame.totalHands ? 'RUN_COMPLETE' : 'BUFF_SELECTION';
    return { game: updatedGame, events };
  }

  // AI Called or Raised
  let aiBetIncrement = 0;
  if (aiAction === 'CALL') {
    aiBetIncrement = Math.min(updatedGame.ai.chips, callAmount);
  } else if (aiAction === 'RAISE' || aiAction === 'ALL_IN') {
    const aiTarget = Math.max(callAmount + 60, updatedGame.player.currentBet * 2);
    aiBetIncrement = aiAction === 'ALL_IN' ? updatedGame.ai.chips : Math.min(updatedGame.ai.chips, aiTarget);
  }

  updatedGame.ai.chips -= aiBetIncrement;
  updatedGame.ai.currentBet += aiBetIncrement;
  updatedGame.pot += aiBetIncrement;
  updatedGame.currentBet = Math.max(updatedGame.currentBet, updatedGame.ai.currentBet);

  // Showdown!
  const comp = compareHands(playerEval, aiEval);
  let playerWon = false;

  if (comp > 0) {
    playerWon = true;
    updatedGame.player.chips += updatedGame.pot;
    updatedGame.ai.visualState = 'UNCERTAIN';
  } else if (comp < 0) {
    playerWon = false;
    updatedGame.ai.chips += updatedGame.pot;
    updatedGame.ai.visualState = 'CONFIDENT';
  } else {
    // Tie: split pot
    const half = Math.floor(updatedGame.pot / 2);
    updatedGame.player.chips += half;
    updatedGame.ai.chips += half;
  }

  const modelBreak = applyModelBreakToGame(updatedGame, playerEval, aiAction, belief, events);

  // Update AI understanding metric based on prediction accuracy
  if (!modelBreak) {
    if (playerWon) {
      updatedGame.aiUnderstanding = Math.max(10, updatedGame.aiUnderstanding - 15);
    } else {
      updatedGame.aiUnderstanding = Math.min(updatedGame.ai.isBoss ? 1000 : 98, updatedGame.aiUnderstanding + 10);
    }
  }

  updatedGame.history.push(createHistoryEntry(updatedGame, action, delayMs, betIncrement, playerWon, true, playerEval, aiAction, belief, !!modelBreak));

  updatedGame.phase = updatedGame.handIndex >= updatedGame.totalHands ? 'RUN_COMPLETE' : 'BUFF_SELECTION';
  return { game: updatedGame, events };
}
