import { describe, it, expect } from 'vitest';
import { calculateHandScore } from '../src/game/scoring/calculator';
import { Card, PlayerBelief } from '../src/game/types';
import { createJokerInstance } from '../src/game/jokers/definitions';

describe('Balatro-style Scoring Calculator', () => {
  it('calculates standard pair score with card rank chips', () => {
    // Pair of 8s with King kicker
    const cards: Card[] = [
      { id: '1', suit: '♠', rank: 8 },
      { id: '2', suit: '♥', rank: 8 },
      { id: '3', suit: '♦', rank: 13 },
    ];

    const result = calculateHandScore({ handCards: cards });
    expect(result.evaluatedHand.handType).toBe('PAIR');
    expect(result.baseChips).toBe(10);
    expect(result.baseMult).toBe(2);
    // Card bonus: 8 + 8 + 10 = 26 chips -> totalChips = 10 + 26 = 36 chips
    expect(result.totalChips).toBe(36);
    expect(result.totalMult).toBe(2);
    expect(result.finalScore).toBe(36 * 2);
  });

  it('triggers Model Break cognitive multiplier on weak hand with high AI strong confidence', () => {
    // High card 2-4-7
    const junkCards: Card[] = [
      { id: '1', suit: '♣', rank: 2 },
      { id: '2', suit: '♥', rank: 4 },
      { id: '3', suit: '♠', rank: 7 },
    ];

    const belief: PlayerBelief = {
      behavior: {
        value: 'STRONG_REPRESENTATION',
        probabilities: {
          STRONG_REPRESENTATION: 0.92,
          BLUFF_REPRESENTATION: 0.05,
          BAIT: 0.01,
          PROBE: 0.01,
          DEFENSIVE: 0.01,
          TILT: 0.0,
          UNCLEAR: 0.0,
        },
        confidence: 0.92,
      },
      bluff: 0.1,
      baiting: 0.05,
      reversePrediction: 0.2,
      aggression: 0.8,
      predictability: 0.85,
      tilt: 0.0,
    };

    const result = calculateHandScore({ handCards: junkCards, belief });
    expect(result.isModelBreak).toBe(true);
    expect(result.cognitiveMult).toBeGreaterThanOrEqual(9.0);
    expect(result.finalScore).toBeGreaterThan(200);
  });

  it('applies Joker triggers sequentially and multiplies final score', () => {
    // Straight: 4-5-6-7-8
    const straightCards: Card[] = [
      { id: '1', suit: '♠', rank: 4 },
      { id: '2', suit: '♥', rank: 5 },
      { id: '3', suit: '♦', rank: 6 },
      { id: '4', suit: '♣', rank: 7 },
      { id: '5', suit: '♠', rank: 8 },
    ];

    const bellJoker = createJokerInstance('PAVLOVS_BELL');
    const biasJoker = createJokerInstance('CONFIRMATION_BIAS');

    const belief: PlayerBelief = {
      behavior: {
        value: 'STRONG_REPRESENTATION',
        probabilities: {
          STRONG_REPRESENTATION: 0.8,
          BLUFF_REPRESENTATION: 0.1,
          BAIT: 0.0,
          PROBE: 0.05,
          DEFENSIVE: 0.05,
          TILT: 0.0,
          UNCLEAR: 0.0,
        },
        confidence: 0.8,
      },
      bluff: 0.2,
      baiting: 0.1,
      reversePrediction: 0.3,
      aggression: 0.7,
      predictability: 0.6,
      tilt: 0.0,
    };

    const result = calculateHandScore({
      handCards: straightCards,
      jokers: [bellJoker, biasJoker],
      belief,
      consecutiveActions: ['FAST_RAISE', 'FAST_RAISE'],
    });

    // Pavlov's Bell added +25 Mult (Straight baseMult is 4 -> 4 + 25 = 29)
    // Confirmation Bias multiplied Mult by 1.5 -> 29 * 1.5 = 44 (rounded)
    expect(result.totalMult).toBeGreaterThanOrEqual(40);
    expect(result.finalScore).toBeGreaterThan(1500);
  });

  it('triggers Model Break only when AI confidence is high and hand is truly weak', () => {
    const weakCards: Card[] = [
      { id: '1', suit: '♠', rank: 2 },
      { id: '2', suit: '♥', rank: 4 },
      { id: '3', suit: '♦', rank: 6 },
    ];

    const highConfidenceBelief: PlayerBelief = {
      behavior: {
        value: 'STRONG_REPRESENTATION',
        probabilities: { STRONG_REPRESENTATION: 0.85 },
        confidence: 0.85,
      },
      bluff: 0.1,
      baiting: 0.1,
      reversePrediction: 0.2,
      aggression: 0.8,
      predictability: 0.7,
      tilt: 0.0,
    };

    const mbResult = calculateHandScore({
      handCards: weakCards,
      belief: highConfidenceBelief,
    });
    expect(mbResult.isModelBreak).toBe(true);
    expect(mbResult.cognitiveMult).toBeGreaterThanOrEqual(10);

    // If AI confidence is only 0.55, it should NOT trigger Model Break
    const moderateBelief: PlayerBelief = {
      behavior: {
        value: 'STRONG_REPRESENTATION',
        probabilities: { STRONG_REPRESENTATION: 0.55 },
        confidence: 0.55,
      },
      bluff: 0.3,
      baiting: 0.1,
      reversePrediction: 0.2,
      aggression: 0.5,
      predictability: 0.4,
      tilt: 0.0,
    };

    const noMbResult = calculateHandScore({
      handCards: weakCards,
      belief: moderateBelief,
    });
    expect(noMbResult.isModelBreak).toBe(false);
  });
});
