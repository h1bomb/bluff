import { SessionStore } from '@/game/engine/session-store';
import { restoreGameStateFromPublic } from '@/game/engine/game-engine';
import { Card, GameState, PublicGameState } from '@/game/types';

export function resolveSession(gameId: string, clientState?: PublicGameState, requiredCardIds?: string[]): GameState | undefined {
  let game = SessionStore.get(gameId);

  // Resilient Session Auto-Healing: restore if server hot-reloaded
  if (!game && clientState) {
    game = restoreGameStateFromPublic(clientState);
    SessionStore.set(gameId, game);
  }

  // Auto-heal session if game.player.cards does not contain the cards but clientState does
  if (game && clientState?.playerCards && requiredCardIds && requiredCardIds.length > 0) {
    const clientCards: Card[] = clientState.playerCards;
    const hasAllInGame = requiredCardIds.every((id: string) => game?.player?.cards?.some((c) => c.id === id));
    const hasAllInClient = requiredCardIds.every((id: string) => clientCards.some((c: Card) => c.id === id));
    if (!hasAllInGame && hasAllInClient) {
      game = restoreGameStateFromPublic(clientState);
      SessionStore.set(gameId, game);
    }
  }

  return game;
}
