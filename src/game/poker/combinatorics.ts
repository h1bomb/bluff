import { Card } from '../types';

export function getSubsetsOf3(arr: Card[]): Card[][] {
  const result: Card[][] = [];
  function backtrack(start: number, current: Card[]) {
    if (current.length === 3) {
      result.push([...current]);
      return;
    }
    for (let i = start; i < arr.length; i++) {
      current.push(arr[i]);
      backtrack(i + 1, current);
      current.pop();
    }
  }
  backtrack(0, []);
  return result;
}
