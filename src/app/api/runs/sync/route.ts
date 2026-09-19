import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma, isDatabaseConfigured } from '@/lib/db';
import { GameRunRecord } from '@/lib/history/types';

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!isDatabaseConfigured() || !prisma) {
    return NextResponse.json({ error: 'Database is not configured' }, { status: 503 });
  }

  try {
    const { runs } = (await request.json()) as { runs?: GameRunRecord[] };
    if (!runs || !Array.isArray(runs) || runs.length === 0) {
      return NextResponse.json({ success: true, count: 0 });
    }

    let syncedCount = 0;
    for (const run of runs) {
      if (!run || !run.id || !run.startTime || !run.summary) continue;

      await prisma.gameRun.upsert({
        where: { id: run.id },
        create: {
          id: run.id,
          userId: session.user.id,
          mode: run.mode || 'roguelike',
          status: run.status || 'IN_PROGRESS',
          startTime: run.startTime,
          endTime: run.endTime ?? null,
          durationMs: run.durationMs ?? null,
          summary: run.summary as object,
          steps: (run.steps || []) as object[],
          version: run.version || 1,
        },
        update: {
          status: run.status,
          endTime: run.endTime ?? null,
          durationMs: run.durationMs ?? null,
          summary: run.summary as object,
          steps: (run.steps || []) as object[],
        },
      });
      syncedCount++;
    }

    return NextResponse.json({ success: true, count: syncedCount });
  } catch (error) {
    console.error('Failed to sync game runs:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
