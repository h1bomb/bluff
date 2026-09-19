'use client';

import React from 'react';
import { GameRunRecord } from '@/lib/history/types';
import { useLanguageStore } from '@/store/language-store';
import { AutopilotCockpit } from '@/components/game/autopilot-cockpit';
import { useReplayPlayback } from './replay/hooks/use-replay-playback';
import { getActionBadge } from './replay/utils/replay-helpers';
import { ReplayTransportBar } from './replay/components/replay-transport-bar';
import { ReplayCabinet } from './replay/components/replay-cabinet';
import { ReplayStepLogs } from './replay/components/replay-step-logs';

interface ReplayPlayerProps {
  run: GameRunRecord;
  onClose: () => void;
}

export function ReplayPlayer({ run, onClose }: ReplayPlayerProps) {
  const { language, t } = useLanguageStore();
  
  const {
    stepIndex, setStepIndex,
    isPlaying, setIsPlaying,
    speed, setSpeed,
    activeTab, setActiveTab,
    isMobileDrawerOpen, setIsMobileDrawerOpen,
    steps, currentStep, publicState, autopilotSnapshot,
    handlePrev, handleNext, handleFirst, handleLast,
    isVictory, isDefeat,
    isShopStep, isTallyStep, isResultStep, hasSpecialView, showSpecial,
  } = useReplayPlayback(run);

  const actionBadge = getActionBadge(currentStep?.actionType, t);

  const autopilotCockpitProps = {
    isReplayMode: true,
    replayEnabled: autopilotSnapshot?.isEnabled ?? false,
    replaySpeed: autopilotSnapshot?.speed ?? '1x',
    replayDecisions: autopilotSnapshot?.decisions ?? [],
    replayThoughtLogs: autopilotSnapshot?.thoughtLogs ?? [],
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/95 backdrop-blur-md flex flex-col items-center justify-start p-2 sm:p-2.5 select-none overflow-hidden text-white h-screen max-h-screen">
      <div className="crt-screen absolute inset-0 pointer-events-none z-30" />

      <ReplayTransportBar
        run={run}
        currentStep={currentStep}
        stepIndex={stepIndex}
        totalSteps={steps.length}
        isPlaying={isPlaying}
        speed={speed}
        isVictory={isVictory}
        isDefeat={isDefeat}
        actionBadge={actionBadge}
        language={language}
        t={t}
        onClose={onClose}
        onPlayPause={() => setIsPlaying(!isPlaying)}
        onPrev={handlePrev}
        onNext={handleNext}
        onFirst={handleFirst}
        onLast={handleLast}
        onScrub={(index) => {
          setIsPlaying(false);
          setStepIndex(index);
        }}
        onSpeedToggle={() => setSpeed(speed === 1 ? 2 : 1)}
      />

      {publicState ? (
        <div className="w-full flex-1 min-h-0 flex flex-col lg:flex-row items-stretch justify-between gap-2.5 sm:gap-3 overflow-hidden pb-1">
          <ReplayCabinet
            run={run}
            stepIndex={stepIndex}
            totalSteps={steps.length}
            currentStep={currentStep}
            publicState={publicState}
            autopilotSnapshot={autopilotSnapshot}
            isVictory={isVictory}
            showSpecial={showSpecial}
            isResultStep={isResultStep}
            isShopStep={isShopStep}
            isTallyStep={isTallyStep}
            hasSpecialView={hasSpecialView}
            activeTab={activeTab}
            language={language}
            t={t}
            onTabChange={setActiveTab}
            onOpenMobileDrawer={() => setIsMobileDrawerOpen(true)}
            onFirstStep={handleFirst}
            onClose={onClose}
            onNextStep={handleNext}
          />

          <div className="hidden lg:flex flex-col w-full lg:flex-1 min-w-0 h-full">
            <AutopilotCockpit className="h-full" {...autopilotCockpitProps} />
          </div>

          <ReplayStepLogs
            steps={steps}
            stepIndex={stepIndex}
            language={language}
            t={t}
            onStepSelect={(index) => {
              setIsPlaying(false);
              setStepIndex(index);
            }}
          />
        </div>
      ) : (
        <div className="p-12 text-center retro text-xs text-zinc-500">
          {t.historyReplay.loadingReplay}
        </div>
      )}

      {isMobileDrawerOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in duration-150" onClick={(e) => { if (e.target === e.currentTarget) setIsMobileDrawerOpen(false); }}>
          <div className="w-full max-w-[390px] max-h-[90vh] overflow-y-auto">
            <AutopilotCockpit {...autopilotCockpitProps} isMobileDrawer={true} />
          </div>
        </div>
      )}
    </div>
  );
}
