import { PublicGameState, BlindInfo } from '../../game/types';
import { ReplayStateSnapshot } from './types';
import { BOSS_ROSTER } from '../../game/engine/blinds';
import { enJson, zhJson } from '@/lib/i18n/translations';

export function formatBlindName(blind?: BlindInfo, lang: 'zh' | 'en' = 'zh'): string {
  const locale = lang === 'zh' ? zhJson : enJson;
  if (!blind) return locale.blinds.smallBlind;
  if (blind.blindType === 'SMALL') return locale.blinds.smallBlind;
  if (blind.blindType === 'BIG') return locale.blinds.bigBlind;

  let bossDisplayName = locale.boss.readerName;
  if (lang === 'zh') {
    bossDisplayName = blind.bossNameZh || (typeof blind.bossName === 'string' ? blind.bossName : '') || zhJson.boss.readerName;
  } else {
    bossDisplayName = (typeof blind.bossName === 'string' ? blind.bossName : '') || enJson.boss.readerName;
  }

  if (typeof blind.bossName === 'object' && blind.bossName !== null) {
    const b = blind.bossName as { nameZh?: string; name?: string };
    bossDisplayName = (lang === 'zh' ? (b.nameZh || b.name) : b.name) || bossDisplayName;
  }

  return `${locale.blinds.bossBlind}: ${bossDisplayName}`;
}

/**
 * Resolves any recorded blind representation (BlindInfo object,
 * { name, nameZh } object, or a legacy string baked in one language)
 * into a display string for the requested language. The literal anchors
 * in the matchers cover records written before the locale-backed wording.
 */
export function localizeBlindDisplay(value: unknown, lang: 'zh' | 'en'): string {
  if (!value) return '';
  const locale = lang === 'zh' ? zhJson : enJson;
  if (typeof value === 'object') {
    const b = value as { blindType?: string; bossName?: string; bossNameZh?: string; name?: string; nameZh?: string };
    if (b.blindType) {
      return formatBlindName(b as BlindInfo, lang);
    }
    return (lang === 'zh' ? (b.nameZh || b.bossNameZh || b.name || b.bossName) : (b.name || b.bossName || b.nameZh || b.bossNameZh)) || '';
  }

  const v = String(value).trim();
  if (!v) return '';
  const smallAliases = new Set([zhJson.blinds.smallBlind, enJson.blinds.smallBlind, '小盲注', 'Small Blind', 'SMALL']);
  const bigAliases = new Set([zhJson.blinds.bigBlind, enJson.blinds.bigBlind, '大盲注', 'Big Blind', 'BIG']);
  if (smallAliases.has(v)) return locale.blinds.smallBlind;
  if (bigAliases.has(v)) return locale.blinds.bigBlind;
  if (v === 'BOSS') return locale.blinds.bossBlind;

  const m = v.match(/^(?:首领盲注|Boss Blind)\s*[:：]\s*(.+)$/);
  if (m) {
    const boss = BOSS_ROSTER.find((b) => b.nameZh === m[1] || b.name === m[1]);
    const bossName = boss ? (lang === 'zh' ? boss.nameZh : boss.name) : m[1];
    return `${locale.blinds.bossBlind}: ${bossName}`;
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
