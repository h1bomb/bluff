import { ShopItem } from './types';
import { getRandomJokers } from '../jokers/definitions';
import { HandType } from '../types';

const UPGRADE_POOL: Array<{ handType: HandType; nameZh: string; nameEn: string; cost: number }> = [
  { handType: 'STRAIGHT_FLUSH', nameZh: '同花顺神级卷轴', nameEn: 'Straight Flush Apex Scroll', cost: 5 },
  { handType: 'FOUR_OF_A_KIND', nameZh: '四条数据卷轴', nameEn: 'Four of a Kind Data Scroll', cost: 4 },
  { handType: 'FULL_HOUSE', nameZh: '葫芦数据卷轴', nameEn: 'Full House Data Scroll', cost: 4 },
  { handType: 'FLUSH', nameZh: '同花数据卷轴', nameEn: 'Flush Data Scroll', cost: 3 },
  { handType: 'STRAIGHT', nameZh: '顺子数据卷轴', nameEn: 'Straight Data Scroll', cost: 3 },
  { handType: 'THREE_OF_A_KIND', nameZh: '三条数据卷轴', nameEn: 'Three of a Kind Data Scroll', cost: 3 },
  { handType: 'TWO_PAIR', nameZh: '两对数据卷轴', nameEn: 'Two Pair Data Scroll', cost: 2 },
  { handType: 'PAIR', nameZh: '对子数据卷轴', nameEn: 'Pair Data Scroll', cost: 2 },
  { handType: 'HIGH_CARD', nameZh: '高牌数据卷轴', nameEn: 'High Card Data Scroll', cost: 2 },
];

const MEMORY_MOD_POOL = [
  {
    type: 'QUANTUM_FOIL',
    name: 'Quantum Foil Coating',
    nameZh: '量子镀层芯片',
    description: 'Apply FOIL modifier to a card (+30 chips)',
    descriptionZh: '为一张手牌镀上量子箔层（+30 筹码）',
    cost: 3,
    icon: '✨',
  },
  {
    type: 'HOLOGRAPHIC_COAT',
    name: 'Holographic Coating',
    nameZh: '全息涂层芯片',
    description: 'Apply HOLO modifier to a card (+10 mult)',
    descriptionZh: '为一张手牌涂上全息涂层（+10 倍率）',
    cost: 4,
    icon: '🌈',
  },
  {
    type: 'POLYCHROME_FINISH',
    name: 'Polychrome Finish',
    nameZh: '聚合棱镜芯片',
    description: 'Apply POLY modifier to a card (×1.5 mult)',
    descriptionZh: '为一张手牌镶嵌聚合棱镜（×1.5 倍率）',
    cost: 5,
    icon: '💎',
  },
  {
    type: 'SUIT_TRANSMUTE',
    name: 'Suit Transmuter',
    nameZh: '花色转换器',
    description: 'Swap a card between ♠↔♥ suit',
    descriptionZh: '将一张手牌的花色在 ♠↔♥ 之间转换',
    cost: 2,
    icon: '🔄',
  },
  {
    type: 'MEMORY_PURGE',
    name: 'Memory Purge',
    nameZh: '内存清理',
    description: 'Delete a card from your hand permanently',
    descriptionZh: '永久删除手中一张废牌，精炼牌库',
    cost: 1,
    icon: '🗑️',
  },
] as const;

export function generateShopInventory(existingJokerKeys: string[] = []): ShopItem[] {
  const items: ShopItem[] = [];

  // 1. Pick 2 Jokers
  const jokers = getRandomJokers(2, existingJokerKeys);
  for (const j of jokers) {
    items.push({
      id: `shop_joker_${j.key}_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      itemType: 'JOKER',
      name: j.name,
      nameZh: j.nameZh,
      description: j.description,
      descriptionZh: j.descriptionZh,
      cost: j.cost,
      icon: j.icon,
      payload: {
        jokerKey: j.key,
      },
    });
  }

  // 2. Pick 1 Hand Upgrade
  const randomUpgrade = UPGRADE_POOL[Math.floor(Math.random() * UPGRADE_POOL.length)];
  items.push({
    id: `shop_upgrade_${randomUpgrade.handType}_${Date.now()}`,
    itemType: 'HAND_UPGRADE',
    name: randomUpgrade.nameEn,
    nameZh: randomUpgrade.nameZh,
    description: `Upgrades ${randomUpgrade.nameEn} +1 Level.`,
    descriptionZh: `提升【${randomUpgrade.nameZh.replace('数据卷轴', '').replace('神级卷轴', '')}】+1 等级（提升筹码与倍数）。`,
    cost: randomUpgrade.cost,
    icon: '📜',
    payload: {
      handTypeToUpgrade: randomUpgrade.handType,
    },
  });

  // 3. Pick 1 Memory Mod from pool
  const randomMod = MEMORY_MOD_POOL[Math.floor(Math.random() * MEMORY_MOD_POOL.length)];
  items.push({
    id: `shop_mod_${randomMod.type.toLowerCase()}_${Date.now()}`,
    itemType: 'MEMORY_MOD',
    name: randomMod.name,
    nameZh: randomMod.nameZh,
    description: randomMod.description,
    descriptionZh: randomMod.descriptionZh,
    cost: randomMod.cost,
    icon: randomMod.icon,
    payload: {
      memoryModType: randomMod.type,
    },
  });

  return items;
}
