import React from 'react';
import { useLanguageStore } from '@/store/language-store';

interface ScoreBreakdownGridProps {
  displayChips: number;
  displayMult: number;
  displayCogMult: number;
  currentCalculatedScore: number;
  finalScore: number;
  isFinished: boolean;
}

export function ScoreBreakdownGrid({
  displayChips,
  displayMult,
  displayCogMult,
  currentCalculatedScore,
  finalScore,
  isFinished,
}: ScoreBreakdownGridProps) {
  const { t } = useLanguageStore();

  return (
    <div className="w-full bg-black/70 border border-zinc-700/80 p-2 flex items-center justify-around font-mono text-center">
      {/* Chips */}
      <div className="flex flex-col items-center">
        <span className="text-[8px] retro font-bold text-zinc-500">{t.scoring.chips}</span>
        <span className="text-base sm:text-lg font-black text-cyan-400">
          {displayChips}
        </span>
      </div>

      <span className="text-zinc-500 text-sm font-bold">×</span>

      {/* Mult */}
      <div className="flex flex-col items-center">
        <span className="text-[8px] retro font-bold text-zinc-500">{t.scoring.mult}</span>
        <span className="text-base sm:text-lg font-black text-red-400">
          {displayMult}
        </span>
      </div>

      {displayCogMult > 1 && (
        <>
          <span className="text-zinc-500 text-sm font-bold">×</span>
          <div className="flex flex-col items-center">
            <span className="text-[8px] retro font-bold text-purple-400">{t.scoring.cog}</span>
            <span className="text-base sm:text-lg font-black text-purple-300">
              {typeof displayCogMult === 'number' ? displayCogMult.toFixed(1) : displayCogMult}x
            </span>
          </div>
        </>
      )}

      <span className="text-zinc-500 text-sm font-bold">=</span>

      {/* Current running score */}
      <div className="flex flex-col items-center">
        <span className="text-[8px] retro font-bold text-yellow-500">{t.scoring.gain}</span>
        <span className="text-base sm:text-lg font-black text-yellow-300">
          +{isFinished ? finalScore : currentCalculatedScore}
        </span>
      </div>
    </div>
  );
}
