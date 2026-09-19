'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useGameStore } from '@/store/game-store';
import { useLanguageStore } from '@/store/language-store';
import { useAutopilotStore } from '@/store/autopilot-store';
import { AutopilotDecision } from '@/game/autopilot/types';
import { AutopilotCockpit } from '@/components/game/autopilot-cockpit';
import { hasMindReadBuff } from '@/game/buffs/engine';
import { useAutopilotLoop } from '@/hooks/use-autopilot-loop';
import { useGameSession } from '@/hooks/use-game-session';
import { CabinetHeader } from '@/components/game/cabinet-header';
import { GameScreenDispatcher } from '@/components/game/game-screen-dispatcher';
import { GameOverlays } from '@/components/game/game-overlays';
import { AutopilotConfirmModal } from '@/components/game/autopilot/autopilot-confirm-modal';

export default function GamePage() {
  const router = useRouter();
  const { status: authStatus } = useSession();
  const { t, language } = useLanguageStore();
  const gameStore = useGameStore();
  const autopilotStore = useAutopilotStore();
  const [showHistoryModal, setShowHistoryModal] = useState<boolean>(false);
  const [showConfirmNewRun, setShowConfirmNewRun] = useState<boolean>(false);
  const [isStartingNewRun, setIsStartingNewRun] = useState<boolean>(false);

  useEffect(() => {
    if (authStatus === 'unauthenticated') {
      router.replace('/');
    }
  }, [authStatus, router]);

  const {
    publicState,
    loading,
    startGame,
    playAction,
    toggleSelectCard,
    setSelectedCards,
    discardCards,
    playHand,
    buyShopItem,
    sellJoker,
    rerollShop,
    nextBlind,
    showScoreTally,
    lastScoreResult,
    dismissScoreTally,
    showModelBreak,
    currentModelBreakPayload,
    dismissModelBreak,
    latestToast,
    clearLatestToast,
    resumeActiveGame,
  } = gameStore;

  const {
    isEnabled: isAutopilotEnabled,
    speed: autopilotSpeed,
    decisions,
    isExecuting: isAutopilotExecuting,
    isMobileDrawerOpen,
    setMobileDrawerOpen,
    updateDecisions,
    executeDecision,
    toggleAutopilot,
  } = autopilotStore;

  useGameSession({
    publicState,
    latestToast,
    resumeActiveGame,
    startGame,
    clearLatestToast,
    updateDecisions,
  });

  const handleConfirmNewRun = async (enableAutopilot: boolean) => {
    autopilotStore.setAutopilot(enableAutopilot);
    setIsStartingNewRun(true);
    try {
      await startGame('roguelike');
    } finally {
      setIsStartingNewRun(false);
      setShowConfirmNewRun(false);
    }
  };

  const handleExecuteDecision = useCallback(
    (decision: AutopilotDecision) => {
      executeDecision(decision, {
        setSelectedCards,
        toggleSelectCard,
        playHand,
        discardCards,
        buyShopItem,
        sellJoker,
        rerollShop,
        nextBlind,
        dismissScoreTally,
      });
    },
    [
      executeDecision,
      setSelectedCards,
      toggleSelectCard,
      playHand,
      discardCards,
      buyShopItem,
      sellJoker,
      rerollShop,
      nextBlind,
      dismissScoreTally,
    ]
  );

  useAutopilotLoop({
    isAutopilotEnabled,
    isAutopilotExecuting,
    loading,
    publicState,
    showScoreTally,
    showModelBreak,
    decisions,
    autopilotSpeed,
    dismissModelBreak,
    dismissScoreTally,
    handleExecuteDecision,
  });

  if (!publicState) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="retro text-xs text-emerald-400 animate-pulse">
          {t.game.initializing}
        </div>
      </main>
    );
  }

  const isBoss = publicState.blind?.blindType === 'BOSS' || publicState.aiIsBoss;
  const isPlayerTurn = publicState.phase === 'PLAYER_TURN' && !loading;
  const hasMindRead = hasMindReadBuff(publicState.activeBuffs);
  const isRoguelike = publicState.ante !== undefined;
  const selectedCards = publicState.playerCards.filter((c) =>
    (publicState.selectedCardIds || []).includes(c.id)
  );

  return (
    <main className="h-screen max-h-screen bg-black text-white flex flex-col items-center justify-center p-2 sm:p-3 relative select-none overflow-hidden">
      <div className="crt-screen absolute inset-0 pointer-events-none" />

      <GameOverlays
        isRoguelike={isRoguelike}
        isAutopilotEnabled={isAutopilotEnabled}
        decisions={decisions}
        latestToast={latestToast}
        isMobileDrawerOpen={isMobileDrawerOpen}
        showHistoryModal={showHistoryModal}
        showModelBreak={showModelBreak}
        currentModelBreakPayload={currentModelBreakPayload}
        t={t}
        onOpenHistory={() => setShowHistoryModal(true)}
        onCloseHistory={() => setShowHistoryModal(false)}
        onOpenMobileDrawer={() => setMobileDrawerOpen(true)}
        onCloseMobileDrawer={() => setMobileDrawerOpen(false)}
        onDismissModelBreak={dismissModelBreak}
        onExecuteDecision={handleExecuteDecision}
        onToggleAutopilot={toggleAutopilot}
      />

      {/* Main Container - Left & Right Columns with Matching Height */}
      <div className="w-full max-w-[920px] h-full flex flex-row items-center justify-center gap-3 md:gap-4 pt-7 pb-1">
        {/* LEFT: Main Arcade Screen */}
        <div className="w-full max-w-[440px] bg-zinc-950 border-2 border-emerald-500/80 p-2 sm:p-2.5 shadow-[0_0_20px_rgba(16,185,129,0.2)] relative flex flex-col justify-between h-[min(880px,calc(100dvh-2.5rem))] gap-1 shrink-0 overflow-hidden">
          <CabinetHeader
            publicState={publicState}
            isRoguelike={isRoguelike}
            decisions={decisions}
            isAutopilotEnabled={isAutopilotEnabled}
            language={language}
            t={t}
            onOpenMobileDrawer={() => setMobileDrawerOpen(true)}
          />

          <GameScreenDispatcher
            publicState={publicState}
            isRoguelike={isRoguelike}
            isBoss={isBoss}
            isPlayerTurn={isPlayerTurn}
            hasMindRead={hasMindRead}
            selectedCards={selectedCards}
            showScoreTally={showScoreTally}
            lastScoreResult={lastScoreResult}
            decisions={decisions}
            isAutopilotEnabled={isAutopilotEnabled}
            t={t}
            onStartGame={async () => {
              setShowConfirmNewRun(true);
            }}
            onOpenHistory={() => setShowHistoryModal(true)}
            onSellJoker={sellJoker}
            onBuyItem={buyShopItem}
            onRerollShop={rerollShop}
            onNextBlind={nextBlind}
            onDismissScoreTally={dismissScoreTally}
            onToggleSelectCard={toggleSelectCard}
            onPlayHand={playHand}
            onDiscardCards={discardCards}
            onPlayAction={playAction}
          />
        </div>

        {/* RIGHT: Autopilot Cockpit Panel on Desktop - Rendered ONLY when Autopilot is toggled ON */}
        {isRoguelike && isAutopilotEnabled && (
          <div className="hidden md:flex flex-col w-[380px] lg:w-[410px] h-[min(880px,calc(100dvh-2.5rem))] shrink-0 animate-in fade-in duration-200">
            <AutopilotCockpit className="h-full" onExecuteDecision={handleExecuteDecision} />
          </div>
        )}
      </div>

      <AutopilotConfirmModal
        isOpen={showConfirmNewRun}
        isLoading={isStartingNewRun}
        onConfirm={handleConfirmNewRun}
        onClose={() => setShowConfirmNewRun(false)}
      />
    </main>
  );
}
