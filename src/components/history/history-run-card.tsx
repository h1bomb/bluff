import React from 'react';
import { GameRunRecord } from '@/lib/history/types';
import { downloadRunAsJson } from '@/lib/history/db';
import { TranslationDictionary } from '@/lib/i18n/translations';

interface HistoryRunCardProps {
  run: GameRunRecord;
  t: TranslationDictionary;
  onReplay: (run: GameRunRecord) => void;
  onDelete: (id: string) => void;
}

export function HistoryRunCard({ run, t, onReplay, onDelete }: HistoryRunCardProps) {
  const isVictory = run.status === 'VICTORY';
  const isDefeat = run.status === 'DEFEAT';
  const dateStr = new Date(run.startTime).toLocaleString();
  const durationSec = run.durationMs
    ? Math.round(run.durationMs / 1000)
    : run.endTime
    ? Math.round((run.endTime - run.startTime) / 1000)
    : 0;

  const rawFinalBlind = run.summary?.finalBlind;
  const finalBlindDisplay =
    typeof rawFinalBlind === 'object' && rawFinalBlind !== null
      ? (rawFinalBlind as { nameZh?: string; name?: string; bossNameZh?: string; bossName?: string }).nameZh ||
        (rawFinalBlind as { nameZh?: string; name?: string; bossNameZh?: string; bossName?: string }).name ||
        (rawFinalBlind as { nameZh?: string; name?: string; bossNameZh?: string; bossName?: string }).bossNameZh ||
        (rawFinalBlind as { nameZh?: string; name?: string; bossNameZh?: string; bossName?: string }).bossName ||
        'BOSS'
      : String(rawFinalBlind || '');

  return (
    <div className="border-2 border-zinc-800 bg-zinc-950 p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-[2px_2px_0px_#000] hover:border-zinc-700 transition-all">
      <div className="flex items-center gap-3">
        <div
          className={`w-12 h-12 border-2 flex flex-col items-center justify-center font-mono ${
            isVictory
              ? 'border-emerald-500 bg-emerald-950/40 text-emerald-300'
              : isDefeat
              ? 'border-red-500 bg-red-950/40 text-red-400'
              : 'border-cyan-500 bg-cyan-950/40 text-cyan-300'
          }`}
        >
          <span className="text-lg">
            {isVictory ? '🏆' : isDefeat ? '💀' : '⏳'}
          </span>
          <span className="text-[8px] retro font-bold uppercase">
            A.{run.summary.finalAnte}
          </span>
        </div>

        <div>
          <div className="flex items-center gap-2">
            <span
              className={`text-xs retro font-bold ${
                isVictory
                  ? 'text-emerald-400'
                  : isDefeat
                  ? 'text-red-400'
                  : 'text-cyan-400'
              }`}
            >
              {isVictory
                ? t.history.statusVictory
                : isDefeat
                ? t.history.statusDefeat
                : t.history.statusRunning}
            </span>
            <span className="text-[9px] retro text-zinc-400 font-bold">
              ANTE {run.summary?.finalAnte ?? 1} - {finalBlindDisplay}
            </span>
          </div>

          <div className="flex items-center gap-3 mt-1 text-[9px] font-mono text-zinc-400 flex-wrap">
            <span>
              {t.history.totalScore}:{' '}
              <strong className="text-yellow-400">
                {run.summary.totalScore.toLocaleString()}
              </strong>
            </span>
            <span>
              {t.history.peakScore}:{' '}
              <strong className="text-emerald-400">
                +{run.summary.peakRoundScore.toLocaleString()}
              </strong>
            </span>
            <span>
              {t.history.handsPlayed}: {run.summary.totalHandsPlayed}
            </span>
            <span>
              {t.history.purchases}: {run.summary.totalPurchases}
            </span>
            <span>
              {run.steps.length} {t.history.stepsUnit}
            </span>
          </div>

          <div className="text-[8px] text-zinc-600 font-mono mt-1">
            {dateStr} | {t.history.duration}: {durationSec}s
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 self-end sm:self-center">
        <button
          onClick={() => onReplay(run)}
          className="px-3 py-1.5 bg-emerald-950 border border-emerald-500 text-emerald-300 retro text-[9px] font-bold hover:bg-emerald-900 active:scale-95 shadow-[0_0_8px_rgba(16,185,129,0.3)] flex items-center gap-1"
        >
          <span>▶</span>
          <span>{t.history.replayRun}</span>
        </button>

        <button
          onClick={() => downloadRunAsJson(run)}
          title="Export as JSON"
          className="px-2.5 py-1.5 bg-zinc-900 border border-zinc-700 text-zinc-300 retro text-[9px] hover:border-zinc-500 active:scale-95"
        >
          ⬇ JSON
        </button>

        <button
          onClick={() => onDelete(run.id)}
          title="Delete record"
          className="px-2 py-1.5 bg-zinc-950 border border-zinc-800 text-zinc-600 retro text-[9px] hover:text-red-400 hover:border-red-700 active:scale-95"
        >
          🗑
        </button>
      </div>
    </div>
  );
}
