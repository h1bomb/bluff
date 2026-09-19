import React from 'react';
import { PublicGameState } from '@/game/types';
import { AutopilotDecision } from '@/game/autopilot/types';
import { TranslationDictionary } from '@/lib/i18n/translations';

import { SoundToggle } from '@/components/ui/sound-toggle';

interface CabinetHeaderProps {
  publicState: PublicGameState;
  isRoguelike: boolean;
  decisions: AutopilotDecision[];
  isAutopilotEnabled: boolean;
  language: string;
  t: TranslationDictionary;
  onOpenMobileDrawer: () => void;
}

export function CabinetHeader({
  publicState,
  isRoguelike,
  decisions,
  isAutopilotEnabled,
  language,
  t,
  onOpenMobileDrawer,
}: CabinetHeaderProps) {
  return (
    <>
      {/* Mobile Mini Autopilot Pill */}
      {isRoguelike && isAutopilotEnabled && decisions.length > 0 && (
        <div
          onClick={onOpenMobileDrawer}
          className="md:hidden w-full bg-zinc-950 border border-emerald-500/70 p-1 flex items-center justify-between gap-2 cursor-pointer hover:bg-zinc-900 text-xs retro shrink-0"
        >
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-emerald-400">🤖</span>
            <span className="text-[8px] text-zinc-400 font-bold">
              {t.autopilot.engaged}:
            </span>
            <span className="text-[8px] text-emerald-300 truncate font-bold">
              {language === 'zh' ? decisions[0].titleZh : decisions[0].title}
            </span>
          </div>
          <div className="flex items-center gap-1 shrink-0 font-mono text-[9px] text-yellow-300 font-bold">
            <span>{decisions[0].confidence}%</span>
            <span className="text-[7px] text-zinc-500">▶</span>
          </div>
        </div>
      )}

      {/* Cabinet Header: Title & Step Status */}
      <div className="flex items-center justify-between border-b border-zinc-800/80 pb-1 shrink-0">
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <span className="text-base leading-none">🕹️</span>
            <span className="retro text-xs font-black text-emerald-400 tracking-wider">
              {t.common.battleHud}
            </span>
          </div>
          <span className="retro text-[8px] text-zinc-500 font-mono tracking-widest">
            ANTE {publicState.ante ?? 1} • {publicState.blind?.blindType || 'BLIND'}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <SoundToggle showSliders={true} />
          <span className="px-1.5 py-0.5 bg-zinc-900 border border-zinc-700 text-zinc-300 retro text-[8px] font-bold">
            {publicState.phase}
          </span>
        </div>
      </div>
    </>
  );
}
