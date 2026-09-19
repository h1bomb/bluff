import { describe, it, expect } from 'vitest';
import { initGame, processPlayerAction, selectBuffAndNextHand } from '../src/game/engine/game-engine';
import { HeuristicDecisionProvider } from '../src/jev/heuristic-provider';

describe('End-to-End Game Flow & Model Break Simulation', () => {
  const provider = new HeuristicDecisionProvider();

  it('progresses through hands and triggers Model Break upon deception', async () => {
    // 1. Init Game
    const game = initGame('test_run');
    expect(game.handIndex).toBe(1);
    expect(game.phase).toBe('PLAYER_TURN');
    expect(game.player.cards).toHaveLength(3);
    expect(game.ai.cards).toHaveLength(3);

    // Force weak player hand (2♣ 4♥ 7♠) and mediocre AI hand to test Model Break condition
    game.player.cards = [
      { id: '1', suit: '♣', rank: 2 },
      { id: '2', suit: '♥', rank: 4 },
      { id: '3', suit: '♠', rank: 7 },
    ];
    game.ai.cards = [
      { id: '4', suit: '♠', rank: 3 },
      { id: '5', suit: '♥', rank: 3 },
      { id: '6', suit: '♦', rank: 8 },
    ];

    // Simulate that player previously established a fast-raise pattern in history
    game.history.push(
      {
        handIndex: 0,
        playerAction: 'RAISE',
        actionDelayMs: 350,
        betAmount: 100,
        won: true,
        showdown: false,
        playerCards: [],
        aiCards: [],
        aiAction: 'FOLD',
        pot: 200,
      },
      {
        handIndex: 0.5,
        playerAction: 'RAISE',
        actionDelayMs: 300,
        betAmount: 120,
        won: true,
        showdown: false,
        playerCards: [],
        aiCards: [],
        aiAction: 'FOLD',
        pot: 240,
      }
    );

    // 2. Player executes fast raise with junk hand
    const { game: updatedGame, events } = await processPlayerAction(
      game,
      'RAISE',
      280, // Fast reaction delay
      provider
    );

    expect(events.some(e => e.type === 'AI_READING')).toBe(true);
    expect(events.some(e => e.type === 'BELIEF_UPDATED')).toBe(true);

    // AI should have folded and Model Break should have fired!
    expect(updatedGame.ai.folded).toBe(true);
    const modelBreakEvent = events.find(e => e.type === 'MODEL_BREAK');
    expect(modelBreakEvent).toBeDefined();
    expect(updatedGame.modelBreaksCount).toBeGreaterThanOrEqual(1);
    expect(updatedGame.biggestLie).toBeDefined();

    // 3. Select buff and advance to next hand
    const withBuff = selectBuffAndNextHand(updatedGame, 'MIND_READ');
    expect(withBuff.handIndex).toBe(2);
    expect(withBuff.activeBuffs.some(b => b.id === 'MIND_READ')).toBe(true);
    expect(withBuff.phase).toBe('PLAYER_TURN');
  });

  it('reaches Hand 5 and transforms AI into Boss "THE READER Lv. ????"', () => {
    const game = initGame('test_boss_run');
    game.handIndex = 4;
    const bossHand = selectBuffAndNextHand(game, 'COUNTER_READ');
    expect(bossHand.handIndex).toBe(5);
    expect(bossHand.ai.isBoss).toBe(true);
    expect(bossHand.ai.name).toBe('THE READER Lv. ????');
    expect(bossHand.aiUnderstanding).toBe(850);
  });
});
