import { GameRunRecord } from './types';
import { getAllGameRuns, saveGameRun } from './runs-repository';

/**
 * Format a run record as formatted JSON string.
 */
export function exportRunToJson(run: GameRunRecord): string {
  return JSON.stringify(run, null, 2);
}

/**
 * Trigger download of a single run record as a JSON file in the browser.
 */
export function downloadRunAsJson(run: GameRunRecord): void {
  if (typeof window === 'undefined') return;

  const jsonStr = exportRunToJson(run);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');

  const dateStr = new Date(run.startTime).toISOString().slice(0, 10);
  const statusStr = run.status.toLowerCase();
  a.href = url;
  a.download = `bluff_run_${run.id}_ante${run.summary.finalAnte}_${statusStr}_${dateStr}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Download all stored game runs in one combined JSON backup file.
 */
export async function downloadAllRunsAsJson(): Promise<void> {
  if (typeof window === 'undefined') return;

  const runs = await getAllGameRuns();
  const jsonStr = JSON.stringify(runs, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');

  const dateStr = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `bluff_all_runs_backup_${dateStr}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Import a game run from a JSON string, validate, and save to IndexedDB.
 */
export async function importRunFromJson(jsonString: string): Promise<GameRunRecord> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonString);
  } catch {
    throw new Error('无效的 JSON 格式 (Invalid JSON file format)');
  }

  // Handle single run or array of runs
  if (Array.isArray(parsed)) {
    if (parsed.length === 0) {
      throw new Error('导入的战局列表为空 (Run array is empty)');
    }
    for (const run of parsed) {
      validateRunRecord(run);
      await saveGameRun(run);
    }
    return parsed[0] as GameRunRecord;
  } else {
    validateRunRecord(parsed);
    await saveGameRun(parsed);
    return parsed;
  }
}

export function validateRunRecord(data: unknown): asserts data is GameRunRecord {
  if (!data || typeof data !== 'object') {
    throw new Error('战局数据格式错误：非有效对象 (Invalid run record object)');
  }
  const rec = data as Partial<GameRunRecord>;
  if (!rec.id || typeof rec.id !== 'string') {
    throw new Error('战局缺少有效 ID (Missing run ID)');
  }
  if (!Array.isArray(rec.steps)) {
    throw new Error('战局缺少回放步骤列表 (Missing replay steps)');
  }
  if (!rec.summary || typeof rec.summary !== 'object') {
    throw new Error('战局缺少战绩汇总数据 (Missing summary data)');
  }
  if (typeof rec.summary.finalBlind === 'object' && rec.summary.finalBlind !== null) {
    const b = rec.summary.finalBlind as { nameZh?: string; name?: string; bossNameZh?: string; bossName?: string };
    rec.summary.finalBlind = b.nameZh || b.name || b.bossNameZh || b.bossName || 'BOSS';
  } else if (typeof rec.summary.finalBlind !== 'string') {
    rec.summary.finalBlind = String(rec.summary.finalBlind || '');
  }
}
