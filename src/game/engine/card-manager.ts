import { GameState, GameUIEvent, Card } from '../types';
import { shuffleDeck } from '../poker/deck';
import { JOKER_DEFINITIONS } from '../jokers/definitions';

export function drawCards(hand: Card[], drawDeck: Card[], discardPile: Card[], count: number) {
  let deck = [...drawDeck];
  let pile = [...discardPile];
  
  if (deck.length < count) {
    deck = [...deck, ...shuffleDeck(pile)];
    pile = [];
  }
  
  const drawnCards = deck.slice(0, count);
  const remainingDeck = deck.slice(count);
  const newHand = [...hand, ...drawnCards];
  
  return { newHand, remainingDeck, newDiscardPile: pile };
}

export function toggleSelectCard(game: GameState, cardId: string): GameState {
  const currentSelected = new Set(game.selectedCardIds || []);
  if (currentSelected.has(cardId)) {
    currentSelected.delete(cardId);
  } else {
    if (currentSelected.size < 5) {
      currentSelected.add(cardId);
    }
  }
  return {
    ...game,
    selectedCardIds: Array.from(currentSelected),
  };
}

export function setSelectedCards(game: GameState, cardIds: string[]): GameState {
  const validIds = cardIds.slice(0, 5);
  return {
    ...game,
    selectedCardIds: validIds,
  };
}

export function discardSelectedCards(game: GameState): { game: GameState; events: GameUIEvent[] } {
  const events: GameUIEvent[] = [];
  const selectedIds = game.selectedCardIds || [];
  if (selectedIds.length === 0 || (game.discardsLeft ?? 0) <= 0) {
    return { game, events };
  }

  const discardedCards = game.player.cards.filter((c) => selectedIds.includes(c.id));
  const keptCards = game.player.cards.filter((c) => !selectedIds.includes(c.id));

  // Trigger jokers onDiscard
  const jokers = game.jokers || [];
  for (const j of jokers) {
    const def = JOKER_DEFINITIONS[j.jokerKey];
    if (def?.onDiscard) {
      const res = def.onDiscard(discardedCards, j);
      if (res.message) {
        events.push({ type: 'BUFF_TRIGGERED', buffId: 'FALSE_TELL', message: res.message });
      }
    }
  }

  const { newHand, remainingDeck, newDiscardPile } = drawCards(
    keptCards,
    game.drawDeck || [],
    [...(game.discardPile || []), ...discardedCards],
    discardedCards.length
  );

  return {
    game: {
      ...game,
      player: {
        ...game.player,
        cards: newHand,
      },
      drawDeck: remainingDeck,
      discardPile: newDiscardPile,
      discardsLeft: (game.discardsLeft ?? 3) - 1,
      selectedCardIds: [],
    },
    events,
  };
}
