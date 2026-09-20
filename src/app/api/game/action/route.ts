import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { SessionStore } from '@/game/engine/session-store';
import { sessionKeyFor } from '@/game/engine/session-key';
import {
  advanceFromShopToNextBlind,
  buyShopItem,
  rerollShop,
  discardSelectedCards,
  playSelectedCards,
  processPlayerAction,
  sanitizePublicState,
  sellJoker,
  setSelectedCards,
  toggleSelectCard,
} from '@/game/engine/game-engine';
import { selectDecisionProvider } from '@/jev/provider-selector';
import { resolveQuotaIdentity } from '@/jev/identity';
import { GameState, GameUIEvent, PokerAction } from '@/game/types';
import { ActionSchema } from './schema';
import { resolveSession } from './session-resolver';

export async function POST(req: Request) {
  try {
    const session = await auth();
    const userId = session?.user?.id ?? null;
    // Guests get a small daily Jev allowance keyed by IP hash; signed-in
    // users get the full quota. Exhaustion falls back to heuristic.
    const identity = resolveQuotaIdentity(userId, req.headers);
    const { provider, wasThrottled, quotaSnapshot } = selectDecisionProvider(identity);

    const body = await req.json();
    const parsed = ActionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid request body', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { gameId, action, delayMs, sequence, cardId, cardIds, item, jokerId, clientState } = parsed.data;
    const sessionKey = sessionKeyFor(userId, gameId);

    // Initial fetch to check existence
    let game = resolveSession(sessionKey, clientState);

    if (!game) {
      return NextResponse.json(
        { success: false, error: 'Game session not found or expired' },
        { status: 404 }
      );
    }

    const respond = (updated: GameState, extra?: Record<string, unknown>) => {
      SessionStore.set(sessionKey, updated);
      const events = extra?.events as GameUIEvent[] | undefined;
      return NextResponse.json({
        success: true,
        publicState: sanitizePublicState(updated, events),
        sequence: sequence + 1,
        ...extra,
      });
    };

    // 1. Roguelike Card Selection
    if (action === 'TOGGLE_SELECT') {
      if (!cardId) {
        return NextResponse.json({ success: false, error: 'cardId is required' }, { status: 400 });
      }
      return respond(toggleSelectCard(game, cardId));
    }

    if (action === 'SET_SELECTED_CARDS') {
      return respond(setSelectedCards(game, cardIds || []));
    }

    // 2. Roguelike Discard
    if (action === 'DISCARD') {
      const idsToDiscard = cardIds && cardIds.length > 0 ? cardIds : (game?.selectedCardIds || []);
      game = resolveSession(sessionKey, clientState, idsToDiscard)!;
      if (idsToDiscard.length > 0) {
        game = setSelectedCards(game, idsToDiscard);
      }
      const { game: updated, events } = discardSelectedCards(game);
      return respond(updated, { events });
    }

    // 3. Roguelike Play Hand
    if (action === 'PLAY_HAND') {
      let idsToPlay = cardIds && cardIds.length >= 1 && cardIds.length <= 5 ? cardIds : (game?.selectedCardIds || []);
      game = resolveSession(sessionKey, clientState, idsToPlay)!;

      const matchingCards = (game?.player?.cards || []).filter((c) => idsToPlay.includes(c.id));
      if ((matchingCards.length < 1 || matchingCards.length > 5) && (game?.player?.cards || []).length >= 1) {
        idsToPlay = game.player.cards.slice(0, Math.min(3, game.player.cards.length)).map((c) => c.id);
      }

      game = setSelectedCards(game, idsToPlay);
      const { game: updated, events, scoreResult } = await playSelectedCards(game, delayMs ?? 500, provider);
      return respond(updated, {
        events,
        scoreResult,
        ...(wasThrottled() ? { jevThrottled: true } : {}),
        ...(quotaSnapshot() ? { jevQuota: quotaSnapshot() } : {}),
      });
    }

    // 4. Roguelike Buy Shop Item
    if (action === 'BUY_ITEM') {
      if (!item) {
        return NextResponse.json({ success: false, error: 'item is required' }, { status: 400 });
      }
      const { game: updated, success, message } = buyShopItem(game, item);
      if (success) {
        SessionStore.set(sessionKey, updated);
      }
      return NextResponse.json({
        success,
        message,
        publicState: sanitizePublicState(updated),
        sequence: sequence + 1,
      });
    }

    // 5. Roguelike Sell Joker
    if (action === 'SELL_JOKER') {
      if (!jokerId) {
        return NextResponse.json({ success: false, error: 'jokerId is required' }, { status: 400 });
      }
      return respond(sellJoker(game, jokerId));
    }

    // 5.5 Roguelike Reroll Shop
    if (action === 'REROLL_SHOP') {
      const { game: updated, success, message } = rerollShop(game);
      if (success) {
        SessionStore.set(sessionKey, updated);
      }
      return NextResponse.json({
        success,
        message,
        publicState: sanitizePublicState(updated),
        sequence: sequence + 1,
      });
    }

    // 6. Roguelike Next Blind
    if (action === 'NEXT_BLIND') {
      return respond(advanceFromShopToNextBlind(game));
    }

    // 7. Classic Poker Action (FOLD, CALL, RAISE, ALL_IN)
    if (game.phase !== 'PLAYER_TURN') {
      return NextResponse.json(
        { success: false, error: `Invalid phase for action: ${game.phase}` },
        { status: 400 }
      );
    }

    const { game: updatedGame, events } = await processPlayerAction(
      game,
      action as PokerAction,
      delayMs ?? 500,
      provider
    );

    return respond(updatedGame, {
      events,
      ...(wasThrottled() ? { jevThrottled: true } : {}),
      ...(quotaSnapshot() ? { jevQuota: quotaSnapshot() } : {}),
    });
  } catch (err: unknown) {
    console.error('Error in /api/game/action:', err);
    const message = err instanceof Error ? err.message : 'Internal action processing error';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
