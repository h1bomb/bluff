import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma, isDatabaseConfigured } from '@/lib/db';
import { GameRunRecord } from '@/lib/history/types';

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!isDatabaseConfigured() || !prisma) {
    return NextResponse.json({ error: 'Database is not configured' }, { status: 503 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(Number(searchParams.get('limit')) || 50, 100);
    const status = searchParams.get('status');

    const whereClause: {
      userId: string;
      status?: string;
    } = {
      userId: session.user.id,
    };

    if (status && status !== 'ALL') {
      whereClause.status = status;
    }

    // Select summary and metadata, omit heavy steps in list view
    const runs = await prisma.gameRun.findMany({
      where: whereClause,
      orderBy: { startTime: 'desc' },
      take: limit,
      select: {
        id: true,
        mode: true,
        status: true,
        startTime: true,
        endTime: true,
        durationMs: true,
        summary: true,
        version: true,
        createdAt: true,
      },
    });

    const formattedRuns: GameRunRecord[] = runs.map((r) => ({
      id: r.id,
      startTime: r.startTime,
      endTime: r.endTime ?? undefined,
      durationMs: r.durationMs ?? undefined,
      mode: r.mode as 'roguelike' | 'classic',
      status: r.status as 'IN_PROGRESS' | 'VICTORY' | 'DEFEAT',
      summary: r.summary as unknown as GameRunRecord['summary'],
      steps: [], // empty in list view for performance
      version: r.version,
    }));

    return NextResponse.json({ runs: formattedRuns });
  } catch (error) {
    console.error('Failed to fetch game runs:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!isDatabaseConfigured() || !prisma) {
    return NextResponse.json({ error: 'Database is not configured' }, { status: 503 });
  }

  try {
    const body = (await request.json()) as GameRunRecord;
    if (!body || !body.id || !body.startTime || !body.summary) {
      return NextResponse.json({ error: 'Invalid run record payload' }, { status: 400 });
    }

    const saved = await prisma.gameRun.upsert({
      where: { id: body.id },
      create: {
        id: body.id,
        userId: session.user.id,
        mode: body.mode || 'roguelike',
        status: body.status || 'IN_PROGRESS',
        startTime: body.startTime,
        endTime: body.endTime ?? null,
        durationMs: body.durationMs ?? null,
        summary: body.summary as object,
        steps: (body.steps || []) as object[],
        version: body.version || 1,
      },
      update: {
        status: body.status,
        endTime: body.endTime ?? null,
        durationMs: body.durationMs ?? null,
        summary: body.summary as object,
        steps: (body.steps || []) as object[],
      },
    });

    return NextResponse.json({ success: true, id: saved.id });
  } catch (error) {
    console.error('Failed to save game run:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
