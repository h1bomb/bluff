import { BehaviorType, PlayerBelief } from '../game/types';

export function clamp(val: number, min = 0, max = 1): number {
  if (isNaN(val)) return min;
  return Math.max(min, Math.min(max, val));
}

export function normalizeBelief(raw: Partial<PlayerBelief>): PlayerBelief {
  const defaultProbs: Partial<Record<BehaviorType, number>> = {
    STRONG_REPRESENTATION: 0.14,
    BLUFF_REPRESENTATION: 0.14,
    BAIT: 0.14,
    PROBE: 0.14,
    DEFENSIVE: 0.14,
    TILT: 0.14,
    UNCLEAR: 0.16,
    GENUINE_STRONG: 0.25,
    CALCULATED_BLUFF: 0.25,
    TEMPO_MANIPULATION: 0.25,
    DESPERATION_DIG: 0.25,
  };

  const rawProbs = raw.behavior?.probabilities || defaultProbs;
  const normalizedProbs: Partial<Record<BehaviorType, number>> = {};
  let sum = 0;

  for (const [k, v] of Object.entries(rawProbs)) {
    if (typeof v === 'number' && !isNaN(v)) {
      const p = Math.max(0, v);
      normalizedProbs[k as BehaviorType] = p;
      sum += p;
    }
  }

  if (sum > 0) {
    for (const k of Object.keys(normalizedProbs) as BehaviorType[]) {
      normalizedProbs[k] = Math.round(((normalizedProbs[k] || 0) / sum) * 1000) / 1000;
    }
  }

  // Cross-alias legacy and roguelike types so callers never miss probabilities
  if (normalizedProbs.GENUINE_STRONG !== undefined && normalizedProbs.STRONG_REPRESENTATION === undefined) {
    normalizedProbs.STRONG_REPRESENTATION = normalizedProbs.GENUINE_STRONG;
  } else if (normalizedProbs.STRONG_REPRESENTATION !== undefined && normalizedProbs.GENUINE_STRONG === undefined) {
    normalizedProbs.GENUINE_STRONG = normalizedProbs.STRONG_REPRESENTATION;
  }

  if (normalizedProbs.CALCULATED_BLUFF !== undefined && normalizedProbs.BLUFF_REPRESENTATION === undefined) {
    normalizedProbs.BLUFF_REPRESENTATION = normalizedProbs.CALCULATED_BLUFF;
  } else if (normalizedProbs.BLUFF_REPRESENTATION !== undefined && normalizedProbs.CALCULATED_BLUFF === undefined) {
    normalizedProbs.CALCULATED_BLUFF = normalizedProbs.BLUFF_REPRESENTATION;
  }

  if (normalizedProbs.TEMPO_MANIPULATION !== undefined && normalizedProbs.BAIT === undefined) {
    normalizedProbs.BAIT = normalizedProbs.TEMPO_MANIPULATION;
  } else if (normalizedProbs.BAIT !== undefined && normalizedProbs.TEMPO_MANIPULATION === undefined) {
    normalizedProbs.TEMPO_MANIPULATION = normalizedProbs.BAIT;
  }

  if (normalizedProbs.DESPERATION_DIG !== undefined && normalizedProbs.DEFENSIVE === undefined) {
    normalizedProbs.DEFENSIVE = normalizedProbs.DESPERATION_DIG;
  } else if (normalizedProbs.DEFENSIVE !== undefined && normalizedProbs.DESPERATION_DIG === undefined) {
    normalizedProbs.DESPERATION_DIG = normalizedProbs.DEFENSIVE;
  }

  // Find dominant behavior
  let topBehavior: BehaviorType = raw.behavior?.value || 'UNCLEAR';
  let maxProb = -1;
  for (const [k, v] of Object.entries(normalizedProbs)) {
    if (typeof v === 'number' && v > maxProb) {
      maxProb = v;
      topBehavior = k as BehaviorType;
    }
  }

  return {
    behavior: {
      value: topBehavior,
      probabilities: normalizedProbs,
      confidence: clamp(raw.behavior?.confidence ?? maxProb),
    },
    bluff: clamp(raw.bluff ?? normalizedProbs.BLUFF_REPRESENTATION ?? normalizedProbs.CALCULATED_BLUFF ?? 0),
    baiting: clamp(raw.baiting ?? normalizedProbs.BAIT ?? normalizedProbs.TEMPO_MANIPULATION ?? 0),
    reversePrediction: clamp(raw.reversePrediction ?? 0.1),
    aggression: clamp(raw.aggression ?? 0.5),
    predictability: clamp(raw.predictability ?? 0.5),
    tilt: clamp(raw.tilt ?? normalizedProbs.TILT ?? 0),
  };
}
