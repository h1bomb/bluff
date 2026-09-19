import React from 'react';
import { PokerCard } from '@/components/game/poker-card';
import { Card } from '@/game/types';
import { TranslationDictionary } from '@/lib/i18n/translations';

interface ReplayCardHandProps {
  playerCards: Card[];
  playedCards: Card[];
  discardedCards: Card[];
  selectedCardIds?: string[];
  t: TranslationDictionary;
}

export function ReplayCardHand({
  playerCards,
  playedCards,
  discardedCards,
  selectedCardIds = [],
  t,
}: ReplayCardHandProps) {
  return (
    <div className="w-full flex flex-col items-center justify-center relative overflow-visible py-1">
      <div
        className="w-full overflow-visible my-0.5 grid gap-1 pt-3 pb-1"
        style={{
          gridTemplateColumns: `repeat(${playerCards.length || 6}, minmax(0, 1fr))`,
        }}
      >
        {(playerCards || []).map((card) => {
          const isPlayed = (playedCards || []).some((c) => c.id === card.id);
          const isDiscarded = (discardedCards || []).some((c) => c.id === card.id);
          const isSelected = selectedCardIds.includes(card.id) || isPlayed;

          return (
            <div
              key={card.id}
              className={`w-full relative transition-all duration-200 ${
                isPlayed
                  ? '-translate-y-2.5 z-20'
                  : isDiscarded
                  ? 'translate-y-1 opacity-40 grayscale z-0'
                  : 'z-10'
              }`}
            >
              <PokerCard
                card={card}
                size="responsive"
                selected={isSelected}
                highlight={isPlayed}
              />
              {isPlayed && (
                <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-1 bg-yellow-400 text-black retro text-[7px] font-bold shadow-[0_0_6px_#facc15] animate-pulse whitespace-nowrap z-30">
                  {t.historyReplay.cardPlay}
                </div>
              )}
              {isDiscarded && (
                <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-1 bg-red-600 text-white retro text-[7px] font-bold whitespace-nowrap z-30">
                  {t.historyReplay.cardDiscard}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
