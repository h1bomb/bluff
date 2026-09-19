'use client';

import React from 'react';
import EnemyHealthDisplay from '@/components/ui/8bit/enemy-health-display';
import { PlayerBelief } from '@/game/types';
import { useLanguageStore } from '@/store/language-store';

interface BossReaderProps {
  understanding: number; // 0 to 1000
  maxUnderstanding?: number;
  belief?: PlayerBelief;
  isBroken?: boolean;
  compact?: boolean;
}

export function BossReader({
  understanding,
  maxUnderstanding = 1000,
  belief,
  isBroken = false,
  compact = false,
}: BossReaderProps) {
  const { t } = useLanguageStore();

  const topProb = belief
    ? Math.round(
        (belief.behavior.probabilities[belief.behavior.value] || belief.behavior.confidence) * 100
      )
    : 87;

  const behaviorName = belief
    ? (t.behaviors[belief.behavior.value] || t.boss.controlledByMe)
    : '';
  const quote = belief
    ? `${t.boss.quotePrefix}${behaviorName}${t.boss.quoteSuffix}`
    : t.boss.defaultQuote;

  return (
    <div
      className={`w-full border-2 border-purple-600 bg-zinc-950 ${compact ? 'p-1.5 sm:p-2' : 'p-2.5'} shadow-[4px_4px_0px_#2e1065] relative select-none ${
        isBroken ? 'animate-pixel-shake border-red-500 shadow-[4px_4px_0px_#7f1d1d]' : ''
      }`}
    >
      <div className="flex items-center justify-between mb-1 leading-none">
        <div className="flex items-center gap-2 leading-none">
          <span className="text-purple-400 text-sm leading-none">👑</span>
          <span className="retro text-xs sm:text-sm font-bold text-purple-300 leading-none">
            {t.boss.readerName}
          </span>
          <span className="retro text-[8px] bg-purple-900 px-1 py-0.5 text-purple-200 border border-purple-400 font-bold leading-none inline-flex items-center">
            LV. ????
          </span>
        </div>
        <span className="retro text-[10px] sm:text-xs font-bold text-purple-400 leading-none">
          {t.common.bossBattle}
        </span>
      </div>

      <div className={compact ? 'my-1' : 'my-2'}>
        <div className="flex items-center justify-between text-[11px] sm:text-xs retro font-bold text-zinc-300 mb-1 leading-none">
          <span className="leading-none">{t.common.aiUnderstanding}</span>
          <span className="font-mono text-purple-300 font-bold leading-none">
            {understanding} / {maxUnderstanding}
          </span>
        </div>

        <EnemyHealthDisplay
          enemyName=""
          showLevel={false}
          showHealthText={false}
          currentHealth={understanding}
          maxHealth={maxUnderstanding}
          healthBarColor="bg-purple-600"
          healthBarVariant="retro"
          className="space-y-0"
        />
      </div>

      {/* Boss Quote */}
      <div className={`${compact ? 'mt-1.5 p-1.5 text-[11px]' : 'mt-2.5 p-2 text-xs'} bg-purple-950/50 border border-purple-900/80 flex items-center justify-between retro font-bold`}>
        <span className="text-purple-200 truncate">
          {quote}
        </span>
        <span className="text-purple-400 font-mono font-bold ml-2 shrink-0">
          {topProb}%
        </span>
      </div>
    </div>
  );
}
