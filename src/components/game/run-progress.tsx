'use client';

import React from 'react';
import { useLanguageStore } from '@/store/language-store';

interface RunProgressProps {
  currentHand: number;
  totalHands?: number;
  chips: number;
  pot: number;
  className?: string;
}

export function RunProgress({
  currentHand,
  totalHands = 5,
  chips,
  pot,
  className = '',
}: RunProgressProps) {
  const { t } = useLanguageStore();

  return (
    <div
      className={`w-full bg-zinc-950 border-2 border-zinc-800 p-2.5 select-none shadow-[2px_2px_0px_#000] flex items-center justify-between gap-2 ${className}`}
    >
      {/* Hand index indicator */}
      <div className="flex flex-col justify-center">
        <div className="flex items-center gap-1.5 leading-none">
          <span className="retro text-xs font-bold text-zinc-400 leading-none">{t.common.hand}</span>
          <span className="retro text-xs font-bold text-zinc-100 font-mono leading-none">
            {currentHand.toString().padStart(2, '0')}/{totalHands.toString().padStart(2, '0')}
          </span>
        </div>

        {/* Retro dots */}
        <div className="flex items-center gap-1.5 mt-1.5 leading-none">
          {Array.from({ length: totalHands }).map((_, i) => {
            const handNum = i + 1;
            const isCurrent = handNum === currentHand;
            const isCompleted = handNum < currentHand;
            const isBoss = handNum === totalHands;

            return (
              <span
                key={i}
                className={`text-[10px] font-bold leading-none transition-colors ${
                  isCompleted
                    ? 'text-emerald-400'
                    : isCurrent
                    ? isBoss
                      ? 'text-purple-400 animate-pulse'
                      : 'text-yellow-400 animate-pulse'
                    : 'text-zinc-600'
                }`}
              >
                {isBoss ? (isCurrent || isCompleted ? '👑' : '♔') : isCompleted || isCurrent ? '●' : '○'}
              </span>
            );
          })}
        </div>
      </div>

      {/* Pot in middle */}
      <div className="flex flex-col items-center justify-center leading-none">
        <span className="retro text-[11px] font-bold text-zinc-400 leading-none">{t.common.pot}</span>
        <span className="retro text-sm font-bold text-yellow-400 font-mono mt-1 leading-none">
          {pot}
        </span>
      </div>

      {/* Player Chips on right */}
      <div className="flex flex-col items-end justify-center leading-none">
        <span className="retro text-[11px] font-bold text-zinc-400 leading-none">{t.common.chips}</span>
        <span className="retro text-sm font-bold text-emerald-400 font-mono mt-1 leading-none">
          {chips}
        </span>
      </div>
    </div>
  );
}
