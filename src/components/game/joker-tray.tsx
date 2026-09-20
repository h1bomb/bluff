'use client';

import React, { useState } from 'react';
import { JokerInstance } from '@/game/jokers/types';
import { useLanguageStore } from '@/store/language-store';
import { useGameStore } from '@/store/game-store';

interface JokerTrayProps {
  jokers: JokerInstance[];
  maxJokers?: number;
  onSellJoker?: (jokerId: string) => void;
  className?: string;
  compact?: boolean;
}

export function JokerTray({
  jokers,
  maxJokers = 5,
  onSellJoker,
  className = '',
  compact = false,
}: JokerTrayProps) {
  const { language, t } = useLanguageStore();
  const shopPending = useGameStore((s) => s.shopPending);
  const [selectedJoker, setSelectedJoker] = useState<JokerInstance | null>(null);

  const rarityBorders: Record<string, string> = {
    COMMON: 'border-zinc-600 bg-zinc-950 text-zinc-300',
    UNCOMMON: 'border-cyan-500 bg-cyan-950/40 text-cyan-300 shadow-[0_0_8px_rgba(6,182,212,0.3)]',
    RARE: 'border-purple-500 bg-purple-950/40 text-purple-300 shadow-[0_0_10px_rgba(168,85,247,0.4)]',
    LEGENDARY: 'border-yellow-400 bg-yellow-950/40 text-yellow-300 shadow-[0_0_12px_rgba(250,204,21,0.5)]',
  };

  return (
    <div className={`w-full flex flex-col ${compact ? 'gap-1' : 'gap-1.5'} select-none ${className}`}>
      {/* Header with Passive Slot Categorization */}
      <div className={`flex items-center justify-between px-1 ${compact ? 'text-[10px]' : 'text-[11px]'} retro leading-none`}>
        <span className="text-zinc-300 font-bold flex items-center gap-1.5">
          <span className="text-purple-400">🃏</span>
          <span className="px-1 py-0.2 bg-purple-950/80 border border-purple-500/60 text-purple-300 text-[8px] font-black">
            {t.jokers.passiveSlots || '常驻卡槽'}
          </span>
          <span className="text-zinc-400 font-medium">{t.jokers.title}</span>
        </span>
        <span className="font-mono text-zinc-400 font-bold text-[10px]">
          {jokers.length}/{maxJokers}
        </span>
      </div>

      {/* 5 Slots - Compact Height to save vertical space */}
      <div className="grid grid-cols-5 gap-1.5 w-full">
        {Array.from({ length: maxJokers }).map((_, index) => {
          const joker = jokers[index];

          if (!joker) {
            return (
              <div
                key={`empty_${index}`}
                className="h-11 sm:h-12 border-2 border-dashed border-zinc-800 bg-zinc-950/50 flex flex-col items-center justify-center retro text-zinc-700 select-none group hover:border-zinc-700"
              >
                <span className="text-xs text-zinc-600 leading-none">+</span>
                <span className="text-[7px] text-zinc-700 font-mono scale-90">SLOT</span>
              </div>
            );
          }

          const style = rarityBorders[joker.rarity] || rarityBorders.COMMON;
          const isInspected = selectedJoker?.id === joker.id;

          return (
            <button
              key={joker.id}
              onClick={() => setSelectedJoker(isInspected ? null : joker)}
              className={`h-11 sm:h-12 p-0.5 border-2 flex flex-col items-center justify-between cursor-pointer transition-transform active:scale-95 ${style} ${
                isInspected ? 'ring-2 ring-yellow-400 -translate-y-0.5' : ''
              }`}
              title={language === 'zh' ? joker.nameZh : joker.name}
            >
              <span className="text-base sm:text-lg leading-none mt-0.5">{joker.icon}</span>
              <span className="text-[7px] sm:text-[8px] retro font-bold text-center truncate w-full leading-tight">
                {language === 'zh' ? joker.nameZh : joker.name}
              </span>
            </button>
          );
        })}
      </div>

      {/* Inspected Joker Details Drawer / Popover */}
      {selectedJoker && (
        <div className="border-2 border-yellow-500 bg-zinc-950 p-2.5 flex items-center justify-between gap-3 text-xs retro shadow-[0_0_15px_rgba(234,179,8,0.2)] animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="flex flex-col gap-1 leading-normal flex-1">
            <div className="flex items-center gap-2">
              <span className="text-base leading-none">{selectedJoker.icon}</span>
              <span className="font-bold text-yellow-300">
                {language === 'zh' ? selectedJoker.nameZh : selectedJoker.name}
              </span>
              <span className="text-[8px] px-1 py-0.5 border border-zinc-600 bg-zinc-900 text-zinc-400">
                {t.jokers.rarity[selectedJoker.rarity as keyof typeof t.jokers.rarity] || selectedJoker.rarity}
              </span>
            </div>
            <p className="text-[11px] text-zinc-300 leading-tight">
              {language === 'zh' ? selectedJoker.descriptionZh : selectedJoker.description}
            </p>
          </div>

          {onSellJoker && (
            <button
              disabled={shopPending}
              onClick={() => {
                if (shopPending) return;
                onSellJoker(selectedJoker.id);
                setSelectedJoker(null);
              }}
              className={`px-2.5 py-1.5 bg-red-950/80 border border-red-500 text-red-300 transition-all text-xs font-bold leading-none shrink-0 ${
                shopPending ? 'opacity-50 cursor-wait' : 'hover:bg-red-900 active:scale-95'
              }`}
            >
              {`${t.jokers.sell} +$${selectedJoker.sellValue}`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
