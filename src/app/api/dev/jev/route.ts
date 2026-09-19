import { NextResponse } from 'next/server';
import { TypeSafeJevProvider } from '@/jev/typesafe-provider';
import { HeuristicDecisionProvider } from '@/jev/heuristic-provider';
import { ObservablePlayerState } from '@/game/types';

const typesafe = new TypeSafeJevProvider();
const heuristic = new HeuristicDecisionProvider();

export async function POST(req: Request) {
  // Security guard: Disable dev playground API in production by default
  if (process.env.NODE_ENV === 'production' && process.env.ENABLE_DEV_PLAYGROUND !== 'true') {
    return NextResponse.json(
      { success: false, error: 'Dev playground API is disabled in production environment for security.' },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const { observableState, useProvider = 'auto' } = body as {
      observableState: ObservablePlayerState;
      useProvider?: 'typesafe' | 'heuristic' | 'auto';
    };

    const startTime = Date.now();
    let belief;
    let used = 'heuristic';

    // In production, prevent unauthenticated LLM quota drain even if playground is enabled
    const allowLlm = process.env.NODE_ENV !== 'production' || process.env.DEV_PLAYGROUND_ALLOW_LLM === 'true';

    if (useProvider === 'typesafe' && allowLlm) {
      belief = await typesafe.evaluatePlayer(observableState);
      used = 'typesafe';
    } else if (useProvider === 'heuristic' || !allowLlm) {
      belief = await heuristic.evaluatePlayer(observableState);
      used = 'heuristic';
    } else {
      belief = await typesafe.evaluatePlayer(observableState);
      used = process.env.TYPESAFE_API_KEY ? 'typesafe' : 'heuristic_fallback';
    }

    const latency = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      belief,
      latency,
      providerUsed: used,
    });
  } catch (err: unknown) {
    console.error('Error in /api/dev/jev:', err);
    const message = err instanceof Error ? err.message : 'Jev evaluation error';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
