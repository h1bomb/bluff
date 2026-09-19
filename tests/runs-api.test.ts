import { describe, it, expect, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET as getRuns, POST as postRun } from '@/app/api/runs/route';
import { POST as syncRuns } from '@/app/api/runs/sync/route';
import { GET as getSingleRun, DELETE as deleteSingleRun } from '@/app/api/runs/[id]/route';
import { RunsCloudService } from '@/services/runs-cloud-service';
import { GameRunRecord } from '@/lib/history/types';

vi.mock('@/auth', () => ({
  auth: vi.fn().mockResolvedValue(null),
}));

describe('Runs API Security & Validation', () => {
  it('rejects unauthenticated GET /api/runs with 401', async () => {
    const req = new NextRequest('http://localhost:3000/api/runs');
    const res = await getRuns(req);
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toBe('Unauthorized');
  });

  it('rejects unauthenticated POST /api/runs with 401', async () => {
    const req = new NextRequest('http://localhost:3000/api/runs', {
      method: 'POST',
      body: JSON.stringify({ id: 'test' }),
    });
    const res = await postRun(req);
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toBe('Unauthorized');
  });

  it('rejects unauthenticated POST /api/runs/sync with 401', async () => {
    const req = new NextRequest('http://localhost:3000/api/runs/sync', {
      method: 'POST',
      body: JSON.stringify({ runs: [] }),
    });
    const res = await syncRuns(req);
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toBe('Unauthorized');
  });

  it('rejects unauthenticated GET /api/runs/[id] with 401', async () => {
    const req = new NextRequest('http://localhost:3000/api/runs/run_123');
    const res = await getSingleRun(req, { params: Promise.resolve({ id: 'run_123' }) });
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toBe('Unauthorized');
  });

  it('rejects unauthenticated DELETE /api/runs/[id] with 401', async () => {
    const req = new NextRequest('http://localhost:3000/api/runs/run_123', {
      method: 'DELETE',
    });
    const res = await deleteSingleRun(req, { params: Promise.resolve({ id: 'run_123' }) });
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toBe('Unauthorized');
  });
});

describe('RunsCloudService', () => {
  it('gracefully handles fetch failure and returns empty list', async () => {
    const originalFetch = global.fetch;
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ error: 'Unauthorized' }),
    });

    try {
      const runs = await RunsCloudService.fetchCloudRuns();
      expect(runs).toEqual([]);
    } finally {
      global.fetch = originalFetch;
    }
  });

  it('gracefully handles network exceptions in saveCloudRun', async () => {
    const originalFetch = global.fetch;
    global.fetch = vi.fn().mockRejectedValue(new Error('Network disconnected'));

    const dummyRun: GameRunRecord = {
      id: 'run_test_1',
      startTime: Date.now(),
      mode: 'roguelike',
      status: 'VICTORY',
      summary: {
        finalAnte: 8,
        finalBlind: 'BOSS',
        totalScore: 50000,
        peakRoundScore: 20000,
        totalHandsPlayed: 10,
        totalDiscards: 5,
        totalPurchases: 3,
        finalMoney: 25,
        jokersCount: 4,
        modelBreaksCount: 2,
        jokersSnapshot: [],
      },
      steps: [],
      version: 1,
    };

    try {
      const result = await RunsCloudService.saveCloudRun(dummyRun);
      expect(result).toBe(false);
    } finally {
      global.fetch = originalFetch;
    }
  });
});
