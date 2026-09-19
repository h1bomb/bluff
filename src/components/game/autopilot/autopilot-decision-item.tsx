import React from 'react';
import { AutopilotDecision } from '@/game/autopilot/types';
import { TranslationDictionary } from '@/lib/i18n/translations';
import { Button } from '@/components/ui/8bit/button';
import { Progress } from '@/components/ui/8bit/progress';
import { getCategoryBadge } from './category-config';

interface AutopilotDecisionItemProps {
  decision: AutopilotDecision;
  index: number;
  isReplayMode: boolean;
  isExecuting: boolean;
  language: string;
  t: TranslationDictionary;
  onExecuteDecision?: (d: AutopilotDecision) => void;
}

export function AutopilotDecisionItem({
  decision,
  index,
  isReplayMode,
  isExecuting,
  language,
  t,
  onExecuteDecision,
}: AutopilotDecisionItemProps) {
  const badge = getCategoryBadge(decision.category, t);

  return (
    <div className="border border-zinc-800 bg-black/60 p-1.5 flex flex-col gap-1 hover:border-zinc-600 transition-all group">
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col gap-0.5 flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-zinc-500 font-mono text-[9px] font-bold">
              #{index + 1}
            </span>
            <span
              className={`text-[8px] retro font-bold px-1 py-0.2 border ${badge.className}`}
            >
              {badge.label}
            </span>
            <span className="retro text-[10px] font-bold text-zinc-200 truncate leading-normal">
              {language === 'zh' ? decision.titleZh : decision.title}
            </span>
          </div>

          <p className="text-[9px] retro text-zinc-400 truncate leading-normal py-0.5">
            {language === 'zh' ? decision.subtitleZh : decision.subtitle}
          </p>
        </div>

        {isReplayMode ? (
          <span className="h-5 px-1.5 retro text-[8px] font-bold border border-zinc-800 bg-zinc-950 text-zinc-500 flex items-center shrink-0">
            REC
          </span>
        ) : (
          <Button
            variant="outline"
            disabled={isExecuting}
            onClick={() => onExecuteDecision?.(decision)}
            className="h-6 px-2 retro text-[8px] font-bold border-zinc-700 bg-zinc-900 text-yellow-300 hover:border-yellow-400 hover:bg-yellow-950/40 active:scale-95 shrink-0"
          >
            {isExecuting ? t.autopilot.executing : t.autopilot.execute}
          </Button>
        )}
      </div>

      <div className="flex items-center gap-2">
        <div className="flex-1">
          <Progress
            variant="retro"
            value={decision.confidence}
            className="h-2"
            progressBg={badge.barColor}
          />
        </div>
        <span className="font-mono text-[10px] font-black text-zinc-300 w-9 text-right">
          {decision.confidence}%
        </span>
      </div>
    </div>
  );
}
