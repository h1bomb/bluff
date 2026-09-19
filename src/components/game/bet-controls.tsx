'use client';

import React from 'react';
import { Button } from '@/components/ui/8bit/button';
import { PokerAction } from '@/game/types';
import { useLanguageStore } from '@/store/language-store';
import { audioManager } from '@/lib/audio/audio-manager';

interface BetControlsProps {
  onAction: (action: PokerAction) => void;
  disabled?: boolean;
  callAmount?: number;
  raiseAmount?: number;
  playerChips?: number;
}

export function BetControls({
  onAction,
  disabled = false,
  callAmount = 0,
  raiseAmount = 60,
  playerChips = 1000,
}: BetControlsProps) {
  const { t } = useLanguageStore();

  return (
    <div className="w-full grid grid-cols-2 gap-3 select-none">
      {/* Top Left: CALL */}
      <Button
        variant="secondary"
        size="lg"
        disabled={disabled}
        onClick={() => {
          audioManager.playSfx('chipClink');
          onAction('CALL');
        }}
        className="h-15 min-h-[58px] w-full retro tracking-wider flex flex-col items-center justify-center font-bold bg-zinc-800 text-zinc-100 hover:bg-zinc-700 active:scale-95 transition-transform p-1.5"
      >
        <span className="text-sm sm:text-base font-black">{t.actions.call}</span>
        {callAmount > 0 ? (
          <span className="font-mono text-xs text-yellow-400 font-bold">
            +{callAmount}
          </span>
        ) : (
          <span className="font-mono text-[11px] text-zinc-400 font-normal">
            0
          </span>
        )}
      </Button>

      {/* Top Right: RAISE */}
      <Button
        variant="default"
        size="lg"
        disabled={disabled || playerChips <= 0}
        onClick={() => {
          audioManager.playSfx('chipClink');
          onAction('RAISE');
        }}
        className="h-15 min-h-[58px] w-full retro tracking-wider flex flex-col items-center justify-center font-bold bg-emerald-600 text-black hover:bg-emerald-500 active:scale-95 transition-transform p-1.5"
      >
        <span className="text-sm sm:text-base font-black">{t.actions.raise}</span>
        <span className="font-mono text-xs text-zinc-950 font-bold">
          {raiseAmount}
        </span>
      </Button>

      {/* Bottom Left: FOLD */}
      <Button
        variant="outline"
        size="lg"
        disabled={disabled}
        onClick={() => {
          audioManager.playSfx('cardDiscard');
          onAction('FOLD');
        }}
        className="h-15 min-h-[58px] w-full retro tracking-wider flex flex-col items-center justify-center font-bold bg-zinc-900 border-2 border-zinc-600 text-zinc-300 hover:text-white hover:bg-zinc-800 active:scale-95 transition-transform p-1.5"
      >
        <span className="text-sm sm:text-base font-black">{t.actions.fold}</span>
        <span className="font-mono text-xs text-zinc-400 font-medium">
          {t.actions.giveUp}
        </span>
      </Button>

      {/* Bottom Right: ALL IN */}
      <Button
        variant="destructive"
        size="lg"
        disabled={disabled || playerChips <= 0}
        onClick={() => {
          audioManager.playSfx('chipClink');
          onAction('ALL_IN');
        }}
        className="h-15 min-h-[58px] w-full retro tracking-wider flex flex-col items-center justify-center font-bold bg-red-600 text-white hover:bg-red-500 active:scale-95 transition-transform shadow-[0_0_15px_rgba(239,68,68,0.5)] p-1.5"
      >
        <span className="text-sm sm:text-base font-black">{t.actions.allIn}</span>
        <span className="font-mono text-xs text-red-200 font-bold">
          {playerChips}
        </span>
      </Button>
    </div>
  );
}
