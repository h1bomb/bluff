'use client';

import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { JokerInstance } from '@/game/jokers/types';
import { useLanguageStore } from '@/store/language-store';
import { format } from '@/lib/i18n/translations';
import { localizeBlindDisplay } from '@/lib/history/snapshot';
import { Button } from '@/components/ui/8bit/button';
import { audioManager } from '@/lib/audio/audio-manager';

interface ResultInlineViewProps {
  isVictory: boolean;
  ante: number;
  blindName?: unknown;
  totalScore: number;
  peakRoundScore?: number;
  totalHandsPlayed?: number;
  totalDiscards?: number;
  totalPurchases?: number;
  modelBreaksCount?: number;
  jokers?: JokerInstance[];
  onNewRun?: () => void;
  onOpenHistory?: () => void;
  onFirstStep?: () => void;
  onClose?: () => void;
  isReplayMode?: boolean;
}

export function ResultInlineView({
  isVictory,
  ante,
  blindName,
  totalScore,
  peakRoundScore = 0,
  totalHandsPlayed = 0,
  totalDiscards = 0,
  totalPurchases = 0,
  modelBreaksCount = 0,
  jokers = [],
  onNewRun,
  onOpenHistory,
  onFirstStep,
  onClose,
  isReplayMode = false,
}: ResultInlineViewProps) {
  const { language, t } = useLanguageStore();

  useEffect(() => {
    if (isVictory) {
      audioManager.playSfx('winChime');
      try {
        confetti({
          particleCount: 80,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#fbbf24', '#f59e0b', '#10b981', '#3b82f6', '#ec4899'],
        });
      } catch {
        // Confetti is optional visual flair
      }
    } else {
      audioManager.playSfx('gameOver');
    }
  }, [isVictory]);

  const resolvedBlindName = localizeBlindDisplay(blindName, language);

  return (
    <div
      className={`w-full border-2 ${
        isVictory
          ? 'border-yellow-400 bg-zinc-950 shadow-[0_0_25px_rgba(250,204,21,0.3)]'
          : 'border-red-600 bg-zinc-950 shadow-[0_0_25px_rgba(239,68,68,0.3)]'
      } p-3.5 flex flex-col items-center gap-3 text-center relative select-none animate-in fade-in duration-200`}
    >
      {/* Result Status Banner */}
      <div className="flex flex-col items-center gap-1 w-full border-b border-zinc-800 pb-2.5">
        <span className="text-3xl animate-bounce">
          {isVictory ? '🏆' : '💀'}
        </span>
        <div
          className={`retro text-base font-black tracking-wider ${
            isVictory ? 'text-yellow-400' : 'text-red-500'
          }`}
        >
          {isVictory ? t.resultRoguelike.victoryTitle : t.resultRoguelike.defeatTitle}
        </div>
        <p className="retro text-[9px] text-zinc-400">
          {isVictory
            ? t.resultRoguelike?.victorySub
            : typeof t.resultRoguelike?.defeatSub === 'function'
            ? t.resultRoguelike.defeatSub(ante, resolvedBlindName)
            : format(
                (t.resultRoguelike?.defeatSub as unknown as string) || '',
                { ante, blindName: resolvedBlindName ? ` (${resolvedBlindName})` : '' }
              )}
        </p>
      </div>

      {/* Main Score & Ante Display */}
      <div className="w-full bg-black/70 border border-zinc-800 p-2.5 flex items-center justify-around font-mono">
        <div className="flex flex-col items-center">
          <span className="retro text-[8px] text-zinc-500 font-bold">
            {t.resultRoguelike.finalAnte}
          </span>
          <span className="text-xl font-black text-cyan-400">
            ANTE {ante}
          </span>
        </div>

        <div className="w-[1px] h-8 bg-zinc-800" />

        <div className="flex flex-col items-center">
          <span className="retro text-[8px] text-zinc-500 font-bold">
            {t.resultRoguelike.totalScore}
          </span>
          <span className="text-2xl font-black text-yellow-400">
            {totalScore.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Tactical Stats Matrix */}
      <div className="w-full grid grid-cols-2 gap-1.5 text-left font-mono">
        <div className="p-1.5 bg-zinc-900/80 border border-zinc-800 flex items-center justify-between text-[10px]">
          <span className="text-zinc-400">{t.resultRoguelike.peakHand}:</span>
          <span className="text-emerald-400 font-bold">+{peakRoundScore.toLocaleString()}</span>
        </div>
        <div className="p-1.5 bg-zinc-900/80 border border-zinc-800 flex items-center justify-between text-[10px]">
          <span className="text-zinc-400">{t.resultRoguelike.handsPlayed}:</span>
          <span className="text-zinc-200 font-bold">{totalHandsPlayed}</span>
        </div>
        <div className="p-1.5 bg-zinc-900/80 border border-zinc-800 flex items-center justify-between text-[10px]">
          <span className="text-zinc-400">{t.resultRoguelike.discardsUsed}:</span>
          <span className="text-zinc-200 font-bold">{totalDiscards}</span>
        </div>
        <div className="p-1.5 bg-zinc-900/80 border border-zinc-800 flex items-center justify-between text-[10px]">
          <span className="text-zinc-400">{t.resultRoguelike.purchases}:</span>
          <span className="text-purple-300 font-bold">{totalPurchases}</span>
        </div>
        <div className="p-1.5 bg-zinc-900/80 border border-zinc-800 flex items-center justify-between text-[10px] col-span-2">
          <span className="text-zinc-400">{t.resultRoguelike.modelBreaks}:</span>
          <span className="text-red-400 font-bold">{modelBreaksCount}{t.resultRoguelike.timesSuffix}</span>
        </div>
      </div>

      {/* Jokers Collection Showcase */}
      {jokers && jokers.length > 0 && (
        <div className="w-full flex flex-col gap-1 text-left">
          <span className="retro text-[8px] text-zinc-500 font-bold">
            {typeof t.resultRoguelike?.finalJokerLineup === 'function'
              ? t.resultRoguelike.finalJokerLineup(jokers.length)
              : format(
                  (t.resultRoguelike?.finalJokerLineup as unknown as string) || '',
                  { count: jokers.length }
                )}
          </span>
          <div className="flex flex-wrap gap-1">
            {jokers.map((joker, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 bg-purple-950/80 border border-purple-500 text-purple-300 retro text-[8px] font-bold"
              >
                🃏 {language === 'zh' ? (joker.nameZh || joker.name) : joker.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="w-full flex items-center gap-2 pt-1 border-t border-zinc-800">
        {!isReplayMode ? (
          <>
            {onNewRun && (
              <Button
                variant="default"
                onClick={onNewRun}
                className="flex-1 h-10 retro text-xs font-black bg-emerald-600 hover:bg-emerald-500 text-black shadow-[0_0_12px_rgba(16,185,129,0.3)] active:scale-95"
              >
                {t.resultRoguelike.startNewRun}
              </Button>
            )}
            {onOpenHistory && (
              <Button
                variant="outline"
                onClick={onOpenHistory}
                className="px-3 h-10 retro text-[9px] font-bold border-zinc-700 hover:border-zinc-500 text-zinc-300 active:scale-95"
              >
                {t.resultRoguelike.historyButton}
              </Button>
            )}
          </>
        ) : (
          <>
            {onFirstStep && (
              <Button
                variant="outline"
                onClick={onFirstStep}
                className="flex-1 h-9 retro text-[9px] font-bold border-zinc-700 hover:border-emerald-500 text-zinc-300 hover:text-emerald-300 active:scale-95"
              >
                {t.resultRoguelike.replayFromStart}
              </Button>
            )}
            {onClose && (
              <Button
                variant="destructive"
                onClick={onClose}
                className="px-4 h-9 retro text-[9px] font-bold active:scale-95"
              >
                {t.resultRoguelike.exitReplay}
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
