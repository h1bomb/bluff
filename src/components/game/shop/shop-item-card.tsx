import React from 'react';
import { ShopItem } from '@/game/shop/types';
import { TranslationDictionary } from '@/lib/i18n/translations';
import { audioManager } from '@/lib/audio/audio-manager';

interface ShopItemCardProps {
  item: ShopItem;
  canAfford: boolean;
  isJokerFull: boolean;
  isBoughtStepItem: boolean;
  isReplayMode: boolean;
  isAutopilotEnabled: boolean;
  matchingDecision: boolean;
  language: string;
  t: TranslationDictionary;
  onBuy: (item: ShopItem) => void;
}

export function ShopItemCard({
  item,
  canAfford,
  isJokerFull,
  isBoughtStepItem,
  isReplayMode,
  isAutopilotEnabled,
  matchingDecision,
  language,
  t,
  onBuy,
}: ShopItemCardProps) {
  return (
    <div
      onClick={() => {
        if (!isReplayMode && canAfford && !isJokerFull) {
          audioManager.playSfx('chipClink');
          onBuy(item);
        }
      }}
      className={`border-2 ${isReplayMode ? 'p-1.5 gap-2' : 'p-2 gap-2.5'} flex items-center justify-between transition-all ${
        isBoughtStepItem
          ? 'border-yellow-400 bg-purple-950/70 shadow-[0_0_15px_rgba(250,204,21,0.4)] ring-2 ring-yellow-400/80 scale-[1.01]'
          : isReplayMode
          ? 'border-zinc-800 bg-zinc-950/80 opacity-80 cursor-default'
          : !canAfford || isJokerFull
          ? 'border-zinc-800 bg-zinc-950/60 opacity-60 cursor-not-allowed'
          : matchingDecision && isAutopilotEnabled
          ? 'border-yellow-400 bg-yellow-950/40 shadow-[0_0_10px_rgba(250,204,21,0.3)] ring-1 ring-yellow-400/50 hover:bg-yellow-950/50 cursor-pointer'
          : 'border-zinc-700 bg-zinc-900/90 hover:border-emerald-400 hover:bg-zinc-800/80 cursor-pointer active:scale-[0.99]'
      }`}
    >
      <div className="flex items-start gap-2 flex-1 min-w-0">
        <span className={`${isReplayMode ? 'text-lg' : 'text-xl'} shrink-0 mt-0.5`}>{item.icon}</span>
        <div className="flex flex-col gap-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={`retro ${isReplayMode ? 'text-[11px]' : 'text-xs'} font-bold text-zinc-100 truncate`}>
              {language === 'zh' ? item.nameZh || item.name : item.name}
            </span>
            <span
              className={`text-[7px] px-1.5 py-0.2 border retro font-bold ${
                item.itemType === 'JOKER'
                  ? 'border-purple-400 bg-purple-950 text-purple-300'
                  : item.itemType === 'HAND_UPGRADE'
                  ? 'border-cyan-400 bg-cyan-950 text-cyan-300'
                  : 'border-amber-400 bg-amber-950 text-amber-300'
              }`}
            >
              {item.itemType === 'JOKER'
                ? `🃏 ${t.shop.categoryJoker || '常驻卡槽'}`
                : item.itemType === 'HAND_UPGRADE'
                ? `📜 ${t.shop.categoryUpgrade || '一次性使用'}`
                : `✨ ${t.shop.categoryMod || '对卡片起作用'}`}
            </span>
            {isBoughtStepItem && (
              <span className="text-[8px] px-1 py-0.2 bg-yellow-400 text-black font-black retro animate-pulse shadow-[0_0_6px_#facc15]">
                {t.shop.purchased}
              </span>
            )}
          </div>
          <p className="text-[9px] text-zinc-300 leading-normal line-clamp-1 sm:line-clamp-2">
            {language === 'zh' ? item.descriptionZh || item.description : item.description}
          </p>
          <span className="text-[8px] text-zinc-500 leading-normal block">
            {item.itemType === 'JOKER'
              ? t.shop.categoryJokerDesc
              : item.itemType === 'HAND_UPGRADE'
              ? t.shop.categoryUpgradeDesc
              : t.shop.categoryModDesc}
          </span>
        </div>
      </div>

      <div className="flex flex-col items-end shrink-0 gap-1">
        <div
          className={`font-mono text-xs font-black ${
            isBoughtStepItem
              ? 'text-yellow-300'
              : canAfford
              ? 'text-yellow-400'
              : 'text-red-400'
          }`}
        >
          ${item.cost}
        </div>

        {!isReplayMode && (
          <button
            disabled={!canAfford || isJokerFull}
            className={`px-2 py-0.5 retro text-[8px] font-bold border ${
              !canAfford || isJokerFull
                ? 'border-zinc-800 bg-zinc-900 text-zinc-600 cursor-not-allowed'
                : 'border-emerald-500 bg-emerald-950 text-emerald-300 hover:bg-emerald-900 active:scale-95'
            }`}
          >
            {isJokerFull && item.itemType === 'JOKER'
              ? t.shop.full
              : t.shop.buy}
          </button>
        )}
      </div>
    </div>
  );
}
