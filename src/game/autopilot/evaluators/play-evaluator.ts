import { Card, PublicGameState } from '../../types';
import { evaluateHand } from '../../poker/evaluator';
import { calculateHandScore } from '../../scoring/calculator';
import { AutopilotDecision } from '../types';
import { getCombinations } from '../../../lib/math/combinations';
import { getSimulatedDelayMs } from '../joker-heuristics';
import { findDeadCards } from '../hand-analysis';

export function evaluatePlayHandDecisions(publicState: PublicGameState): AutopilotDecision[] {
  const decisions: AutopilotDecision[] = [];
  const cards = publicState.playerCards || [];
  const targetScore = publicState.targetScore ?? (publicState.blind?.targetScore ?? 300);
  const currentScore = publicState.currentRoundScore ?? 0;
  const neededScore = Math.max(1, targetScore - currentScore);
  const handsLeft = publicState.handsLeft ?? 0;
  const discardsLeft = publicState.discardsLeft ?? 0;
  const jokers = publicState.jokers || [];

  const simulatedDelayMs = getSimulatedDelayMs(jokers);

  if (cards.length >= 1) {
    const allCombos: Card[][] = [];
    const maxComboSize = Math.min(5, cards.length);
    for (let size = 1; size <= maxComboSize; size++) {
      allCombos.push(...getCombinations(cards, size));
    }

    const evaluatedCombos = allCombos.map((combo) => {
      const evaluated = evaluateHand(combo);
      const scoreRes = calculateHandScore({
        handCards: combo,
        handLevels: publicState.handLevels,
        jokers: publicState.jokers,
        belief: publicState.belief,
        actionDelayMs: simulatedDelayMs,
        consecutiveActions: publicState.consecutiveActions || [],
        discardedHistory: [],
      });
      return {
        combo,
        evaluated,
        // Joker effects are already fully applied inside calculateHandScore —
        // adding ad-hoc bonuses on top would double-count them.
        score: scoreRes.finalScore,
        scoreRes,
      };
    });

    evaluatedCombos.sort((a, b) => {
      const aWin = a.score >= neededScore;
      const bWin = b.score >= neededScore;
      if (aWin && bWin) {
        if (a.evaluated.handType === b.evaluated.handType) {
          if (a.combo.length !== b.combo.length) {
            return a.combo.length - b.combo.length;
          }
        }
        return b.score - a.score;
      }
      if (aWin) return -1;
      if (bWin) return 1;
      return b.score - a.score;
    });

    const best = evaluatedCombos[0];
    const isWin = !!best && best.score >= neededScore;

    // Dump line: when no combo can clear, the best combo can't even keep pace,
    // and no discards remain, spend the hand cycling junk cards to dig for a
    // winning draw while keeping the pair/run/flush core for the next hand.
    if (best && !isWin && discardsLeft === 0 && handsLeft >= 2 && best.score < neededScore / handsLeft) {
      const dumpCards = findDeadCards(cards).slice(0, 5);
      if (dumpCards.length >= 3) {
        const dumpScore = calculateHandScore({
          handCards: dumpCards,
          handLevels: publicState.handLevels,
          jokers: publicState.jokers,
          belief: publicState.belief,
          actionDelayMs: simulatedDelayMs,
          consecutiveActions: publicState.consecutiveActions || [],
          discardedHistory: [],
        }).finalScore;
        decisions.push({
          id: `decision_play_dump_${dumpCards.map((c) => c.id).join('_')}`,
          type: 'PLAY_HAND',
          category: 'GREED',
          title: `DUMP: ${dumpCards.map((c) => `${c.suit}${c.rank}`).join(' ')}`,
          titleZh: `弃养挖牌: ${dumpCards.map((c) => `${c.suit}${c.rank}`).join(' ')}`,
          subtitle: `Cycle ${dumpCards.length} dead cards, keep the core for next hand`,
          subtitleZh: `打出 ${dumpCards.length} 张死牌换抽，保留核心牌型组件备战下手`,
          confidence: 70,
          simulatedDelayMs,
          cards: dumpCards,
          cardIds: dumpCards.map((c) => c.id),
          expectedScore: dumpScore,
          reasoning: `No combo can clear ${neededScore} and no discards remain. Playing ${dumpCards.length} dead cards maximizes redraw while preserving the scoring core.`,
          reasoningZh: `当前无组合可清版且弃牌已用完，打出 ${dumpCards.length} 张死牌最大化换抽，同时保留得分核心组件。`,
        });
      }
    }

    if (best) {
      const winConfidence = isWin
        ? Math.min(98, 90 + Math.floor((best.score / neededScore) * 3))
        : Math.min(85, Math.max(40, Math.round((best.score / neededScore) * 55) + 15));

      decisions.push({
        id: `decision_play_best_${best.combo.map((c) => c.id).join('_')}`,
        type: 'PLAY_HAND',
        category: 'BEST',
        title: `PLAY: ${best.combo.map((c) => `${c.suit}${c.rank}`).join(' ')} (${best.evaluated.descriptionZh || best.evaluated.description})`,
        titleZh: `出牌: ${best.combo.map((c) => `${c.suit}${c.rank}`).join(' ')} (${best.evaluated.descriptionZh || best.evaluated.description})`,
        subtitle: `Expected: +${best.score} score ${isWin ? '| CLEARS BLIND!' : '(' + Math.min(100, Math.round((best.score / neededScore) * 100)) + '%)'}`,
        subtitleZh: `预计得分: +${best.score} ${isWin ? '| 一击清版突破盲注！' : '(达成 ' + Math.min(100, Math.round((best.score / neededScore) * 100)) + '%)'}`,
        confidence: winConfidence,
        simulatedDelayMs,
        cards: best.combo,
        cardIds: best.combo.map((c) => c.id),
        expectedScore: best.score,
        reasoning: `Playing ${best.evaluated.handType} (${best.combo.length} cards) provides the highest point yield of ${best.score}.`,
        reasoningZh: `选定【${best.evaluated.descriptionZh || best.evaluated.description}】(${best.combo.length}张牌)产生当前最优期望得分 ${best.score} 分。`,
      });
    }

    if (evaluatedCombos.length > 1) {
      const second = evaluatedCombos.find(
        (c) => c.evaluated.handType !== best?.evaluated.handType || c.combo.length !== best?.combo.length
      ) || evaluatedCombos[1];
      if (second && second.score !== best.score) {
        decisions.push({
          id: `decision_play_alt_${second.combo.map((c) => c.id).join('_')}`,
          type: 'PLAY_HAND',
          category: 'SAFE',
          title: `PLAY: ${second.evaluated.handType}`,
          titleZh: `出牌备选: ${second.evaluated.descriptionZh || second.evaluated.description} (${second.combo.length}张)`,
          subtitle: `Expected: +${second.score} score`,
          subtitleZh: `预计得分: +${second.score}`,
          confidence: Math.max(30, Math.round(decisions[0].confidence * 0.7)),
          simulatedDelayMs,
          cards: second.combo,
          cardIds: second.combo.map((c) => c.id),
          expectedScore: second.score,
          reasoning: `Alternative line: plays ${second.evaluated.handType} for ${second.score} points.`,
          reasoningZh: `次优备选路线：打出【${second.evaluated.descriptionZh || second.evaluated.description}】获得 ${second.score} 分。`,
        });
      }
    }

    const aiConfidence = publicState.belief?.behavior?.confidence ?? 0;
    const aiBehavior = publicState.belief?.behavior?.value;
    const aiSmellsBluff = (publicState.belief?.bluff ?? 0) >= 0.5;
    // Never gamble on a bluff when a guaranteed clear exists — take the win.
    // And when the AI already suspects a bluff, the Model Break won't trigger.
    if (!isWin && !aiSmellsBluff && (aiConfidence >= 0.75 || aiBehavior === 'STRONG_REPRESENTATION')) {
      const weakCombos = evaluatedCombos.filter((c) => c.evaluated.strength <= 0.30);
      if (weakCombos.length > 0 && aiConfidence >= 0.75) {
        const worst = weakCombos[weakCombos.length - 1];
        const bluffConfidence = Math.min(88, Math.round(aiConfidence * 80) + 15);
        const hasPavlov = jokers.some((j) => j.jokerKey === 'PAVLOVS_BELL');
        decisions.push({
          id: `decision_play_bluff_${worst.combo.map((c) => c.id).join('_')}`,
          type: 'PLAY_HAND',
          category: 'BLUFF',
          title: `BLUFF: Induce MODEL BREAK!`,
          titleZh: `心理诈唬: 诱爆 MODEL BREAK!`,
          subtitle: `AI Confidence is ${Math.round(aiConfidence * 100)}% | Exploits high misread`,
          subtitleZh: `AI 置信度高达 ${Math.round(aiConfidence * 100)}% | 弱牌逆向核爆`,
          confidence: bluffConfidence,
          simulatedDelayMs: hasPavlov ? 420 : 500,
          cards: worst.combo,
          cardIds: worst.combo.map((c) => c.id),
          // worst.score already includes the cognitive multiplier that
          // calculateHandScore applies for this weak hand vs the AI's read.
          expectedScore: worst.score,
          reasoning: `The AI is hyper-confident you hold a monster hand (${Math.round(aiConfidence * 100)}%). Playing a weak hand triggers a catastrophic Model Break!`,
          reasoningZh: `AI 此时极度坚信你手握怪物牌（置信度 ${Math.round(aiConfidence * 100)}%），用弱牌诱发 MODEL BREAK 触发巨额认知乘数！`,
        });
      }
    }
  }
  return decisions;
}
