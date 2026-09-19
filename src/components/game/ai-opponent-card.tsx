'use client';

import React from 'react';
import { Badge } from '@/components/ui/8bit/badge';
import { Spinner } from '@/components/ui/8bit/spinner';
import { AIVisualState, PlayerBelief } from '@/game/types';
import { useLanguageStore } from '@/store/language-store';

interface AIOpponentCardProps {
  name: string;
  isBoss: boolean;
  chips: number;
  currentBet: number;
  visualState: AIVisualState;
  belief?: PlayerBelief;
  folded: boolean;
  compact?: boolean;
}

export function AIOpponentCard({
  name,
  isBoss,
  chips,
  currentBet,
  visualState,
  folded,
  compact = false,
}: AIOpponentCardProps) {
  const { t } = useLanguageStore();
  const isBroken = visualState === 'BROKEN' || folded;
  const isReading = visualState === 'READING';
  const isConfident = visualState === 'CONFIDENT';

  const displayName = isBoss ? t.boss.readerBoss : (name === 'THE READER' || name === '读心者' || !name ? t.boss.readerAi : name);

  return (
    <div
      className={`relative w-full border-2 border-zinc-700 bg-zinc-950 ${compact ? 'p-1.5 sm:p-2' : 'p-2.5'} select-none shadow-[3px_3px_0px_#000] ${
        isBroken ? 'animate-pixel-shake border-red-500' : ''
      }`}
    >
      {/* CRT Scanline effect on card */}
      <div className={`crt-screen relative ${compact ? 'p-0.5 gap-2' : 'p-1 gap-3'} flex items-center justify-between`}>
        {/* Left: Pixel Avatar */}
        <div className={`relative flex items-center ${compact ? 'gap-2' : 'gap-3'}`}>
          <div
            className={`${compact ? 'w-10 h-10 text-base' : 'w-13 h-13 text-xl'} border-2 ${
              isBroken
                ? 'border-red-500 bg-red-950/40 text-red-400'
                : isBoss
                ? 'border-purple-500 bg-purple-950/40 text-purple-400'
                : 'border-emerald-500 bg-emerald-950/40 text-emerald-400'
            } flex items-center justify-center font-mono relative overflow-hidden shrink-0`}
          >
            {isBroken ? (
              <span className="text-red-500 text-base font-bold glitch-text" data-text="X_X">
                X_X
              </span>
            ) : isReading ? (
              <Spinner variant="diamond" className={`text-emerald-400 ${compact ? 'size-4' : 'size-6'}`} />
            ) : isBoss ? (
              <span className="text-purple-400 text-base font-bold">[👁️]</span>
            ) : isConfident ? (
              <span className="text-cyan-400 text-lg font-bold">[^_^]</span>
            ) : (
              <span className="text-emerald-400 text-lg font-bold">[•_•]</span>
            )}

            {/* Subtle horizontal scanline */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/5 to-transparent pointer-events-none" />
          </div>

          <div className="flex flex-col justify-center">
            <div className="flex items-center gap-2 leading-none">
              <span className="retro text-sm font-bold tracking-wider text-zinc-100 leading-none">
                {displayName}
              </span>
              {isBoss && (
                <span className="retro text-[9px] px-1.5 py-0.5 bg-purple-900/80 text-purple-300 border border-purple-500 font-bold leading-none inline-flex items-center">
                  {t.common.boss}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 mt-1.5 text-xs font-mono text-zinc-300 font-medium leading-none">
              <span className="inline-flex items-center gap-1 leading-none">{t.common.chips}: <strong className="text-yellow-400 font-bold leading-none">{chips}</strong></span>
              {currentBet > 0 && (
                <span className="inline-flex items-center gap-1 leading-none">{t.common.bet}: <strong className="text-orange-400 font-bold leading-none">{currentBet}</strong></span>
              )}
            </div>
          </div>
        </div>

        {/* Right: AI Status / Indicator */}
        <div className="flex flex-col items-end justify-center gap-1 shrink-0">
          {folded ? (
            <Badge variant="destructive" className="retro text-xs px-2.5 py-1 font-bold animate-pulse leading-none inline-flex items-center justify-center">
              {t.common.folded}
            </Badge>
          ) : isReading ? (
            <div className="inline-flex items-center justify-center gap-1.5 px-2.5 py-1 bg-yellow-950/70 border border-yellow-500 text-yellow-300 retro text-[10px] font-bold leading-none">
              <Spinner variant="diamond" className="size-3.5 text-yellow-400 shrink-0" />
              <span className="leading-none">{t.common.scanning}</span>
            </div>
          ) : isBroken ? (
            <Badge variant="destructive" className="retro text-xs px-2 py-1 font-bold leading-none inline-flex items-center justify-center">
              {t.common.deceived}
            </Badge>
          ) : (
            <div className="inline-flex items-center justify-center gap-1.5 px-2.5 py-1 bg-emerald-950/30 border border-emerald-500/30 leading-none">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-ping shrink-0" />
              <span className="retro text-xs text-emerald-400 font-bold tracking-wide leading-none">
                {t.common.active}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
