import { evaluateHand } from '../poker/evaluator';
import { DEFAULT_HAND_LEVELS, getHandLevel } from '../poker/hands-levels';
import { JokerScoringContext } from '../jokers/types';
import { enJson, zhJson, format } from '@/lib/i18n/translations';

import { ScoreCalculationParams, ScoreCalculationResult } from './types';
import { ScoreTallyBuilder } from './tally-builder';
import { evaluateCognitiveMultiplier } from './cognitive-evaluator';

import { applyCardModifiers, applyJokerTriggers } from './modifiers';

export * from './types';
export * from './tally-builder';
export * from './cognitive-evaluator';
export * from './modifiers';

export function calculateHandScore(params: ScoreCalculationParams): ScoreCalculationResult {
  const {
    handCards,
    handLevels = DEFAULT_HAND_LEVELS,
    jokers = [],
    belief,
    actionDelayMs = 1200,
    consecutiveActions = [],
    discardedHistory = [],
  } = params;

  // 1. Evaluate hand
  const evaluated = evaluateHand(handCards);
  const handType = evaluated.handType;
  const { chips: baseChips, mult: baseMult, level: handLevel } = getHandLevel(handLevels, handType);

  const builder = new ScoreTallyBuilder(0, 0, 1.0);

  // Step 1: Base Hand
  builder.addStep({
    type: 'HAND_BASE',
    source: evaluated.description,
    chipsAdded: baseChips,
    multAdded: baseMult,
    message: format(enJson.scoring.stepTemplates.baseHand, {
      handDesc: evaluated.description,
      level: handLevel,
      chips: baseChips,
      mult: baseMult,
    }),
    messageZh: format(zhJson.scoring.stepTemplates.baseHand, {
      handDesc: evaluated.descriptionZh || evaluated.description,
      level: handLevel,
      chips: baseChips,
      mult: baseMult,
    }),
  });

  // Step 2: Individual Card Rank Scoring (2..14)
  const cardRankChips = handCards.reduce((acc, c) => acc + (c.rank === 14 ? 11 : Math.min(10, c.rank)), 0);
  builder.addStep({
    type: 'CARD_BONUS',
    source: 'CARDS',
    chipsAdded: cardRankChips,
    message: format(enJson.scoring.stepTemplates.cardRankBonus, { chips: cardRankChips }),
    messageZh: format(zhJson.scoring.stepTemplates.cardRankBonus, { chips: cardRankChips }),
  });

  // Step 2.5: Card Modifiers and Enhancements
  applyCardModifiers(handCards, builder);

  // Step 3: Tell Bonus
  if (actionDelayMs < 600) {
    builder.addStep({
      type: 'TELL_BONUS',
      source: 'FAST_ACTION',
      chipsAdded: 25,
      message: enJson.scoring.stepTemplates.fastTell,
      messageZh: zhJson.scoring.stepTemplates.fastTell,
    });
  } else if (actionDelayMs > 3000) {
    builder.addStep({
      type: 'TELL_BONUS',
      source: 'HESITATION',
      multAdded: 2,
      message: enJson.scoring.stepTemplates.slowTell,
      messageZh: zhJson.scoring.stepTemplates.slowTell,
    });
  }

  // Step 4: Cognitive / Model Break
  const cogResult = evaluateCognitiveMultiplier(belief, evaluated);
  if (cogResult.stepParams) {
    builder.addStep(cogResult.stepParams);
  }

  // Step 5: Sequential Joker Triggers
  const scoringContext: JokerScoringContext = {
    handCards,
    handType,
    baseChips,
    baseMult,
    chips: builder.currentChips,
    mult: builder.currentMult,
    cognitiveMult: builder.currentCognitiveMult,
    belief,
    isModelBreak: cogResult.isModelBreak,
    consecutiveActions,
    actionDelayMs,
    discardedCardsHistory: discardedHistory,
  };

  applyJokerTriggers(jokers, scoringContext, builder, cogResult.isModelBreak);

  // Step 6: Final Total Score
  const finalScore = Math.round(builder.currentChips * builder.currentMult * builder.currentCognitiveMult);
  builder.addStep({
    type: 'TOTAL',
    source: 'TOTAL',
    message: format(enJson.scoring.stepTemplates.totalResult, {
      chips: builder.currentChips,
      mult: builder.currentMult,
      cog: builder.currentCognitiveMult.toFixed(1),
      score: finalScore,
    }),
    messageZh: format(zhJson.scoring.stepTemplates.totalResult, {
      chips: builder.currentChips,
      mult: builder.currentMult,
      cog: builder.currentCognitiveMult.toFixed(1),
      score: finalScore,
    }),
    isModelBreak: cogResult.isModelBreak,
  });

  return {
    evaluatedHand: evaluated,
    handLevel,
    baseChips,
    baseMult,
    totalChips: builder.currentChips,
    totalMult: builder.currentMult,
    cognitiveMult: builder.currentCognitiveMult,
    isModelBreak: cogResult.isModelBreak,
    modelBreakBonus: cogResult.modelBreakBonus,
    finalScore,
    tallySteps: builder.getSteps(),
  };
}
