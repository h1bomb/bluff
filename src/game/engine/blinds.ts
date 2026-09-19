import { BlindInfo, BlindType } from '../types';
import zhJson from '@/lib/i18n/locales/zh.json';
import enJson from '@/lib/i18n/locales/en.json';

export const BOSS_ROSTER = [
  {
    name: enJson.blinds.bossRoster.THE_CYNIC.name,
    nameZh: zhJson.blinds.bossRoster.THE_CYNIC.name,
    bossAbility: enJson.blinds.bossRoster.THE_CYNIC.ability,
    bossAbilityZh: zhJson.blinds.bossRoster.THE_CYNIC.ability,
  },
  {
    name: enJson.blinds.bossRoster.THE_NARCISSIST.name,
    nameZh: zhJson.blinds.bossRoster.THE_NARCISSIST.name,
    bossAbility: enJson.blinds.bossRoster.THE_NARCISSIST.ability,
    bossAbilityZh: zhJson.blinds.bossRoster.THE_NARCISSIST.ability,
  },
  {
    name: enJson.blinds.bossRoster.THE_BLIND_SPOT.name,
    nameZh: zhJson.blinds.bossRoster.THE_BLIND_SPOT.name,
    bossAbility: enJson.blinds.bossRoster.THE_BLIND_SPOT.ability,
    bossAbilityZh: zhJson.blinds.bossRoster.THE_BLIND_SPOT.ability,
  },
  {
    name: enJson.blinds.bossRoster.THE_OVERCLOCKER.name,
    nameZh: zhJson.blinds.bossRoster.THE_OVERCLOCKER.name,
    bossAbility: enJson.blinds.bossRoster.THE_OVERCLOCKER.ability,
    bossAbilityZh: zhJson.blinds.bossRoster.THE_OVERCLOCKER.ability,
  },
];

// Standard Balatro-balanced progression (Ante 1 to 8)
// In 3-card poker, hands naturally score tighter than 5-card games,
// so scaling to 100,000 for the Ante 8 Boss creates a rigorous yet conquerable endgame.
export const BALATRO_ANTE_TARGETS: Record<number, { small: number; big: number; boss: number }> = {
  1: { small: 300, big: 450, boss: 600 },
  2: { small: 800, big: 1200, boss: 1600 },
  3: { small: 2000, big: 3000, boss: 4000 },
  4: { small: 5000, big: 7500, boss: 10000 },
  5: { small: 11000, big: 16500, boss: 22000 },
  6: { small: 20000, big: 30000, boss: 40000 },
  7: { small: 35000, big: 52500, boss: 70000 },
  8: { small: 50000, big: 75000, boss: 100000 },
};

export function getBlindInfo(ante: number, blindType: BlindType): BlindInfo {
  let targetScore: number;
  let rewardMoney = 3;

  if (ante <= 8 && BALATRO_ANTE_TARGETS[ante]) {
    const table = BALATRO_ANTE_TARGETS[ante];
    if (blindType === 'SMALL') {
      targetScore = table.small;
      rewardMoney = 3;
    } else if (blindType === 'BIG') {
      targetScore = table.big;
      rewardMoney = 4;
    } else {
      targetScore = table.boss;
      rewardMoney = 5;
    }
  } else {
    // Endless mode beyond Ante 8
    const baseAnte8 = BALATRO_ANTE_TARGETS[8];
    const endlessMultiplier = Math.pow(1.85, ante - 8);
    if (blindType === 'SMALL') {
      targetScore = Math.round(baseAnte8.small * endlessMultiplier);
      rewardMoney = 4;
    } else if (blindType === 'BIG') {
      targetScore = Math.round(baseAnte8.big * endlessMultiplier);
      rewardMoney = 5;
    } else {
      targetScore = Math.round(baseAnte8.boss * endlessMultiplier);
      rewardMoney = 6;
    }
  }

  if (blindType === 'BOSS') {
    const boss = BOSS_ROSTER[(ante - 1) % BOSS_ROSTER.length];
    return {
      ante,
      blindType,
      targetScore,
      rewardMoney,
      bossName: boss.name,
      bossNameZh: boss.nameZh,
      bossAbility: boss.bossAbility,
      bossAbilityZh: boss.bossAbilityZh,
    };
  }

  return {
    ante,
    blindType,
    targetScore,
    rewardMoney,
  };
}

export function getNextBlind(ante: number, currentBlind: BlindType): { nextAnte: number; nextBlind: BlindType } {
  if (currentBlind === 'SMALL') {
    return { nextAnte: ante, nextBlind: 'BIG' };
  } else if (currentBlind === 'BIG') {
    return { nextAnte: ante, nextBlind: 'BOSS' };
  } else {
    return { nextAnte: ante + 1, nextBlind: 'SMALL' };
  }
}
