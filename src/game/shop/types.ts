import { HandType } from '../types';

export type ShopItemType = 'JOKER' | 'HAND_UPGRADE' | 'MEMORY_MOD';

export interface ShopItem {
  id: string;
  itemType: ShopItemType;
  name: string;
  nameZh: string;
  description: string;
  descriptionZh: string;
  cost: number;
  icon: string;
  payload: {
    jokerKey?: string;
    handTypeToUpgrade?: HandType;
    memoryModType?: 'QUANTUM_FOIL' | 'HOLOGRAPHIC_COAT' | 'POLYCHROME_FINISH' | 'SUIT_TRANSMUTE' | 'MEMORY_PURGE';
  };
}

export interface ShopState {
  items: ShopItem[];
  rerollCost: number;
}
