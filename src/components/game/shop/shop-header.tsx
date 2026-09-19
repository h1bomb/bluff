import React from 'react';
import { TranslationDictionary } from '@/lib/i18n/translations';

interface ShopHeaderProps {
  money: number;
  t: TranslationDictionary;
  isReplayMode: boolean;
}

export function ShopHeader({ money, t, isReplayMode }: ShopHeaderProps) {
  return (
    <div className="flex items-center justify-between border-b-2 border-emerald-500/50 pb-2 shrink-0">
      <div className="flex items-center gap-2">
        <span className="text-xl">🏪</span>
        <div>
          <div className="retro text-xs font-black text-emerald-400 tracking-wider">
            {t.shop.title}
          </div>
          <div className="text-[8px] text-zinc-400 retro font-mono">
            {isReplayMode ? t.shop.subReplay : t.shop.subTitle}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1 px-2.5 py-1 bg-yellow-950/80 border border-yellow-500 text-yellow-300 retro text-xs font-bold">
        <span>💰</span>
        <span className="font-mono text-sm">${money}</span>
      </div>
    </div>
  );
}
