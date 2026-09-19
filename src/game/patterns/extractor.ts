import { ObservableHandHistory, PlayerPatternStats, PokerAction } from '../types';

export function extractPlayerPatterns(
  history: ObservableHandHistory[],
  currentAction?: PokerAction,
  currentDelayMs?: number
): PlayerPatternStats {
  const allHands = [...history];

  if (allHands.length === 0 && !currentAction) {
    return {
      raiseRate: 0,
      foldRate: 0,
      allInRate: 0,
      fastRaiseRate: 0,
      raisesAfterLoss: 0,
      successfulBluffs: 0,
      failedBluffs: 0,
      repeatedSequences: [],
    };
  }

  // Include current action if available
  const actions: { action: PokerAction; delay: number; won?: boolean }[] = allHands.map(h => ({
    action: h.playerAction,
    delay: h.actionDelayMs,
    won: h.won,
  }));

  if (currentAction && currentDelayMs !== undefined) {
    actions.push({
      action: currentAction,
      delay: currentDelayMs,
    });
  }

  const totalActions = actions.length;
  if (totalActions === 0) {
    return {
      raiseRate: 0,
      foldRate: 0,
      allInRate: 0,
      fastRaiseRate: 0,
      raisesAfterLoss: 0,
      successfulBluffs: 0,
      failedBluffs: 0,
      repeatedSequences: [],
    };
  }

  const raiseCount = actions.filter(a => a.action === 'RAISE').length;
  const foldCount = actions.filter(a => a.action === 'FOLD').length;
  const allInCount = actions.filter(a => a.action === 'ALL_IN').length;
  const fastRaises = actions.filter(a => a.action === 'RAISE' && a.delay <= 800).length;

  let raisesAfterLoss = 0;
  for (let i = 1; i < actions.length; i++) {
    if (actions[i - 1].won === false && (actions[i].action === 'RAISE' || actions[i].action === 'ALL_IN')) {
      raisesAfterLoss++;
    }
  }

  let successfulBluffs = 0;
  let failedBluffs = 0;
  for (const hand of allHands) {
    const isAggressive = hand.playerAction === 'RAISE' || hand.playerAction === 'ALL_IN';
    const hasRevealedStrength = hand.revealedHandStrength !== undefined;
    const isWeakHand = hasRevealedStrength && hand.revealedHandStrength! < 0.42;

    if (isAggressive) {
      if (hand.won && (!hand.showdown || isWeakHand)) {
        successfulBluffs++;
      } else if (!hand.won && isWeakHand) {
        failedBluffs++;
      }
    }
  }

  // Detect repeated action sequences
  const repeatedSequences: string[] = [];
  const seqTokens: string[] = actions.map(a => {
    if (a.action === 'RAISE' && a.delay <= 800) return 'FAST_RAISE';
    return a.action;
  });

  for (let i = 0; i < seqTokens.length - 1; i++) {
    if (seqTokens[i] === seqTokens[i + 1]) {
      const rep = `${seqTokens[i]}x2`;
      if (!repeatedSequences.includes(rep)) {
        repeatedSequences.push(rep);
      }
    }
  }

  return {
    raiseRate: Math.round((raiseCount / totalActions) * 100) / 100,
    foldRate: Math.round((foldCount / totalActions) * 100) / 100,
    allInRate: Math.round((allInCount / totalActions) * 100) / 100,
    fastRaiseRate: raiseCount > 0 ? Math.round((fastRaises / raiseCount) * 100) / 100 : 0,
    raisesAfterLoss,
    successfulBluffs,
    failedBluffs,
    repeatedSequences,
  };
}
