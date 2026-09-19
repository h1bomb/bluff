import { describe, it, expect } from 'vitest';
import { extractPlayerPatterns } from '../src/game/patterns/extractor';
import { ObservableHandHistory } from '../src/game/types';

describe('Player Pattern Extractor', () => {
  it('detects repeated fast raises', () => {
    const history: ObservableHandHistory[] = [
      {
        handIndex: 1,
        playerAction: 'RAISE',
        actionDelayMs: 400,
        betAmount: 100,
        won: true,
        showdown: false,
      },
      {
        handIndex: 2,
        playerAction: 'RAISE',
        actionDelayMs: 350,
        betAmount: 120,
        won: true,
        showdown: false,
      },
    ];

    const stats = extractPlayerPatterns(history, 'RAISE', 300);
    expect(stats.fastRaiseRate).toBe(1);
    expect(stats.repeatedSequences).toContain('FAST_RAISEx2');
  });

  it('detects tilt raises after loss', () => {
    const history: ObservableHandHistory[] = [
      {
        handIndex: 1,
        playerAction: 'CALL',
        actionDelayMs: 1200,
        betAmount: 50,
        won: false,
        showdown: true,
      },
      {
        handIndex: 2,
        playerAction: 'RAISE',
        actionDelayMs: 500,
        betAmount: 150,
        won: false,
        showdown: true,
      },
    ];

    const stats = extractPlayerPatterns(history);
    expect(stats.raisesAfterLoss).toBe(1);
  });
});
