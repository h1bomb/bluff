import { Card, EvaluatedHand } from '../types';
import { evaluate5Cards } from './evaluator-5cards';

export { RANK_NAMES } from './constants';
export { getSubsetsOf3 } from './combinatorics';
export { evaluate3Cards } from './evaluator-3cards';
export { evaluate5Cards } from './evaluator-5cards';

export function evaluateHand(cards: Card[]): EvaluatedHand {
  return evaluate5Cards(cards);
}

export function compareHands(handA: EvaluatedHand, handB: EvaluatedHand): number {
  if (handA.score > handB.score) return 1;
  if (handA.score < handB.score) return -1;
  return 0;
}
