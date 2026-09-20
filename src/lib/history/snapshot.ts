import { PublicGameState, BlindInfo } from '../../game/types';
import { ReplayStateSnapshot } from './types';
import { BOSS_ROSTER } from '../../game/engine/blinds';

export function formatBlindName(blind?: BlindInfo, lang: 'zh' | 'en' = 'zh'): string {
  if (!blind) return lang === 'zh' ? '小盲注' : 'Small Blind';
  if (blind.blindType === 'SMALL') return lang === 'zh' ? '小盲注' : 'Small Blind';
  if (blind.blindType === 'BIG') return lang === 'zh' ? '大盲注' : 'Big Blind';

  let bossDisplayName = 'READER';
  if (lang === 'zh') {
    bossDisplayName = blind.bossNameZh || (typeof blind.bossName === 'string' ? blind.bossName : '') || '读心者';
  } else {
    bossDisplayName = (typeof blind.bossName === 'string' ? blind.bossName : '') || 'READER';
  }

  if (typeof blind.bossName === 'object' && blind.bossName !== null) {
    const b = blind.bossName as { nameZh?: string; name?: string };
    bossDisplayName = (lang === 'zh' ? (b.nameZh || b.name) : b.name) || bossDisplayName;
  }

  return `${lang === 'zh' ? '首领盲注' : 'Boss Blind'}: ${bossDisplayName}`;
}

/**
 * Resolves any recorded blind representation (BlindInfo object,
 * { name, nameZh } object, or a legacy string baked in one language)
 * into a display string for the requested language.
 */
export function localizeBlindDisplay(value: unknown, lang: 'zh' | 'en'): string {
  if (!value) return '';
  if (typeof value === 'object') {
    const b = value as { blindType?: string; bossName?: string; bossNameZh?: string; name?: string; nameZh?: string };
    if (b.blindType) {
      return formatBlindName(b as BlindInfo, lang);
    }
    return (lang === 'zh' ? (b.nameZh || b.bossNameZh || b.name || b.bossName) : (b.name || b.bossName || b.nameZh || b.bossNameZh)) || '';
  }

  const v = String(value).trim();
  if (!v) return '';
  if (v === '小盲注' || v === 'Small Blind' || v === 'SMALL') return lang === 'zh' ? '小盲注' : 'Small Blind';
  if (v === '大盲注' || v === 'Big Blind' || v === 'BIG') return lang === 'zh' ? '大盲注' : 'Big Blind';
  if (v === 'BOSS') return lang === 'zh' ? '首领盲注' : 'Boss Blind';

  const m = v.match(/^(?:首领盲注|Boss Blind)\s*[:：]\s*(.+)$/);
  if (m) {
    const boss = BOSS_ROSTER.find((b) => b.nameZh === m[1] || b.name === m[1]);
    const bossName = boss ? (lang === 'zh' ? boss.nameZh : boss.name) : m[1];
    return `${lang === 'zh' ? '首领盲注' : 'Boss Blind'}: ${bossName}`;
  }

  return v;
}

export function extractStateSnapshot(publicState: PublicGameState): ReplayStateSnapshot {
  return {
    ante: publicState.ante || 1,
    blindName: formatBlindName(publicState.blind, 'zh'),
    blindType: publicState.blind?.blindType || 'SMALL',
    targetScore: publicState.targetScore || 300,
    currentRoundScore: publicState.currentRoundScore || 0,
    handsLeft: publicState.handsLeft ?? 4,
    discardsLeft: publicState.discardsLeft ?? 3,
    money: publicState.money || 0,
    playerCards: JSON.parse(JSON.stringify(publicState.playerCards || [])),
    selectedCardIds: [...(publicState.selectedCardIds || [])],
    jokers: JSON.parse(JSON.stringify(publicState.jokers || [])),
    handLevels: publicState.handLevels ? JSON.parse(JSON.stringify(publicState.handLevels)) : undefined,
    shopInventory: publicState.shopInventory ? JSON.parse(JSON.stringify(publicState.shopInventory)) : undefined,
  };
}
