import { Card, EvaluatedHand, HandType } from '../types';
import { enJson, zhJson, format } from '@/lib/i18n/translations';
import { RANK_NAMES } from './constants';

export function evaluate3Cards(cards: Card[]): EvaluatedHand {
  // Sort descending by rank
  const sorted = [...cards].sort((a, b) => b.rank - a.rank);
  const [c1, c2, c3] = sorted;
  const r1 = c1.rank;
  const r2 = c2.rank;
  const r3 = c3.rank;

  const isFlush = c1.suit === c2.suit && c2.suit === c3.suit;

  // Straight check:
  // Normal straight: r1 - r2 === 1 && r2 - r3 === 1
  // Wheel straight: A-2-3 (ranks 14, 3, 2)
  const isNormalStraight = r1 - r2 === 1 && r2 - r3 === 1;
  const isWheelStraight = r1 === 14 && r2 === 3 && r3 === 2;
  const isStraight = isNormalStraight || isWheelStraight;
  const straightHighRank = isWheelStraight ? 3 : r1;

  // Three of a kind
  const isTrips = r1 === r2 && r2 === r3;

  // Pair check
  const isPair = r1 === r2 || r2 === r3 || r1 === r3;
  let pairRank = 0;
  let kickerRank = 0;
  if (isPair && !isTrips) {
    if (r1 === r2) {
      pairRank = r1;
      kickerRank = r3;
    } else if (r2 === r3) {
      pairRank = r2;
      kickerRank = r1;
    } else {
      pairRank = r1;
      kickerRank = r2;
    }
  }

  let handType: HandType;
  let score = 0;
  let description = '';
  let descriptionZh = '';

  if (isStraight && isFlush) {
    handType = 'STRAIGHT_FLUSH';
    score = 6_000_000 + straightHighRank;
    description = format(enJson.pokerHands.evaluatorTemplates.straightFlush, { high: RANK_NAMES[straightHighRank] });
    descriptionZh = format(zhJson.pokerHands.evaluatorTemplates.straightFlush, { high: RANK_NAMES[straightHighRank] });
  } else if (isTrips) {
    handType = 'THREE_OF_A_KIND';
    score = 5_000_000 + r1;
    description = format(enJson.pokerHands.evaluatorTemplates.threeOfAKind, { rank: RANK_NAMES[r1] });
    descriptionZh = format(zhJson.pokerHands.evaluatorTemplates.threeOfAKind, { rank: RANK_NAMES[r1] });
  } else if (isFlush) {
    handType = 'FLUSH';
    score = 4_000_000 + r1 * 225 + r2 * 15 + r3;
    description = format(enJson.pokerHands.evaluatorTemplates.flush, { suit: c1.suit, high: RANK_NAMES[r1] });
    descriptionZh = format(zhJson.pokerHands.evaluatorTemplates.flush, { suit: c1.suit, high: RANK_NAMES[r1] });
  } else if (isStraight) {
    handType = 'STRAIGHT';
    score = 3_000_000 + straightHighRank;
    description = format(enJson.pokerHands.evaluatorTemplates.straight, { high: RANK_NAMES[straightHighRank] });
    descriptionZh = format(zhJson.pokerHands.evaluatorTemplates.straight, { high: RANK_NAMES[straightHighRank] });
  } else if (isPair) {
    handType = 'PAIR';
    score = 2_000_000 + pairRank * 15 + kickerRank;
    description = format(enJson.pokerHands.evaluatorTemplates.pair, { rank: RANK_NAMES[pairRank], kicker: RANK_NAMES[kickerRank] });
    descriptionZh = format(zhJson.pokerHands.evaluatorTemplates.pair, { rank: RANK_NAMES[pairRank], kicker: RANK_NAMES[kickerRank] });
  } else {
    handType = 'HIGH_CARD';
    score = 1_000_000 + r1 * 225 + r2 * 15 + r3;
    description = format(enJson.pokerHands.evaluatorTemplates.highCard, { r1: RANK_NAMES[r1], r2: RANK_NAMES[r2], r3: RANK_NAMES[r3] });
    descriptionZh = format(zhJson.pokerHands.evaluatorTemplates.highCard, { r1: RANK_NAMES[r1], r2: RANK_NAMES[r2], r3: RANK_NAMES[r3] });
  }

  // Calculate normalized strength [0.0, 1.0]
  let strength = 0;
  if (handType === 'HIGH_CARD') {
    const minHc = 5 * 225 + 3 * 15 + 2;
    const maxHc = 14 * 225 + 13 * 15 + 11;
    const frac = Math.max(0, Math.min(1, ((r1 * 225 + r2 * 15 + r3) - minHc) / (maxHc - minHc)));
    strength = 0.02 + frac * 0.43;
  } else if (handType === 'PAIR') {
    const minPair = 2 * 15 + 3;
    const maxPair = 14 * 15 + 13;
    const frac = Math.max(0, Math.min(1, (pairRank * 15 + kickerRank - minPair) / (maxPair - minPair)));
    strength = 0.45 + frac * 0.27;
  } else if (handType === 'STRAIGHT') {
    const frac = Math.max(0, Math.min(1, (straightHighRank - 3) / (14 - 3)));
    strength = 0.72 + frac * 0.10;
  } else if (handType === 'FLUSH') {
    const minFl = 5 * 225 + 3 * 15 + 2;
    const maxFl = 14 * 225 + 13 * 15 + 11;
    const frac = Math.max(0, Math.min(1, ((r1 * 225 + r2 * 15 + r3) - minFl) / (maxFl - minFl)));
    strength = 0.82 + frac * 0.10;
  } else if (handType === 'THREE_OF_A_KIND') {
    const frac = (r1 - 2) / (14 - 2);
    strength = 0.92 + frac * 0.05;
  } else if (handType === 'STRAIGHT_FLUSH') {
    const frac = (straightHighRank - 3) / (14 - 3);
    strength = 0.97 + frac * 0.03;
  }

  return {
    handType,
    score,
    strength: Math.round(strength * 1000) / 1000,
    description,
    descriptionZh,
    cards: sorted,
  };
}
