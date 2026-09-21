'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useGameStore } from '@/store/game-store';
import { useLanguageStore } from '@/store/language-store';
import { useAutopilotStore } from '@/store/autopilot-store';
import { fetchJevQuota } from '@/services/game-api';
import { AutopilotDecision } from '@/game/autopilot/types';
import { AutopilotCockpit } from '@/components/game/autopilot-cockpit';
import { hasMindReadBuff } from '@/game/buffs/engine';
import { useAutopilotLoop } from '@/hooks/use-autopilot-loop';
import { useGameSession } from '@/hooks/use-game-session';
import { CabinetHeader } from '@/components/game/cabinet-header';
import { GameScreenDispatcher } from '@/components/game/game-screen-dispatcher';
import { GameOverlays } from '@/components/game/game-overlays';
import { AutopilotConfirmModal } from '@/components/game/autopilot/autopilot-confirm-modal';
import { AuthModal } from '@/components/auth/auth-modal';

export default function GamePage() {
  const { status: authStatus } = useSession();
  const { t, language } = useLanguageStore();
  const gameStore = useGameStore();
  const autopilotStore = useAutopilotStore();
  const jevQuota = useGameStore(s => s.jevQuota);
  const setJevQuota = useGameStore(s => s.setJevQuota);
  const [showHistoryModal, setShowHistoryModal] = useState<boolean>(false);
  const [showConfirmNewRun, setShowConfirmNewRun] = useState<boolean>(false);
  const [isStartingNewRun, setIsStartingNewRun] = useState<boolean>(false);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);

  // Load the current identity's Jev daily quota on mount / auth change
  useEffect(() => {
    if (authStatus === 'loading') return;
    fetchJevQuota().then((quota) => {
      if (quota) setJevQuota(quota);
    });
  }, [authStatus, setJevQuota]);

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
    loading,
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
      executeDecision(
        decision,
        {
          setSelectedCards,
          toggleSelectCard,
          playHand,
          discardCards,
          buyShopItem,
          sellJoker,
          rerollShop,
          nextBlind,
          dismissScoreTally,
        },
        {
          publicState,
          onJevMeta: (meta) => {
            if (meta.jevQuota) setJevQuota(meta.jevQuota);
            if (meta.jevThrottled && !useGameStore.getState().jevThrottled) {
              useGameStore.setState({
                jevThrottled: true,
                latestToast: useLanguageStore.getState().t.game.jevQuotaToast,
              });
            }
          },
        }
      );
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
      publicState,
      setJevQuota,
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

      {/* Top-left status area: guest badge + Jev quota */}
      <div className="absolute top-2 left-2 z-50 flex items-center gap-2">
        {authStatus === 'unauthenticated' && (
          <button
            onClick={() => setShowAuthModal(true)}
            className="flex items-center gap-1.5 px-2 py-1 bg-zinc-950/95 border border-amber-500/70 hover:border-amber-300 retro text-[9px] active:scale-95 transition-all"
            title={t.auth?.quotaGuestHint || 'Sign in for 600/day'}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-amber-300">{t.auth?.guestBadge || 'GUEST'}</span>
            <span className="text-zinc-600 hidden sm:inline">·</span>
            <span className="text-emerald-400 hidden sm:inline">{t.auth?.unlockJevBadge || 'UNLOCK JEV'}</span>
          </button>
        )}

        {jevQuota && (
          <button
            onClick={() => {
              if (jevQuota.isGuest) setShowAuthModal(true);
            }}
            disabled={!jevQuota.isGuest}
            className={`flex items-center gap-1.5 px-2 py-1 bg-zinc-950/95 border retro text-[9px] transition-all ${
              jevQuota.remaining <= 0
                ? 'border-rose-500/70 text-rose-300'
                : 'border-emerald-500/60 text-emerald-300'
            } ${jevQuota.isGuest ? 'hover:border-emerald-300 active:scale-95 cursor-pointer' : 'cursor-default'}`}
            title={jevQuota.isGuest ? (t.auth?.quotaGuestHint || 'Sign in for 600/day') : undefined}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${jevQuota.remaining <= 0 ? 'bg-rose-400' : 'bg-emerald-400'}`} />
            <span><span className="hidden sm:inline">JEV&nbsp;</span>{jevQuota.remaining}/{jevQuota.limit}</span>
          </button>
        )}
      </div>

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
      <div className="w-full max-w-[920px] h-full flex flex-row items-center justify-center gap-3 md:gap-4 pt-11 sm:pt-12 pb-2">
        {/* LEFT: Main Arcade Screen */}
        <div className="w-full max-w-[440px] bg-zinc-950 border-2 border-emerald-500/80 p-2 sm:p-2.5 shadow-[0_0_20px_rgba(16,185,129,0.2)] relative flex flex-col justify-between h-[min(860px,calc(100dvh-3.75rem))] gap-1 shrink-0 overflow-hidden">
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
          <div className="hidden md:flex flex-col w-[380px] lg:w-[410px] h-[min(860px,calc(100dvh-3.75rem))] shrink-0 animate-in fade-in duration-200">
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

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        reason={t.auth?.unlockJevReason || 'Sign in to unlock the Jev cognitive engine. Guest mode runs on the local heuristic AI.'}
      />
    </main>
  );
}
