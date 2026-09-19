import React from 'react';
import { GameRunRecord, GameReplayStep, ReplayAutopilotSnapshot } from '@/lib/history/types';
import { PublicGameState } from '@/game/types';
import { TranslationDictionary } from '@/lib/i18n/translations';
import { ScoreTargetBar } from '@/components/game/score-target-bar';
import { AIOpponentCard } from '@/components/game/ai-opponent-card';
import { BossReader } from '@/components/game/boss-reader';
import { AIBeliefPanel } from '@/components/game/ai-belief-panel';
import { JokerTray } from '@/components/game/joker-tray';
import { ShopInlineView } from '@/components/game/shop-inline-view';
import { ScoreTallyInlineView } from '@/components/game/score-tally-inline-view';
import { ResultInlineView } from '@/components/game/result-inline-view';
import { hasMindReadBuff } from '@/game/buffs/engine';
import { ReplayCardHand } from './replay-card-hand';
import { resolveLocalizedText } from '../utils/replay-helpers';

interface ReplayCabinetProps {
  run: GameRunRecord;
  stepIndex: number;
  totalSteps: number;
  currentStep?: GameReplayStep;
  publicState: PublicGameState;
  autopilotSnapshot?: ReplayAutopilotSnapshot | null;
  isVictory: boolean;
  showSpecial: boolean;
  isResultStep: boolean;
  isShopStep: boolean;
  isTallyStep: boolean;
  hasSpecialView: boolean;
  activeTab: 'AUTO' | 'TABLE' | 'SPECIAL';
  language: string;
  t: TranslationDictionary;
  onTabChange: (tab: 'AUTO' | 'TABLE' | 'SPECIAL') => void;
  onOpenMobileDrawer: () => void;
  onFirstStep: () => void;
  onClose: () => void;
  onNextStep: () => void;
}

export function ReplayCabinet({
  run, stepIndex, totalSteps, currentStep, publicState, autopilotSnapshot,
  isVictory, showSpecial, isResultStep, isShopStep, isTallyStep, hasSpecialView,
  activeTab, language, t,
  onTabChange, onOpenMobileDrawer, onFirstStep, onClose, onNextStep
}: ReplayCabinetProps) {
  const isBoss = publicState?.blind?.blindType === 'BOSS' || publicState?.aiIsBoss;
  const hasMindRead = hasMindReadBuff(publicState?.activeBuffs || []);

  return (
    <div className="w-full lg:flex-1 min-w-0 bg-zinc-950 border-2 border-emerald-500/80 p-2 sm:p-2.5 flex flex-col shadow-[0_0_20px_rgba(16,185,129,0.2)] relative select-none h-full min-h-0 overflow-hidden">
      <div className="crt-screen absolute inset-0 pointer-events-none" />

      {autopilotSnapshot && autopilotSnapshot.decisions.length > 0 && (
        <div onClick={onOpenMobileDrawer} className="lg:hidden w-full bg-zinc-950 border border-emerald-500/70 p-1.5 mb-1.5 flex items-center justify-between gap-2 cursor-pointer hover:bg-zinc-900 text-xs retro shrink-0">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-emerald-400">🤖</span>
            <span className="text-[9px] text-zinc-400 font-bold">{autopilotSnapshot.isEnabled ? 'AUTO ON' : 'STANDBY'}:</span>
            <span className="text-[9px] text-emerald-300 truncate font-bold">
              {resolveLocalizedText(autopilotSnapshot.decisions[0].titleZh, autopilotSnapshot.decisions[0].title, language)}
            </span>
          </div>
          <div className="flex items-center gap-1 shrink-0 font-mono text-[10px] text-yellow-300 font-bold">
            <span>{autopilotSnapshot.decisions[0].confidence}%</span>
            <span className="text-[8px] text-zinc-500">▶</span>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between border-b border-zinc-800 pb-1.5 mb-1 shrink-0">
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <span className="text-base leading-none">🕹️</span>
            <span className="retro text-xs font-black text-emerald-400 tracking-wider">{t.historyReplay.battleHud}</span>
          </div>
          <span className="retro text-[8px] text-zinc-500 font-mono tracking-widest">
            ANTE {publicState.ante ?? 1} • {publicState.blind?.blindType || 'BLIND'}
          </span>
        </div>
        <span className="px-1.5 py-0.5 bg-zinc-900 border border-zinc-700 text-zinc-300 retro text-[8px] font-bold">
          STEP {stepIndex + 1}/{totalSteps}
        </span>
      </div>

      {hasSpecialView && (
        <div className="flex items-center gap-1 my-0.5 border-b border-zinc-800/80 pb-1 shrink-0">
          <button onClick={() => onTabChange('AUTO')} className={`px-2 py-0.5 retro text-[8px] border font-bold active:scale-95 ${activeTab === 'AUTO' ? 'border-emerald-400 bg-emerald-950 text-emerald-300' : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-600'}`}>👁️ {t.historyReplay.autoView}</button>
          <button onClick={() => onTabChange('SPECIAL')} className={`px-2 py-0.5 retro text-[8px] border font-bold active:scale-95 ${activeTab === 'SPECIAL' ? 'border-yellow-400 bg-yellow-950 text-yellow-300' : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-600'}`}>
            {isShopStep ? t.historyReplay.shopView : isTallyStep ? t.historyReplay.tallyView : t.historyReplay.resultView}
          </button>
          <button onClick={() => onTabChange('TABLE')} className={`px-2 py-0.5 retro text-[8px] border font-bold active:scale-95 ${activeTab === 'TABLE' ? 'border-cyan-400 bg-cyan-950 text-cyan-300' : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-600'}`}>🃏 {t.historyReplay.tableMatch}</button>
        </div>
      )}

      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden custom-scrollbar flex flex-col gap-1.5 pr-0.5">
        <ScoreTargetBar ante={publicState.ante ?? 1} blind={publicState.blind} currentScore={publicState.currentRoundScore ?? 0} targetScore={publicState.targetScore ?? 300} handsLeft={publicState.handsLeft ?? 4} discardsLeft={publicState.discardsLeft ?? 3} money={publicState.money ?? 0} compact={true} />

        {showSpecial && isResultStep ? (
          <div className="flex-1 flex flex-col justify-center my-0.5">
            <ResultInlineView isVictory={currentStep?.actionType === 'RUN_COMPLETE' || isVictory} ante={publicState.ante ?? run.summary.finalAnte ?? 1} blindName={publicState.blind?.bossName || publicState.blind?.blindType || run.summary.finalBlind} totalScore={run.summary.totalScore} peakRoundScore={run.summary.peakRoundScore} totalHandsPlayed={run.summary.totalHandsPlayed} totalDiscards={run.summary.totalDiscards} totalPurchases={run.summary.totalPurchases} modelBreaksCount={run.summary.modelBreaksCount} jokers={publicState.jokers || run.summary.jokersSnapshot || []} onFirstStep={onFirstStep} onClose={onClose} isReplayMode={true} />
          </div>
        ) : showSpecial && isShopStep ? (
          <div className="flex-1 flex flex-col gap-1.5 my-0.5">
            <JokerTray jokers={publicState.jokers ?? []} maxJokers={publicState.maxJokers ?? 5} compact={true} />
            <ShopInlineView money={publicState.money ?? 0} jokers={publicState.jokers ?? []} maxJokers={publicState.maxJokers ?? 5} nextBlind={publicState.blind} inventory={publicState.shopInventory || []} isReplayMode={true} boughtItemPayload={currentStep?.payload?.boughtItem} activeDecisions={autopilotSnapshot?.decisions ?? []} isAutopilotEnabled={autopilotSnapshot?.isEnabled ?? false} />
          </div>
        ) : showSpecial && isTallyStep ? (
          <div className="flex-1 flex flex-col gap-1.5 my-0.5">
            <ReplayCardHand playerCards={publicState.playerCards || []} playedCards={currentStep?.payload?.playedCards || []} discardedCards={[]} t={t} />
            <ScoreTallyInlineView scoreResult={currentStep?.payload?.scoreResult} isReplayMode={true} onNextStep={stepIndex < totalSteps - 1 ? onNextStep : undefined} />
          </div>
        ) : (
          <>
            <div className="w-full flex flex-col gap-1.5">
              {isBoss ? (
                <BossReader understanding={publicState.aiUnderstanding ?? 100} maxUnderstanding={1000} belief={publicState.belief} isBroken={publicState.aiVisualState === 'BROKEN'} compact={true} />
              ) : (
                <AIOpponentCard name={publicState.aiName || 'Observer AI'} isBoss={false} chips={publicState.aiChips ?? 200} currentBet={publicState.aiCurrentBet ?? 0} visualState={publicState.aiVisualState || 'IDLE'} belief={publicState.belief} folded={publicState.aiFolded || false} compact={true} />
              )}
              <AIBeliefPanel belief={publicState.belief} hasMindRead={hasMindRead} compact={true} />
              <JokerTray jokers={publicState.jokers ?? []} maxJokers={publicState.maxJokers ?? 5} compact={true} />
            </div>

            <ReplayCardHand playerCards={publicState.playerCards || []} playedCards={currentStep?.payload?.playedCards || []} discardedCards={currentStep?.payload?.discardedCards || []} selectedCardIds={publicState.selectedCardIds || []} t={t} />
            
            <div className="retro text-[8px] sm:text-[9px] font-bold text-zinc-400 mt-1 flex items-center justify-center gap-2">
              <span>{t.historyReplay.tableStatus(publicState.playerCards?.length || 0, publicState.handsLeft ?? 0, publicState.discardsLeft ?? 0)}</span>
            </div>

            <div className="w-full flex flex-col gap-1">
              <div className="h-7 sm:h-8 w-full bg-zinc-950 border-2 border-zinc-800 flex items-center justify-between px-2.5 text-xs retro leading-none">
                <span className="text-zinc-400 text-[10px]">{t.historyReplay.stepAction}:</span>
                <span className="text-emerald-400 font-bold text-[11px] truncate max-w-[260px]">{resolveLocalizedText(currentStep?.actionTitleZh, currentStep?.actionTitle, language)}</span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
