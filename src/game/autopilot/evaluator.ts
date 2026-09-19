import { PublicGameState } from '../types';
import { AutopilotDecision } from './types';
import { ShopItem } from '../shop/types';
import { evaluatePlayHandDecisions } from './evaluators/play-evaluator';
import { evaluateDiscardDecisions } from './evaluators/discard-evaluator';
import { evaluateShopDecisions } from './evaluators/shop-evaluator';

export function evaluateAutopilotDecisions(
  publicState: PublicGameState,
  shopInventory?: ShopItem[]
): AutopilotDecision[] {
  const decisions: AutopilotDecision[] = [];

  if (publicState.phase === 'PLAYER_TURN') {
    const playDecisions = evaluatePlayHandDecisions(publicState);
    decisions.push(...playDecisions);
    
    const bestPlay = playDecisions.find((d) => d.type === 'PLAY_HAND');
    const discardDecisions = evaluateDiscardDecisions(publicState, bestPlay);
    decisions.push(...discardDecisions);
  }

  if (publicState.phase === 'SHOP') {
    decisions.push(...evaluateShopDecisions(publicState, shopInventory));
  }

  if (publicState.phase === 'SCORING') {
    decisions.push({
      id: 'decision_dismiss_tally',
      type: 'DISMISS_TALLY',
      category: 'SAFE',
      title: 'CONTINUE: Dismiss Tally',
      titleZh: '继续: 确认得分结算',
      subtitle: 'Advance to next hand or darknet shop',
      subtitleZh: '推进对局或进入暗网黑市',
      confidence: 100,
      simulatedDelayMs: 1200,
      reasoning: 'Score calculation complete. Ready to proceed.',
      reasoningZh: '本手牌计分动画已演示完毕，准备推进下一环节。',
    });
  }

  decisions.sort((a, b) => b.confidence - a.confidence);
  return decisions.slice(0, 4);
}
