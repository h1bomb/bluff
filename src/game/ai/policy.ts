import { EvaluatedHand, PlayerBelief, PokerAction } from '../types';

export interface AIDecisionContext {
  aiHand: EvaluatedHand;
  pot: number;
  currentBet: number;
  callAmount: number;
  playerAction: PokerAction;
  playerBetAmount: number;
  belief: PlayerBelief;
  isBoss: boolean;
}

export function decideAIAction(ctx: AIDecisionContext): PokerAction {
  const {
    aiHand,
    pot,
    callAmount,
    playerAction,
    belief,
    isBoss,
  } = ctx;

  const handStrength = aiHand.strength;
  const potOdds = callAmount > 0 ? callAmount / (pot + callAmount) : 0;

  const representedStrong =
    belief.behavior.probabilities.GENUINE_STRONG ??
    belief.behavior.probabilities.STRONG_REPRESENTATION ??
    (belief.behavior.value === 'STRONG_REPRESENTATION' || belief.behavior.value === 'GENUINE_STRONG'
      ? belief.behavior.confidence
      : 0.2);

  const bluffProb = belief.bluff;
  const tiltProb = belief.tilt;
  const baitProb = belief.baiting;

  // If player checked/called
  if (playerAction === 'CALL') {
    if (handStrength > (isBoss ? 0.70 : 0.78)) {
      return 'RAISE';
    }
    return 'CALL';
  }

  // If player bet aggressively (RAISE or ALL_IN)
  if (playerAction === 'RAISE' || playerAction === 'ALL_IN') {
    // 1. Monster hand in AI's pocket
    if (handStrength >= 0.88) {
      if (playerAction === 'ALL_IN' || handStrength >= 0.94) {
        return playerAction === 'ALL_IN' ? 'CALL' : 'ALL_IN';
      }
      return 'RAISE';
    }

    // 2. High belief that player is representing STRONG
    // If AI thinks player has monster, and AI does not have a monster, AI folds!
    const foldThreshold = isBoss ? 0.72 : 0.68;
    if (representedStrong >= foldThreshold && handStrength < 0.60) {
      // AI believes the representation and folds
      return 'FOLD';
    }

    // 3. AI smells a bluff!
    const catchBluffThreshold = isBoss ? 0.58 : 0.68;
    if (bluffProb >= catchBluffThreshold && handStrength >= 0.28) {
      // Catch the bluff!
      if (handStrength >= 0.65 && playerAction !== 'ALL_IN') {
        return 'RAISE';
      }
      return 'CALL';
    }

    // 4. Player is tilted!
    if (tiltProb >= 0.60 && handStrength >= 0.35) {
      return 'CALL';
    }

    // 5. Suspecting bait
    if (baitProb >= 0.65 && handStrength < 0.70) {
      return 'FOLD';
    }

    // 6. Standard Pot Odds evaluation
    // If pot odds are favorable and hand is reasonable
    if (handStrength > potOdds * 1.2) {
      return 'CALL';
    }

    // Weak hand against aggression
    if (handStrength < 0.40) {
      return 'FOLD';
    }

    return 'CALL';
  }

  return 'CALL';
}
