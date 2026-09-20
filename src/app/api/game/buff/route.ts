import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/auth';
import { SessionStore } from '@/game/engine/session-store';
import { sessionKeyFor } from '@/game/engine/session-key';
import { sanitizePublicState, selectBuffAndNextHand } from '@/game/engine/game-engine';
import { BuffId } from '@/game/types';

const BuffSchema = z.object({
  gameId: z.string(),
  buffId: z.enum(['FALSE_TELL', 'MEMORY_POISON', 'COUNTER_READ', 'MIND_READ']),
});

export async function POST(req: Request) {
  try {
    const session = await auth();
    const userId = session?.user?.id ?? null;

    const body = await req.json();
    const parsed = BuffSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid buff selection', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { gameId, buffId } = parsed.data;
    const sessionKey = sessionKeyFor(userId, gameId);
    const game = SessionStore.get(sessionKey);

    if (!game) {
      return NextResponse.json(
        { success: false, error: 'Game session not found' },
        { status: 404 }
      );
    }

    const updatedGame = selectBuffAndNextHand(game, buffId as BuffId);
    SessionStore.set(sessionKey, updatedGame);
    const publicState = sanitizePublicState(updatedGame);

    return NextResponse.json({
      success: true,
      publicState,
    });
  } catch (err: unknown) {
    console.error('Error in /api/game/buff:', err);
    const message = err instanceof Error ? err.message : 'Failed to select buff';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
