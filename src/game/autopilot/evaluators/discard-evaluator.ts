import { PublicGameState } from '../../types';
import { evaluateHand } from '../../poker/evaluator';
import { AutopilotDecision } from '../types';
import { findDeadCards } from '../hand-analysis';

export function evaluateDiscardDecisions(publicState: PublicGameState, bestPlay?: AutopilotDecision): AutopilotDecision[] {
  const decisions: AutopilotDecision[] = [];
  const cards = publicState.playerCards || [];
  const discardsLeft = publicState.discardsLeft ?? 0;
  const handsLeft = publicState.handsLeft ?? 0;
  const targetScore = publicState.targetScore ?? (publicState.blind?.targetScore ?? 300);
  const currentScore = publicState.currentRoundScore ?? 0;
  const neededScore = Math.max(1, targetScore - currentScore);

  if (discardsLeft > 0 && cards.length >= 2) {
    const deadCards = findDeadCards(cards);

    let discardSelection = deadCards.slice(0, 5);
    if (discardSelection.length === 0 && cards.length >= 3) {
      const sortedAsc = [...cards].sort((a, b) => a.rank - b.rank);
      const unpaired = sortedAsc.filter((c) => cards.filter((o) => o.rank === c.rank).length === 1);
      discardSelection = (unpaired.length > 0 ? unpaired : sortedAsc).slice(0, 3);
    }

    if (discardSelection.length > 0) {
      const bestScore = bestPlay?.expectedScore ?? 0;
      const bestHandType = bestPlay ? (evaluateHand(bestPlay.cards || []).handType) : 'HIGH_CARD';

      let discardConf = 40;
      if (bestScore >= neededScore) {
        discardConf = 30;
      } else if (bestHandType === 'HIGH_CARD' && handsLeft >= 2) {
        discardConf = 96;
      } else if (bestHandType === 'PAIR' && handsLeft >= 2 && bestScore < neededScore * 0.7) {
        discardConf = 89;
      } else if (handsLeft >= 2) {
        discardConf = 82;
      } else {
        discardConf = 45;
      }

      decisions.push({
        id: `decision_discard_${discardSelection.map((c) => c.id).join('_')}`,
        type: 'DISCARD',
        category: 'SAFE',
        title: `DISCARD: ${discardSelection.map((c) => `${c.suit}${c.rank}`).join(' ')}`,
        titleZh: `弃牌换牌: ${discardSelection.map((c) => `${c.suit}${c.rank}`).join(' ')}`,
        subtitle: `Dump ${discardSelection.length} junk cards to dig for Flushes / Straights`,
        subtitleZh: `清理 ${discardSelection.length} 张散牌，抽牌博取顺子/同花/豹子`,
        confidence: discardConf,
        simulatedDelayMs: 650,
        cards: discardSelection,
        cardIds: discardSelection.map((c) => c.id),
        reasoning: `Discarding offsuit disconnected cards increases draw probability for a high-value Flush or Straight.`,
        reasoningZh: `弃掉无关联的散牌，大幅增加下一抽抓到同花或高位顺子的几率。`,
      });
    }
  }
  return decisions;
}
