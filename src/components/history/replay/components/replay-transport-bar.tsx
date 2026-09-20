import React from 'react';
import { GameRunRecord, GameReplayStep } from '@/lib/history/types';
import { TranslationDictionary } from '@/lib/i18n/translations';
import { downloadRunAsJson } from '@/lib/history/db';
import { resolveLocalizedText } from '../utils/replay-helpers';

interface ReplayTransportBarProps {
  run: GameRunRecord;
  currentStep?: GameReplayStep;
  stepIndex: number;
  totalSteps: number;
  isPlaying: boolean;
  speed: 1 | 2;
  isVictory: boolean;
  isDefeat: boolean;
  actionBadge: { label: string; className: string };
  language: string;
  t: TranslationDictionary;
  onClose: () => void;
  onPlayPause: () => void;
  onPrev: () => void;
  onNext: () => void;
  onFirst: () => void;
  onLast: () => void;
  onScrub: (index: number) => void;
  onSpeedToggle: () => void;
}

export function ReplayTransportBar({
  run, currentStep, stepIndex, totalSteps, isPlaying, speed,
  isVictory, isDefeat, actionBadge, language, t,
  onClose, onPlayPause, onPrev, onNext, onFirst, onLast, onScrub, onSpeedToggle
}: ReplayTransportBarProps) {
  return (
    <div className="w-full bg-zinc-950/95 border-2 border-emerald-500/80 px-2.5 py-1.5 sm:px-3 sm:py-2 z-40 shadow-[0_0_20px_rgba(16,185,129,0.3)] mb-2 flex flex-col gap-1.5 shrink-0">
      <div className="flex items-center justify-between gap-2 border-b border-zinc-800 pb-1.5">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-emerald-400 font-bold text-xs sm:text-sm retro flex items-center gap-1.5">
            <span>▶</span>
            <span>{t.historyReplay.cyberReplay}</span>
          </span>

          <span
            className={`px-1.5 py-0.5 text-[8px] sm:text-[9px] retro font-bold uppercase border ${
              isVictory
                ? 'border-emerald-400 bg-emerald-950 text-emerald-300 shadow-[0_0_8px_rgba(16,185,129,0.4)]'
                : isDefeat
                ? 'border-red-500 bg-red-950 text-red-400'
                : 'border-cyan-400 bg-cyan-950 text-cyan-300'
            }`}
          >
            {isVictory
              ? t.historyReplay.statusVictory
              : isDefeat
              ? t.historyReplay.statusDefeat
              : t.historyReplay.statusRunning}
          </span>

          <span className="font-mono text-[9px] sm:text-[10px] text-zinc-400 hidden sm:inline">
            ANTE {run.summary.finalAnte} | {t.historyReplay.scoreLabel}: {run.summary.totalScore.toLocaleString()}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => downloadRunAsJson(run)}
            className="px-2.5 py-1 bg-zinc-900 border border-zinc-700 text-zinc-300 retro text-[9px] hover:border-emerald-400 hover:text-emerald-300 active:scale-95 flex items-center gap-1"
          >
            <span>⬇</span>
            <span>{t.history.exportJson}</span>
          </button>
          <button
            onClick={onClose}
            className="px-2.5 py-1 bg-red-950 border border-red-500 text-red-300 retro text-[10px] font-bold hover:bg-red-900 active:scale-95"
          >
            ✕
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-1.5">
        <div className="w-full sm:flex-1 flex items-center gap-2">
          <span className="font-mono text-[10px] text-zinc-500 w-6 text-right">
            {stepIndex + 1}
          </span>
          <input
            type="range"
            min={0}
            max={totalSteps - 1}
            value={stepIndex}
            onChange={(e) => onScrub(Number(e.target.value))}
            className="w-full accent-emerald-500 cursor-pointer h-2 bg-zinc-800 rounded-none"
          />
          <span className="font-mono text-[10px] text-zinc-500 w-6">
            {totalSteps}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button onClick={onFirst} title={t.history.firstStep} className="px-2 py-1 bg-zinc-900 border border-zinc-700 text-zinc-300 retro text-[8px] active:scale-95">
            |◀
          </button>
          <button onClick={onPrev} disabled={stepIndex === 0} className="px-2 py-1 bg-zinc-900 border border-zinc-700 text-zinc-300 retro text-[8px] disabled:opacity-30 active:scale-95">
            {t.history.prevStep}
          </button>
          <button onClick={onPlayPause} className={`px-3 py-1 border retro text-[9px] font-bold active:scale-95 ${isPlaying ? 'bg-yellow-950 border-yellow-500 text-yellow-300 shadow-[0_0_8px_rgba(234,179,8,0.4)]' : 'bg-emerald-950 border-emerald-400 text-emerald-300 shadow-[0_0_8px_rgba(16,185,129,0.3)]'}`}>
            {isPlaying ? t.history.pause : t.historyReplay.autoplay}
          </button>
          <button onClick={onNext} disabled={stepIndex >= totalSteps - 1} className="px-2 py-1 bg-zinc-900 border border-zinc-700 text-zinc-300 retro text-[8px] disabled:opacity-30 active:scale-95">
            {t.history.nextStep}
          </button>
          <button onClick={onLast} title={t.history.lastStep} className="px-2 py-1 bg-zinc-900 border border-zinc-700 text-zinc-300 retro text-[8px] active:scale-95">
            ▶|
          </button>
          <button onClick={onSpeedToggle} className="px-2 py-1 bg-zinc-900 border border-zinc-700 text-yellow-400 font-mono text-[9px] font-bold active:scale-95" title={t.history.speed}>
            {speed}x
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 pt-1 border-t border-zinc-800/80 text-[10px] retro">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className={`px-1.5 py-0.2 border font-bold shrink-0 text-[8px] ${actionBadge.className}`}>
            {actionBadge.label}
          </span>
          <span className="text-zinc-200 truncate font-mono">
            {resolveLocalizedText(currentStep?.descriptionZh, currentStep?.description, language)}
          </span>
        </div>
        <span className="text-[9px] font-mono text-zinc-500 shrink-0">
          {currentStep?.timestamp ? new Date(currentStep.timestamp).toLocaleTimeString() : ''}
        </span>
      </div>
    </div>
  );
}
