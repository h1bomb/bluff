'use client';

import React, { useState } from 'react';
import { PublicGameState } from '@/game/types';

import { useLanguageStore } from '@/store/language-store';

interface BeliefDebugDrawerProps {
  state: PublicGameState | null;
}

export function BeliefDebugDrawer({ state }: BeliefDebugDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { t } = useLanguageStore();

  if (!state) return null;

  return (
    <div className="w-full mt-3 select-none">
      <div className="flex justify-center">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="retro text-[8px] text-zinc-500 hover:text-emerald-400 py-1 px-3 border border-zinc-800 bg-zinc-950 transition-colors"
        >
          {isOpen ? t.common.hideConsole : t.common.showConsole}
        </button>
      </div>

      {isOpen && (
        <div className="mt-2 w-full border-2 border-zinc-800 bg-zinc-950 p-3 text-[9px] font-mono text-zinc-300 space-y-2 max-h-60 overflow-y-auto">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-1">
            <span className="text-emerald-400 font-bold">{t.common.gameStateSnapshot}</span>
            <span className="text-zinc-500">ID: {state.gameId}</span>
          </div>

          <div>
            <div className="text-zinc-400 font-bold">{t.common.activeBuffs}:</div>
            {state.activeBuffs.length === 0 ? (
              <span className="text-zinc-600">{t.common.none}</span>
            ) : (
              <div className="flex gap-1 flex-wrap mt-0.5">
                {state.activeBuffs.map(b => (
                  <span key={b.id} className="bg-zinc-900 border border-zinc-700 px-1 py-0.5 text-[8px]">
                    {b.icon} {(t.buffs[b.id] as { name?: string })?.name || b.name}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div>
            <div className="text-zinc-400 font-bold">{t.common.normalizedJevBelief}:</div>
            {state.belief ? (
              <pre className="bg-black/60 p-2 border border-zinc-900 text-emerald-300 overflow-x-auto text-[8px]">
                {JSON.stringify(
                  {
                    topPrediction: state.belief.behavior.value,
                    confidence: state.belief.behavior.confidence,
                    bluffProb: state.belief.bluff,
                    baitingProb: state.belief.baiting,
                    aggression: state.belief.aggression,
                    predictability: state.belief.predictability,
                    tilt: state.belief.tilt,
                  },
                  null,
                  2
                )}
              </pre>
            ) : (
              <span className="text-zinc-600">{t.common.noActiveBelief}</span>
            )}
          </div>

          <div>
            <div className="text-zinc-400 font-bold">{t.common.aiStatus}:</div>
            <div className="text-zinc-400">
              {t.common.action}: <span className="text-yellow-400">{state.aiLastAction || 'PENDING'}</span> | {t.common.visual}:{' '}
              <span className="text-cyan-400">{state.aiVisualState}</span> | {t.common.understanding}:{' '}
              <span className="text-purple-400">{state.aiUnderstanding}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
