import { NextResponse } from 'next/server';
import { initGame, initRoguelikeGame, sanitizePublicState } from '@/game/engine/game-engine';
import { SessionStore } from '@/game/engine/session-store';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const mode = body.mode || 'roguelike';
    const game = mode === 'classic' ? initGame() : initRoguelikeGame();
    SessionStore.set(game.gameId, game);
    const publicState = sanitizePublicState(game);

    return NextResponse.json({
      success: true,
      publicState,
    });
  } catch (err: unknown) {
    console.error('Error in /api/game/start:', err);
    const message = err instanceof Error ? err.message : 'Failed to start game';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
