import { PlayerBelief, EvaluatedHand } from '../types';
import { enJson, zhJson, format } from '@/lib/i18n/translations';

export interface CognitiveEvaluationResult {
  isModelBreak: boolean;
  modelBreakBonus: number;
  cognitiveMult: number;
  stepParams?: {
    type: 'COGNITIVE_MULT';
    source: string;
    cognitiveMult: number;
    message: string;
    messageZh: string;
    isModelBreak?: boolean;
  };
}

export function evaluateCognitiveMultiplier(
  belief: PlayerBelief | undefined,
  evaluated: EvaluatedHand
): CognitiveEvaluationResult {
  let isModelBreak = false;
  let modelBreakBonus = 0;
  let cognitiveMult = 1.0;
  let stepParams: CognitiveEvaluationResult['stepParams'];

  if (!belief) {
    return { isModelBreak, modelBreakBonus, cognitiveMult };
  }

  const probs = (belief.behavior.probabilities || {}) as Record<string, number | undefined>;
  const strongProb = probs.STRONG_REPRESENTATION ?? probs.GENUINE_STRONG ?? 0;
  const isAiPredictingStrong =
    belief.behavior.value === 'STRONG_REPRESENTATION' ||
    belief.behavior.value === 'GENUINE_STRONG' ||
    strongProb >= 0.70;
  const aiStrongConfidence = Math.max(strongProb, isAiPredictingStrong ? belief.behavior.confidence : 0);
  const isTrulyWeakHand = evaluated.strength < 0.35;

  if (isTrulyWeakHand && isAiPredictingStrong && aiStrongConfidence >= 0.75 && belief.bluff < 0.25) {
    isModelBreak = true;
    const breakMult = Math.min(25, 4.0 + aiStrongConfidence * 14.0);
    cognitiveMult = Math.round(breakMult * 10) / 10;
    modelBreakBonus = Math.round(aiStrongConfidence * 150);

    stepParams = {
      type: 'COGNITIVE_MULT',
      source: 'MODEL_BREAK',
      cognitiveMult,
      message: format(enJson.scoring.stepTemplates.modelBreakStrong, {
        conf: Math.round(aiStrongConfidence * 100),
        mult: cognitiveMult.toFixed(1),
      }),
      messageZh: format(zhJson.scoring.stepTemplates.modelBreakStrong, {
        conf: Math.round(aiStrongConfidence * 100),
        mult: cognitiveMult.toFixed(1),
      }),
      isModelBreak: true,
    };
  } else if (evaluated.strength >= 0.80 && belief.bluff >= 0.75) {
    isModelBreak = true;
    cognitiveMult = 5.0;
    modelBreakBonus = Math.round(belief.bluff * 150);
    stepParams = {
      type: 'COGNITIVE_MULT',
      source: 'MODEL_BREAK',
      cognitiveMult,
      message: format(enJson.scoring.stepTemplates.modelBreakMonster, {
        bluff: Math.round(belief.bluff * 100),
        mult: '5.0',
      }),
      messageZh: format(zhJson.scoring.stepTemplates.modelBreakMonster, {
        bluff: Math.round(belief.bluff * 100),
        mult: '5.0',
      }),
      isModelBreak: true,
    };
  } else if (evaluated.strength > 0.65 && belief.bluff > 0.45) {
    cognitiveMult = 2.5;
    stepParams = {
      type: 'COGNITIVE_MULT',
      source: 'COUNTER_BAIT',
      cognitiveMult,
      message: format(enJson.scoring.stepTemplates.counterBait, {
        bluff: Math.round(belief.bluff * 100),
        mult: '2.5',
      }),
      messageZh: format(zhJson.scoring.stepTemplates.counterBait, {
        bluff: Math.round(belief.bluff * 100),
        mult: '2.5',
      }),
    };
  } else if (Math.abs(evaluated.strength - (isAiPredictingStrong ? 0.8 : 0.2)) > 0.3) {
    cognitiveMult = 1.6;
    stepParams = {
      type: 'COGNITIVE_MULT',
      source: 'COGNITIVE_DISCREPANCY',
      cognitiveMult,
      message: format(enJson.scoring.stepTemplates.cognitiveDiscrepancy, { mult: '1.6' }),
      messageZh: format(zhJson.scoring.stepTemplates.cognitiveDiscrepancy, { mult: '1.6' }),
    };
  }

  return { isModelBreak, modelBreakBonus, cognitiveMult, stepParams };
}
