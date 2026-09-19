import { describe, it, expect } from 'vitest';
import { evaluateHand, compareHands } from '../src/game/poker/evaluator';
import { Card } from '../src/game/types';

describe('Balatro 5-Card Poker Evaluator', () => {
  it('identifies Straight Flush correctly (5 cards)', () => {
    const cards: Card[] = [
      { id: '1', suit: '♠', rank: 14 },
      { id: '2', suit: '♠', rank: 13 },
      { id: '3', suit: '♠', rank: 12 },
      { id: '4', suit: '♠', rank: 11 },
      { id: '5', suit: '♠', rank: 10 },
    ];
    const evalResult = evaluateHand(cards);
    expect(evalResult.handType).toBe('STRAIGHT_FLUSH');
    expect(evalResult.strength).toBeGreaterThan(0.95);
    expect(evalResult.description).toContain('Straight Flush');
    expect(evalResult.descriptionZh).toContain('同花顺');
  });

  it('identifies Ace-low Wheel Straight Flush (A-2-3-4-5)', () => {
    const cards: Card[] = [
      { id: '1', suit: '♥', rank: 14 },
      { id: '2', suit: '♥', rank: 5 },
      { id: '3', suit: '♥', rank: 4 },
      { id: '4', suit: '♥', rank: 3 },
      { id: '5', suit: '♥', rank: 2 },
    ];
    const evalResult = evaluateHand(cards);
    expect(evalResult.handType).toBe('STRAIGHT_FLUSH');
    expect(evalResult.description).toContain('5 High');
    expect(evalResult.descriptionZh).toContain('5高');
  });

  it('identifies Four of a Kind (4 cards or 5 cards)', () => {
    const fourCards: Card[] = [
      { id: '1', suit: '♠', rank: 9 },
      { id: '2', suit: '♥', rank: 9 },
      { id: '3', suit: '♦', rank: 9 },
      { id: '4', suit: '♣', rank: 9 },
    ];
    expect(evaluateHand(fourCards).handType).toBe('FOUR_OF_A_KIND');

    const fiveCards: Card[] = [...fourCards, { id: '5', suit: '♠', rank: 14 }];
    const fiveEval = evaluateHand(fiveCards);
    expect(fiveEval.handType).toBe('FOUR_OF_A_KIND');
    expect(fiveEval.scoringCards).toHaveLength(4);
  });

  it('identifies Full House (5 cards: 3 of a kind + pair)', () => {
    const cards: Card[] = [
      { id: '1', suit: '♠', rank: 13 },
      { id: '2', suit: '♥', rank: 13 },
      { id: '3', suit: '♦', rank: 13 },
      { id: '4', suit: '♣', rank: 8 },
      { id: '5', suit: '♠', rank: 8 },
    ];
    const evalResult = evaluateHand(cards);
    expect(evalResult.handType).toBe('FULL_HOUSE');
    expect(evalResult.scoringCards).toHaveLength(5);
    expect(evalResult.descriptionZh).toContain('葫芦');
  });

  it('identifies Flush (5 cards of same suit)', () => {
    const cards: Card[] = [
      { id: '1', suit: '♣', rank: 14 },
      { id: '2', suit: '♣', rank: 9 },
      { id: '3', suit: '♣', rank: 7 },
      { id: '4', suit: '♣', rank: 5 },
      { id: '5', suit: '♣', rank: 2 },
    ];
    const evalResult = evaluateHand(cards);
    expect(evalResult.handType).toBe('FLUSH');
    expect(evalResult.strength).toBeGreaterThan(0.80);
    expect(evalResult.strength).toBeLessThan(0.95);
  });

  it('identifies Straight (5 cards consecutive)', () => {
    const cards: Card[] = [
      { id: '1', suit: '♠', rank: 9 },
      { id: '2', suit: '♥', rank: 8 },
      { id: '3', suit: '♦', rank: 7 },
      { id: '4', suit: '♣', rank: 6 },
      { id: '5', suit: '♠', rank: 5 },
    ];
    const evalResult = evaluateHand(cards);
    expect(evalResult.handType).toBe('STRAIGHT');
    expect(evalResult.strength).toBeGreaterThan(0.70);
    expect(evalResult.descriptionZh).toBe('顺子 (9高)');
  });

  it('identifies Ace-low Wheel Straight (A-2-3-4-5)', () => {
    const cards: Card[] = [
      { id: '1', suit: '♠', rank: 14 },
      { id: '2', suit: '♥', rank: 5 },
      { id: '3', suit: '♦', rank: 4 },
      { id: '4', suit: '♣', rank: 3 },
      { id: '5', suit: '♦', rank: 2 },
    ];
    const evalResult = evaluateHand(cards);
    expect(evalResult.handType).toBe('STRAIGHT');
    expect(evalResult.descriptionZh).toBe('顺子 (5高)');
  });

  it('requires 5 cards for Straight and Flush (4 cards 2-3-4-5 is HIGH_CARD in Balatro)', () => {
    // Exactly the user scenario: 4 cards [4♥, 3♥, 2♦, 5♠]
    const userCards: Card[] = [
      { id: '1', suit: '♥', rank: 4 },
      { id: '2', suit: '♥', rank: 3 },
      { id: '3', suit: '♦', rank: 2 },
      { id: '4', suit: '♠', rank: 5 },
    ];
    const evalResult = evaluateHand(userCards);
    // In Balatro, 4 consecutive cards cannot make a Straight, so it is HIGH_CARD
    expect(evalResult.handType).toBe('HIGH_CARD');
    expect(evalResult.descriptionZh).toBe('高牌 5');

    // Adding 5th card makes it a full Straight
    const completeStraight: Card[] = [...userCards, { id: '5', suit: '♣', rank: 6 }];
    expect(evaluateHand(completeStraight).handType).toBe('STRAIGHT');
  });

  it('identifies Three of a Kind', () => {
    const cards: Card[] = [
      { id: '1', suit: '♠', rank: 7 },
      { id: '2', suit: '♥', rank: 7 },
      { id: '3', suit: '♣', rank: 7 },
      { id: '4', suit: '♦', rank: 4 },
    ];
    const evalResult = evaluateHand(cards);
    expect(evalResult.handType).toBe('THREE_OF_A_KIND');
    expect(evalResult.scoringCards).toHaveLength(3);
  });

  it('identifies Two Pair', () => {
    const cards: Card[] = [
      { id: '1', suit: '♠', rank: 10 },
      { id: '2', suit: '♥', rank: 10 },
      { id: '3', suit: '♦', rank: 4 },
      { id: '4', suit: '♣', rank: 4 },
      { id: '5', suit: '♠', rank: 14 },
    ];
    const evalResult = evaluateHand(cards);
    expect(evalResult.handType).toBe('TWO_PAIR');
    expect(evalResult.scoringCards).toHaveLength(4);
    expect(evalResult.descriptionZh).toContain('两对');
  });

  it('identifies Pair', () => {
    const cards: Card[] = [
      { id: '1', suit: '♠', rank: 10 },
      { id: '2', suit: '♥', rank: 10 },
      { id: '3', suit: '♦', rank: 4 },
    ];
    const evalResult = evaluateHand(cards);
    expect(evalResult.handType).toBe('PAIR');
    expect(evalResult.scoringCards).toHaveLength(2);
  });

  it('identifies High Card junk hand (2♣ 4♥ 7♠)', () => {
    const cards: Card[] = [
      { id: '1', suit: '♣', rank: 2 },
      { id: '2', suit: '♥', rank: 4 },
      { id: '3', suit: '♠', rank: 7 },
    ];
    const evalResult = evaluateHand(cards);
    expect(evalResult.handType).toBe('HIGH_CARD');
    expect(evalResult.strength).toBeLessThan(0.25);
  });

  it('correctly compares hands by Balatro hierarchy', () => {
    const straightFlush = evaluateHand([
      { id: '1', suit: '♠', rank: 10 },
      { id: '2', suit: '♠', rank: 9 },
      { id: '3', suit: '♠', rank: 8 },
      { id: '4', suit: '♠', rank: 7 },
      { id: '5', suit: '♠', rank: 6 },
    ]);
    const fourKind = evaluateHand([
      { id: '1', suit: '♠', rank: 14 },
      { id: '2', suit: '♥', rank: 14 },
      { id: '3', suit: '♦', rank: 14 },
      { id: '4', suit: '♣', rank: 14 },
    ]);
    const fullHouse = evaluateHand([
      { id: '1', suit: '♠', rank: 13 },
      { id: '2', suit: '♥', rank: 13 },
      { id: '3', suit: '♦', rank: 13 },
      { id: '4', suit: '♣', rank: 9 },
      { id: '5', suit: '♠', rank: 9 },
    ]);
    const flush = evaluateHand([
      { id: '1', suit: '♦', rank: 10 },
      { id: '2', suit: '♦', rank: 8 },
      { id: '3', suit: '♦', rank: 6 },
      { id: '4', suit: '♦', rank: 4 },
      { id: '5', suit: '♦', rank: 2 },
    ]);
    const straight = evaluateHand([
      { id: '1', suit: '♠', rank: 10 },
      { id: '2', suit: '♥', rank: 9 },
      { id: '3', suit: '♦', rank: 8 },
      { id: '4', suit: '♣', rank: 7 },
      { id: '5', suit: '♠', rank: 6 },
    ]);
    const trips = evaluateHand([
      { id: '1', suit: '♠', rank: 10 },
      { id: '2', suit: '♥', rank: 10 },
      { id: '3', suit: '♦', rank: 10 },
    ]);
    const twoPair = evaluateHand([
      { id: '1', suit: '♠', rank: 10 },
      { id: '2', suit: '♥', rank: 10 },
      { id: '3', suit: '♦', rank: 8 },
      { id: '4', suit: '♣', rank: 8 },
    ]);
    const pair = evaluateHand([
      { id: '4', suit: '♠', rank: 14 },
      { id: '5', suit: '♥', rank: 14 },
    ]);
    const highCard = evaluateHand([
      { id: '1', suit: '♠', rank: 14 },
    ]);

    expect(compareHands(straightFlush, fourKind)).toBe(1);
    expect(compareHands(fourKind, fullHouse)).toBe(1);
    expect(compareHands(fullHouse, flush)).toBe(1);
    expect(compareHands(flush, straight)).toBe(1);
    expect(compareHands(straight, trips)).toBe(1);
    expect(compareHands(trips, twoPair)).toBe(1);
    expect(compareHands(twoPair, pair)).toBe(1);
    expect(compareHands(pair, highCard)).toBe(1);
  });

  it('evaluates single card as HIGH_CARD', () => {
    const single: Card[] = [{ id: '1', suit: '♠', rank: 14 }];
    const res = evaluateHand(single);
    expect(res.handType).toBe('HIGH_CARD');
    expect(res.description).toContain('High Card A');
    expect(res.cards).toHaveLength(1);
  });

  it('throws for 0 cards or >5 cards', () => {
    expect(() => evaluateHand([])).toThrow();
    const sixCards: Card[] = [
      { id: '1', suit: '♠', rank: 10 },
      { id: '2', suit: '♠', rank: 9 },
      { id: '3', suit: '♠', rank: 8 },
      { id: '4', suit: '♦', rank: 2 },
      { id: '5', suit: '♣', rank: 3 },
      { id: '6', suit: '♥', rank: 4 },
    ];
    expect(() => evaluateHand(sixCards)).toThrow();
  });
});
