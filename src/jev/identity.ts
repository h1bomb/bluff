import { createHash, randomUUID } from 'crypto';
import { NextResponse } from 'next/server';

export const JEV_USER_LIMIT_PER_MINUTE = Math.max(
  1,
  Number(process.env.JEV_RATE_LIMIT_PER_MINUTE) || 40
);
export const JEV_USER_LIMIT_PER_DAY = Math.max(
  1,
  Number(process.env.JEV_RATE_LIMIT_PER_DAY) || 600
);
export const JEV_GUEST_LIMIT_PER_MINUTE = Math.max(
  1,
  Number(process.env.JEV_GUEST_RATE_LIMIT_PER_MINUTE) || 10
);
export const JEV_GUEST_LIMIT_PER_DAY = Math.max(
  1,
  Number(process.env.JEV_GUEST_RATE_LIMIT_PER_DAY) || 100
);
// Aggregate backstop per egress IP: stops cookie-rotation abuse without
// false-sharing the device quota across a corporate WiFi / NAT.
export const JEV_GUEST_IP_LIMIT_PER_MINUTE = Math.max(
  1,
  Number(process.env.JEV_GUEST_IP_RATE_LIMIT_PER_MINUTE) || 30
);
export const JEV_GUEST_IP_LIMIT_PER_DAY = Math.max(
  1,
  Number(process.env.JEV_GUEST_IP_RATE_LIMIT_PER_DAY) || 1000
);

export const GUEST_COOKIE_NAME = 'bluff_gid';
const GUEST_COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

export interface QuotaIdentity {
  /** Primary quota key: "u:{userId}", "g:{deviceId}" or "g:ip:{ipHash}". */
  key: string;
  isGuest: boolean;
  minuteLimit: number;
  dailyLimit: number;
  /** Aggregate per-IP backstop key for guests; null for signed-in users. */
  ipKey: string | null;
  ipMinuteLimit: number;
  ipDailyLimit: number;
  /** When set, the response must issue this guest device cookie. */
  setGuestId: string | null;
}

function extractClientIp(headers: Headers): string {
  const forwarded = headers.get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim();
    if (first) return first;
  }
  return headers.get('x-real-ip')?.trim() || 'unknown';
}

function hashIp(ip: string): string {
  const salt = process.env.AUTH_SECRET || 'bluff_guest_quota_salt';
  return createHash('sha256').update(`${ip}:${salt}`).digest('hex').slice(0, 16);
}

function readGuestCookie(headers: Headers): string | null {
  const raw = headers.get('cookie');
  if (!raw) return null;
  const match = raw.match(/(?:^|;\s*)bluff_gid=([a-zA-Z0-9-]{8,64})\b/);
  return match?.[1] ?? null;
}

/**
 * Resolves the quota identity for a request.
 * - Signed-in users: keyed by userId.
 * - Guests with a device cookie: keyed by device id, so people sharing an
 *   egress IP (corporate WiFi, NAT) each get their own daily quota.
 * - Guests without a cookie (scripts, first hit): keyed by IP hash; a device
 *   cookie is issued via setGuestId so browsers upgrade on the next request.
 * Guest calls additionally consume a generous aggregate per-IP quota that
 * only exists to stop cookie-rotation abuse.
 */
export function resolveQuotaIdentity(userId: string | null | undefined, headers: Headers): QuotaIdentity {
  if (userId) {
    return {
      key: `u:${userId}`,
      isGuest: false,
      minuteLimit: JEV_USER_LIMIT_PER_MINUTE,
      dailyLimit: JEV_USER_LIMIT_PER_DAY,
      ipKey: null,
      ipMinuteLimit: 0,
      ipDailyLimit: 0,
      setGuestId: null,
    };
  }

  const ipHash = hashIp(extractClientIp(headers));
  const deviceId = readGuestCookie(headers);

  return {
    key: deviceId ? `g:${deviceId}` : `g:ip:${ipHash}`,
    isGuest: true,
    minuteLimit: JEV_GUEST_LIMIT_PER_MINUTE,
    dailyLimit: JEV_GUEST_LIMIT_PER_DAY,
    ipKey: `ip:${ipHash}`,
    ipMinuteLimit: JEV_GUEST_IP_LIMIT_PER_MINUTE,
    ipDailyLimit: JEV_GUEST_IP_LIMIT_PER_DAY,
    setGuestId: deviceId ? null : randomUUID(),
  };
}

/** Issues the guest device cookie on the response when identity requires it. */
export function attachGuestCookie(res: NextResponse, identity: QuotaIdentity): NextResponse {
  if (identity.setGuestId) {
    res.cookies.set(GUEST_COOKIE_NAME, identity.setGuestId, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: GUEST_COOKIE_MAX_AGE,
      path: '/',
    });
  }
  return res;
}
