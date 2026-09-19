import { GameState, HandType } from '../types';
import { ShopItem } from './types';
import { createJokerInstance } from '../jokers/definitions';
import { DEFAULT_HAND_LEVELS } from '../poker/hands-levels';
import { generateShopInventory } from './definitions';

export function buyShopItem(game: GameState, item: ShopItem): { game: GameState; success: boolean; message: string } {
  const currentMoney = game.money ?? 0;
  if (currentMoney < (item.cost || 0)) {
    return { game, success: false, message: '资金不足！' };
  }

  const updated = { ...game };
  updated.money = currentMoney - item.cost;

  if (item.itemType === 'JOKER') {
    const jokers = [...(updated.jokers || [])];
    if (jokers.length >= (updated.maxJokers ?? 5)) {
      return { game, success: false, message: '小丑槽位已满 (上限 5 张)！' };
    }
    const resolvedKey = item.payload?.jokerKey || 'PAVLOVS_BELL';
    jokers.push(createJokerInstance(resolvedKey));
    updated.jokers = jokers;
  } else if (item.itemType === 'HAND_UPGRADE') {
    const handLevels = { ...(updated.handLevels || DEFAULT_HAND_LEVELS) };
    const handTypeToUpgrade: HandType = item.payload?.handTypeToUpgrade || 'HIGH_CARD';
    const current = handLevels[handTypeToUpgrade] || DEFAULT_HAND_LEVELS[handTypeToUpgrade];
    handLevels[handTypeToUpgrade] = {
      ...current,
      level: (current.level || 1) + 1,
      baseChips: (current.baseChips || 20) + (current.chipGrowth || 15),
      baseMult: (current.baseMult || 2) + (current.multGrowth || 1),
    };
    updated.handLevels = handLevels;
  } else if (item.itemType === 'MEMORY_MOD') {
    const modType = item.payload?.memoryModType || 'QUANTUM_FOIL';
    const playerCards = [...updated.player.cards];
    const targetIdx = updated.selectedCardIds && updated.selectedCardIds.length > 0
      ? playerCards.findIndex(c => c.id === updated.selectedCardIds![0])
      : 0;

    if (playerCards.length > 0 && targetIdx >= 0) {
      const targetCard = { ...playerCards[targetIdx] };
      if (modType === 'QUANTUM_FOIL') {
        targetCard.extraChips = (targetCard.extraChips || 0) + 30;
        targetCard.modifier = 'FOIL';
        playerCards[targetIdx] = targetCard;
      } else if (modType === 'HOLOGRAPHIC_COAT') {
        targetCard.modifier = 'HOLO';
        playerCards[targetIdx] = targetCard;
      } else if (modType === 'POLYCHROME_FINISH') {
        targetCard.modifier = 'POLY';
        playerCards[targetIdx] = targetCard;
      } else if (modType === 'SUIT_TRANSMUTE') {
        targetCard.suit = targetCard.suit === '♠' ? '♥' : '♠';
        playerCards[targetIdx] = targetCard;
      } else if (modType === 'MEMORY_PURGE') {
        playerCards.splice(targetIdx, 1);
      }
      updated.player = {
        ...updated.player,
        cards: playerCards,
      };
      updated.selectedCardIds = [];
    }
  }

  if (updated.shopInventory) {
    updated.shopInventory = updated.shopInventory.filter(
      (i) => i.id !== item.id && i.name !== item.name
    );
  }

  return { game: updated, success: true, message: `成功购买 ${item.nameZh || item.name}!` };
}

export function rerollShop(game: GameState): { game: GameState; success: boolean; message: string } {
  const currentMoney = game.money ?? 0;
  const cost = game.rerollCost ?? 2;
  if (currentMoney < cost) {
    return { game, success: false, message: '资金不足，无法刷新黑市！' };
  }

  const updatedInventory = generateShopInventory((game.jokers || []).map((j) => j.jokerKey));
  const updatedGame: GameState = {
    ...game,
    money: currentMoney - cost,
    shopInventory: updatedInventory,
    rerollCost: cost + 1,
  };

  return {
    game: updatedGame,
    success: true,
    message: `暗网黑市已刷新！(花费 $${cost})`,
  };
}

export function sellJoker(game: GameState, jokerId: string): GameState {
  const jokers = game.jokers || [];
  const target = jokers.find((j) => j.id === jokerId);
  if (!target) return game;

  const refund = target.sellValue ?? 2;
  return {
    ...game,
    money: (game.money ?? 0) + refund,
    jokers: jokers.filter((j) => j.id !== jokerId),
  };
}
