import { Card, EvaluatedHand, HandType } from '../types';
import { enJson, zhJson, format } from '@/lib/i18n/translations';
import { RANK_NAMES } from './constants';

export function evaluate5Cards(cards: Card[]): EvaluatedHand {
  if (!cards || cards.length < 1 || cards.length > 5) {
    throw new Error(`Evaluating hand requires between 1 and 5 cards, got ${cards?.length ?? 0}`);
  }

  // Sort descending by rank (A=14 ... 2=2)
  const sorted = [...cards].sort((a, b) => b.rank - a.rank);
  const len = sorted.length;

  // Build rank count map
  const rankMap = new Map<number, Card[]>();
  for (const c of sorted) {
    const list = rankMap.get(c.rank) || [];
    list.push(c);
    rankMap.set(c.rank, list);
  }

  // Groups sorted by frequency descending, then rank descending
  const groups = Array.from(rankMap.entries())
    .map(([rank, cardList]) => ({ rank, count: cardList.length, cards: cardList }))
    .sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count;
      return b.rank - a.rank;
    });

  // Check Flush (only possible if len === 5, all same suit)
  const isFlush = len === 5 && sorted.every((c) => c.suit === sorted[0].suit);
  const flushSuit = isFlush ? sorted[0].suit : '';

  // Check Straight (only possible if len === 5, 5 distinct ranks)
  let isStraight = false;
  let straightHighRank = 0;

  if (len === 5 && groups.length === 5) {
    const ranks = sorted.map((c) => c.rank);
    // Normal straight check: r[0] - r[4] === 4
    if (ranks[0] - ranks[4] === 4) {
      isStraight = true;
      straightHighRank = ranks[0];
    } else if (ranks[0] === 14 && ranks[1] === 5 && ranks[2] === 4 && ranks[3] === 3 && ranks[4] === 2) {
      // Ace-low Wheel straight (A-2-3-4-5) -> high rank is 5
      isStraight = true;
      straightHighRank = 5;
    }
  }

  // Determine hand type & scoring cards
  let handType: HandType;
  let score = 0;
  let strength = 0;
  let description = '';
  let descriptionZh = '';
  let scoringCards: Card[] = [];

  // 1. STRAIGHT_FLUSH (5 cards, straight + flush)
  if (isStraight && isFlush) {
    handType = 'STRAIGHT_FLUSH';
    score = 9_000_000 + straightHighRank;
    strength = 0.98 + ((straightHighRank - 5) / (14 - 5)) * 0.02;
    description = format(enJson.pokerHands.evaluatorTemplates.straightFlush, { high: RANK_NAMES[straightHighRank] });
    descriptionZh = format(zhJson.pokerHands.evaluatorTemplates.straightFlush, { high: RANK_NAMES[straightHighRank] });
    scoringCards = sorted;
  }
  // 2. FOUR_OF_A_KIND (>=4 cards, 4 of same rank)
  else if (groups[0].count === 4) {
    handType = 'FOUR_OF_A_KIND';
    const fourRank = groups[0].rank;
    const kickerRank = groups[1] ? groups[1].rank : 0;
    score = 8_000_000 + fourRank * 15 + kickerRank;
    strength = 0.94 + ((fourRank - 2) / 12) * 0.04;
    description = format(enJson.pokerHands.evaluatorTemplates.fourOfAKind, { rank: RANK_NAMES[fourRank] });
    descriptionZh = format(zhJson.pokerHands.evaluatorTemplates.fourOfAKind, { rank: RANK_NAMES[fourRank] });
    scoringCards = groups[0].cards;
  }
  // 3. FULL_HOUSE (5 cards: 3 of one, 2 of another)
  else if (len === 5 && groups[0].count === 3 && groups[1].count === 2) {
    handType = 'FULL_HOUSE';
    const tripsRank = groups[0].rank;
    const pairRank = groups[1].rank;
    score = 7_000_000 + tripsRank * 15 + pairRank;
    strength = 0.88 + ((tripsRank - 2) / 12) * 0.06;
    description = format(enJson.pokerHands.evaluatorTemplates.fullHouse, { r1: RANK_NAMES[tripsRank], r2: RANK_NAMES[pairRank] });
    descriptionZh = format(zhJson.pokerHands.evaluatorTemplates.fullHouse, { r1: RANK_NAMES[tripsRank], r2: RANK_NAMES[pairRank] });
    scoringCards = sorted;
  }
  // 4. FLUSH (5 cards, all same suit)
  else if (isFlush) {
    handType = 'FLUSH';
    const r0 = sorted[0].rank;
    const r1 = sorted[1].rank;
    const r2 = sorted[2].rank;
    const r3 = sorted[3].rank;
    const r4 = sorted[4].rank;
    score = 6_000_000 + r0 * 50625 + r1 * 3375 + r2 * 225 + r3 * 15 + r4;
    strength = 0.82 + ((r0 - 2) / 12) * 0.06;
    description = format(enJson.pokerHands.evaluatorTemplates.flush, { suit: flushSuit, high: RANK_NAMES[r0] });
    descriptionZh = format(zhJson.pokerHands.evaluatorTemplates.flush, { suit: flushSuit, high: RANK_NAMES[r0] });
    scoringCards = sorted;
  }
  // 5. STRAIGHT (5 cards, consecutive ranks)
  else if (isStraight) {
    handType = 'STRAIGHT';
    score = 5_000_000 + straightHighRank;
    strength = 0.72 + ((straightHighRank - 5) / (14 - 5)) * 0.10;
    description = format(enJson.pokerHands.evaluatorTemplates.straight, { high: RANK_NAMES[straightHighRank] });
    descriptionZh = format(zhJson.pokerHands.evaluatorTemplates.straight, { high: RANK_NAMES[straightHighRank] });
    scoringCards = sorted;
  }
  // 6. THREE_OF_A_KIND (>=3 cards, 3 of same rank)
  else if (groups[0].count === 3) {
    handType = 'THREE_OF_A_KIND';
    const tripsRank = groups[0].rank;
    const k1 = groups[1] ? groups[1].rank : 0;
    const k2 = groups[2] ? groups[2].rank : 0;
    score = 4_000_000 + tripsRank * 225 + k1 * 15 + k2;
    strength = 0.60 + ((tripsRank - 2) / 12) * 0.12;
    description = format(enJson.pokerHands.evaluatorTemplates.threeOfAKind, { rank: RANK_NAMES[tripsRank] });
    descriptionZh = format(zhJson.pokerHands.evaluatorTemplates.threeOfAKind, { rank: RANK_NAMES[tripsRank] });
    scoringCards = groups[0].cards;
  }
  // 7. TWO_PAIR (>=4 cards, two distinct pairs)
  else if (groups[0].count === 2 && groups[1] && groups[1].count === 2) {
    handType = 'TWO_PAIR';
    const highPair = Math.max(groups[0].rank, groups[1].rank);
    const lowPair = Math.min(groups[0].rank, groups[1].rank);
    const kicker = groups[2] ? groups[2].rank : 0;
    score = 3_000_000 + highPair * 225 + lowPair * 15 + kicker;
    strength = 0.45 + ((highPair - 2) / 12) * 0.15;
    description = format(enJson.pokerHands.evaluatorTemplates.twoPair, { r1: RANK_NAMES[highPair], r2: RANK_NAMES[lowPair] });
    descriptionZh = format(zhJson.pokerHands.evaluatorTemplates.twoPair, { r1: RANK_NAMES[highPair], r2: RANK_NAMES[lowPair] });
    scoringCards = [...groups[0].cards, ...groups[1].cards];
  }
  // 8. PAIR (>=2 cards, one pair)
  else if (groups[0].count === 2) {
    handType = 'PAIR';
    const pairRank = groups[0].rank;
    const kickers = groups.slice(1).map((g) => g.rank);
    const k1 = kickers[0] || 0;
    const k2 = kickers[1] || 0;
    const k3 = kickers[2] || 0;
    score = 2_000_000 + pairRank * 3375 + k1 * 225 + k2 * 15 + k3;
    strength = 0.25 + ((pairRank - 2) / 12) * 0.20;
    if (len === 2) {
      description = format(enJson.pokerHands.evaluatorTemplates.pairSingle, { rank: RANK_NAMES[pairRank] });
      descriptionZh = format(zhJson.pokerHands.evaluatorTemplates.pairSingle, { rank: RANK_NAMES[pairRank] });
    } else {
      description = format(enJson.pokerHands.evaluatorTemplates.pair, { rank: RANK_NAMES[pairRank], kicker: RANK_NAMES[k1] });
      descriptionZh = format(zhJson.pokerHands.evaluatorTemplates.pair, { rank: RANK_NAMES[pairRank], kicker: RANK_NAMES[k1] });
    }
    scoringCards = groups[0].cards;
  }
  // 9. HIGH_CARD (1..5 cards)
  else {
    handType = 'HIGH_CARD';
    const r0 = sorted[0].rank;
    const r1 = sorted[1]?.rank || 0;
    const r2 = sorted[2]?.rank || 0;
    const r3 = sorted[3]?.rank || 0;
    const r4 = sorted[4]?.rank || 0;
    score = 1_000_000 + r0 * 50625 + r1 * 3375 + r2 * 225 + r3 * 15 + r4;
    strength = 0.05 + ((r0 - 2) / 12) * 0.20;
    if (len === 1) {
      description = format(enJson.pokerHands.evaluatorTemplates.highCardSingle, { r1: RANK_NAMES[r0] });
      descriptionZh = format(zhJson.pokerHands.evaluatorTemplates.highCardSingle, { r1: RANK_NAMES[r0] });
    } else if (len === 2) {
      description = format(enJson.pokerHands.evaluatorTemplates.highCardDouble, { r1: RANK_NAMES[r0], r2: RANK_NAMES[r1] });
      descriptionZh = format(zhJson.pokerHands.evaluatorTemplates.highCardDouble, { r1: RANK_NAMES[r0], r2: RANK_NAMES[r1] });
    } else {
      description = format(enJson.pokerHands.evaluatorTemplates.highCard, { r1: RANK_NAMES[r0] });
      descriptionZh = format(zhJson.pokerHands.evaluatorTemplates.highCard, { r1: RANK_NAMES[r0] });
    }
    scoringCards = [sorted[0]];
  }

  return {
    handType,
    score,
    strength: Math.round(strength * 1000) / 1000,
    description,
    descriptionZh,
    cards: sorted,
    scoringCards,
  };
}
