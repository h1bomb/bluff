import React from 'react';
import { Button } from '@/components/ui/8bit/button';
import { TranslationDictionary } from '@/lib/i18n/translations';

interface ShopActionBarProps {
  isReplayMode: boolean;
  money: number;
  rerollCost: number;
  t: TranslationDictionary;
  nextBlindFullText: string;
  onReroll: () => void;
  onNextBlind?: () => void;
  isPending?: boolean;
}

export function ShopActionBar({
  isReplayMode,
  money,
  rerollCost,
  t,
  nextBlindFullText,
  onReroll,
  onNextBlind,
  isPending = false,
}: ShopActionBarProps) {
  if (isReplayMode) {
    return (
      <div className="w-full py-1 text-center font-mono text-[9px] text-zinc-500 border border-zinc-800/80 bg-zinc-950/80 shrink-0">
        ✦ {t.shop.archiveReadOnly} ✦
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2.5 pt-1.5 border-t border-zinc-800/80 shrink-0">
      <Button
        variant="outline"
        size="sm"
        soundEffect="cardDiscard"
        onClick={onReroll}
        disabled={money < rerollCost || isPending}
        className="shrink-0 w-auto px-2.5 sm:px-3 retro text-[9px] h-9 border-zinc-700 hover:border-yellow-400 text-zinc-300 hover:text-yellow-300 active:scale-95 flex items-center justify-center gap-1"
      >
        <span className="shrink-0">🔄</span>
        <span className="whitespace-nowrap">{`${t.shop.reroll} ($${rerollCost})`}</span>
      </Button>

      <Button
        variant="default"
        size="sm"
        onClick={onNextBlind}
        className="flex-1 min-w-0 bg-emerald-600 hover:bg-emerald-500 text-black active:scale-95 retro text-[9px] sm:text-[10px] font-black h-9 shadow-[0_0_12px_rgba(16,185,129,0.3)] flex items-center justify-center px-2"
        title={nextBlindFullText}
      >
        <span className="shrink-0 mr-1">⚔️</span>
        <span className="truncate">
          {nextBlindFullText}
        </span>
        <span className="shrink-0 ml-1">▶</span>
      </Button>
    </div>
  );
}
