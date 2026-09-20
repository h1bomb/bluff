'use client';

import React, { useState } from 'react';
import { ShopItem } from '@/game/shop/types';
import { generateShopInventory } from '@/game/shop/definitions';
import { JokerInstance } from '@/game/jokers/types';
import { BlindInfo } from '@/game/types';
import { useLanguageStore } from '@/store/language-store';
import { blindTypeLabel } from '@/lib/i18n/translations';
import { AutopilotDecision } from '@/game/autopilot/types';
import { ShopHeader } from './shop/shop-header';
import { ShopActionBar } from './shop/shop-action-bar';
import { ShopItemCard } from './shop/shop-item-card';
import { ShopBanners } from './shop/shop-banners';

interface ShopInlineViewProps {
  money: number;
  jokers: JokerInstance[];
  maxJokers?: number;
  nextBlind?: BlindInfo;
  inventory?: ShopItem[];
  rerollCost?: number;
  onBuyItem?: (item: ShopItem) => boolean | Promise<boolean>;
  onReroll?: () => boolean | Promise<boolean>;
  onNextBlind?: () => void;
  isReplayMode?: boolean;
  boughtItemPayload?: {
    name: string;
    nameZh?: string;
    itemType: string;
    cost: number;
  };
  activeDecisions?: AutopilotDecision[];
  isAutopilotEnabled?: boolean;
}

export function ShopInlineView({
  money,
  jokers,
  maxJokers = 5,
  nextBlind,
  inventory: propInventory,
  rerollCost: propRerollCost,
  onBuyItem,
  onReroll,
  onNextBlind,
  isReplayMode = false,
  boughtItemPayload,
  activeDecisions = [],
  isAutopilotEnabled = false,
}: ShopInlineViewProps) {
  const { language, t } = useLanguageStore();
  const [localInventory, setLocalInventory] = useState<ShopItem[]>(() =>
    generateShopInventory((jokers || []).map((j) => j.jokerKey))
  );
  const [boughtItemIds, setBoughtItemIds] = useState<string[]>([]);
  const [localRerollCost, setLocalRerollCost] = useState<number>(2);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const rerollCost = propRerollCost ?? localRerollCost;

  const rawInventory =
    propInventory && propInventory.length > 0
      ? propInventory
      : isReplayMode
      ? []
      : localInventory;
  const inventory = rawInventory.filter((i) => !boughtItemIds.includes(i.id));

  const nextBlindName = nextBlind
    ? nextBlind.blindType === 'BOSS'
      ? (language === 'zh' ? (nextBlind.bossNameZh || nextBlind.bossName) : (nextBlind.bossName || nextBlind.bossNameZh)) || t.blinds.boss
      : blindTypeLabel(t, nextBlind.blindType)
    : null;

  const nextBlindFullText = nextBlind
    ? `${t.shop.enterNextBlind}${nextBlindName ? ` (${nextBlindName})` : ''}`
    : t.shop.enterNextBlind;

  const handleBuy = async (item: ShopItem) => {
    if (isReplayMode || !onBuyItem) return;

    if (item.itemType === 'JOKER' && jokers.length >= maxJokers) {
      setStatusMessage(t.shop.slotsFull);
      return;
    }
    if (money < item.cost) {
      setStatusMessage(t.shop.notEnoughCash);
      return;
    }

    const success = await onBuyItem(item);
    if (success) {
      setBoughtItemIds((prev) => [...prev, item.id]);
      setLocalInventory((prev) => prev.filter((i) => i.id !== item.id && i.name !== item.name));
      const itemName = language === 'zh' ? (item.nameZh || item.name) : item.name;
      setStatusMessage(t.shop.purchasedSuccess(itemName, item.cost));
    } else {
      setStatusMessage(t.shop.purchaseFailed);
    }
  };

  const handleReroll = async () => {
    if (isReplayMode) return;
    if (money < rerollCost) {
      setStatusMessage(t.shop.notEnoughCashReroll);
      return;
    }
    if (onReroll) {
      const ok = await onReroll();
      if (ok) {
        setBoughtItemIds([]);
        setStatusMessage(t.shop.restocked);
      } else {
        setStatusMessage(t.shop.rerollFailed);
      }
    } else {
      setBoughtItemIds([]);
      setLocalInventory(generateShopInventory((jokers || []).map((j) => j.jokerKey)));
      setLocalRerollCost((c) => c + 1);
      setStatusMessage(t.shop.restocked);
    }
  };

  return (
    <div className="w-full flex-1 min-h-0 flex flex-col justify-between gap-2 select-none animate-in fade-in duration-200">
      <ShopHeader money={money} t={t} isReplayMode={isReplayMode} />

      <ShopBanners
        isReplayMode={isReplayMode}
        boughtItemPayload={boughtItemPayload}
        isAutopilotEnabled={isAutopilotEnabled}
        activeDecisions={activeDecisions}
        statusMessage={statusMessage}
        language={language}
        t={t}
      />

      {/* Category Legend Bar */}
      <div className="flex items-center justify-between px-1.5 py-1 bg-zinc-900/60 border border-zinc-800 text-[8px] retro font-bold shrink-0">
        <span className="flex items-center gap-1 text-purple-300">
          <span>🃏</span>
          <span>{t.shop.categoryJoker}</span>
        </span>
        <span className="flex items-center gap-1 text-cyan-300">
          <span>📜</span>
          <span>{t.shop.categoryUpgrade}</span>
        </span>
        <span className="flex items-center gap-1 text-amber-300">
          <span>✨</span>
          <span>{t.shop.categoryMod}</span>
        </span>
      </div>

      {/* Available Items List */}
      <div className={`flex flex-col gap-1.5 flex-1 min-h-[120px] ${isReplayMode ? 'max-h-[190px] sm:max-h-[220px]' : 'max-h-[260px] sm:max-h-[300px]'} overflow-y-auto pr-1 custom-scrollbar`}>
        {inventory.length === 0 ? (
          <div className="p-6 text-center retro text-xs text-zinc-500 border border-dashed border-zinc-800">
            {t.shop.soldOutInline}
          </div>
        ) : (
          inventory.map((item) => {
            const canAfford = money >= item.cost;
            const isJokerFull = item.itemType === 'JOKER' && (jokers || []).length >= maxJokers;
            const isBoughtStepItem =
              isReplayMode &&
              boughtItemPayload &&
              (boughtItemPayload.name === item.name ||
                boughtItemPayload.nameZh === item.nameZh);
            const matchingDecision = !!activeDecisions.find(
              (d) =>
                d.item?.id === item.id ||
                d.item?.name === item.name ||
                d.item?.nameZh === item.nameZh ||
                (d.item?.payload?.jokerKey &&
                  d.item.payload.jokerKey === item.payload?.jokerKey)
            );

            return (
              <ShopItemCard
                key={item.id}
                item={item}
                canAfford={canAfford}
                isJokerFull={isJokerFull}
                isBoughtStepItem={!!isBoughtStepItem}
                isReplayMode={isReplayMode}
                isAutopilotEnabled={isAutopilotEnabled}
                matchingDecision={matchingDecision}
                language={language}
                t={t}
                onBuy={handleBuy}
              />
            );
          })
        )}
      </div>

      <ShopActionBar
        isReplayMode={isReplayMode}
        money={money}
        rerollCost={rerollCost}
        t={t}
        nextBlindFullText={nextBlindFullText}
        onReroll={handleReroll}
        onNextBlind={onNextBlind}
      />
    </div>
  );
}
