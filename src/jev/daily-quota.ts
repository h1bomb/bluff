import { prisma } from '@/lib/db';

// In-memory fallback when DATABASE_URL is not configured (local dev, tests).
// Attach to globalThis to survive Next.js / Turbopack hot reloads.
const globalStore = globalThis as unknown as {
  __BLUFF_JEV_DAILY_QUOTA__?: Map<string, number>;
};

if (!globalStore.__BLUFF_JEV_DAILY_QUOTA__) {
  globalStore.__BLUFF_JEV_DAILY_QUOTA__ = new Map<string, number>();
}

const memoryCounters = globalStore.__BLUFF_JEV_DAILY_QUOTA__;

export function utcDayBucket(now: number = Date.now()): string {
  return new Date(now).toISOString().slice(0, 10);
}

export interface DailyQuotaSnapshot {
  used: number;
  limit: number;
  remaining: number;
}

function toSnapshot(used: number, limit: number): DailyQuotaSnapshot {
  return { used, limit, remaining: Math.max(0, limit - used) };
}

/**
 * Reads today's usage without consuming. DB-backed when configured,
 * in-memory otherwise.
 */
export async function peekDailyQuota(key: string, limit: number): Promise<DailyQuotaSnapshot> {
  const id = `${key}:${utcDayBucket()}`;
  if (!prisma) {
    return toSnapshot(memoryCounters.get(id) ?? 0, limit);
  }
  try {
    const row = await prisma.jevUsage.findUnique({ where: { id } });
    return toSnapshot(row?.count ?? 0, limit);
  } catch (err) {
    console.error('Failed to read Jev daily quota, treating as unused:', err);
    return toSnapshot(0, limit);
  }
}

/**
 * Atomically consumes one unit of today's quota and reports whether the
 * caller is still within the limit. On DB failure it fails open (allowed)
 * and defers to the in-memory minute limiter as the burst backstop.
 */
export async function consumeDailyQuota(key: string, limit: number): Promise<DailyQuotaSnapshot & { allowed: boolean }> {
  const id = `${key}:${utcDayBucket()}`;
  if (!prisma) {
    const used = (memoryCounters.get(id) ?? 0) + 1;
    memoryCounters.set(id, used);
    return { ...toSnapshot(used, limit), allowed: used <= limit };
  }
  try {
    const row = await prisma.jevUsage.upsert({
      where: { id },
      create: { id, count: 1 },
      update: { count: { increment: 1 } },
    });
    return { ...toSnapshot(row.count, limit), allowed: row.count <= limit };
  } catch (err) {
    console.error('Failed to consume Jev daily quota, failing open:', err);
    return { ...toSnapshot(0, limit), allowed: true };
  }
}

/** Test hook: clear all in-memory daily state. */
export function resetDailyQuotaMemory(): void {
  memoryCounters.clear();
}
