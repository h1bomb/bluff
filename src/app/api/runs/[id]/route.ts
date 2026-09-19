import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma, isDatabaseConfigured } from '@/lib/db';
import { GameRunRecord } from '@/lib/history/types';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!isDatabaseConfigured() || !prisma) {
    return NextResponse.json({ error: 'Database is not configured' }, { status: 503 });
  }

  try {
    const { id } = await params;
    const run = await prisma.gameRun.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!run) {
      return NextResponse.json({ error: 'Run not found' }, { status: 404 });
    }

    const formattedRun: GameRunRecord = {
      id: run.id,
      startTime: run.startTime,
      endTime: run.endTime ?? undefined,
      durationMs: run.durationMs ?? undefined,
      mode: run.mode as 'roguelike' | 'classic',
      status: run.status as 'IN_PROGRESS' | 'VICTORY' | 'DEFEAT',
      summary: run.summary as unknown as GameRunRecord['summary'],
      steps: run.steps as unknown as GameRunRecord['steps'],
      version: run.version,
    };

    return NextResponse.json({ run: formattedRun });
  } catch (error) {
    console.error('Failed to get game run replay:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!isDatabaseConfigured() || !prisma) {
    return NextResponse.json({ error: 'Database is not configured' }, { status: 503 });
  }

  try {
    const { id } = await params;
    await prisma.gameRun.deleteMany({
      where: {
        id,
        userId: session.user.id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete game run:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
