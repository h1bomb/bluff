import { describe, it, expect } from 'vitest';
import { POST } from '../src/app/api/game/action/route';
import { SessionStore } from '../src/game/engine/session-store';
import { initRoguelikeGame, sanitizePublicState } from '../src/game/engine/game-engine';

describe('API /api/game/action simulation', () => {
  it('handles SET_SELECTED_CARDS and PLAY_HAND when session exists in SessionStore', async () => {
    const game = initRoguelikeGame('test_session_1');
    SessionStore.set('test_session_1', game);

    const cardIds = game.player.cards.slice(0, 3).map((c) => c.id);

    // 1. SET_SELECTED_CARDS
    const req1 = new Request('http://localhost/api/game/action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        gameId: 'test_session_1',
        sequence: 1,
        action: 'SET_SELECTED_CARDS',
        cardIds,
      }),
    });
    const res1 = await POST(req1);
    const data1 = await res1.json();
    expect(data1.success).toBe(true);
    expect(data1.publicState.selectedCardIds).toEqual(cardIds);

    // 2. PLAY_HAND
    const req2 = new Request('http://localhost/api/game/action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        gameId: 'test_session_1',
        sequence: 2,
        action: 'PLAY_HAND',
        delayMs: 450,
      }),
    });
    const res2 = await POST(req2);
    const data2 = await res2.json();
    expect(data2.success).toBe(true);
    expect(data2.publicState.handsLeft).toBe(3);
  });

  it('supports atomic PLAY_HAND with cardIds passed directly in payload', async () => {
    const game = initRoguelikeGame('test_atomic_session');
    SessionStore.set('test_atomic_session', game);

    const cardIds = [game.player.cards[0].id, game.player.cards[1].id, game.player.cards[2].id];

    const req = new Request('http://localhost/api/game/action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        gameId: 'test_atomic_session',
        sequence: 1,
        action: 'PLAY_HAND',
        cardIds,
        delayMs: 450,
      }),
    });
    const res = await POST(req);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.publicState.handsLeft).toBe(3);
    expect(data.scoreResult.finalScore).toBeGreaterThan(0);
  });

  it('auto-heals session when SessionStore is empty but clientState is provided', async () => {
    const game = initRoguelikeGame('test_resilience_session');
    const publicState = sanitizePublicState(game);
    // Ensure SessionStore does NOT have this session
    SessionStore.delete('test_resilience_session');

    const cardIds = [publicState.playerCards[0].id, publicState.playerCards[1].id, publicState.playerCards[2].id];

    const req = new Request('http://localhost/api/game/action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        gameId: 'test_resilience_session',
        sequence: 1,
        action: 'PLAY_HAND',
        cardIds,
        delayMs: 450,
        clientState: publicState,
      }),
    });
    const res = await POST(req);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.publicState.handsLeft).toBe(3);
    expect(data.scoreResult.finalScore).toBeGreaterThan(0);
  });
});
