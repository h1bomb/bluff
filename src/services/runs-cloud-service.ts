import { GameRunRecord } from '@/lib/history/types';

export const RunsCloudService = {
  async fetchCloudRuns(): Promise<GameRunRecord[]> {
    try {
      const res = await fetch('/api/runs');
      if (!res.ok) return [];
      const data = await res.json();
      return data.runs || [];
    } catch (err) {
      console.warn('Failed to fetch runs from cloud:', err);
      return [];
    }
  },

  async fetchCloudRunDetail(id: string): Promise<GameRunRecord | null> {
    try {
      const res = await fetch(`/api/runs/${encodeURIComponent(id)}`);
      if (!res.ok) return null;
      const data = await res.json();
      return data.run || null;
    } catch (err) {
      console.warn(`Failed to fetch run details for ${id}:`, err);
      return null;
    }
  },

  async saveCloudRun(run: GameRunRecord): Promise<boolean> {
    try {
      const res = await fetch('/api/runs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(run),
      });
      return res.ok;
    } catch (err) {
      console.warn('Failed to save run to cloud:', err);
      return false;
    }
  },

  async deleteCloudRun(id: string): Promise<boolean> {
    try {
      const res = await fetch(`/api/runs/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      return res.ok;
    } catch (err) {
      console.warn(`Failed to delete run ${id} from cloud:`, err);
      return false;
    }
  },

  async syncLocalRunsToCloud(runs: GameRunRecord[]): Promise<number> {
    if (!runs || runs.length === 0) return 0;
    try {
      const res = await fetch('/api/runs/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ runs }),
      });
      if (!res.ok) return 0;
      const data = await res.json();
      return data.count || 0;
    } catch (err) {
      console.warn('Failed to sync local runs to cloud:', err);
      return 0;
    }
  },
};
