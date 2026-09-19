'use client';

import React from 'react';
import { Progress } from '@/components/ui/8bit/progress';
import { PlayerBelief } from '@/game/types';
import { useLanguageStore } from '@/store/language-store';

interface AIBeliefPanelProps {
  belief?: PlayerBelief;
  hasMindRead?: boolean;
  className?: string;
  compact?: boolean;
}

export function AIBeliefPanel({
  belief,
  hasMindRead = false,
  className = '',
  compact = false,
}: AIBeliefPanelProps) {
  const { t } = useLanguageStore();

  if (!belief) {
    return (
      <div
        className={`w-full border-2 border-zinc-800 bg-zinc-950 ${compact ? 'p-2' : 'p-3'} shadow-[2px_2px_0px_#000] flex flex-col items-center justify-center gap-1 text-center ${className}`}
      >
        <span className="retro text-[11px] font-medium text-zinc-400 animate-pulse tracking-wide">
          {t.game.observingInitialTells}
        </span>
        <div className="w-full bg-zinc-900 h-1.5 mt-0.5 border border-zinc-700" />
      </div>
    );
  }

  const topBehavior = belief.behavior.value;
  const topProb = belief.behavior.probabilities[topBehavior] || belief.behavior.confidence;
  const confidencePct = Math.min(99, Math.max(1, Math.round(topProb * 100)));

  // Color mapping
  const behaviorColors: Record<string, { color: string; bg: string }> = {
    STRONG_REPRESENTATION: { color: 'text-red-400 border-red-500', bg: 'bg-red-500' },
    BLUFF_REPRESENTATION: { color: 'text-cyan-400 border-cyan-500', bg: 'bg-cyan-500' },
    BAIT: { color: 'text-purple-400 border-purple-500', bg: 'bg-purple-500' },
    PROBE: { color: 'text-yellow-400 border-yellow-500', bg: 'bg-yellow-500' },
    DEFENSIVE: { color: 'text-blue-400 border-blue-500', bg: 'bg-blue-500' },
    TILT: { color: 'text-orange-400 border-orange-500', bg: 'bg-orange-500' },
    UNCLEAR: { color: 'text-zinc-400 border-zinc-500', bg: 'bg-zinc-500' },
    GENUINE_STRONG: { color: 'text-red-400 border-red-500', bg: 'bg-red-500' },
    CALCULATED_BLUFF: { color: 'text-cyan-400 border-cyan-500', bg: 'bg-cyan-500' },
    TEMPO_MANIPULATION: { color: 'text-purple-400 border-purple-500', bg: 'bg-purple-500' },
    DESPERATION_DIG: { color: 'text-blue-400 border-blue-500', bg: 'bg-blue-500' },
  };

  const currentColors = behaviorColors[topBehavior] || behaviorColors.UNCLEAR;
  const labelText = t.behaviors[topBehavior] || t.behaviors.UNCLEAR;

  return (
    <div
      className={`w-full border-2 border-zinc-700 bg-zinc-950 ${compact ? 'p-1.5 sm:p-2 gap-1.5' : 'p-3 gap-2.5'} shadow-[3px_3px_0px_#000] flex flex-col ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between leading-none">
        <span className={`retro ${compact ? 'text-[11px]' : 'text-xs'} font-bold text-zinc-300 tracking-wide leading-none`}>
          {t.game.aiThinksYouAre}
        </span>
        <div
          className={`retro ${compact ? 'text-[10px] px-2 py-0.5' : 'text-xs px-2.5 py-1'} border font-bold leading-none inline-flex items-center justify-center ${currentColors.color} bg-zinc-900`}
        >
          {labelText}
        </div>
      </div>

      {/* Primary Probability Bar */}
      <div className="flex items-center gap-2.5 leading-none">
        <div className="flex-1">
          <Progress
            variant="retro"
            value={confidencePct}
            className={compact ? 'h-2.5' : 'h-3.5'}
            progressBg={currentColors.bg}
          />
        </div>
        <span className={`retro ${compact ? 'text-xs' : 'text-sm'} font-bold text-zinc-100 min-w-[42px] text-right leading-none`}>
          {confidencePct}%
        </span>
      </div>

      {/* Unlocked Mind Read Buff Details */}
      {hasMindRead && (
        <div className="mt-1 pt-2.5 border-t border-dashed border-zinc-800 flex flex-col gap-2 animate-fade-in">
          <div className="flex items-center justify-between">
            <span className="retro text-xs text-emerald-400 font-bold flex items-center gap-1.5">
              <span>👁️</span> {t.game.mindReadDecrypted}
            </span>
            <span className="retro text-[9px] text-zinc-400">{t.game.rawTelemetry}</span>
          </div>

          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs font-mono mt-0.5">
            <div className="flex items-center justify-between">
              <span className="text-zinc-300">{t.behaviors.BLUFF_REPRESENTATION}:</span>
              <span className="text-cyan-400 font-bold">
                {Math.round((belief.behavior.probabilities.BLUFF_REPRESENTATION || belief.bluff) * 100)}%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-300">{t.behaviors.BAIT}:</span>
              <span className="text-purple-400 font-bold">
                {Math.round((belief.behavior.probabilities.BAIT || belief.baiting) * 100)}%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-300">{t.behaviors.STRONG_REPRESENTATION}:</span>
              <span className="text-red-400 font-bold">
                {Math.round((belief.behavior.probabilities.STRONG_REPRESENTATION || 0) * 100)}%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-300">{t.behaviors.PROBE}:</span>
              <span className="text-yellow-400 font-bold">
                {Math.round((belief.behavior.probabilities.PROBE || 0) * 100)}%
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] font-mono pt-1.5 text-zinc-300 border-t border-zinc-900 font-medium">
            <span>{t.game.aggression}: <strong className="text-red-400">{Math.round(belief.aggression * 100)}%</strong></span>
            <span>{t.game.predictability}: <strong className="text-yellow-400">{Math.round(belief.predictability * 100)}%</strong></span>
            <span>{t.game.tilt}: <strong className="text-orange-400">{Math.round(belief.tilt * 100)}%</strong></span>
          </div>
        </div>
      )}
    </div>
  );
}
