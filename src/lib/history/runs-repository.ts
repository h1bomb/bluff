import { GameRunRecord, GameReplayStep, GameRunSummary } from './types';
import {
  STORE_NAME,
  getIndexedDB,
  withStore,
  memoryStore,
} from './idb-core';

export function sanitizeRunSummary(summary?: GameRunSummary): GameRunSummary {
  if (!summary) {
    return {
      finalAnte: 1,
      finalBlind: 'SMALL',
      totalScore: 0,
      peakRoundScore: 0,
      totalHandsPlayed: 0,
      totalDiscards: 0,
      totalPurchases: 0,
      finalMoney: 0,
      jokersCount: 0,
      modelBreaksCount: 0,
      jokersSnapshot: [],
    };
  }

  let finalBlind = summary.finalBlind;
  if (typeof finalBlind === 'object' && finalBlind !== null) {
    const b = finalBlind as { nameZh?: string; name?: string; bossNameZh?: string; bossName?: string };
    finalBlind = b.nameZh || b.name || b.bossNameZh || b.bossName || 'BOSS';
  } else if (typeof finalBlind !== 'string') {
    finalBlind = String(finalBlind || '');
  }

  return {
    ...summary,
    finalAnte: typeof summary.finalAnte === 'number' ? summary.finalAnte : 1,
    finalBlind,
  };
}

export function sanitizeRunRecord(run: GameRunRecord): GameRunRecord {
  if (!run) return run;
  return {
    ...run,
    summary: sanitizeRunSummary(run.summary),
  };
}

/**
 * Save or completely overwrite a game run record.
 */
export async function saveGameRun(run: GameRunRecord): Promise<void> {
  const sanitizedRun = sanitizeRunRecord(run);
  if (!getIndexedDB()) {
    memoryStore.set(sanitizedRun.id, sanitizedRun);
    return;
  }

  try {
    await withStore<void>(STORE_NAME, 'readwrite', (store, resolve, reject) => {
      const req = store.put(sanitizedRun);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Falling back to memoryStore for saveGameRun:', err);
    memoryStore.set(sanitizedRun.id, sanitizedRun);
  }
}

/**
 * Appends a step to an existing run, updating its summary and status.
 */
export async function appendReplayStep(
  runId: string,
  step: GameReplayStep,
  summaryDelta?: Partial<GameRunSummary>,
  statusUpdate?: 'IN_PROGRESS' | 'VICTORY' | 'DEFEAT'
): Promise<void> {
  const existing = await getGameRun(runId);
  if (!existing) {
    console.warn(`Run ${runId} not found in database to append step.`);
    return;
  }

  existing.steps.push(step);
  if (summaryDelta) {
    existing.summary = {
      ...existing.summary,
      finalAnte: summaryDelta.finalAnte ?? existing.summary.finalAnte,
      finalBlind: summaryDelta.finalBlind ?? existing.summary.finalBlind,
      totalScore: existing.summary.totalScore + (summaryDelta.totalScore ?? 0),
      peakRoundScore: Math.max(existing.summary.peakRoundScore, summaryDelta.peakRoundScore ?? 0),
      totalHandsPlayed: existing.summary.totalHandsPlayed + (summaryDelta.totalHandsPlayed ?? 0),
      totalDiscards: existing.summary.totalDiscards + (summaryDelta.totalDiscards ?? 0),
      totalPurchases: existing.summary.totalPurchases + (summaryDelta.totalPurchases ?? 0),
      modelBreaksCount: existing.summary.modelBreaksCount + (summaryDelta.modelBreaksCount ?? 0),
      finalMoney: summaryDelta.finalMoney ?? existing.summary.finalMoney,
      jokersCount: summaryDelta.jokersCount ?? existing.summary.jokersCount,
      jokersSnapshot: summaryDelta.jokersSnapshot ?? existing.summary.jokersSnapshot,
    };
  }

  if (statusUpdate) {
    existing.status = statusUpdate;
    if (statusUpdate !== 'IN_PROGRESS') {
      existing.endTime = Date.now();
      existing.durationMs = existing.endTime - existing.startTime;
    }
  }

  await saveGameRun(existing);
}

/**
 * Retrieve a specific game run record by ID.
 */
export async function getGameRun(runId: string): Promise<GameRunRecord | null> {
  if (!getIndexedDB()) {
    const memRun = memoryStore.get(runId);
    return memRun ? sanitizeRunRecord(memRun) : null;
  }

  try {
    return await withStore(STORE_NAME, 'readonly', (store, resolve, reject) => {
      const req = store.get(runId);
      req.onsuccess = () => {
        const res = req.result;
        resolve(res ? sanitizeRunRecord(res) : null);
      };
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Falling back to memoryStore for getGameRun:', err);
    const memRun = memoryStore.get(runId);
    return memRun ? sanitizeRunRecord(memRun) : null;
  }
}

/**
 * Get all game run records, sorted with newest first.
 */
export async function getAllGameRuns(): Promise<GameRunRecord[]> {
  if (!getIndexedDB()) {
    const list = Array.from(memoryStore.values())
      .filter((r) => r.status === 'VICTORY' || r.status === 'DEFEAT')
      .map(sanitizeRunRecord);
    list.sort((a, b) => b.startTime - a.startTime);
    return list;
  }

  try {
    const results = await withStore<GameRunRecord[]>(STORE_NAME, 'readonly', (store, resolve, reject) => {
      const req = store.getAll();
      req.onsuccess = () => {
        const filtered = (req.result || [])
          .filter((r: GameRunRecord) => r.status === 'VICTORY' || r.status === 'DEFEAT')
          .map(sanitizeRunRecord);
        filtered.sort((a: GameRunRecord, b: GameRunRecord) => b.startTime - a.startTime);
        resolve(filtered);
      };
      req.onerror = () => reject(req.error);
    });
    return results;
  } catch (err) {
    console.warn('Falling back to memoryStore for getAllGameRuns:', err);
    const list = Array.from(memoryStore.values())
      .filter((r) => r.status === 'VICTORY' || r.status === 'DEFEAT')
      .map(sanitizeRunRecord);
    list.sort((a, b) => b.startTime - a.startTime);
    return list;
  }
}

/**
 * Delete a specific run record by ID.
 */
export async function deleteGameRun(runId: string): Promise<void> {
  if (!getIndexedDB()) {
    memoryStore.delete(runId);
    return;
  }

  try {
    await withStore<void>(STORE_NAME, 'readwrite', (store, resolve, reject) => {
      const req = store.delete(runId);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Falling back to memoryStore for deleteGameRun:', err);
    memoryStore.delete(runId);
  }
}

/**
 * Clear all game runs from the database.
 */
export async function clearAllGameRuns(): Promise<void> {
  if (!getIndexedDB()) {
    memoryStore.clear();
    return;
  }

  try {
    await withStore<void>(STORE_NAME, 'readwrite', (store, resolve, reject) => {
      const req = store.clear();
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Falling back to memoryStore for clearAllGameRuns:', err);
    memoryStore.clear();
  }
}
