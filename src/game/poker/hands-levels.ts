import { HandType } from '../types';

export interface HandLevelConfig {
  handType: HandType;
  level: number;
  baseChips: number;
  baseMult: number;
  chipGrowth: number;
  multGrowth: number;
  nameZh: string;
  nameEn: string;
}

export const DEFAULT_HAND_LEVELS: Record<HandType, HandLevelConfig> = {
  STRAIGHT_FLUSH: {
    handType: 'STRAIGHT_FLUSH',
    level: 1,
    baseChips: 100,
    baseMult: 8,
    chipGrowth: 40,
    multGrowth: 4,
    nameZh: '同花顺',
    nameEn: 'Straight Flush',
  },
  FOUR_OF_A_KIND: {
    handType: 'FOUR_OF_A_KIND',
    level: 1,
    baseChips: 60,
    baseMult: 7,
    chipGrowth: 30,
    multGrowth: 3,
    nameZh: '四条',
    nameEn: 'Four of a Kind',
  },
  FULL_HOUSE: {
    handType: 'FULL_HOUSE',
    level: 1,
    baseChips: 40,
    baseMult: 4,
    chipGrowth: 25,
    multGrowth: 2,
    nameZh: '葫芦',
    nameEn: 'Full House',
  },
  FLUSH: {
    handType: 'FLUSH',
    level: 1,
    baseChips: 35,
    baseMult: 4,
    chipGrowth: 15,
    multGrowth: 2,
    nameZh: '同花',
    nameEn: 'Flush',
  },
  STRAIGHT: {
    handType: 'STRAIGHT',
    level: 1,
    baseChips: 30,
    baseMult: 4,
    chipGrowth: 30,
    multGrowth: 3,
    nameZh: '顺子',
    nameEn: 'Straight',
  },
  THREE_OF_A_KIND: {
    handType: 'THREE_OF_A_KIND',
    level: 1,
    baseChips: 30,
    baseMult: 3,
    chipGrowth: 20,
    multGrowth: 2,
    nameZh: '三条',
    nameEn: 'Three of a Kind',
  },
  TWO_PAIR: {
    handType: 'TWO_PAIR',
    level: 1,
    baseChips: 20,
    baseMult: 2,
    chipGrowth: 20,
    multGrowth: 1,
    nameZh: '两对',
    nameEn: 'Two Pair',
  },
  PAIR: {
    handType: 'PAIR',
    level: 1,
    baseChips: 10,
    baseMult: 2,
    chipGrowth: 15,
    multGrowth: 1,
    nameZh: '对子',
    nameEn: 'Pair',
  },
  HIGH_CARD: {
    handType: 'HIGH_CARD',
    level: 1,
    baseChips: 5,
    baseMult: 1,
    chipGrowth: 10,
    multGrowth: 1,
    nameZh: '高牌',
    nameEn: 'High Card',
  },
};

export function getHandLevel(
  levels: Record<HandType, HandLevelConfig>,
  handType: HandType
): { chips: number; mult: number; level: number } {
  const cfg = levels[handType] || DEFAULT_HAND_LEVELS[handType];
  const chips = cfg.baseChips + (cfg.level - 1) * cfg.chipGrowth;
  const mult = cfg.baseMult + (cfg.level - 1) * cfg.multGrowth;
  return { chips, mult, level: cfg.level };
}
