'use client';

import React from 'react';
import { BlindInfo } from '@/game/types';
import { useLanguageStore } from '@/store/language-store';
import { Progress } from '@/components/ui/8bit/progress';

interface ScoreTargetBarProps {
  ante: number;
  blind?: BlindInfo;
  currentScore: number;
  targetScore: number;
  handsLeft: number;
  discardsLeft: number;
  money: number;
  className?: string;
  compact?: boolean;
}

export function ScoreTargetBar({
  ante,
  blind,
  currentScore,
  targetScore,
  handsLeft,
  discardsLeft,
  money,
  className = '',
  compact = false,
}: ScoreTargetBarProps) {
  const { language, t } = useLanguageStore();
  const pct = Math.min(100, Math.round((currentScore / Math.max(1, targetScore)) * 100));
  const isBoss = blind?.blindType === 'BOSS';

  const bossName = language === 'zh'
    ? (blind?.bossNameZh || blind?.bossName || t.boss.readerName)
    : (blind?.bossName || t.boss.readerName);

  const blindLabel = blind
    ? blind.blindType === 'SMALL'
      ? t.blinds.smallBlind
      : blind.blindType === 'BIG'
      ? t.blinds.bigBlind
      : `${t.blinds.boss}: ${bossName}`
    : '';

  return (
    <div
      className={`w-full bg-zinc-950 border-2 ${
        isBoss ? 'border-purple-600 shadow-[0_0_15px_rgba(168,85,247,0.3)]' : 'border-zinc-700 shadow-[2px_2px_0px_#000]'
      } p-2 gap-1.5 shrink-0 flex flex-col select-none ${className}`}
    >
      {/* Top Header: Ante, Blind, Money */}
      <div className={`flex items-center justify-between ${compact ? 'text-[11px]' : 'text-xs'} retro leading-none`}>
        <div className="flex items-center gap-1.5">
          <span className="px-1.5 py-0.5 bg-zinc-900 border border-zinc-700 text-zinc-300 font-bold text-[10px]">
            {t.blinds.ante} {ante}
          </span>
          <span className={`font-bold truncate max-w-[180px] ${isBoss ? 'text-purple-400' : 'text-zinc-200'}`}>
            {blindLabel}
          </span>
        </div>

        <div className="flex items-center gap-1 font-bold text-yellow-400">
          <span>💰</span>
          <span className="font-mono text-xs sm:text-sm leading-none">${money}</span>
        </div>
      </div>

      {/* Target Score & Progress */}
      <div className="flex flex-col gap-0.5">
        <div className={`flex items-center justify-between ${compact ? 'text-[10px]' : 'text-xs'} retro leading-none`}>
          <span className="text-zinc-400 font-bold">
            {t.blinds.scoreToBeat}
          </span>
          <span className="font-mono text-[11px] font-bold text-zinc-100">
            <strong className={`text-emerald-400 ${compact ? 'text-xs' : 'text-sm'}`}>{currentScore}</strong> / {targetScore}
          </span>
        </div>

        <Progress
          variant="retro"
          value={pct}
          className={compact ? 'h-2' : 'h-3'}
          progressBg={isBoss ? 'bg-purple-500' : pct >= 100 ? 'bg-emerald-400' : 'bg-cyan-500'}
        />
      </div>

      {/* Bottom Counter: Hands Left & Discards Left */}
      <div className={`flex items-center justify-between ${compact ? 'text-[10px] pt-0.5' : 'text-xs pt-1'} retro leading-none border-t border-zinc-800`}>
        <div className="flex items-center gap-1 text-blue-400 font-bold">
          <span>✋</span>
          <span>{t.blinds.hands}:</span>
          <span className={`font-mono ${compact ? 'text-xs' : 'text-sm'} text-blue-300 font-black`}>{handsLeft}</span>
        </div>

        <div className="flex items-center gap-1 text-orange-400 font-bold">
          <span>🔄</span>
          <span>{t.blinds.discards}:</span>
          <span className={`font-mono ${compact ? 'text-xs' : 'text-sm'} text-orange-300 font-black`}>{discardsLeft}</span>
        </div>
      </div>
    </div>
  );
}
