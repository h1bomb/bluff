import { GameRunRecord, ActiveGameSession } from './types';

export const DB_NAME = 'bluff_ai_history_db';
export const DB_VERSION = 2;
export const STORE_NAME = 'game_runs';
export const ACTIVE_STORE_NAME = 'active_session';

export const memoryStore: Map<string, GameRunRecord> = new Map();
export let memoryActiveSession: ActiveGameSession | null = null;

export function setMemoryActiveSession(session: ActiveGameSession | null) {
  memoryActiveSession = session;
}

export function getIndexedDB(): IDBFactory | null {
  if (typeof window !== 'undefined' && window.indexedDB) {
    return window.indexedDB;
  }
  const g = globalThis as unknown as { indexedDB?: IDBFactory };
  if (typeof globalThis !== 'undefined' && g.indexedDB) {
    return g.indexedDB;
  }
  return null;
}

export function openDatabase(): Promise<IDBDatabase> {
  const idb = getIndexedDB();
  if (!idb) {
    return Promise.reject(new Error('IndexedDB is not supported in this environment'));
  }

  return new Promise((resolve, reject) => {
    const request = idb.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('startTime', 'startTime', { unique: false });
        store.createIndex('status', 'status', { unique: false });
        store.createIndex('totalScore', 'summary.totalScore', { unique: false });
        store.createIndex('finalAnte', 'summary.finalAnte', { unique: false });
      }
      if (!db.objectStoreNames.contains(ACTIVE_STORE_NAME)) {
        db.createObjectStore(ACTIVE_STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Failed to open IndexedDB'));
  });
}

export async function withStore<T>(
  storeName: string,
  mode: IDBTransactionMode,
  callback: (store: IDBObjectStore, resolve: (value: T) => void, reject: (reason?: unknown) => void) => void
): Promise<T> {
  const db = await openDatabase();
  return new Promise<T>((resolve, reject) => {
    const tx = db.transaction(storeName, mode);
    const store = tx.objectStore(storeName);
    
    callback(store, resolve, reject);
    
    tx.oncomplete = () => db.close();
  });
}
