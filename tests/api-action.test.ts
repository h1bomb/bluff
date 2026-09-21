import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';

vi.mock('@/auth', () => ({
  auth: vi.fn().mockResolvedValue(null),
}));

import { auth } from '@/auth';
import { POST } from '../src/app/api/game/action/route';
import { POST as startGame } from '../src/app/api/game/start/route';
import { GET as getQuota } from '../src/app/api/game/quota/route';
import { SessionStore } from '../src/game/engine/session-store';
import { sessionKeyFor } from '../src/game/engine/session-key';
import { initRoguelikeGame, sanitizePublicState } from '../src/game/engine/game-engine';
import { consumeMinuteQuota, resetMinuteQuota } from '../src/jev/rate-limiter';
import { consumeDailyQuota, peekDailyQuota, resetDailyQuotaMemory } from '../src/jev/daily-quota';
import {
  resolveQuotaIdentity,
  GUEST_COOKIE_NAME,
  JEV_USER_LIMIT_PER_MINUTE,
  JEV_USER_LIMIT_PER_DAY,
  JEV_GUEST_LIMIT_PER_DAY,
} from '../src/jev/identity';
import { selectDecisionProvider } from '../src/jev/provider-selector';
import { ObservablePlayerState } from '../src/game/types';

const mockAuth = auth as unknown as Mock;

function mockLoggedInUser(userId: string | null) {
  mockAuth.mockResolvedValue(userId ? { user: { id: userId }, expires: '' } : null);
}

const sampleObservable: ObservablePlayerState = {
  handIndex: 1,
  pot: 100,
  currentBet: 20,
  player: { chips: 500, currentAction: 'RAISE', betAmount: 40, actionDelayMs: 500 },
  recentHands: [],
  patterns: {
    raiseRate: 0,
    foldRate: 0,
    allInRate: 0,
    fastRaiseRate: 0,
    raisesAfterLoss: 0,
    successfulBluffs: 0,
    failedBluffs: 0,
    repeatedSequences: [],
  },
};

beforeEach(() => {
  mockAuth.mockResolvedValue(null);
  resetMinuteQuota();
  resetDailyQuotaMemory();
});

describe('API /api/game/action simulation (guest)', () => {
  it('handles SET_SELECTED_CARDS and PLAY_HAND when session exists in SessionStore', async () => {
    const game = initRoguelikeGame('test_session_1');
    SessionStore.set(sessionKeyFor(null, 'test_session_1'), game);

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
    SessionStore.set(sessionKeyFor(null, 'test_atomic_session'), game);

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
    SessionStore.delete(sessionKeyFor(null, 'test_resilience_session'));

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

describe('API /api/game/action session binding', () => {
  it('binds sessions to the signed-in user; guests cannot hijack them via gameId', async () => {
    const game = initRoguelikeGame('test_bound_session');
    // Session created while user-a was signed in
    SessionStore.set(sessionKeyFor('user-a', 'test_bound_session'), game);

    // A guest who learns the gameId cannot access the session
    mockLoggedInUser(null);
    const guestReq = new Request('http://localhost/api/game/action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        gameId: 'test_bound_session',
        sequence: 1,
        action: 'SET_SELECTED_CARDS',
        cardIds: [],
      }),
    });
    const guestRes = await POST(guestReq);
    expect(guestRes.status).toBe(404);

    // A different signed-in user cannot access it either
    mockLoggedInUser('user-b');
    const otherReq = new Request('http://localhost/api/game/action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        gameId: 'test_bound_session',
        sequence: 1,
        action: 'SET_SELECTED_CARDS',
        cardIds: [],
      }),
    });
    const otherRes = await POST(otherReq);
    expect(otherRes.status).toBe(404);

    // The owner can access it
    mockLoggedInUser('user-a');
    const ownerReq = new Request('http://localhost/api/game/action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        gameId: 'test_bound_session',
        sequence: 1,
        action: 'SET_SELECTED_CARDS',
        cardIds: [],
      }),
    });
    const ownerRes = await POST(ownerReq);
    const ownerData = await ownerRes.json();
    expect(ownerData.success).toBe(true);
  });
});

describe('Jev quota identity', () => {
  it('keys signed-in users by userId with user limits', () => {
    const identity = resolveQuotaIdentity('user-1', new Headers());
    expect(identity.isGuest).toBe(false);
    expect(identity.key).toBe('u:user-1');
    expect(identity.dailyLimit).toBe(JEV_USER_LIMIT_PER_DAY);
    expect(identity.ipKey).toBeNull();
    expect(identity.setGuestId).toBeNull();
  });

  it('keys guests by device cookie when present, so shared IPs do not share quota', () => {
    const ipHeaders = { 'x-forwarded-for': '203.0.113.9' };
    const deviceA = resolveQuotaIdentity(null, new Headers({ ...ipHeaders, cookie: `${GUEST_COOKIE_NAME}=device-aaaa-1111` }));
    const deviceB = resolveQuotaIdentity(null, new Headers({ ...ipHeaders, cookie: `${GUEST_COOKIE_NAME}=device-bbbb-2222` }));

    expect(deviceA.key).toBe('g:device-aaaa-1111');
    expect(deviceB.key).toBe('g:device-bbbb-2222');
    expect(deviceA.key).not.toBe(deviceB.key);
    // Same egress IP -> same aggregate backstop key
    expect(deviceA.ipKey).toBe(deviceB.ipKey);
    // Cookie already present -> no re-issue
    expect(deviceA.setGuestId).toBeNull();
    // Raw IP never leaks into keys
    expect(JSON.stringify(deviceA)).not.toContain('203.0.113.9');
  });

  it('falls back to a hashed IP key for cookieless guests and asks to set a cookie', () => {
    const identity = resolveQuotaIdentity(null, new Headers({ 'x-forwarded-for': '203.0.113.9' }));
    expect(identity.isGuest).toBe(true);
    expect(identity.key.startsWith('g:ip:')).toBe(true);
    expect(identity.key).not.toContain('203.0.113.9');
    expect(identity.setGuestId).toBeTruthy();
  });
});

describe('guest device cookie issuance', () => {
  it('issues a guest cookie on /api/game/start when absent', async () => {
    const req = new Request('http://localhost/api/game/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode: 'roguelike' }),
    });
    const res = await startGame(req);
    expect(res.headers.get('set-cookie')).toContain(`${GUEST_COOKIE_NAME}=`);
  });

  it('does not re-issue a cookie when the device already has one', async () => {
    const req = new Request('http://localhost/api/game/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', cookie: `${GUEST_COOKIE_NAME}=existing-device-123` },
      body: JSON.stringify({ mode: 'roguelike' }),
    });
    const res = await startGame(req);
    expect(res.headers.get('set-cookie')).toBeNull();
  });

  it('issues a guest cookie on /api/game/quota when absent', async () => {
    const res = await getQuota(new Request('http://localhost/api/game/quota'));
    expect(res.headers.get('set-cookie')).toContain(`${GUEST_COOKIE_NAME}=`);
  });
});

describe('Jev quota enforcement', () => {
  it('enforces the per-minute burst limit', () => {
    const now = Date.now();
    for (let i = 0; i < 10; i++) {
      expect(consumeMinuteQuota('burst-key', 10, now + i).allowed).toBe(true);
    }
    const blocked = consumeMinuteQuota('burst-key', 10, now + 10);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSec).toBeGreaterThan(0);
  });

  it('enforces the daily limit and reports remaining', async () => {
    for (let i = 0; i < 5; i++) {
      const r = await consumeDailyQuota('daily-key', 5);
      expect(r.allowed).toBe(true);
      expect(r.used).toBe(i + 1);
    }
    const blocked = await consumeDailyQuota('daily-key', 5);
    expect(blocked.allowed).toBe(false);

    const peek = await peekDailyQuota('daily-key', 5);
    expect(peek.used).toBe(6);
    expect(peek.remaining).toBe(0);
  });

  it('tracks quotas independently per identity key', async () => {
    const now = Date.now();
    for (let i = 0; i < 10; i++) {
      consumeMinuteQuota('key-x', 10, now);
    }
    expect(consumeMinuteQuota('key-x', 10, now).allowed).toBe(false);
    expect(consumeMinuteQuota('key-y', 10, now).allowed).toBe(true);
  });

  it('throttles after the daily limit and exposes a quota snapshot', async () => {
    const identity = {
      key: 'u:throttle-user',
      isGuest: false,
      minuteLimit: 100,
      dailyLimit: 2,
      ipKey: null,
      ipMinuteLimit: 0,
      ipDailyLimit: 0,
      setGuestId: null,
    };
    const selection = selectDecisionProvider(identity);

    await selection.provider.evaluatePlayer(sampleObservable);
    expect(selection.wasThrottled()).toBe(false);
    expect(selection.quotaSnapshot()?.used).toBe(1);

    await selection.provider.evaluatePlayer(sampleObservable);
    expect(selection.wasThrottled()).toBe(false);

    // Third call exceeds dailyLimit: 2 -> silent heuristic fallback
    const belief = await selection.provider.evaluatePlayer(sampleObservable);
    expect(selection.wasThrottled()).toBe(true);
    expect(selection.quotaSnapshot()?.remaining).toBe(0);
    expect(belief.behavior.value).toBeTruthy();
  });

  it('gives each guest device an independent daily quota on a shared egress IP', async () => {
    const mkIdentity = (device: string) => ({
      key: `g:${device}`,
      isGuest: true,
      minuteLimit: 100,
      dailyLimit: 1,
      ipKey: 'ip:shared-office',
      ipMinuteLimit: 100,
      ipDailyLimit: 100,
      setGuestId: null,
    });

    // device A uses up its own daily allowance
    await selectDecisionProvider(mkIdentity('dev-a')).provider.evaluatePlayer(sampleObservable);
    const aBlocked = selectDecisionProvider(mkIdentity('dev-a'));
    await aBlocked.provider.evaluatePlayer(sampleObservable);
    expect(aBlocked.wasThrottled()).toBe(true);

    // device B behind the same NAT keeps its own quota
    const b = selectDecisionProvider(mkIdentity('dev-b'));
    await b.provider.evaluatePlayer(sampleObservable);
    expect(b.wasThrottled()).toBe(false);
  });

  it('IP aggregate backstop trips when one IP rotates device cookies', async () => {
    const mkIdentity = (device: string) => ({
      key: `g:${device}`,
      isGuest: true,
      minuteLimit: 100,
      dailyLimit: 100,
      ipKey: 'ip:attacker',
      ipMinuteLimit: 100,
      ipDailyLimit: 2,
      setGuestId: null,
    });

    await selectDecisionProvider(mkIdentity('rot-1')).provider.evaluatePlayer(sampleObservable);
    await selectDecisionProvider(mkIdentity('rot-2')).provider.evaluatePlayer(sampleObservable);
    const third = selectDecisionProvider(mkIdentity('rot-3'));
    await third.provider.evaluatePlayer(sampleObservable);
    expect(third.wasThrottled()).toBe(true);
  });

  it('flags jevThrottled in PLAY_HAND response when the quota is exhausted', async () => {
    mockLoggedInUser('heavy-user');
    const game = initRoguelikeGame('throttle_route_session');
    SessionStore.set(sessionKeyFor('heavy-user', 'throttle_route_session'), game);

    const now = Date.now();
    for (let i = 0; i < JEV_USER_LIMIT_PER_MINUTE; i++) {
      consumeMinuteQuota('u:heavy-user', JEV_USER_LIMIT_PER_MINUTE, now + i);
    }

    const cardIds = game.player.cards.slice(0, 3).map((c) => c.id);
    const req = new Request('http://localhost/api/game/action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        gameId: 'throttle_route_session',
        sequence: 1,
        action: 'PLAY_HAND',
        cardIds,
        delayMs: 450,
      }),
    });
    const res = await POST(req);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.jevThrottled).toBe(true);
  });

  it('consumes exactly one daily quota per played hand (autopilot path), none for select/discard', async () => {
    mockLoggedInUser('quota-hands-user');
    const gameId = 'quota_hands_session';
    const game = initRoguelikeGame(gameId);
    SessionStore.set(sessionKeyFor('quota-hands-user', gameId), game);

    const call = (seq: number, action: string, extra: Record<string, unknown> = {}) =>
      POST(
        new Request('http://localhost/api/game/action', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ gameId, sequence: seq, action, ...extra }),
        })
      ).then((r) => r.json());

    // Non-scoring actions must not consume Jev quota.
    const cardIds = game.player.cards.slice(0, 3).map((c) => c.id);
    await call(1, 'SET_SELECTED_CARDS', { cardIds });
    const afterDiscard = await call(2, 'DISCARD', { cardIds });
    expect(afterDiscard.success).toBe(true);
    let quota = await peekDailyQuota('u:quota-hands-user', JEV_USER_LIMIT_PER_DAY);
    expect(quota.used).toBe(0);

    // Each PLAY_HAND (what the autopilot issues per hand) consumes exactly 1.
    const hand1 = await call(3, 'PLAY_HAND', {
      cardIds: afterDiscard.publicState.playerCards.slice(0, 3).map((c: { id: string }) => c.id),
      delayMs: 500,
    });
    expect(hand1.success).toBe(true);
    expect(hand1.jevQuota?.used).toBe(1);
    expect(hand1.jevQuota?.remaining).toBe(JEV_USER_LIMIT_PER_DAY - 1);

    if (hand1.publicState.phase === 'PLAYER_TURN') {
      const hand2 = await call(4, 'PLAY_HAND', {
        cardIds: hand1.publicState.playerCards.slice(0, 3).map((c: { id: string }) => c.id),
        delayMs: 500,
      });
      expect(hand2.success).toBe(true);
      expect(hand2.jevQuota?.used).toBe(2);
      expect(hand2.jevQuota?.remaining).toBe(JEV_USER_LIMIT_PER_DAY - 2);
    }

    quota = await peekDailyQuota('u:quota-hands-user', JEV_USER_LIMIT_PER_DAY);
    expect(quota.used).toBeGreaterThanOrEqual(1);
    expect(quota.used).toBeLessThanOrEqual(2);
  });
});

describe('API /api/game/quota', () => {
  it('returns guest quota for unauthenticated callers', async () => {
    mockLoggedInUser(null);
    const req = new Request('http://localhost/api/game/quota', {
      headers: { 'x-forwarded-for': '192.0.2.77' },
    });
    const res = await getQuota(req);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.jevQuota.isGuest).toBe(true);
    expect(data.jevQuota.limit).toBe(JEV_GUEST_LIMIT_PER_DAY);
    expect(data.jevQuota.remaining).toBe(JEV_GUEST_LIMIT_PER_DAY);
  });

  it('returns user quota for signed-in callers including prior usage', async () => {
    mockLoggedInUser('quota-reader');
    await consumeDailyQuota('u:quota-reader', JEV_USER_LIMIT_PER_DAY);
    await consumeDailyQuota('u:quota-reader', JEV_USER_LIMIT_PER_DAY);

    const req = new Request('http://localhost/api/game/quota');
    const res = await getQuota(req);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.jevQuota.isGuest).toBe(false);
    expect(data.jevQuota.limit).toBe(JEV_USER_LIMIT_PER_DAY);
    expect(data.jevQuota.used).toBe(2);
    expect(data.jevQuota.remaining).toBe(JEV_USER_LIMIT_PER_DAY - 2);
  });
});
