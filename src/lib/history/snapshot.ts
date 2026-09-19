import { PublicGameState, BlindInfo } from '../../game/types';
import { ReplayStateSnapshot } from './types';

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
