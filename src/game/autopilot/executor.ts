import { AutopilotDecision } from './types';
import { AutopilotGameActions } from '@/store/autopilot-store';
import { audioManager } from '@/lib/audio/audio-manager';

export async function runAutopilotDecision(
  decision: AutopilotDecision,
  gameStoreActions: AutopilotGameActions,
  speed: '1x' | '2x',
  addThoughtLog: (log: string | { zh: string; en: string; timestamp?: string }) => void
): Promise<void> {
  const delayMultiplier = speed === '2x' ? 0.4 : 1.0;

  if (decision.type === 'PLAY_HAND' && decision.cardIds) {
    const cardStr = decision.cards?.map((c) => c.suit + c.rank).join(' ') || '??';
    const isBluff = decision.category === 'BLUFF';
    addThoughtLog(
      isBluff
        ? {
            zh: `⚠️ 启动弱牌逆向核爆协议 → 锁定 [${cardStr}]，诱骗 AI 认知模型崩溃`,
            en: `⚠️ Executing weak reverse bluff → Locking [${cardStr}] to shatter AI model`,
          }
        : {
            zh: `🎯 锁定最优组件 [${cardStr}]，预估得分 +${decision.expectedScore ?? '???'}`,
            en: `🎯 Locking optimal combo [${cardStr}], est. score +${decision.expectedScore ?? '???'}`,
          }
    );

    audioManager.playSfx('cardSelect');
    await gameStoreActions.setSelectedCards(decision.cardIds);

    const waitTime = Math.max(200, Math.round(decision.simulatedDelayMs * delayMultiplier));
    addThoughtLog(
      waitTime < 600
        ? {
            zh: `⚡ 拟态破绽：${waitTime}ms 闪电秒出，伪装强牌诱导 AI 置信度攀升`,
            en: `⚡ Tell mimicry: ${waitTime}ms snap action, feigning monster hand`,
          }
        : waitTime > 2500
        ? {
            zh: `⏳ 蓄力延迟 ${waitTime}ms → 触发假意迟疑/扑克脸 Joker 词条`,
            en: `⏳ Delay ${waitTime}ms → Trigger hesitation / Poker Face Joker`,
          }
        : {
            zh: `⏱️ 标准节奏 ${waitTime}ms 出牌中...`,
            en: `⏱️ Standard pace ${waitTime}ms playing hand...`,
          }
    );
    await new Promise((r) => setTimeout(r, waitTime));

    audioManager.playSfx('cardPlay');
    const success = await gameStoreActions.playHand(decision.cardIds);
    if (success) {
      addThoughtLog(
        isBluff
          ? {
              zh: `💥 MODEL BREAK 弹头已发射！等待 AI 认知崩溃反馈...`,
              en: `💥 MODEL BREAK warhead launched! Awaiting AI model collapse...`,
            }
          : {
              zh: `✅ 手牌已结算，等待得分反馈...`,
              en: `✅ Hand resolved, awaiting score feedback...`,
            }
      );
    } else {
      addThoughtLog({
        zh: `⚠️ 出牌请求未成功，等待状态重新同步...`,
        en: `⚠️ Play hand request failed, resyncing state...`,
      });
      await new Promise((r) => setTimeout(r, 1000));
    }
  } else if (decision.type === 'DISCARD' && decision.cardIds) {
    const discardStr = decision.cards?.map((c) => c.suit + c.rank).join(' ') || '??';
    addThoughtLog({
      zh: `🗑️ 清理散牌 [${discardStr}] → 抽牌博取同花/顺子组件`,
      en: `🗑️ Discarding junk [${discardStr}] → Digging for straight/flush synergy`,
    });

    audioManager.playSfx('cardSelect');
    await gameStoreActions.setSelectedCards(decision.cardIds);
    await new Promise((r) => setTimeout(r, Math.round(350 * delayMultiplier)));
    audioManager.playSfx('cardDiscard');
    const success = await gameStoreActions.discardCards(decision.cardIds);
    if (success) {
      addThoughtLog({
        zh: `♻️ 牌库已轮换，新手牌已就绪`,
        en: `♻️ Deck cycled, new cards ready`,
      });
    } else {
      addThoughtLog({
        zh: `⚠️ 弃牌请求未成功，等待状态重新同步...`,
        en: `⚠️ Discard request failed, resyncing state...`,
      });
      await new Promise((r) => setTimeout(r, 1000));
    }
  } else if (decision.type === 'BUY_ITEM' && decision.item) {
    const itemNameZh = decision.item.nameZh || decision.item.name;
    const itemNameEn = decision.item.name;
    const itemTypeDescZh = decision.item.itemType === 'JOKER' ? '乘数核弹' : '战术补丁';
    const itemTypeDescEn = decision.item.itemType === 'JOKER' ? 'Mult Nuke' : 'Tactical Patch';
    addThoughtLog({
      zh: `💰 暗网采购 → 【${itemNameZh}】(${itemTypeDescZh})`,
      en: `💰 Darknet purchase → [${itemNameEn}] (${itemTypeDescEn})`,
    });
    await new Promise((r) => setTimeout(r, Math.round(500 * delayMultiplier)));
    audioManager.playSfx('chipClink');
    const success = await gameStoreActions.buyShopItem(decision.item);
    if (success) {
      addThoughtLog({
        zh: `✅ 【${itemNameZh}】已装备，战力矩阵已更新`,
        en: `✅ [${itemNameEn}] equipped, combat matrix updated`,
      });
    }
  } else if (decision.type === 'SELL_JOKER' && decision.jokerId) {
    addThoughtLog({
      zh: `♻️ 汰弱留强：出售淘汰小丑，腾出槽位迎接高阶乘区组件`,
      en: `♻️ Selling weaker joker to free slot for superior synergy`,
    });
    await new Promise((r) => setTimeout(r, Math.round(400 * delayMultiplier)));
    if (gameStoreActions.sellJoker) {
      audioManager.playSfx('chipClink');
      await gameStoreActions.sellJoker(decision.jokerId);
      addThoughtLog({
        zh: `✅ 小丑已变现，槽位已释放`,
        en: `✅ Joker sold, slot freed`,
      });
    }
  } else if (decision.type === 'REROLL_SHOP') {
    addThoughtLog({
      zh: `🎲 部署富余资金刷新黑市，寻觅核心乘区组件`,
      en: `🎲 Deploying excess cash to reroll shop for key multipliers`,
    });
    await new Promise((r) => setTimeout(r, Math.round(500 * delayMultiplier)));
    if (gameStoreActions.rerollShop) {
      audioManager.playSfx('cardDiscard');
      await gameStoreActions.rerollShop();
      addThoughtLog({
        zh: `🔄 黑市已刷新，战术矩阵重新评估中`,
        en: `🔄 Shop refreshed, re-evaluating options`,
      });
    }
  } else if (decision.type === 'NEXT_BLIND') {
    addThoughtLog({
      zh: `⚔️ 进军下一盲注 → 当前资金已锁定利息收益`,
      en: `⚔️ Advancing to next blind → Capital locked for interest`,
    });
    await new Promise((r) => setTimeout(r, Math.round(500 * delayMultiplier)));
    audioManager.playSfx('uiClick');
    await gameStoreActions.nextBlind();
    addThoughtLog({
      zh: `🎲 新盲注已解锁，战场态势重置`,
      en: `🎲 Next blind unlocked, battle arena reset`,
    });
  } else if (decision.type === 'DISMISS_TALLY') {
    await new Promise((r) => setTimeout(r, Math.round(800 * delayMultiplier)));
    gameStoreActions.dismissScoreTally();
  }
}
