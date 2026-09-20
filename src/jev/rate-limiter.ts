// Attach to globalThis to survive Next.js / Turbopack hot reloads in development
const globalStore = globalThis as unknown as {
  __BLUFF_JEV_MINUTE_QUOTA__?: Map<string, number[]>;
};

if (!globalStore.__BLUFF_JEV_MINUTE_QUOTA__) {
  globalStore.__BLUFF_JEV_MINUTE_QUOTA__ = new Map<string, number[]>();
}

const callTimestamps = globalStore.__BLUFF_JEV_MINUTE_QUOTA__;

const MINUTE_MS = 60 * 1000;

export interface MinuteQuotaResult {
  allowed: boolean;
  retryAfterSec: number;
}

/**
 * Best-effort in-memory sliding-window burst limiter (per minute).
 * On serverless platforms each instance keeps its own counters, which is fine
 * for burst smoothing; the durable cost cap is the DB-backed daily quota
 * (see daily-quota.ts).
 */
export function consumeMinuteQuota(
  key: string,
  limit: number,
  now: number = Date.now()
): MinuteQuotaResult {
  let timestamps = callTimestamps.get(key);
  if (!timestamps) {
    timestamps = [];
    callTimestamps.set(key, timestamps);
  }

  const minuteAgo = now - MINUTE_MS;
  while (timestamps.length > 0 && timestamps[0] <= minuteAgo) {
    timestamps.shift();
  }

  if (timestamps.length >= limit) {
    return { allowed: false, retryAfterSec: Math.ceil((timestamps[0] + MINUTE_MS - now) / 1000) };
  }

  timestamps.push(now);
  return { allowed: true, retryAfterSec: 0 };
}

/** Test hook: clear all minute-window state. */
export function resetMinuteQuota(): void {
  callTimestamps.clear();
}
