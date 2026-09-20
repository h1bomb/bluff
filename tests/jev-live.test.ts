import { describe, it, expect } from 'vitest';
import { ObservablePlayerState } from '../src/game/types';
import { extractPlayerPatterns } from '../src/game/patterns/extractor';

// Live validation of the Jev prompt set against the real API.
// Run explicitly with:  JEV_LIVE_TEST=1 npx vitest run tests/jev-live
// Requires TYPESAFE_API_KEY in .env; skipped by default so CI/offline runs
// never burn API quota.
const LIVE = process.env.JEV_LIVE_TEST === '1' && !!process.env.TYPESAFE_API_KEY;

function archetype(recentHands: ObservablePlayerState['recentHands'], delayMs: number): ObservablePlayerState {
  return {
    handIndex: recentHands.length + 1,
    pot: 300,
    currentBet: 0,
    player: { chips: 100, currentAction: 'RAISE', betAmount: 0, actionDelayMs: delayMs },
    recentHands,
    patterns: extractPlayerPatterns(recentHands, 'RAISE', delayMs),
  };
}

const fastAggressive = archetype(
  Array.from({ length: 4 }, (_, i) => ({
    handIndex: i + 1,
    playerAction: 'RAISE' as const,
    actionDelayMs: 400 + i * 20,
    betAmount: 0,
    won: true,
    showdown: true,
    revealedHandType: 'FLUSH' as const,
    revealedHandStrength: 0.85,
  })),
  420,
);

const erraticStaller = archetype(
  [2100, 450, 3800, 500].map((d, i) => ({
    handIndex: i + 1,
    playerAction: 'RAISE' as const,
    actionDelayMs: d,
    betAmount: 0,
    won: i % 2 === 0,
    showdown: true,
    revealedHandType: (i % 2 === 0 ? 'HIGH_CARD' : 'FLUSH') as 'HIGH_CARD' | 'FLUSH',
    revealedHandStrength: i % 2 === 0 ? 0.2 : 0.85,
  })),
  3600,
);

describe.skipIf(!LIVE)('Jev live prompt validation', () => {
  it('returns well-formed beliefs for archetypal play patterns', async () => {
    const { TypeSafeJevProvider } = await import('../src/jev/typesafe-provider');
    const provider = new TypeSafeJevProvider();

    for (const [name, state] of Object.entries({ fastAggressive, erraticStaller })) {
      const belief = await provider.evaluatePlayer(state);
      console.log(        `[jev-live] ${name}: behavior=${belief.behavior.value} conf=${belief.behavior.confidence.toFixed(2)} ` +
          `bluff=${belief.bluff.toFixed(2)} baiting=${belief.baiting.toFixed(2)} reverse=${belief.reversePrediction.toFixed(2)} ` +
          `aggr=${belief.aggression.toFixed(2)} predict=${belief.predictability.toFixed(2)} tilt=${belief.tilt.toFixed(2)}`,
      );

      expect(['GENUINE_STRONG', 'CALCULATED_BLUFF', 'TEMPO_MANIPULATION', 'DESPERATION_DIG']).toContain(
        belief.behavior.value,
      );
      // normalizeBelief cross-aliases the 4 choices to legacy type names, and
      // the provider zero-pads the full BehaviorType union — only non-zero
      // probabilities must stay within the 4 choices (+ aliases).
      const allowedKeys = [
        'GENUINE_STRONG', 'CALCULATED_BLUFF', 'TEMPO_MANIPULATION', 'DESPERATION_DIG',
        'STRONG_REPRESENTATION', 'BLUFF_REPRESENTATION', 'BAIT', 'DEFENSIVE',
      ];
      for (const [k, v] of Object.entries(belief.behavior.probabilities)) {
        if ((v ?? 0) > 0) expect(allowedKeys).toContain(k);
      }
      for (const v of [belief.bluff, belief.baiting, belief.reversePrediction, belief.aggression, belief.predictability, belief.tilt]) {
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThanOrEqual(1);
      }
    }
  }, 60000);
});
