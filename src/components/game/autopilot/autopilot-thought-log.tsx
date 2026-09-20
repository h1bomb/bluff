import React, { useEffect, useRef } from 'react';
import { TranslationDictionary, format } from '@/lib/i18n/translations';
import { AutopilotThoughtLogEntry } from '@/lib/history/types';

export function translateChineseLogToEnglish(text: string): string {
  if (!text) return '';
  let result = text;

  if (result.includes('进军下一盲注')) {
    result = result.replace(/[⚔️\s]*进军下一盲注\s*(?:→|->)\s*当前资金已锁定利息收益/, '⚔️ Advancing to next blind → Capital locked for interest');
  }
  if (result.includes('新盲注已解锁')) {
    result = result.replace(/[🎲🌀\s]*新盲注已解锁[，,]\s*战场态势重置/, '🎲 Next blind unlocked, battle arena reset');
  }
  if (result.includes('清理散牌')) {
    result = result.replace(/[🗑️\s]*清理散牌\s*(\[[^\]]+\])\s*(?:→|->)\s*抽牌博取同花\/顺子组件/, '🗑️ Discarding junk $1 → Digging for straight/flush synergy');
  }
  if (result.includes('牌库已轮换')) {
    result = result.replace(/[♻️\s]*牌库已轮换[，,]\s*新手牌已就绪/, '♻️ Deck cycled, new cards ready');
  }
  if (result.includes('锁定最优组件')) {
    result = result.replace(/[🎯\s]*锁定最优组件\s*(\[[^\]]+\])[，,]\s*预估得分\s*([+0-9?]+)/, '🎯 Locking optimal combo $1, est. score $2');
  }
  if (result.includes('拟态破绽')) {
    result = result.replace(/[⚡\s]*拟态破绽[：:]\s*(\d+ms)\s*闪电秒出[，,]\s*伪装强牌诱导\s*AI\s*置信度攀升/, '⚡ Tell mimicry: $1 snap action, feigning monster hand');
  }
  if (result.includes('蓄力延迟')) {
    result = result.replace(/[⏳\s]*蓄力延迟\s*(\d+ms)\s*(?:→|->)\s*触发假意迟疑\/扑克脸\s*Joker\s*词条/, '⏳ Delay $1 → Trigger hesitation / Poker Face Joker');
  }
  if (result.includes('标准节奏')) {
    result = result.replace(/[⏱️\s]*标准节奏\s*(\d+ms)\s*出牌中\.\.\./, '⏱️ Standard pace $1 playing hand...');
  }
  if (result.includes('手牌已结算')) {
    result = result.replace(/[✅🧪\s]*手牌已结算[，,]\s*等待得分反馈\.\.\./, '✅ Hand resolved, awaiting score feedback...');
  }
  if (result.includes('启动弱牌逆向核爆协议')) {
    result = result.replace(/[⚠️\s]*启动弱牌逆向核爆协议\s*(?:→|->)\s*锁定\s*(\[[^\]]+\])[，,]\s*诱骗\s*AI\s*认知模型崩溃/, '⚠️ Executing weak reverse bluff → Locking $1 to shatter AI model');
  }
  if (result.includes('MODEL BREAK 弹头已发射')) {
    result = result.replace(/[💥\s]*MODEL BREAK\s*弹头已发射！等待\s*AI\s*认知崩溃反馈\.\.\./, '💥 MODEL BREAK warhead launched! Awaiting AI model collapse...');
  }
  if (result.includes('出牌请求未成功')) {
    result = result.replace(/[⚠️\s]*出牌请求未成功[，,]\s*等待状态重新同步\.\.\./, '⚠️ Play hand request failed, resyncing state...');
  }
  if (result.includes('弃牌请求未成功')) {
    result = result.replace(/[⚠️\s]*弃牌请求未成功[，,]\s*等待状态重新同步\.\.\./, '⚠️ Discard request failed, resyncing state...');
  }
  if (result.includes('暗网采购')) {
    result = result.replace(/[💰\s]*暗网采购\s*(?:→|->)\s*【(.*?)】\((.*?)\)/, (_, name, type) => {
      const enType = type === '乘数核弹' ? 'Mult Nuke' : type === '战术补丁' ? 'Tactical Patch' : type;
      return `💰 Darknet purchase → [${name}] (${enType})`;
    });
  }
  if (result.includes('已装备，战力矩阵已更新')) {
    result = result.replace(/[✅\s]*【(.*?)】已装备[，,]\s*战力矩阵已更新/, '✅ [$1] equipped, combat matrix updated');
  }
  if (result.includes('汰弱留强')) {
    result = result.replace(/[♻️\s]*汰弱留强[：:]\s*出售淘汰小丑[，,]\s*腾出槽位迎接高阶乘区组件/, '♻️ Selling weaker joker to free slot for superior synergy');
  }
  if (result.includes('小丑已变现')) {
    result = result.replace(/[✅\s]*小丑已变现[，,]\s*槽位已释放/, '✅ Joker sold, slot freed');
  }
  if (result.includes('部署富余资金刷新黑市')) {
    result = result.replace(/[🎲\s]*部署富余资金刷新黑市[，,]\s*寻觅核心乘区组件/, '🎲 Deploying excess cash to reroll shop for key multipliers');
  }
  if (result.includes('黑市已刷新')) {
    result = result.replace(/[🔄\s]*黑市已刷新[，,]\s*战术矩阵重新评估中/, '🔄 Shop refreshed, re-evaluating options');
  }
  if (result.includes('认知矩阵已初始化')) {
    result = 'JEV COGNITIVE MATRIX INITIALIZED';
  }
  if (result.includes('等待神经决策输入')) {
    result = 'AWAITING NEURAL INPUT VECTORS...';
  }
  if (result.includes('自动驾驶已启动')) {
    result = '>>> AUTOPILOT ENGAGED: Full autonomous control active.';
  }
  if (result.includes('自动驾驶待命')) {
    result = '>>> AUTOPILOT STANDBY: Switched to co-pilot assist mode.';
  }
  if (result.includes('时钟频率已设为')) {
    result = result.replace(/>>>\s*时钟频率已设为\s*(\w+)/, '>>> Clock speed set to $1.');
  }
  if (result.includes('执行异常')) {
    result = result.replace(/❌?\s*执行异常[：:]\s*(.*)/, '❌ Execution error: $1');
  }
  if (result.includes('回放遥测数据已接管')) {
    result = 'REPLAY TELEMETRY SYNTHESIS ENGAGED';
  }
  if (result.includes('动作:') && result.includes('分支路径')) {
    result = result.replace(/动作:\s*(.*?)\s*\|\s*评估了\s*(\d+)\s*条分支路径/, 'Action: $1 | Evaluated $2 candidate paths.');
  }
  if (result.includes('历史动作:')) {
    result = result.replace(/历史动作:\s*(.*)/, 'Historical action: $1');
  }

  return result;
}

export function translateEnglishLogToChinese(text: string): string {
  if (!text) return '';
  let result = text;

  if (result.includes('Advancing to next blind')) {
    result = result.replace(/[⚔️\s]*Advancing to next blind\s*(?:→|->)\s*Capital locked for interest/, '⚔️ 进军下一盲注 → 当前资金已锁定利息收益');
  }
  if (result.includes('Next blind unlocked')) {
    result = result.replace(/[🎲🌀\s]*Next blind unlocked[，,]\s*battle arena reset/, '🎲 新盲注已解锁，战场态势重置');
  }
  if (result.includes('Discarding junk')) {
    result = result.replace(/[🗑️\s]*Discarding junk\s*(\[[^\]]+\])\s*(?:→|->)\s*Digging for straight\/flush synergy/, '🗑️ 清理散牌 $1 → 抽牌博取同花/顺子组件');
  }
  if (result.includes('Deck cycled, new cards ready')) {
    result = result.replace(/[♻️\s]*Deck cycled, new cards ready/, '♻️ 牌库已轮换，新手牌已就绪');
  }
  if (result.includes('Locking optimal combo')) {
    result = result.replace(/[🎯\s]*Locking optimal combo\s*(\[[^\]]+\])[，,]\s*est\.\s*score\s*([+0-9?]+)/, '🎯 锁定最优组件 $1，预估得分 $2');
  }
  if (result.includes('Tell mimicry:')) {
    result = result.replace(/[⚡\s]*Tell mimicry:\s*(\d+ms)\s*snap action[，,]\s*feigning monster hand/, '⚡ 拟态破绽：$1 闪电秒出，伪装强牌诱导 AI 置信度攀升');
  }
  if (result.includes('Delay') && result.includes('Trigger hesitation')) {
    result = result.replace(/[⏳\s]*Delay\s*(\d+ms)\s*(?:→|->)\s*Trigger hesitation \/ Poker Face Joker/, '⏳ 蓄力延迟 $1 → 触发假意迟疑/扑克脸 Joker 词条');
  }
  if (result.includes('Standard pace')) {
    result = result.replace(/[⏱️\s]*Standard pace\s*(\d+ms)\s*playing hand\.\.\./, '⏱️ 标准节奏 $1 出牌中...');
  }
  if (result.includes('Hand resolved, awaiting score feedback')) {
    result = result.replace(/[✅🧪\s]*Hand resolved, awaiting score feedback\.\.\./, '✅ 手牌已结算，等待得分反馈...');
  }
  if (result.includes('Executing weak reverse bluff')) {
    result = result.replace(/[⚠️\s]*Executing weak reverse bluff\s*(?:→|->)\s*Locking\s*(\[[^\]]+\])\s*to shatter AI model/, '⚠️ 启动弱牌逆向核爆协议 → 锁定 $1，诱骗 AI 认知模型崩溃');
  }
  if (result.includes('MODEL BREAK warhead launched')) {
    result = result.replace(/[💥\s]*MODEL BREAK warhead launched! Awaiting AI model collapse\.\.\./, '💥 MODEL BREAK 弹头已发射！等待 AI 认知崩溃反馈...');
  }
  if (result.includes('Play hand request failed')) {
    result = result.replace(/[⚠️\s]*Play hand request failed[，,]\s*resyncing state\.\.\./, '⚠️ 出牌请求未成功，等待状态重新同步...');
  }
  if (result.includes('Discard request failed')) {
    result = result.replace(/[⚠️\s]*Discard request failed[，,]\s*resyncing state\.\.\./, '⚠️ 弃牌请求未成功，等待状态重新同步...');
  }
  if (result.includes('Darknet purchase')) {
    result = result.replace(/[💰\s]*Darknet purchase\s*(?:→|->)\s*\[(.*?)\]\s*\((.*?)\)/, (_, name, type) => {
      const zhType = type === 'Mult Nuke' ? '乘数核弹' : type === 'Tactical Patch' ? '战术补丁' : type;
      return `💰 暗网采购 → 【${name}】(${zhType})`;
    });
  }
  if (result.includes('equipped, combat matrix updated')) {
    result = result.replace(/[✅\s]*\[(.*?)\]\s*equipped[，,]\s*combat matrix updated/, '✅ 【$1】已装备，战力矩阵已更新');
  }
  if (result.includes('Selling weaker joker')) {
    result = result.replace(/[♻️\s]*Selling weaker joker to free slot for superior synergy/, '♻️ 汰弱留强：出售淘汰小丑，腾出槽位迎接高阶乘区组件');
  }
  if (result.includes('Joker sold, slot freed')) {
    result = result.replace(/[✅\s]*Joker sold[，,]\s*slot freed/, '✅ 小丑已变现，槽位已释放');
  }
  if (result.includes('Deploying excess cash to reroll shop')) {
    result = result.replace(/[🎲\s]*Deploying excess cash to reroll shop for key multipliers/, '🎲 部署富余资金刷新黑市，寻觅核心乘区组件');
  }
  if (result.includes('Shop refreshed, re-evaluating options')) {
    result = result.replace(/[🔄\s]*Shop refreshed[，,]\s*re-evaluating options/, '🔄 黑市已刷新，战术矩阵重新评估中');
  }
  if (result.includes('COGNITIVE MATRIX INITIALIZED')) {
    result = 'JEV 认知矩阵已初始化';
  }
  if (result.includes('AWAITING NEURAL INPUT VECTORS')) {
    result = '等待神经决策输入向量...';
  }
  if (result.includes('AUTOPILOT ENGAGED')) {
    result = '>>> 自动驾驶已启动：全自主认知接管';
  }
  if (result.includes('AUTOPILOT STANDBY')) {
    result = '>>> 自动驾驶待命：切换至协同辅助模式';
  }
  if (result.includes('Clock speed set to')) {
    result = result.replace(/>>>\s*Clock speed set to\s*(\w+)\./, '>>> 时钟频率已设为 $1');
  }
  if (result.includes('Execution error:')) {
    result = result.replace(/❌?\s*Execution error:\s*(.*)/, '❌ 执行异常: $1');
  }
  if (result.includes('REPLAY TELEMETRY SYNTHESIS ENGAGED')) {
    result = '回放遥测数据已接管';
  }
  if (result.includes('Action:') && result.includes('candidate paths')) {
    result = result.replace(/Action:\s*(.*?)\s*\|\s*Evaluated\s*(\d+)\s*candidate paths\./, '动作: $1 | 评估了 $2 条分支路径');
  }
  if (result.includes('Historical action:')) {
    result = result.replace(/Historical action:\s*(.*)/, '历史动作: $1');
  }

  return result;
}

interface AutopilotThoughtLogProps {
  thoughtLogs: AutopilotThoughtLogEntry[];
  isFullHeight: boolean;
  isMobileDrawer: boolean;
  language?: string;
  t: TranslationDictionary;
}

export function AutopilotThoughtLog({
  thoughtLogs,
  isFullHeight,
  isMobileDrawer,
  language = 'zh',
  t,
}: AutopilotThoughtLogProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Chronological order: oldest at top, latest at bottom
  const chronologicalLogs = [...thoughtLogs].reverse();

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [thoughtLogs.length]);

  return (
    <div className={`flex flex-col gap-1.5 pt-2 border-t border-zinc-800/80 ${isFullHeight && !isMobileDrawer ? 'flex-1 min-h-0' : ''}`}>
      <div className="flex items-center justify-between text-[10px] retro text-zinc-400 font-mono shrink-0 px-0.5 leading-none">
        <span className="flex items-center gap-1.5 font-bold text-emerald-400">
          <span className="text-emerald-500">▶</span>
          <span>{t.autopilot.telemetryLog}</span>
        </span>
        <span className="text-zinc-500 font-mono text-[9px]">
          {format(t.autopilot.logsCount, { n: thoughtLogs.length })}
        </span>
      </div>

      <div
        ref={scrollRef}
        className={`w-full ${
          isFullHeight && !isMobileDrawer ? 'flex-1 min-h-[140px]' : 'min-h-[90px] max-h-[220px]'
        } bg-black/90 border border-zinc-800 p-2 font-mono overflow-y-auto custom-scrollbar flex flex-col gap-1 select-text`}
      >
        {chronologicalLogs.length === 0 ? (
          <span className="text-zinc-600 font-mono text-[11px] italic py-2">
            {t.autopilot.noTelemetry}
          </span>
        ) : (
          chronologicalLogs.map((log, i) => {
            let timestamp: string | null = null;
            let message = '';

            if (typeof log === 'object' && log !== null) {
              timestamp = log.timestamp ? `[${log.timestamp}]` : null;
              message = (language === 'zh' ? log.zh : log.en) || log.en || log.zh;
            } else if (typeof log === 'string') {
              const match = log.match(/^(\[[^\]]+\])\s*(.*)$/);
              timestamp = match ? match[1] : null;
              const rawMessage = match ? match[2] : log;

              if (language === 'en') {
                message = translateChineseLogToEnglish(rawMessage);
              } else if (language === 'zh') {
                message = translateEnglishLogToChinese(rawMessage);
              } else {
                message = rawMessage;
              }
            }

            return (
              <div
                key={i}
                className="py-0.5 leading-relaxed text-[10px] sm:text-[11px] font-mono text-emerald-400/95 whitespace-pre-wrap break-all tracking-wide hover:text-emerald-300 transition-colors flex items-start gap-1.5"
              >
                {timestamp && (
                  <span className="text-zinc-500 shrink-0 select-none text-[9px] sm:text-[10px] leading-relaxed">
                    {timestamp}
                  </span>
                )}
                <span className="flex-1 leading-relaxed">
                  {message}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
