import { describe, it, expect } from 'vitest';
import { decideAIAction } from '../src/game/ai/policy';
import { evaluateHand } from '../src/game/poker/evaluator';
import { Card, PlayerBelief } from '../src/game/types';

describe('AI Policy & Deception Detection', () => {
  const weakPlayerBelief: PlayerBelief = {
    behavior: {
      value: 'STRONG_REPRESENTATION',
      probabilities: {
        STRONG_REPRESENTATION: 0.88,
        BLUFF_REPRESENTATION: 0.05,
        BAIT: 0.02,
        PROBE: 0.02,
        DEFENSIVE: 0.01,
        TILT: 0.01,
        UNCLEAR: 0.01,
      },
      confidence: 0.88,
    },
    bluff: 0.08,
    baiting: 0.02,
    reversePrediction: 0.1,
    aggression: 0.85,
    predictability: 0.9,
    tilt: 0.05,
  };

  it('folds when AI holds mediocre hand and believes player represents STRONG with high confidence', () => {
    // AI has pair of 3s (hand strength ~0.48)
    const aiCards: Card[] = [
      { id: '1', suit: '♠', rank: 3 },
      { id: '2', suit: '♥', rank: 3 },
      { id: '3', suit: '♦', rank: 9 },
    ];
    const aiHand = evaluateHand(aiCards);

    const action = decideAIAction({
      aiHand,
      pot: 200,
      currentBet: 100,
      callAmount: 100,
      playerAction: 'RAISE',
      playerBetAmount: 100,
      belief: weakPlayerBelief,
      isBoss: false,
    });

    expect(action).toBe('FOLD');
  });

  it('calls when AI holds monster hand regardless of player representation', () => {
    // AI has Straight Flush (strength > 0.95)
    const aiCards: Card[] = [
      { id: '1', suit: '♦', rank: 14 },
      { id: '2', suit: '♦', rank: 13 },
      { id: '3', suit: '♦', rank: 12 },
      { id: '4', suit: '♦', rank: 11 },
      { id: '5', suit: '♦', rank: 10 },
    ];
    const aiHand = evaluateHand(aiCards);

    const action = decideAIAction({
      aiHand,
      pot: 400,
      currentBet: 200,
      callAmount: 200,
      playerAction: 'ALL_IN',
      playerBetAmount: 200,
      belief: weakPlayerBelief,
      isBoss: false,
    });

    expect(['CALL', 'ALL_IN']).toContain(action);
  });
});
