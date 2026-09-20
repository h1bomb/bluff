import React from 'react';
import { Card, PokerAction, PublicGameState } from '@/game/types';
import { TranslationDictionary } from '@/lib/i18n/translations';
import { useLanguageStore } from '@/store/language-store';
import { BossReader } from './boss-reader';
import { AIOpponentCard } from './ai-opponent-card';
import { AIBeliefPanel } from './ai-belief-panel';
import { JokerTray } from './joker-tray';
import { PokerCard } from './poker-card';
import { PlayControls } from './play-controls';
import { BetControls } from './bet-controls';
import { BeliefDebugDrawer } from './belief-debug-drawer';

interface GameBattleTableProps {
  publicState: PublicGameState;
  isBoss: boolean;
  isPlayerTurn: boolean;
  hasMindRead: boolean;
  isRoguelike: boolean;
  selectedCards: Card[];
  t: TranslationDictionary;
  onSellJoker?: (id: string) => void;
  onToggleSelectCard: (id: string) => void;
  onPlayHand: (ids?: string[]) => Promise<boolean>;
  onDiscard: (ids?: string[]) => Promise<boolean>;
  onPlayAction: (action: PokerAction) => Promise<void>;
}

export function GameBattleTable({
  publicState,
  isBoss,
  isPlayerTurn,
  hasMindRead,
  isRoguelike,
  selectedCards,
  t,
  onSellJoker,
  onToggleSelectCard,
  onPlayHand,
  onDiscard,
  onPlayAction,
}: GameBattleTableProps) {
  const language = useLanguageStore(s => s.language);
  return (
    <>
      {/* SECTION 2: AI Opponent / Boss Reader & Jev Belief */}
      <div className="w-full flex flex-col gap-1 shrink-0">
        {isRoguelike ? (
          /* Streamlined Unified AI Telemetry HUD for Roguelike Mode */
          <div className="w-full bg-zinc-950 border border-zinc-700/80 px-2 py-1.5 flex flex-col gap-1 shadow-[2px_2px_0px_#000]">
            <div className="flex items-center justify-between text-xs retro leading-none">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-sm shrink-0">
                  {publicState.aiVisualState === 'BROKEN' ? '💀' : isBoss ? '👁️' : '🤖'}
                </span>
                <span className={`font-bold truncate max-w-[130px] ${isBoss ? 'text-purple-300' : 'text-zinc-200'}`}>
                  {isBoss
                    ? ((language === 'zh'
                        ? publicState.blind?.bossNameZh || publicState.blind?.bossName
                        : publicState.blind?.bossName || publicState.blind?.bossNameZh) || t.boss.readerBoss)
                    : publicState.aiName}
                </span>
                {isBoss && (
                  <span className="text-[7px] px-1 py-0.2 bg-purple-950 border border-purple-500 text-purple-300 font-bold shrink-0">
                    {t.common.boss}
                  </span>
                )}
              </div>

              {/* Belief Prediction pill */}
              {publicState.belief && (
                <div className="flex items-center gap-1 shrink-0">
                  <span className="text-[8px] text-zinc-400 font-medium hidden sm:inline">
                    {t.game.aiThinksYouAre}:
                  </span>
                  <span className="text-[8px] sm:text-[9px] px-1.5 py-0.5 border border-zinc-700 bg-zinc-900 text-zinc-200 font-bold font-mono">
                    {t.behaviors[publicState.belief.behavior.value] || publicState.belief.behavior.value} ({Math.round(publicState.belief.behavior.confidence * 100)}%)
                  </span>
                </div>
              )}
            </div>

            {/* Boss health bar if boss, or AI confidence line */}
            {isBoss ? (
              <div className="w-full flex items-center gap-2 leading-none">
                <span className="text-[8px] font-mono text-purple-400 font-bold shrink-0">
                  {t.common.aiUnderstanding}:
                </span>
                <div className="flex-1 bg-zinc-900 h-1.5 border border-zinc-800 overflow-hidden">
                  <div
                    className="bg-purple-500 h-full transition-all duration-300 shadow-[0_0_6px_#a855f7]"
                    style={{ width: `${Math.min(100, Math.round(((publicState.aiUnderstanding ?? 1000) / 1000) * 100))}%` }}
                  />
                </div>
                <span className="text-[8px] font-mono text-purple-300 font-bold shrink-0">
                  {publicState.aiUnderstanding ?? 1000}/1000
                </span>
              </div>
            ) : publicState.belief ? (
              <div className="w-full bg-zinc-900 h-1 border border-zinc-800 overflow-hidden">
                <div
                  className="bg-emerald-400 h-full transition-all duration-300"
                  style={{ width: `${Math.min(100, Math.round(publicState.belief.behavior.confidence * 100))}%` }}
                />
              </div>
            ) : null}
          </div>
        ) : (
          <>
            {isBoss ? (
              <BossReader
                understanding={publicState.aiUnderstanding}
                maxUnderstanding={1000}
                belief={publicState.belief}
                isBroken={publicState.aiVisualState === 'BROKEN'}
                compact
              />
            ) : (
              <AIOpponentCard
                name={publicState.aiName}
                isBoss={false}
                chips={publicState.aiChips}
                currentBet={publicState.aiCurrentBet}
                visualState={publicState.aiVisualState}
                belief={publicState.belief}
                folded={publicState.aiFolded}
                compact
              />
            )}
            <AIBeliefPanel belief={publicState.belief} hasMindRead={hasMindRead} compact />
          </>
        )}

        {/* SECTION 2.5: Cognitive Jokers Tray (5 Slots) */}
        {isRoguelike && (
          <JokerTray
            jokers={publicState.jokers ?? []}
            maxJokers={publicState.maxJokers ?? 5}
            onSellJoker={onSellJoker}
            compact
          />
        )}
      </div>

      {/* SECTION 3: Game Table & Cards Area */}
      <div className="w-full flex-1 min-h-0 flex flex-col justify-center items-center py-1 relative">
        <div
          className={`w-full overflow-visible my-0.5 ${
            isRoguelike
              ? 'grid gap-1 pt-2 pb-1'
              : 'flex flex-nowrap items-center justify-center gap-2'
          }`}
          style={
            isRoguelike
              ? {
                  gridTemplateColumns: `repeat(${publicState.playerCards.length || 6}, minmax(0, 1fr))`,
                }
              : undefined
          }
        >
          {publicState.playerCards.map((card) => {
            const isSelected = (publicState.selectedCardIds || []).includes(card.id);
            return (
              <PokerCard
                key={card.id}
                card={card}
                size={isRoguelike ? 'responsive' : 'md'}
                selected={isSelected}
                onClick={isRoguelike && isPlayerTurn ? () => onToggleSelectCard(card.id) : undefined}
              />
            );
          })}
        </div>

        <div className="retro text-[9px] font-bold text-zinc-400 mt-1 tracking-wider flex items-center gap-2">
          <span>{isRoguelike ? t.common.tapCardsToSelect : t.game.yourCards}</span>
        </div>
      </div>

      {/* SECTION 4: Controls */}
      <div className="w-full pt-1 shrink-0">
        {isRoguelike ? (
          <PlayControls
            selectedCards={selectedCards}
            handsLeft={publicState.handsLeft ?? 4}
            discardsLeft={publicState.discardsLeft ?? 3}
            disabled={!isPlayerTurn}
            handLevels={publicState.handLevels}
            targetScore={publicState.targetScore ?? 300}
            currentScore={publicState.currentRoundScore ?? 0}
            onPlayHand={onPlayHand}
            onDiscard={onDiscard}
          />
        ) : (
          <BetControls
            onAction={onPlayAction}
            disabled={!isPlayerTurn}
            callAmount={Math.max(0, publicState.aiCurrentBet - publicState.currentBet)}
            raiseAmount={Math.max(60, publicState.currentBet * 2)}
            playerChips={publicState.playerChips}
          />
        )}
      </div>

      {/* SECTION 5: Dev Belief Drawer */}
      <BeliefDebugDrawer state={publicState} />
    </>
  );
}
