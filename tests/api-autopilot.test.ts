import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/auth', () => ({
  auth: vi.fn().mockResolvedValue(null),
}));

const systemOneMock = vi.hoisted(() => vi.fn());
vi.mock('@typesafe-ai/sdk', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@typesafe-ai/sdk')>();
  return {
    ...actual,
    TypeSafeClient: class {
      systemOne = systemOneMock;
    },
  };
});

import { POST } from '../src/app/api/game/autopilot/route';
import { SessionStore } from '../src/game/engine/session-store';
import { sessionKeyFor } from '../src/game/engine/session-key';
import { initRoguelikeGame } from '../src/game/engine/game-engine';
import { evaluateAutopilotDecisions } from '../src/game/autopilot/evaluator';
import { sanitizePublicState } from '../src/game/engine/game-engine';
import { resetMinuteQuota } from '../src/jev/rate-limiter';
import { peekDailyQuota, resetDailyQuotaMemory } from '../src/jev/daily-quota';
import { GUEST_COOKIE_NAME, JEV_GUEST_LIMIT_PER_DAY, JEV_GUEST_LIMIT_PER_MINUTE } from '../src/jev/identity';
import { consumeMinuteQuota } from '../src/jev/rate-limiter';

const GUEST_KEY = 'g:ap-brain-device';
const HEADERS = { 'Content-Type': 'application/json', cookie: `${GUEST_COOKIE_NAME}=ap-brain-device` };

function post(gameId: string, extra: Record<string, unknown> = {}) {
  return POST(
    new Request('http://localhost/api/game/autopilot', {
      method: 'POST',
      headers: HEADERS,
      body: JSON.stringify({ gameId, ...extra }),
    })
  ).then((r) => r.json());
}

describe('API /api/game/autopilot', () => {
  beforeEach(() => {
    resetMinuteQuota();
    resetDailyQuotaMemory();
    systemOneMock.mockReset();
    delete process.env.TYPESAFE_API_KEY;
  });

  it('returns 404 for unknown sessions and 400 for bad bodies', async () => {
    const missing = await post('nope');
    expect(missing.success).toBe(false);

    const bad = await POST(
      new Request('http://localhost/api/game/autopilot', {
        method: 'POST',
        headers: HEADERS,
        body: JSON.stringify({}),
      })
    ).then((r) => r.json());
    expect(bad.success).toBe(false);
  });

  it('falls back to the top heuristic candidate when no API key is configured, without burning quota', async () => {
    const gameId = 'ap_no_key';
    const game = initRoguelikeGame(gameId);
    SessionStore.set(sessionKeyFor(null, gameId), game);
    const expected = evaluateAutopilotDecisions(sanitizePublicState(game))[0];

    const res = await post(gameId);
    expect(res.success).toBe(true);
    expect(res.fallback).toBe('heuristic');
    expect(res.jevPicked).toBeUndefined();
    expect(res.decision.id).toBe(expected.id);
    expect(systemOneMock).not.toHaveBeenCalled();

    const quota = await peekDailyQuota(GUEST_KEY, JEV_GUEST_LIMIT_PER_DAY);
    expect(quota.used).toBe(0);
  });

  it('lets Jev pick among candidates and consumes exactly one daily quota', async () => {
    const gameId = 'ap_jev_pick';
    const game = initRoguelikeGame(gameId);
    SessionStore.set(sessionKeyFor(null, gameId), game);
    const candidates = evaluateAutopilotDecisions(sanitizePublicState(game));
    expect(candidates.length).toBeGreaterThan(1);

    process.env.TYPESAFE_API_KEY = 'test-key';
    systemOneMock.mockResolvedValue({
      answers: { pick: { choice: 'D1', confidence: 0.83 } },
    });

    const res = await post(gameId);
    expect(res.success).toBe(true);
    expect(res.jevPicked).toBe(true);
    expect(res.jevConfidence).toBeCloseTo(0.83);
    expect(res.decision.id).toBe(candidates[1].id);
    expect(res.jevQuota.used).toBe(1);
    expect(res.jevQuota.remaining).toBe(JEV_GUEST_LIMIT_PER_DAY - 1);
  });

  it('throttles to the heuristic candidate without burning daily quota when the burst window is full', async () => {
    const gameId = 'ap_throttled';
    const game = initRoguelikeGame(gameId);
    SessionStore.set(sessionKeyFor(null, gameId), game);
    const expected = evaluateAutopilotDecisions(sanitizePublicState(game))[0];

    process.env.TYPESAFE_API_KEY = 'test-key';
    const now = Date.now();
    for (let i = 0; i < JEV_GUEST_LIMIT_PER_MINUTE; i++) {
      consumeMinuteQuota(GUEST_KEY, JEV_GUEST_LIMIT_PER_MINUTE, now + i);
    }

    const res = await post(gameId);
    expect(res.success).toBe(true);
    expect(res.jevThrottled).toBe(true);
    expect(res.fallback).toBe('heuristic');
    expect(res.decision.id).toBe(expected.id);
    expect(systemOneMock).not.toHaveBeenCalled();

    const quota = await peekDailyQuota(GUEST_KEY, JEV_GUEST_LIMIT_PER_DAY);
    expect(quota.used).toBe(0);
  });

  it('falls back to the heuristic candidate when Jev errors', async () => {
    const gameId = 'ap_jev_error';
    const game = initRoguelikeGame(gameId);
    SessionStore.set(sessionKeyFor(null, gameId), game);
    const expected = evaluateAutopilotDecisions(sanitizePublicState(game))[0];

    process.env.TYPESAFE_API_KEY = 'test-key';
    systemOneMock.mockRejectedValue(new Error('boom'));

    const res = await post(gameId);
    expect(res.success).toBe(true);
    expect(res.fallback).toBe('heuristic');
    expect(res.decision.id).toBe(expected.id);
  });
});
