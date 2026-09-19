import { GameState } from '../types';

interface SessionEntry {
  state: GameState;
  lastAccessed: number;
}

// Attach to globalThis to survive Next.js / Turbopack hot reloads in development
const globalStore = globalThis as unknown as {
  __BLUFF_SESSIONS__?: Map<string, SessionEntry>;
};

if (!globalStore.__BLUFF_SESSIONS__) {
  globalStore.__BLUFF_SESSIONS__ = new Map<string, SessionEntry>();
}

const sessions = globalStore.__BLUFF_SESSIONS__;

// Cleanup stale sessions older than 2 hours
const SESSION_TTL = 2 * 60 * 60 * 1000;

function cleanup() {
  const now = Date.now();
  for (const [id, session] of sessions.entries()) {
    if (now - session.lastAccessed > SESSION_TTL) {
      sessions.delete(id);
    }
  }
}

export const SessionStore = {
  get(gameId: string): GameState | undefined {
    cleanup();
    const session = sessions.get(gameId);
    if (!session) return undefined;
    session.lastAccessed = Date.now();
    return session.state;
  },

  set(gameId: string, state: GameState): void {
    cleanup();
    sessions.set(gameId, { state, lastAccessed: Date.now() });
  },

  delete(gameId: string): void {
    sessions.delete(gameId);
  },
};
