import React, { useEffect, useRef } from 'react';
import { GameReplayStep } from '@/lib/history/types';
import { TranslationDictionary } from '@/lib/i18n/translations';
import { getActionBadge, resolveLocalizedText } from '../utils/replay-helpers';

interface ReplayStepLogsProps {
  steps: GameReplayStep[];
  stepIndex: number;
  language: string;
  t: TranslationDictionary;
  onStepSelect: (index: number) => void;
}

export function ReplayStepLogs({ steps, stepIndex, language, t, onStepSelect }: ReplayStepLogsProps) {
  const logContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!logContainerRef.current) return;
    const activeEl = logContainerRef.current.querySelector(`[data-step-id="${stepIndex}"]`);
    if (activeEl) {
      activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [stepIndex]);

  return (
    <div className="w-full lg:flex-1 min-w-0 bg-zinc-950 border-2 border-emerald-500/80 p-2 sm:p-2.5 flex flex-col shadow-[0_0_20px_rgba(16,185,129,0.2)] relative select-none h-full min-h-0 overflow-hidden">
      <div className="crt-screen absolute inset-0 pointer-events-none" />

      <div className="flex items-center justify-between border-b border-zinc-800 pb-1.5 mb-1 shrink-0">
        <div className="flex items-center gap-1.5">
          <span className="text-sm">📜</span>
          <span className="retro text-xs font-black text-emerald-400 tracking-wider">
            {t.historyReplay.tacticalLogs}
          </span>
        </div>
        <span className="px-1.5 py-0.5 bg-zinc-900 border border-zinc-700 text-zinc-300 retro text-[8px] font-bold">
          {stepIndex + 1}/{steps.length}
        </span>
      </div>

      <div ref={logContainerRef} className="flex-1 min-h-0 overflow-y-auto pr-0.5 custom-scrollbar flex flex-col gap-1.5">
        {steps.map((step, idx) => {
          const isActive = idx === stepIndex;
          const isPast = idx < stepIndex;
          const badge = getActionBadge(step.actionType, t);

          return (
            <div
              key={idx}
              data-step-id={idx}
              onClick={() => onStepSelect(idx)}
              className={`p-2 border text-left cursor-pointer transition-all flex flex-col gap-1 text-[9px] retro ${
                isActive
                  ? 'border-2 border-emerald-400 bg-emerald-950/80 text-emerald-200 shadow-[0_0_12px_rgba(16,185,129,0.4)] ring-1 ring-emerald-400'
                  : isPast
                  ? 'border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:border-zinc-600 hover:bg-zinc-800/50'
                  : 'border-zinc-900 bg-zinc-950/80 text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <div className="flex items-center justify-between gap-1.5">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="font-mono text-zinc-500 font-bold">#{step.stepIndex}</span>
                  <span className={`px-1 py-0.2 border text-[7px] font-bold uppercase shrink-0 ${badge.className}`}>
                    {badge.label}
                  </span>
                  <span className="font-bold truncate text-zinc-200">
                    {resolveLocalizedText(step.actionTitleZh, step.actionTitle, language)}
                  </span>
                </div>
                <span className="font-mono text-[8px] text-zinc-500 shrink-0">
                  {new Date(step.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              </div>
              <p className="text-[8px] text-zinc-400 leading-tight font-mono line-clamp-2">
                {resolveLocalizedText(step.descriptionZh, step.description, language)}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
