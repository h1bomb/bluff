'use client';

import React from 'react';
import { useAutopilotStore } from '@/store/autopilot-store';
import { useLanguageStore } from '@/store/language-store';
import { AutopilotDecision } from '@/game/autopilot/types';
import { AutopilotThoughtLogEntry } from '@/lib/history/types';
import { AutopilotControlBar } from './autopilot/autopilot-control-bar';
import { AutopilotDecisionItem } from './autopilot/autopilot-decision-item';
import { AutopilotThoughtLog } from './autopilot/autopilot-thought-log';

interface AutopilotCockpitProps {
  onExecuteDecision?: (decision: AutopilotDecision) => void;
  className?: string;
  isMobileDrawer?: boolean;
  isReplayMode?: boolean;
  replayEnabled?: boolean;
  replaySpeed?: '1x' | '2x';
  replayDecisions?: AutopilotDecision[];
  replayThoughtLogs?: AutopilotThoughtLogEntry[];
}

export function AutopilotCockpit({
  onExecuteDecision,
  className = '',
  isMobileDrawer = false,
  isReplayMode = false,
  replayEnabled,
  replaySpeed,
  replayDecisions,
  replayThoughtLogs,
}: AutopilotCockpitProps) {
  const { t, language } = useLanguageStore();
  const store = useAutopilotStore();

  const isEnabled = isReplayMode ? (replayEnabled ?? false) : store.isEnabled;
  const speed = isReplayMode ? (replaySpeed ?? '1x') : store.speed;
  const decisions = isReplayMode ? (replayDecisions ?? []) : store.decisions;
  const thoughtLogs = isReplayMode ? (replayThoughtLogs ?? []) : store.thoughtLogs;
  const isExecuting = isReplayMode ? false : store.isExecuting;
  const toggleAutopilot = isReplayMode ? () => {} : store.toggleAutopilot;
  const setSpeed = isReplayMode ? () => {} : store.setSpeed;
  const setMobileDrawerOpen = store.setMobileDrawerOpen;

  const isFullHeight = className.includes('h-full') || isReplayMode;

  return (
    <div
      className={`w-full bg-zinc-950 border-2 border-emerald-500/80 p-2 sm:p-2.5 flex flex-col shadow-[0_0_20px_rgba(16,185,129,0.2)] relative select-none ${className}`}
    >
      {/* CRT Scanline */}
      <div className="crt-screen absolute inset-0 pointer-events-none" />

      {/* Header: Title & Autopilot Switch */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-1.5 mb-1 shrink-0">
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <span className="text-base leading-none">🤖</span>
            <span className="retro text-xs font-black text-emerald-400 tracking-wider">
              {t.autopilot.cockpitTitle}
            </span>
            {isReplayMode && (
              <span className="px-1 py-0.2 bg-purple-950 border border-purple-500 text-purple-300 retro text-[8px] font-bold animate-pulse">
                REC / REPLAY
              </span>
            )}
          </div>
          <span className="retro text-[8px] text-zinc-500 font-mono tracking-widest">
            {isReplayMode ? t.autopilot.historicalTelemetry : t.autopilot.cockpitSub}
          </span>
        </div>

        {isMobileDrawer && (
          <button
            onClick={() => setMobileDrawerOpen(false)}
            className="text-zinc-400 hover:text-white retro text-xs px-1.5 py-0.5 border border-zinc-700 bg-zinc-900"
          >
            ✕
          </button>
        )}
      </div>

      {/* Column Container Body: Unified Scrollable Area */}
      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden custom-scrollbar flex flex-col gap-2 pr-0.5">
        <AutopilotControlBar
          isEnabled={isEnabled}
          speed={speed}
          brain={isReplayMode ? undefined : store.brain}
          setBrain={isReplayMode ? undefined : store.setBrain}
          toggleAutopilot={toggleAutopilot}
          setSpeed={setSpeed}
          t={t}
        />

        {/* Decision Stream List */}
        <div className="flex flex-col gap-1.5 shrink-0">
          <div className="flex items-center justify-between text-[10px] retro text-zinc-400 px-1 font-bold">
            <span>{t.autopilot.candidateBranches}</span>
            <span className="text-[9px] font-mono text-zinc-500">
              {decisions.length} {t.autopilot.pathsUnit}
            </span>
          </div>

          {decisions.length === 0 ? (
            <div className="p-3 border border-dashed border-zinc-800 text-center retro text-[10px] text-zinc-600">
              {t.autopilot.noDecisions}
            </div>
          ) : (
            decisions.map((d, index) => (
              <AutopilotDecisionItem
                key={d.id}
                decision={d}
                index={index}
                isReplayMode={isReplayMode}
                isExecuting={isExecuting}
                language={language}
                t={t}
                onExecuteDecision={onExecuteDecision}
              />
            ))
          )}
        </div>

        <AutopilotThoughtLog
          thoughtLogs={thoughtLogs}
          isFullHeight={isFullHeight}
          isMobileDrawer={isMobileDrawer}
          language={language}
          t={t}
        />
      </div>
    </div>
  );
}
