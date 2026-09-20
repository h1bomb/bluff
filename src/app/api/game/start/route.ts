import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { initGame, initRoguelikeGame, sanitizePublicState } from '@/game/engine/game-engine';
import { SessionStore } from '@/game/engine/session-store';
import { sessionKeyFor } from '@/game/engine/session-key';
import { attachGuestCookie, resolveQuotaIdentity } from '@/jev/identity';

export async function POST(req: Request) {
  try {
    const session = await auth();
    const userId = session?.user?.id ?? null;
    const identity = resolveQuotaIdentity(userId, req.headers);

    const body = await req.json().catch(() => ({}));
    const mode = body.mode || 'roguelike';
    const game = mode === 'classic' ? initGame() : initRoguelikeGame();
    SessionStore.set(sessionKeyFor(userId, game.gameId), game);
    const publicState = sanitizePublicState(game);

    return attachGuestCookie(NextResponse.json({
      success: true,
      publicState,
    }), identity);
  } catch (err: unknown) {
    console.error('Error in /api/game/start:', err);
    const message = err instanceof Error ? err.message : 'Failed to start game';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
