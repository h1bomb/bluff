import { PublicGameState } from '../../types';
import { AutopilotDecision } from '../types';
import { ShopItem } from '../../shop/types';
import { JOKER_TIERS, getJokerSynergyBonus } from '../joker-heuristics';

// The hand type the run is actually winning with: most frequently played
// recently, tie-broken by leveled progression, defaulting to FLUSH.
function getDominantHandType(publicState: PublicGameState): string {
  const counts = new Map<string, number>();
  for (const ht of publicState.consecutiveActions ?? []) {
    counts.set(ht, (counts.get(ht) ?? 0) + 1);
  }
  const levelOf = (ht: string) =>
    publicState.handLevels?.[ht as keyof typeof publicState.handLevels]?.level ?? 1;

  if (counts.size > 0) {
    return [...counts.entries()].sort((a, b) => {
      if (b[1] !== a[1]) return b[1] - a[1];
      return levelOf(b[0]) - levelOf(a[0]);
    })[0][0];
  }

  let dominant = 'FLUSH';
  let maxLevel = 1;
  Object.entries(publicState.handLevels ?? {}).forEach(([ht, cfg]) => {
    if (cfg && cfg.level > maxLevel) {
      maxLevel = cfg.level;
      dominant = ht;
    }
  });
  return dominant;
}

export function evaluateShopDecisions(publicState: PublicGameState, shopInventory?: ShopItem[]): AutopilotDecision[] {
  const decisions: AutopilotDecision[] = [];
  const inventory: ShopItem[] = shopInventory || publicState.shopInventory || [];
  const money = publicState.money ?? 0;
  const jokers = publicState.jokers ?? [];
  const maxJokers = publicState.maxJokers ?? 5;
  const rerollCost = publicState.rerollCost ?? 2;

  const dominantHandType = getDominantHandType(publicState);

  let affordableCount = 0;

  inventory.forEach((item) => {
    if (item.itemType === 'JOKER') {
      const itemKey = (item.payload?.jokerKey || '').toUpperCase();
      const tier = JOKER_TIERS[itemKey] || 50;
      const synergy = getJokerSynergyBonus(itemKey, jokers);
      const effectiveTier = tier + synergy;
      const isSynergy = effectiveTier >= 80;

      if (jokers.length < maxJokers) {
        if (money < item.cost) return;
        affordableCount++;
        const conf = isSynergy ? 95 : Math.min(94, Math.max(40, 82 + synergy));

        decisions.push({
          id: `decision_buy_${item.id}`,
          type: 'BUY_ITEM',
          category: isSynergy ? 'SYNERGY' : 'SAFE',
          title: `BUY JOKER: ${item.name}`,
          titleZh: `购入小丑: ${item.nameZh}`,
          subtitle: `${item.description} ($${item.cost})`,
          subtitleZh: `${item.descriptionZh} ($${item.cost})`,
          confidence: conf,
          simulatedDelayMs: 600,
          item,
          reasoning: `Adding ${item.name} accelerates score accumulation and multiplies hand yields.`,
          reasoningZh: `购入【${item.nameZh}】可提供关键乘区或筹码倍率，极大降低破关难度。`,
        });
      } else {
        const weakest = [...jokers].sort(
          (a, b) =>
            (JOKER_TIERS[a.jokerKey.toUpperCase()] || 40) -
            (JOKER_TIERS[b.jokerKey.toUpperCase()] || 40)
        )[0];

        if (weakest) {
          const weakTier = JOKER_TIERS[weakest.jokerKey?.toUpperCase()] || 40;
          // Only surface swaps for genuinely top-tier pickups — a marginal
          // tier bump re-offered every shop visit just becomes pick noise.
          if (effectiveTier > weakTier + 25 && money + (weakest.sellValue ?? 2) >= item.cost) {
            decisions.push({
              id: `decision_sell_${weakest.id}_for_${item.id}`,
              type: 'SELL_JOKER',
              category: 'SYNERGY',
              title: `SELL JOKER: ${weakest.name}`,
              titleZh: `汰弱留强: 出售【${weakest.nameZh || weakest.name}】`,
              subtitle: `Sell for $${weakest.sellValue} to make room for tier-1 joker ${item.name}`,
              subtitleZh: `变现 $${weakest.sellValue} 腾出槽位，迎入高阶乘区小丑【${item.nameZh}】`,
              confidence: 91,
              simulatedDelayMs: 600,
              jokerId: weakest.id,
              reasoning: `Upgrades joker kit by swapping out weaker ${weakest.name} for superior ${item.name}.`,
              reasoningZh: `淘汰低加成普通小丑【${weakest.nameZh}】，为高阶乘区小丑【${item.nameZh}】腾出关键槽位！`,
            });
          }
        }
      }
    } else if (item.itemType === 'HAND_UPGRADE') {
      if (money < item.cost) return;
      affordableCount++;
      const handTypeToUpgrade = item.payload?.handTypeToUpgrade || '';
      const isDominant = handTypeToUpgrade === dominantHandType;
      const conf = isDominant ? 94 : 76;

      decisions.push({
        id: `decision_buy_${item.id}`,
        type: 'BUY_ITEM',
        category: isDominant ? 'SYNERGY' : 'SAFE',
        title: `UPGRADE HAND: ${item.name}`,
        titleZh: `升级牌型: ${item.nameZh}`,
        subtitle: `Permanently boosts base chips and mult ($${item.cost})`,
        subtitleZh: `永久提升指定牌型基础筹码与倍率 ($${item.cost})`,
        confidence: conf,
        simulatedDelayMs: 600,
        item,
        reasoning: `Upgrading hand levels permanently increases base chips and multiplier for all subsequent blinds.`,
        reasoningZh: isDominant
          ? `核心主打牌型【${item.nameZh}】专精升级，提供长线指数级伤害倍增！`
          : `牌型升级具有长线永久成长价值，每手出牌均可享受额外收益。`,
      });
    } else if (item.itemType === 'MEMORY_MOD') {
      if (money < item.cost) return;
      affordableCount++;
      decisions.push({
        id: `decision_buy_${item.id}`,
        type: 'BUY_ITEM',
        category: 'SAFE',
        title: `BUY MOD: ${item.name}`,
        titleZh: `购买补丁: ${item.nameZh}`,
        subtitle: `${item.description} ($${item.cost})`,
        subtitleZh: `${item.descriptionZh} ($${item.cost})`,
        confidence: 70,
        simulatedDelayMs: 600,
        item,
        reasoning: `Memory mods permanently improve card yields throughout the run.`,
        reasoningZh: `为卡牌植入永久记忆补丁，长期产生额外筹码。`,
      });
    }
  });

  const hasExcessMoney = money >= 25 + rerollCost;
  const isCrisisNeed = (publicState.ante ?? 1) >= 6 && money >= 10 + rerollCost;
  if ((hasExcessMoney || isCrisisNeed) && affordableCount <= 1) {
    decisions.push({
      id: 'decision_reroll_shop',
      type: 'REROLL_SHOP',
      category: 'GREED',
      title: 'REROLL: Refresh Darknet Shop',
      titleZh: `刷新黑市: 寻找高阶组件 (花费 $${rerollCost})`,
      subtitle: `Excess cash ($${money} > $25 max interest) deployed to find X-Mult jokers`,
      subtitleZh: `资金充裕吃满利息，果断刷新黑市寻觅乘区小丑与核心牌型卷轴`,
      confidence: hasExcessMoney ? 88 : 82,
      simulatedDelayMs: 600,
      reasoning: `Capital above $25 generates no additional interest ($5 cap). Actively rerolling finds run-winning multiplier jokers.`,
      reasoningZh: `资金超过 $25 满息线后没有利息增益，果断刷新黑市寻觅核心乘区小丑！`,
    });
  }

  const advanceConfidence = affordableCount === 0 && !hasExcessMoney ? 98 : money >= 10 ? 60 : 75;
  decisions.push({
    id: 'decision_next_blind',
    type: 'NEXT_BLIND',
    category: 'GREED',
    title: 'ADVANCE: To Next Blind',
    titleZh: '前进: 开启下一盲注',
    subtitle: `Preserve cash ($${money}) to generate interest and advance`,
    subtitleZh: `留存资金 ($${money}) 赚取利息，进军下一关`,
    confidence: advanceConfidence,
    simulatedDelayMs: 500,
    reasoning: `Banking funds to capture interest ($1 per $5) builds compounding economy for late-game.`,
    reasoningZh: `留存资金吃利息（每 $5 奖 $1），为高阶 ANTE 蓄积雄厚的经济底气。`,
  });

  return decisions;
}
