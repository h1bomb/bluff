'use client';

import React from 'react';
import { Button } from '@/components/ui/8bit/button';
import { Card, HandType } from '@/game/types';
import { evaluateHand } from '@/game/poker/evaluator';
import { DEFAULT_HAND_LEVELS, getHandLevel, HandLevelConfig } from '@/game/poker/hands-levels';
import { useLanguageStore } from '@/store/language-store';
import { audioManager } from '@/lib/audio/audio-manager';

interface PlayControlsProps {
  selectedCards: Card[];
  handsLeft: number;
  discardsLeft: number;
  disabled?: boolean;
  handLevels?: Record<HandType, HandLevelConfig>;
  targetScore?: number;
  currentScore?: number;
  onPlayHand: () => void;
  onDiscard: () => void;
  className?: string;
}

export function PlayControls({
  selectedCards,
  handsLeft,
  discardsLeft,
  disabled = false,
  handLevels = DEFAULT_HAND_LEVELS,
  targetScore = 300,
  currentScore = 0,
  onPlayHand,
  onDiscard,
  className = '',
}: PlayControlsProps) {
  const { language, t } = useLanguageStore();

  const numSelected = selectedCards.length;
  const canPlay = numSelected >= 1 && numSelected <= 5 && handsLeft > 0 && !disabled;
  const canDiscard = numSelected >= 1 && numSelected <= 5 && discardsLeft > 0 && !disabled;

  // Real-time detailed scoring engine computation
  let evaluatedInfo: {
    handDesc: string;
    level: number;
    baseChips: number;
    cardChips: number;
    totalChips: number;
    mult: number;
    estScore: number;
    needed: number;
    willBeatBlind: boolean;
  } | null = null;

  if (numSelected >= 1 && numSelected <= 5) {
    const evaluated = evaluateHand(selectedCards);
    const lvl = getHandLevel(handLevels, evaluated.handType);
    const handDesc = language === 'zh' ? (evaluated.descriptionZh || evaluated.description) : evaluated.description;

    const cardChips = selectedCards.reduce(
      (acc, c) => acc + (c.rank === 14 ? 11 : Math.min(10, c.rank)) + (c.extraChips || 0),
      0
    );
    const totalChips = lvl.chips + cardChips;
    const mult = lvl.mult;
    const estScore = totalChips * mult;
    const needed = Math.max(0, targetScore - currentScore);
    const willBeatBlind = estScore >= needed;

    evaluatedInfo = {
      handDesc,
      level: lvl.level,
      baseChips: lvl.chips,
      cardChips,
      totalChips,
      mult,
      estScore,
      needed,
      willBeatBlind,
    };
  }

  const remainingNeeded = Math.max(0, targetScore - currentScore);

  return (
    <div className={`w-full flex flex-col gap-1.5 select-none ${className}`}>
      {/* High-Impact Real-time Scoring Banner */}
      <div
        className={`w-full bg-zinc-950 border-2 p-1.5 flex flex-col justify-center transition-all ${
          evaluatedInfo
            ? evaluatedInfo.willBeatBlind
              ? 'border-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.35)] bg-yellow-950/20'
              : 'border-emerald-500/80 shadow-[0_0_12px_rgba(16,185,129,0.2)] bg-zinc-900/60'
            : 'border-zinc-800 bg-zinc-950'
        }`}
      >
        {evaluatedInfo ? (
          <div className="flex flex-col gap-1">
            {/* Top row: Hand Rank & Target Status */}
            <div className="flex items-center justify-between px-0.5 leading-none">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-yellow-400 text-xs animate-bounce leading-none">✨</span>
                <span className="retro text-xs font-black text-yellow-300 truncate">
                  {evaluatedInfo.handDesc}
                </span>
                <span className="px-1 py-0.2 bg-yellow-950/80 border border-yellow-500/80 text-yellow-300 retro text-[8px] font-bold">
                  Lv.{evaluatedInfo.level}
                </span>
              </div>

              {evaluatedInfo.willBeatBlind ? (
                <span className="px-1.5 py-0.2 bg-emerald-500 text-black retro text-[8px] font-black uppercase shadow-[0_0_8px_rgba(16,185,129,0.6)] animate-pulse">
                  {t.playControls.beatBlindNotice || '💥 必定击穿当前盲注！'}
                </span>
              ) : (
                <span className="text-[9px] font-mono text-zinc-400">
                  {t.playControls.remainingScore
                    ? t.playControls.remainingScore(Math.max(0, evaluatedInfo.needed - evaluatedInfo.estScore))
                    : `差 ${Math.max(0, evaluatedInfo.needed - evaluatedInfo.estScore)} 分`}
                </span>
              )}
            </div>

            {/* Bottom row: Scoring Formula & Punchy Projected Total */}
            <div className="flex items-center justify-between pt-1 border-t border-zinc-800/80 leading-none">
              <div className="flex items-center gap-1 text-[11px] font-mono font-bold">
                {/* Chips */}
                <span className="px-1.5 py-0.5 bg-cyan-950/80 border border-cyan-500/60 text-cyan-300 rounded-none inline-flex items-center gap-1">
                  <span>🔵</span>
                  <span>{evaluatedInfo.totalChips}</span>
                  <span className="text-[8px] text-cyan-400/80">({evaluatedInfo.baseChips}+{evaluatedInfo.cardChips})</span>
                </span>

                <span className="text-zinc-500 text-xs font-black">×</span>

                {/* Mult */}
                <span className="px-1.5 py-0.5 bg-red-950/80 border border-red-500/60 text-red-300 rounded-none inline-flex items-center gap-1">
                  <span>🔥</span>
                  <span>{evaluatedInfo.mult}</span>
                </span>
              </div>

              {/* Estimated Total Score */}
              <div className="flex items-center gap-1 font-mono">
                <span className="text-[9px] retro text-zinc-400">{t.playControls.estScore}:</span>
                <span className="text-base font-black text-yellow-300 tracking-wider shadow-sm animate-in fade-in">
                  +{evaluatedInfo.estScore}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between px-1 py-0.5 text-xs retro leading-none">
            <span className="text-zinc-400 font-bold text-[10px] flex items-center gap-1">
              <span>🎯</span>
              <span>{t.playControls.target}: <strong className="text-zinc-200">{targetScore}</strong></span>
              <span className="text-zinc-600">|</span>
              <span>{t.playControls.needed}: <strong className="text-emerald-400">{remainingNeeded}</strong></span>
            </span>
            <span className="text-zinc-500 font-mono text-[10px]">
              {t.playControls.selectedPrefix} {numSelected}/5
            </span>
          </div>
        )}
      </div>

      {/* Action Buttons: Discard & Play Hand */}
      <div className="w-full grid grid-cols-2 gap-2">
        {/* Discard Button */}
        <Button
          variant="outline"
          disabled={!canDiscard}
          onClick={() => {
            audioManager.playSfx('cardDiscard');
            onDiscard();
          }}
          className={`h-11 min-h-[44px] w-full retro font-bold text-xs flex items-center justify-between px-3 border-2 ${
            canDiscard
              ? 'border-orange-500 bg-zinc-900 text-orange-300 hover:bg-orange-950/60 active:scale-95'
              : 'border-zinc-800 bg-zinc-950 text-zinc-600 opacity-50 cursor-not-allowed'
          }`}
        >
          <span className="text-xs font-black leading-none flex items-center gap-1.5">
            <span>🔄</span>
            <span>{t.playControls.discard}</span>
          </span>
          <span className="text-[10px] text-zinc-400 font-mono leading-none">
            {discardsLeft}
          </span>
        </Button>

        {/* Play Hand Button */}
        <Button
          variant="default"
          disabled={!canPlay}
          onClick={() => {
            audioManager.playSfx('cardPlay');
            onPlayHand();
          }}
          className={`h-11 min-h-[44px] w-full retro font-bold text-xs flex items-center justify-between px-3 border-2 ${
            canPlay
              ? 'border-emerald-400 bg-emerald-500 hover:bg-emerald-400 text-black active:scale-95 shadow-[0_0_15px_rgba(16,185,129,0.5)]'
              : 'border-zinc-800 bg-zinc-950 text-zinc-600 opacity-50 cursor-not-allowed'
          }`}
        >
          <span className="text-xs font-black leading-none flex items-center gap-1.5">
            <span>⚡</span>
            <span>{t.playControls.playHand}</span>
          </span>
          <span className="text-[10px] text-zinc-900 font-mono font-bold leading-none">
            {handsLeft}
          </span>
        </Button>
      </div>
    </div>
  );
}
