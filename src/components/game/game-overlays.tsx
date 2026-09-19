import React, { useEffect } from 'react';
import { LanguageSwitcher } from '@/components/ui/language-switcher';
import { SoundToggle } from '@/components/ui/sound-toggle';
import { ModelBreakPayload } from '@/game/types';
import { TranslationDictionary } from '@/lib/i18n/translations';
import { ModelBreakOverlay } from './model-break-overlay';
import { HistoryModal } from '@/components/history/history-modal';
import { AutopilotCockpit } from './autopilot-cockpit';
import { AutopilotDecision } from '@/game/autopilot/types';
import { audioManager } from '@/lib/audio/audio-manager';

interface GameOverlaysProps {
  isRoguelike: boolean;
  isAutopilotEnabled: boolean;
  decisions: AutopilotDecision[];
  latestToast: string | null;
  isMobileDrawerOpen: boolean;
  showHistoryModal: boolean;
  showModelBreak: boolean;
  currentModelBreakPayload?: ModelBreakPayload | null;
  t: TranslationDictionary;
  onOpenHistory: () => void;
  onCloseHistory: () => void;
  onOpenMobileDrawer: () => void;
  onCloseMobileDrawer: () => void;
  onDismissModelBreak: () => void;
  onExecuteDecision: (decision: AutopilotDecision) => void;
  onToggleAutopilot?: () => void;
}

export function GameOverlays({
  isRoguelike,
  isAutopilotEnabled,
  decisions,
  latestToast,
  isMobileDrawerOpen,
  showHistoryModal,
  showModelBreak,
  currentModelBreakPayload,
  t,
  onOpenHistory,
  onCloseHistory,
  onOpenMobileDrawer,
  onCloseMobileDrawer,
  onDismissModelBreak,
  onExecuteDecision,
  onToggleAutopilot,
}: GameOverlaysProps) {
  useEffect(() => {
    if (isMobileDrawerOpen) {
      audioManager.playSfx('modalOpen');
    }
  }, [isMobileDrawerOpen]);

  return (
    <>
      {/* Top Bar */}
      <div className="absolute top-2 right-2 z-50 flex items-center gap-1.5">
        <button
          onClick={() => {
            audioManager.playSfx('uiClick');
            onOpenHistory();
          }}
          className="flex items-center gap-1 px-2 py-1 bg-zinc-950 border border-zinc-700 text-zinc-300 retro text-[9px] font-bold hover:border-emerald-400 hover:text-emerald-300 shadow-[0_0_6px_rgba(0,0,0,0.5)] active:scale-95"
          title={t.history.title}
        >
          <span>📜</span>
          <span>{t.common.history}</span>
        </button>

        {/* Autopilot Toggle directly beside History */}
        {isRoguelike && onToggleAutopilot && (
          <button
            onClick={() => {
              audioManager.playSfx('uiClick');
              onToggleAutopilot();
            }}
            className={`flex items-center gap-1 px-2 py-1 border retro text-[9px] font-bold transition-all active:scale-95 ${
              isAutopilotEnabled
                ? 'border-emerald-400 bg-emerald-950 text-emerald-300 shadow-[0_0_8px_rgba(16,185,129,0.4)]'
                : 'border-zinc-700 bg-zinc-950 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200'
            }`}
            title={isAutopilotEnabled ? t.autopilot.engaged : t.autopilot.standby}
          >
            <span>🤖</span>
            <span>{isAutopilotEnabled ? t.autopilot.autoToggleOn : t.autopilot.autoToggleOff}</span>
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isAutopilotEnabled ? 'bg-emerald-400 shadow-[0_0_6px_#34d399] animate-pulse' : 'bg-zinc-600'
              }`}
            />
          </button>
        )}

        <SoundToggle showSliders={true} />
        <LanguageSwitcher />
      </div>

      {/* Toast */}
      {latestToast && (
        <div className="fixed top-3 z-50 px-4 py-2 bg-yellow-950/95 border-2 border-yellow-400 text-yellow-300 retro text-xs font-bold shadow-[0_0_15px_rgba(250,204,21,0.5)] animate-in slide-in-from-top duration-200">
          {latestToast}
        </div>
      )}

      {/* Mobile Autopilot Drawer Modal */}
      {isMobileDrawerOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in duration-150">
          <div className="w-full max-w-[390px] max-h-[90vh] overflow-y-auto">
            <AutopilotCockpit
              onExecuteDecision={(d) => {
                onExecuteDecision(d);
                onCloseMobileDrawer();
              }}
              isMobileDrawer={true}
            />
          </div>
        </div>
      )}

      {/* Overlays */}
      {showModelBreak && (
        <ModelBreakOverlay payload={currentModelBreakPayload} onDismiss={onDismissModelBreak} />
      )}
      <HistoryModal isOpen={showHistoryModal} onClose={onCloseHistory} />
    </>
  );
}
