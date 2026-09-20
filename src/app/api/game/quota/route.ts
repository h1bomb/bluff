import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { attachGuestCookie, resolveQuotaIdentity } from '@/jev/identity';
import { peekDailyQuota } from '@/jev/daily-quota';

export async function GET(req: Request) {
  try {
    const session = await auth();
    const identity = resolveQuotaIdentity(session?.user?.id ?? null, req.headers);
    const snapshot = await peekDailyQuota(identity.key, identity.dailyLimit);

    return attachGuestCookie(NextResponse.json({
      success: true,
      jevQuota: { ...snapshot, isGuest: identity.isGuest },
    }), identity);
  } catch (err: unknown) {
    console.error('Error in /api/game/quota:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to load quota' },
      { status: 500 }
    );
  }
}
