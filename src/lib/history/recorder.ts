import { PublicGameState, Card } from '../../game/types';
import {
  GameReplayStep,
  ReplayAutopilotSnapshot,
} from './types';
import { JokerInstance } from '../../game/jokers/types';
import { ShopItem } from '../../game/shop/types';
import { ScoreCalculationResult } from '../../game/scoring/calculator';
import { formatBlindName } from './snapshot';
import { buildBaseReplayStep, formatReplayScore } from './step-builder';

export { formatBlindName, extractStateSnapshot } from './snapshot';
export { ensureHighFidelityStep } from './telemetry-synthesis';
export { createInitialRunRecord, buildBaseReplayStep, formatReplayScore } from './step-builder';

export function createPlayHandStep(
  stepIndex: number,
  playedCards: Card[],
  scoreResult: ScoreCalculationResult | null | undefined,
  publicState: PublicGameState,
  autopilotSnapshot?: ReplayAutopilotSnapshot
): GameReplayStep {
  const formattedScore = formatReplayScore(scoreResult);
  const cardListStr = playedCards.map((c) => `${c.suit}${c.rank}`).join(' ');

  return buildBaseReplayStep(
    stepIndex,
    'PLAY_HAND',
    `Play Hand: ${formattedScore?.handType || 'Cards'}`,
    `出牌: ${formattedScore?.handTypeZh || '打出手牌'}`,
    `Played [${cardListStr}] scoring +${formattedScore?.finalScore || 0} chips (${formattedScore?.totalChips || 0} x ${formattedScore?.totalMult || 0}).`,
    `打出 [${cardListStr}]，获得 +${formattedScore?.finalScore || 0} 筹码（底筹 ${formattedScore?.totalChips || 0} × 倍率 ${formattedScore?.totalMult || 0}）。`,
    publicState,
    autopilotSnapshot,
    {
      playedCards: JSON.parse(JSON.stringify(playedCards)),
      scoreResult: formattedScore,
    }
  );
}

export function createDiscardStep(
  stepIndex: number,
  discardedCards: Card[],
  publicState: PublicGameState,
  autopilotSnapshot?: ReplayAutopilotSnapshot
): GameReplayStep {
  const cardListStr = discardedCards.map((c) => `${c.suit}${c.rank}`).join(' ');

  return buildBaseReplayStep(
    stepIndex,
    'DISCARD',
    `Discard ${discardedCards.length} Cards`,
    `弃牌: ${discardedCards.length} 张`,
    `Discarded [${cardListStr}]. Discards left: ${publicState.discardsLeft ?? 0}.`,
    `弃掉手牌 [${cardListStr}] 并抽牌。剩余弃牌次数: ${publicState.discardsLeft ?? 0}。`,
    publicState,
    autopilotSnapshot,
    {
      discardedCards: JSON.parse(JSON.stringify(discardedCards)),
    }
  );
}

export function createBuyItemStep(
  stepIndex: number,
  item: ShopItem,
  publicState: PublicGameState,
  autopilotSnapshot?: ReplayAutopilotSnapshot
): GameReplayStep {
  const itemName = item.nameZh || item.name || 'Unknown Item';

  return buildBaseReplayStep(
    stepIndex,
    'BUY_ITEM',
    `Buy: ${item.name || 'Item'} ($${item.cost || 0})`,
    `购买: ${itemName} ($${item.cost || 0})`,
    `Purchased ${item.name} for $${item.cost}. Remaining balance: $${publicState.money ?? 0}.`,
    `以 $${item.cost} 购入物资【${itemName}】。当前余额: $${publicState.money ?? 0}。`,
    publicState,
    autopilotSnapshot,
    {
      boughtItem: {
        name: item.name || 'Item',
        nameZh: item.nameZh,
        itemType: item.itemType || 'JOKER',
        cost: item.cost || 0,
      },
    }
  );
}

export function createSellJokerStep(
  stepIndex: number,
  joker: JokerInstance,
  publicState: PublicGameState,
  autopilotSnapshot?: ReplayAutopilotSnapshot
): GameReplayStep {
  const jokerName = joker?.nameZh || joker?.name || 'Joker';
  const price = joker?.sellValue || 0;

  return buildBaseReplayStep(
    stepIndex,
    'SELL_JOKER',
    `Sell Joker: ${joker?.name || 'Joker'} (+$${price})`,
    `出售小丑: ${jokerName} (+$${price})`,
    `Sold joker ${joker?.name} for $${price}. Remaining money: $${publicState.money ?? 0}.`,
    `出售小丑【${jokerName}】，获得 $${price}。当前余额: $${publicState.money ?? 0}。`,
    publicState,
    autopilotSnapshot,
    {
      soldJoker: {
        name: joker?.name || 'Joker',
        nameZh: joker?.nameZh,
        sellPrice: price,
      },
    }
  );
}

export function createNextBlindStep(
  stepIndex: number,
  publicState: PublicGameState,
  autopilotSnapshot?: ReplayAutopilotSnapshot
): GameReplayStep {
  const blindNameEn = formatBlindName(publicState.blind, 'en');
  const blindNameZh = formatBlindName(publicState.blind, 'zh');

  return buildBaseReplayStep(
    stepIndex,
    'NEXT_BLIND',
    `Advance: Ante ${publicState.ante || 1} ${blindNameEn}`,
    `迎战新盲注: Ante ${publicState.ante || 1} ${blindNameZh}`,
    `Entered Ante ${publicState.ante || 1}, Blind: ${blindNameEn}. Target score: ${publicState.targetScore || 300}.`,
    `进入 Ante ${publicState.ante || 1}，目标盲注【${blindNameZh}】。过关目标: ${publicState.targetScore || 300} 分。`,
    publicState,
    autopilotSnapshot
  );
}

export function createModelBreakStep(
  stepIndex: number,
  payload: Record<string, unknown>,
  publicState: PublicGameState,
  autopilotSnapshot?: ReplayAutopilotSnapshot
): GameReplayStep {
  return buildBaseReplayStep(
    stepIndex,
    'MODEL_BREAK',
    'MODEL BREAK DETECTED!',
    '心理诈唬诱爆: MODEL BREAK!',
    `Shattered AI confidence (${Math.round((Number(payload?.predictedConfidence) || 0) * 100)}% -> 0%). Reward: +$${Number(payload?.rewardMoney) || 0}.`,
    `成功诱爆 AI 认知模型（原置信度 ${Math.round((Number(payload?.predictedConfidence) || 0) * 100)}% -> 0% 爆破）。奖励: +$${Number(payload?.rewardMoney) || 0} 资金！`,
    publicState,
    autopilotSnapshot,
    {
      modelBreak: {
        confidence: Number(payload?.predictedConfidence) || 0,
        actualStrength: Number(payload?.actualStrength) || 0,
        reward: Number(payload?.rewardMoney) || 0,
      },
    }
  );
}

export function createGameOverStep(
  stepIndex: number,
  isVictory: boolean,
  publicState: PublicGameState,
  autopilotSnapshot?: ReplayAutopilotSnapshot
): GameReplayStep {
  return buildBaseReplayStep(
    stepIndex,
    isVictory ? 'RUN_COMPLETE' : 'GAME_OVER',
    isVictory ? '★ VICTORY - RUN CONQUERED!' : '✖ DEFEAT - RUN TERMINATED',
    isVictory ? '★ 战局通关 - 达成胜局！' : '✖ 战局终结 - 挑战惜败',
    isVictory
      ? `Successfully cleared all 8 Antes and defeated the ultimate cognitive model!`
      : `Exhausted all available hands before breaking target score ${publicState.targetScore || 0}.`,
    isVictory
      ? `成功突破全部 8 层底注，彻底击穿终极认知大模型！`
      : `手牌次数已耗尽，未能在限定回合内达成目标筹码 ${publicState.targetScore || 0} 分。`,
    publicState,
    autopilotSnapshot
  );
}
