import { describe, it, expect } from 'vitest';
import {
  translateChineseLogToEnglish,
  translateEnglishLogToChinese,
} from '../src/components/game/autopilot/autopilot-thought-log';
import { runAutopilotDecision } from '../src/game/autopilot/executor';
import { AutopilotDecision } from '../src/game/autopilot/types';
import { AutopilotThoughtLogEntry, AutopilotThoughtLogItem } from '../src/lib/history/types';
import { useAutopilotStore } from '../src/store/autopilot-store';

describe('Autopilot Thought Log Localization & Fallback Translation', () => {
  it('translates all real-world Chinese logs from screenshot to English', () => {
    // 1. Advance blind
    expect(
      translateChineseLogToEnglish('⚔️ 进军下一盲注 → 当前资金已锁定利息收益')
    ).toBe('⚔️ Advancing to next blind → Capital locked for interest');

    // 2. Next blind unlocked (both dice and swirl emoji)
    expect(
      translateChineseLogToEnglish('🎲 新盲注已解锁，战场态势重置')
    ).toBe('🎲 Next blind unlocked, battle arena reset');
    expect(
      translateChineseLogToEnglish('🌀 新盲注已解锁，战场态势重置')
    ).toBe('🎲 Next blind unlocked, battle arena reset');

    // 3. Discard junk
    expect(
      translateChineseLogToEnglish('🗑️ 清理散牌 [♠2 ♣8] → 抽牌博取同花/顺子组件')
    ).toBe('🗑️ Discarding junk [♠2 ♣8] → Digging for straight/flush synergy');

    // 4. Deck cycled
    expect(
      translateChineseLogToEnglish('♻️ 牌库已轮换，新手牌已就绪')
    ).toBe('♻️ Deck cycled, new cards ready');

    // 5. Locking combo
    expect(
      translateChineseLogToEnglish('🎯 锁定最优组件 [♠14 ♠3 ♠6 ♠13]，预估得分 +16790')
    ).toBe('🎯 Locking optimal combo [♠14 ♠3 ♠6 ♠13], est. score +16790');

    // 6. Tell mimicry (both fullwidth and halfwidth colons)
    expect(
      translateChineseLogToEnglish('⚡ 拟态破绽：260ms 闪电秒出，伪装强牌诱导 AI 置信度攀升')
    ).toBe('⚡ Tell mimicry: 260ms snap action, feigning monster hand');
    expect(
      translateChineseLogToEnglish('⚡ 拟态破绽: 260ms 闪电秒出，伪装强牌诱导 AI 置信度攀升')
    ).toBe('⚡ Tell mimicry: 260ms snap action, feigning monster hand');

    // 7. Hand resolved (both checkmark and test tube emojis)
    expect(
      translateChineseLogToEnglish('✅ 手牌已结算，等待得分反馈...')
    ).toBe('✅ Hand resolved, awaiting score feedback...');
    expect(
      translateChineseLogToEnglish('🧪 手牌已结算，等待得分反馈...')
    ).toBe('✅ Hand resolved, awaiting score feedback...');

    // 8. Reverse bluff
    expect(
      translateChineseLogToEnglish('⚠️ 启动弱牌逆向核爆协议 → 锁定 [♠2 ♦3 ♣5]，诱骗 AI 认知模型崩溃')
    ).toBe('⚠️ Executing weak reverse bluff → Locking [♠2 ♦3 ♣5] to shatter AI model');

    // 9. Model break
    expect(
      translateChineseLogToEnglish('💥 MODEL BREAK 弹头已发射！等待 AI 认知崩溃反馈...')
    ).toBe('💥 MODEL BREAK warhead launched! Awaiting AI model collapse...');

    // 10. Shop purchases & actions
    expect(
      translateChineseLogToEnglish('💰 暗网采购 → 【巴甫洛夫之铃】(乘数核弹)')
    ).toBe('💰 Darknet purchase → [巴甫洛夫之铃] (Mult Nuke)');
    expect(
      translateChineseLogToEnglish('✅ 【巴甫洛夫之铃】已装备，战力矩阵已更新')
    ).toBe('✅ [巴甫洛夫之铃] equipped, combat matrix updated');
    expect(
      translateChineseLogToEnglish('♻️ 汰弱留强：出售淘汰小丑，腾出槽位迎接高阶乘区组件')
    ).toBe('♻️ Selling weaker joker to free slot for superior synergy');
    expect(
      translateChineseLogToEnglish('✅ 小丑已变现，槽位已释放')
    ).toBe('✅ Joker sold, slot freed');
    expect(
      translateChineseLogToEnglish('🎲 部署富余资金刷新黑市，寻觅核心乘区组件')
    ).toBe('🎲 Deploying excess cash to reroll shop for key multipliers');
    expect(
      translateChineseLogToEnglish('🔄 黑市已刷新，战术矩阵重新评估中')
    ).toBe('🔄 Shop refreshed, re-evaluating options');
  });

  it('translates English logs back to Chinese', () => {
    expect(
      translateEnglishLogToChinese('⚔️ Advancing to next blind → Capital locked for interest')
    ).toBe('⚔️ 进军下一盲注 → 当前资金已锁定利息收益');

    expect(
      translateEnglishLogToChinese('🎲 Next blind unlocked, battle arena reset')
    ).toBe('🎲 新盲注已解锁，战场态势重置');

    expect(
      translateEnglishLogToChinese('🗑️ Discarding junk [♠2 ♣8] → Digging for straight/flush synergy')
    ).toBe('🗑️ 清理散牌 [♠2 ♣8] → 抽牌博取同花/顺子组件');

    expect(
      translateEnglishLogToChinese('🎯 Locking optimal combo [♠14 ♠3 ♠6 ♠13], est. score +16790')
    ).toBe('🎯 锁定最优组件 [♠14 ♠3 ♠6 ♠13]，预估得分 +16790');
  });

  it('stores bilingual objects in useAutopilotStore', () => {
    const store = useAutopilotStore.getState();

    // Initial logs should be bilingual objects
    expect(store.thoughtLogs.length).toBeGreaterThanOrEqual(2);
    const initialLog = store.thoughtLogs.find(
      (l) => typeof l === 'object' && l.zh.includes('JEY')
    );
    expect(initialLog).toBeDefined();
    if (initialLog && typeof initialLog === 'object') {
      expect(initialLog.zh).toContain('JEY');
      expect(initialLog.en).toContain('JEV');
    }

    // Adding bilingual log
    useAutopilotStore.getState().addThoughtLog({
      zh: '测试中文日志',
      en: 'Test English Log',
    });

    const newest = useAutopilotStore.getState().thoughtLogs[0];
    expect(typeof newest).toBe('object');
    if (typeof newest === 'object') {
      expect(newest.zh).toBe('测试中文日志');
      expect(newest.en).toBe('Test English Log');
      expect(newest.timestamp).toBeDefined();
    }
  });

  it('runAutopilotDecision emits bilingual thought logs for actions', async () => {
    const receivedLogs: AutopilotThoughtLogEntry[] = [];
    const mockActions = {
      setSelectedCards: () => {},
      playHand: async () => true,
      discardCards: async () => true,
      buyShopItem: async () => true,
      nextBlind: () => {},
      dismissScoreTally: () => {},
    };

    const decision: AutopilotDecision = {
      id: 'd1',
      type: 'PLAY_HAND',
      category: 'BEST',
      confidence: 95,
      simulatedDelayMs: 250,
      title: 'Play Flush',
      titleZh: '打出同花',
      subtitle: '+5000',
      subtitleZh: '+5000',
      reasoning: 'Best hand',
      reasoningZh: '最优手牌',
      cardIds: ['c1', 'c2'],
      cards: [
        { id: 'c1', suit: '♠', rank: 14 },
        { id: 'c2', suit: '♠', rank: 13 },
      ],
      expectedScore: 5000,
    };

    await runAutopilotDecision(decision, mockActions, '2x', (log) => {
      receivedLogs.push(log);
    });

    expect(receivedLogs.length).toBeGreaterThan(0);
    for (const log of receivedLogs) {
      if (typeof log === 'object' && log !== null) {
        expect(log.zh).toBeDefined();
        expect(log.en).toBeDefined();
        expect(typeof log.zh).toBe('string');
        expect(typeof log.en).toBe('string');
      }
    }

    // Verify first log (combo lock)
    const first = receivedLogs[0] as AutopilotThoughtLogItem;
    expect(first.zh).toContain('锁定最优组件');
    expect(first.en).toContain('Locking optimal combo');

    // Verify last log (hand resolved)
    const last = receivedLogs[receivedLogs.length - 1] as AutopilotThoughtLogItem;
    expect(last.zh).toContain('手牌已结算');
    expect(last.en).toContain('Hand resolved');
  });
});
