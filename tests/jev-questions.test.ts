import { describe, it, expect } from 'vitest';
import { JEV_QUESTIONS } from '../src/jev/questions';
import { normalizeBelief } from '../src/jev/normalize';

describe('Jev question set', () => {
  it('keeps bluff/baiting as the only nouls — reverse is derived from behavior', () => {
    expect(Object.keys(JEV_QUESTIONS).sort()).toEqual([
      'aggression',
      'baiting',
      'behavior',
      'bluff',
      'predictability',
      'tilt',
    ]);
  });

  it('derives reversePrediction from the tempo-manipulation probability', () => {
    const belief = normalizeBelief({
      behavior: {
        value: 'TEMPO_MANIPULATION',
        probabilities: {
          GENUINE_STRONG: 0.1,
          CALCULATED_BLUFF: 0.05,
          TEMPO_MANIPULATION: 0.8,
          DESPERATION_DIG: 0.05,
        },
        confidence: 0.8,
      },
      bluff: 0.2,
      baiting: 0.3,
    });
    expect(belt0to1(belief.reversePrediction)).toBe(true);
    expect(belief.reversePrediction).toBeCloseTo(0.8, 5);
  });

  it('defaults reversePrediction low when tempo manipulation is absent', () => {
    const belief = normalizeBelief({
      behavior: {
        value: 'GENUINE_STRONG',
        probabilities: {
          GENUINE_STRONG: 0.9,
          CALCULATED_BLUFF: 0.05,
          TEMPO_MANIPULATION: 0.03,
          DESPERATION_DIG: 0.02,
        },
        confidence: 0.9,
      },
    });
    expect(belief.reversePrediction).toBeLessThanOrEqual(0.1);
  });
});

function belt0to1(v: number): boolean {
  return v >= 0 && v <= 1;
}
