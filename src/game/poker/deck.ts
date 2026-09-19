import { Card, Suit } from '../types';

const SUITS: Suit[] = ['♠', '♥', '♣', '♦'];
const RANKS = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];

export function createDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({
        id: `${suit}${rank}`,
        suit,
        rank,
      });
    }
  }
  return deck;
}

export function shuffleDeck(deck: Card[]): Card[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function dealHands(deck: Card[]): {
  playerCards: Card[];
  aiCards: Card[];
  remainingDeck: Card[];
} {
  const shuffled = shuffleDeck(deck);
  const playerCards = shuffled.slice(0, 3);
  const aiCards = shuffled.slice(3, 6);
  const remainingDeck = shuffled.slice(6);
  return {
    playerCards,
    aiCards,
    remainingDeck,
  };
}

export function dealRoguelikeHand(deck: Card[], handSize = 8): {
  hand: Card[];
  remainingDeck: Card[];
} {
  const shuffled = shuffleDeck(deck);
  return {
    hand: shuffled.slice(0, handSize),
    remainingDeck: shuffled.slice(handSize),
  };
}

