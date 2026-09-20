import { ShopItem } from './types';
import { getRandomJokers } from '../jokers/definitions';
import { HandType } from '../types';
import { enJson, zhJson, format } from '@/lib/i18n/translations';

// Copy lives in src/lib/i18n/locales (shop.upgradeNames / shop.mods);
// these pools carry only mechanics (handType, cost, icon).
const UPGRADE_POOL: Array<{ handType: HandType; cost: number }> = [
  { handType: 'STRAIGHT_FLUSH', cost: 5 },
  { handType: 'FOUR_OF_A_KIND', cost: 4 },
  { handType: 'FULL_HOUSE', cost: 4 },
  { handType: 'FLUSH', cost: 3 },
  { handType: 'STRAIGHT', cost: 3 },
  { handType: 'THREE_OF_A_KIND', cost: 3 },
  { handType: 'TWO_PAIR', cost: 2 },
  { handType: 'PAIR', cost: 2 },
  { handType: 'HIGH_CARD', cost: 2 },
];

const MEMORY_MOD_POOL = [
  { type: 'QUANTUM_FOIL', cost: 3, icon: '✨' },
  { type: 'HOLOGRAPHIC_COAT', cost: 4, icon: '🌈' },
  { type: 'POLYCHROME_FINISH', cost: 5, icon: '💎' },
  { type: 'SUIT_TRANSMUTE', cost: 2, icon: '🔄' },
  { type: 'MEMORY_PURGE', cost: 1, icon: '🗑️' },
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
  const handType = randomUpgrade.handType;
  items.push({
    id: `shop_upgrade_${handType}_${Date.now()}`,
    itemType: 'HAND_UPGRADE',
    name: enJson.shop.upgradeNames[handType],
    nameZh: zhJson.shop.upgradeNames[handType],
    description: format(enJson.shop.upgradeDescription, { name: enJson.pokerHands[handType] }),
    descriptionZh: format(zhJson.shop.upgradeDescription, { name: zhJson.pokerHands[handType] }),
    cost: randomUpgrade.cost,
    icon: '📜',
    payload: {
      handTypeToUpgrade: handType,
    },
  });

  // 3. Pick 1 Memory Mod from pool
  const randomMod = MEMORY_MOD_POOL[Math.floor(Math.random() * MEMORY_MOD_POOL.length)];
  const modCopy = {
    name: enJson.shop.mods[randomMod.type].name,
    nameZh: zhJson.shop.mods[randomMod.type].name,
    description: enJson.shop.mods[randomMod.type].description,
    descriptionZh: zhJson.shop.mods[randomMod.type].description,
  };
  items.push({
    id: `shop_mod_${randomMod.type.toLowerCase()}_${Date.now()}`,
    itemType: 'MEMORY_MOD',
    name: modCopy.name,
    nameZh: modCopy.nameZh,
    description: modCopy.description,
    descriptionZh: modCopy.descriptionZh,
    cost: randomMod.cost,
    icon: randomMod.icon,
    payload: {
      memoryModType: randomMod.type,
    },
  });

  return items;
}
