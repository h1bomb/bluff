import {
  EvaluatedHand,
  ModelBreakPayload,
  PlayerBelief,
  PokerAction,
} from '../types';

export function checkModelBreak(params: {
  playerHand: EvaluatedHand;
  aiAction: PokerAction;
  belief: PlayerBelief;
  pot: number;
}): ModelBreakPayload | null {
  const { playerHand, aiAction, belief, pot } = params;

  const probs = (belief.behavior.probabilities || {}) as Record<string, number | undefined>;
  const representedStrong =
    probs.STRONG_REPRESENTATION ??
    probs.GENUINE_STRONG ??
    (belief.behavior.value === 'STRONG_REPRESENTATION' || belief.behavior.value === 'GENUINE_STRONG'
      ? belief.behavior.confidence
      : 0.2);

  const confidencePct = Math.round(
    Math.max(
      representedStrong,
      belief.behavior.confidence,
      belief.bluff
    ) * 100
  );

  // Scenario 1: Pure Bluff Model Break (The Core Climax)
  // Player had weak hand (< 0.55), AI was convinced player was STRONG (>= 0.52) and FOLDED!
  if (aiAction === 'FOLD' && playerHand.strength < 0.55 && representedStrong >= 0.52) {
    const baseBonus = Math.max(200, Math.round(pot * 0.5));
    return {
      aiConfidence: confidencePct,
      aiPredicted: 'STRONG',
      actualCards: playerHand.cards,
      actualHandType: playerHand.handType,
      actualStrength: playerHand.strength,
      rewardBonus: baseBonus,
      understandingDamage: 250,
    };
  }

  // Scenario 2: Reverse Bait Model Break
  // AI was convinced player was BLUFFING (>= 0.55), AI CALLED or RAISED, but player actually had MONSTER (>= 0.70)!
  if (
    (aiAction === 'CALL' || aiAction === 'RAISE' || aiAction === 'ALL_IN') &&
    playerHand.strength >= 0.70 &&
    belief.bluff >= 0.55
  ) {
    const baseBonus = Math.max(250, Math.round(pot * 0.6));
    return {
      aiConfidence: confidencePct,
      aiPredicted: 'BLUFF',
      actualCards: playerHand.cards,
      actualHandType: playerHand.handType,
      actualStrength: playerHand.strength,
      rewardBonus: baseBonus,
      understandingDamage: 300,
    };
  }

  return null;
}
