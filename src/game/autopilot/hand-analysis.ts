import { Card } from '../types';

/**
 * Cards worth discarding/dumping: not part of the dominant-suit flush draw,
 * not paired, and not part of a consecutive rank run of 3+ (straight draw,
 * Ace counts low for wheel runs). Shared by the discard and dump evaluators.
 */
export function findDeadCards(cards: Card[]): Card[] {
  const suitCounts = new Map<string, number>();
  const rankCounts = new Map<number, number>();
  for (const c of cards) {
    suitCounts.set(c.suit, (suitCounts.get(c.suit) ?? 0) + 1);
    rankCounts.set(c.rank, (rankCounts.get(c.rank) ?? 0) + 1);
  }

  const maxSuitCount = Math.max(...suitCounts.values());
  const dominantSuit = [...suitCounts.entries()].find(([, n]) => n === maxSuitCount)?.[0];

  // Consecutive-rank runs of length >= 3 are straight draws worth keeping.
  const protectedRanks = new Set<number>();
  const uniqueRanks = [...new Set(cards.map((c) => c.rank))].sort((a, b) => a - b);
  const runRanks = uniqueRanks.includes(14) ? [1, ...uniqueRanks] : uniqueRanks;
  let runStart = 0;
  for (let i = 1; i <= runRanks.length; i++) {
    const continues = i < runRanks.length && runRanks[i] === runRanks[i - 1] + 1;
    if (!continues) {
      if (i - runStart >= 3) {
        for (let j = runStart; j < i; j++) protectedRanks.add(runRanks[j]);
      }
      runStart = i;
    }
  }

  return cards.filter((c) => {
    if (maxSuitCount >= 2 && c.suit === dominantSuit) return false;
    if ((rankCounts.get(c.rank) ?? 0) >= 2) return false;
    if (protectedRanks.has(c.rank)) return false;
    if (c.rank === 14 && protectedRanks.has(1)) return false;
    return true;
  });
}
