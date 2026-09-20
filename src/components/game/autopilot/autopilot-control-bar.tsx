import React from 'react';
import { Button } from '@/components/ui/8bit/button';
import { TranslationDictionary } from '@/lib/i18n/translations';

interface AutopilotControlBarProps {
  isEnabled: boolean;
  speed: '1x' | '2x';
  toggleAutopilot: () => void;
  setSpeed: (s: '1x' | '2x') => void;
  t: TranslationDictionary;
}

export function AutopilotControlBar({ isEnabled, speed, toggleAutopilot, setSpeed, t }: AutopilotControlBarProps) {
  return (
    <div className="flex items-center justify-between gap-2 p-1.5 bg-zinc-900/90 border border-zinc-800 shrink-0">
      <div className="flex items-center gap-1.5">
        <span
          className={`inline-block w-2 h-2 rounded-full ${
            isEnabled ? 'bg-emerald-400 shadow-[0_0_8px_#34d399] animate-ping' : 'bg-zinc-600'
          }`}
        />
        <span
          className={`retro text-[9px] font-bold ${
            isEnabled ? 'text-emerald-300' : 'text-zinc-400'
          }`}
        >
          {isEnabled ? t.autopilot.engaged : t.autopilot.standby}
        </span>
      </div>

      <div className="flex items-center gap-1.5">
        {/* Speed Toggle */}
        <button
          onClick={() => setSpeed(speed === '1x' ? '2x' : '1x')}
          className="px-1.5 py-0.5 border border-zinc-700 bg-zinc-800 text-zinc-300 hover:text-yellow-300 retro text-[8px] font-mono"
          title={t.autopilot.speed}
        >
          {speed === '1x' ? t.autopilot.speed1x : t.autopilot.speed2x}
        </button>

        {/* Autopilot Toggle Button */}
        <Button
          variant={isEnabled ? 'default' : 'outline'}
          onClick={toggleAutopilot}
          className={`h-7 px-2.5 retro text-[9px] font-bold border-2 leading-none ${
            isEnabled
              ? 'bg-emerald-500 text-black border-emerald-400 shadow-[0_0_12px_rgba(168,85,247,0.6)]'
              : 'border-zinc-600 text-zinc-300 hover:border-emerald-400'
          }`}
        >
          {isEnabled ? t.autopilot.autoToggleOn : t.autopilot.autoToggleOff}
        </Button>
      </div>
    </div>
  );
}
