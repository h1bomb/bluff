/**
 * Server-side session keys are bound to the caller's identity.
 * Logged-in users get `u:{userId}:{gameId}` so a leaked or guessed gameId
 * cannot be used to drive another user's game. Guests are keyed by gameId
 * alone (guest sessions never invoke paid AI calls, so the gameId itself
 * acts as the capability token).
 */
export function sessionKeyFor(userId: string | null | undefined, gameId: string): string {
  return userId ? `u:${userId}:${gameId}` : `guest:${gameId}`;
}
