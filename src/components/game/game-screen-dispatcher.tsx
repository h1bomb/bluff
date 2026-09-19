import React from 'react';
import { Card, PokerAction, PublicGameState } from '@/game/types';
import { AutopilotDecision } from '@/game/autopilot/types';
import { ScoreTargetBar } from './score-target-bar';
import { RunProgress } from './run-progress';
import { ResultInlineView } from './result-inline-view';
import { ShopInlineView } from './shop-inline-view';
import { ScoreTallyInlineView } from './score-tally-inline-view';
import { GameBattleTable } from './game-battle-table';
import { JokerTray } from './joker-tray';
import { ShopItem } from '@/game/shop/types';
import { ScoreCalculationResult } from '@/game/scoring/calculator';
import { TranslationDictionary } from '@/lib/i18n/translations';

interface GameScreenDispatcherProps {
  publicState: PublicGameState;
  isRoguelike: boolean;
  isBoss: boolean;
  isPlayerTurn: boolean;
  hasMindRead: boolean;
  selectedCards: Card[];
  showScoreTally: boolean;
  lastScoreResult?: ScoreCalculationResult | null;
  decisions: AutopilotDecision[];
  isAutopilotEnabled: boolean;
  t: TranslationDictionary;
  onStartGame: (mode: 'roguelike' | 'classic') => Promise<void>;
  onOpenHistory: () => void;
  onSellJoker: (jokerId: string) => Promise<void> | void;
  onBuyItem: (item: ShopItem) => Promise<boolean>;
  onRerollShop: () => Promise<boolean>;
  onNextBlind: () => Promise<void>;
  onDismissScoreTally: () => void;
  onToggleSelectCard: (cardId: string) => Promise<void>;
  onPlayHand: (cardIds?: string[]) => Promise<boolean>;
  onDiscardCards: (cardIds?: string[]) => Promise<boolean>;
  onPlayAction: (action: PokerAction) => Promise<void>;
}

export function GameScreenDispatcher({
  publicState,
  isRoguelike,
  isBoss,
  isPlayerTurn,
  hasMindRead,
  selectedCards,
  showScoreTally,
  lastScoreResult,
  decisions,
  isAutopilotEnabled,
  t,
  onStartGame,
  onOpenHistory,
  onSellJoker,
  onBuyItem,
  onRerollShop,
  onNextBlind,
  onDismissScoreTally,
  onToggleSelectCard,
  onPlayHand,
  onDiscardCards,
  onPlayAction,
}: GameScreenDispatcherProps) {
  return (
    <>
      {/* SECTION 1: Top HUD / Target Bar */}
      {isRoguelike ? (
        <ScoreTargetBar
          ante={publicState.ante ?? 1}
          blind={publicState.blind}
          currentScore={publicState.currentRoundScore ?? 0}
          targetScore={publicState.targetScore ?? 300}
          handsLeft={publicState.handsLeft ?? 4}
          discardsLeft={publicState.discardsLeft ?? 3}
          money={publicState.money ?? 4}
        />
      ) : (
        <RunProgress
          currentHand={publicState.handIndex}
          totalHands={publicState.totalHands}
          chips={publicState.playerChips}
          pot={publicState.pot}
        />
      )}

      {/* IN-PLACE VIEW REPLACEMENT */}
      {publicState.phase === 'GAME_OVER' || publicState.phase === 'RUN_COMPLETE' ? (
        <div className="flex-1 flex flex-col justify-center">
          <ResultInlineView
            isVictory={publicState.phase === 'RUN_COMPLETE'}
            ante={publicState.ante ?? 1}
            blindName={publicState.blind?.bossName || publicState.blind?.blindType}
            totalScore={publicState.currentRoundScore ?? 0}
            peakRoundScore={lastScoreResult?.finalScore ?? 0}
            totalHandsPlayed={4 - (publicState.handsLeft ?? 4)}
            totalDiscards={3 - (publicState.discardsLeft ?? 3)}
            modelBreaksCount={publicState.modelBreaksCount ?? 0}
            jokers={publicState.jokers ?? []}
            onNewRun={() => onStartGame('roguelike')}
            onOpenHistory={onOpenHistory}
          />
        </div>
      ) : publicState.phase === 'SHOP' ? (
        <div className="flex-1 min-h-0 flex flex-col gap-1.5 overflow-hidden">
          {isRoguelike && (
            <JokerTray
              jokers={publicState.jokers ?? []}
              maxJokers={publicState.maxJokers ?? 5}
              onSellJoker={onSellJoker}
              compact
            />
          )}
          <ShopInlineView
            money={publicState.money ?? 0}
            jokers={publicState.jokers ?? []}
            maxJokers={publicState.maxJokers ?? 5}
            nextBlind={publicState.blind}
            inventory={publicState.shopInventory}
            rerollCost={publicState.rerollCost ?? 2}
            onBuyItem={onBuyItem}
            onReroll={onRerollShop}
            onNextBlind={onNextBlind}
            activeDecisions={decisions}
            isAutopilotEnabled={isAutopilotEnabled}
          />
        </div>
      ) : showScoreTally && lastScoreResult ? (
        <div className="flex-1 min-h-0 flex flex-col gap-1.5 justify-center overflow-hidden">
          {isRoguelike && (
            <JokerTray jokers={publicState.jokers ?? []} maxJokers={publicState.maxJokers ?? 5} compact />
          )}
          <ScoreTallyInlineView scoreResult={lastScoreResult} onDismiss={onDismissScoreTally} />
        </div>
      ) : (
        <GameBattleTable
          publicState={publicState}
          isBoss={isBoss}
          isPlayerTurn={isPlayerTurn}
          hasMindRead={hasMindRead}
          isRoguelike={isRoguelike}
          selectedCards={selectedCards}
          t={t}
          onSellJoker={onSellJoker}
          onToggleSelectCard={onToggleSelectCard}
          onPlayHand={onPlayHand}
          onDiscard={onDiscardCards}
          onPlayAction={onPlayAction}
        />
      )}
    </>
  );
}
