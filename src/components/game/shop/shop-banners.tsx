import React from 'react';
import { AutopilotDecision } from '@/game/autopilot/types';
import { TranslationDictionary } from '@/lib/i18n/translations';

interface ShopBannersProps {
  isReplayMode: boolean;
  boughtItemPayload?: {
    name: string;
    nameZh?: string;
    itemType: string;
    cost: number;
  };
  isAutopilotEnabled: boolean;
  activeDecisions: AutopilotDecision[];
  statusMessage: string | null;
  language: string;
  t: TranslationDictionary;
}

export function ShopBanners({
  isReplayMode,
  boughtItemPayload,
  isAutopilotEnabled,
  activeDecisions,
  statusMessage,
  language,
  t,
}: ShopBannersProps) {
  return (
    <>
      {/* Replay Purchased Item Highlight Banner */}
      {isReplayMode && boughtItemPayload && (
        <div className="w-full p-2 bg-purple-950/80 border-2 border-purple-400 text-purple-200 retro text-[10px] flex items-center justify-between shadow-[0_0_12px_rgba(168,85,247,0.3)] shrink-0">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-yellow-300 text-xs">🛒</span>
            <span className="font-bold text-yellow-300">{t.shop.stepPurchase}</span>
            <span className="text-white truncate font-bold">
              {language === 'zh' ? (boughtItemPayload.nameZh || boughtItemPayload.name) : boughtItemPayload.name}
            </span>
          </div>
          <span className="font-mono text-yellow-400 font-bold shrink-0 ml-1">
            -${boughtItemPayload.cost}
          </span>
        </div>
      )}

      {/* Autopilot Status Indicator in Live Mode */}
      {!isReplayMode && isAutopilotEnabled && (
        <div className="px-2.5 py-1 bg-emerald-950/80 border border-emerald-500 text-emerald-300 retro text-[9px] flex items-center justify-between animate-in fade-in shrink-0">
          <div className="flex items-center gap-1.5">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            <span className="font-bold">{t.shop.autopilotActive}</span>
          </div>
          <span className="text-yellow-300 font-mono font-bold truncate max-w-[150px]">
            {activeDecisions[0]
              ? language === 'zh'
                ? `[${activeDecisions[0].titleZh}]`
                : `[${activeDecisions[0].title}]`
              : '...'}
          </span>
        </div>
      )}

      {/* Live Status Toast */}
      {statusMessage && (
        <div className="p-1 bg-zinc-900 border border-yellow-500 text-yellow-300 retro text-[10px] text-center font-bold animate-in fade-in shrink-0">
          {statusMessage}
        </div>
      )}
    </>
  );
}
