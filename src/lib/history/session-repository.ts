import { ActiveGameSession } from './types';
import {
  ACTIVE_STORE_NAME,
  getIndexedDB,
  openDatabase,
  memoryActiveSession,
  setMemoryActiveSession,
} from './idb-core';

/**
 * Persist the current ongoing game session to IndexedDB so it survives page reloads.
 */
export async function saveActiveSession(session: ActiveGameSession): Promise<void> {
  const idb = getIndexedDB();
  if (!idb) {
    setMemoryActiveSession(session);
    return;
  }

  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(ACTIVE_STORE_NAME, 'readwrite');
      const store = tx.objectStore(ACTIVE_STORE_NAME);
      const req = store.put({ id: 'current', ...session });

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
      tx.oncomplete = () => db.close();
    });
  } catch (err) {
    console.warn('Falling back to memoryActiveSession for saveActiveSession:', err);
    setMemoryActiveSession(session);
  }
}

/**
 * Retrieve the current in-progress game session if one exists.
 */
export async function getActiveSession(): Promise<ActiveGameSession | null> {
  const idb = getIndexedDB();
  if (!idb) {
    return memoryActiveSession;
  }

  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(ACTIVE_STORE_NAME, 'readonly');
      const store = tx.objectStore(ACTIVE_STORE_NAME);
      const req = store.get('current');

      req.onsuccess = () => {
        if (!req.result) {
          resolve(null);
          return;
        }
        const session = { ...req.result };
        delete session.id;
        resolve(session as ActiveGameSession);
      };
      req.onerror = () => reject(req.error);
      tx.oncomplete = () => db.close();
    });
  } catch (err) {
    console.warn('Falling back to memoryActiveSession for getActiveSession:', err);
    return memoryActiveSession;
  }
}

/**
 * Clear the active session (e.g. when a run ends or is reset).
 */
export async function clearActiveSession(): Promise<void> {
  const idb = getIndexedDB();
  if (!idb) {
    setMemoryActiveSession(null);
    return;
  }

  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(ACTIVE_STORE_NAME, 'readwrite');
      const store = tx.objectStore(ACTIVE_STORE_NAME);
      const req = store.delete('current');

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
      tx.oncomplete = () => db.close();
    });
  } catch (err) {
    console.warn('Falling back to memoryActiveSession for clearActiveSession:', err);
    setMemoryActiveSession(null);
  }
}
