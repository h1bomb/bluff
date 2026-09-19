'use client';

import React, { useEffect, useRef, useState } from 'react';
import { toPng } from 'html-to-image';
import { Button } from '@/components/ui/8bit/button';
import { Card as CardType, PublicGameState } from '@/game/types';
import { PokerCard } from './poker-card';
import { useLanguageStore } from '@/store/language-store';
import { audioManager } from '@/lib/audio/audio-manager';

interface ResultCardProps {
  state: PublicGameState | null;
  onPlayAgain: () => void;
}

export function ResultCard({ state, onPlayAgain }: ResultCardProps) {
  const { t } = useLanguageStore();
  const shareCardRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  // Compute stats
  const modelBreaks = state?.modelBreaksCount ?? 0;
  const playerChips = state?.playerChips ?? 1000;
  const isVictory = playerChips > 1000 || modelBreaks > 0;

  useEffect(() => {
    if (isVictory) {
      audioManager.playSfx('winChime');
    } else {
      audioManager.playSfx('gameOver');
    }
  }, [isVictory]);

  // AI readability: inverse of how many times player fooled AI
  const readability = Math.max(12, Math.min(95, Math.round(100 - modelBreaks * 22)));

  // Archetype
  let archetypeObj = t.result.archetypes.patternManipulator;
  if (modelBreaks >= 3) {
    archetypeObj = t.result.archetypes.cognitiveAnomaly;
  } else if (playerChips > 1400) {
    archetypeObj = t.result.archetypes.coldBloodedBaiter;
  } else if (modelBreaks === 0) {
    archetypeObj = t.result.archetypes.transparentSpecimen;
  }

  const biggestLieCards: CardType[] = [
    { id: '1', suit: '♣', rank: 2 },
    { id: '2', suit: '♥', rank: 4 },
    { id: '3', suit: '♠', rank: 7 },
  ];

  const handleShare = async () => {
    if (!shareCardRef.current) return;
    setDownloading(true);
    try {
      const dataUrl = await toPng(shareCardRef.current, {
        cacheBust: true,
        pixelRatio: 2,
      });
      const link = document.createElement('a');
      link.download = `bluff-ai-result-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to export share card:', err);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="w-full max-w-[430px] mx-auto flex flex-col items-center gap-4 select-none p-3">
      {/* 9:16 Retro Share Card Container */}
      <div
        ref={shareCardRef}
        className="w-full border-4 border-emerald-500 bg-black p-5 shadow-[0_0_30px_rgba(16,185,129,0.3)] flex flex-col justify-between relative overflow-hidden"
      >
        <div className="crt-screen absolute inset-0 pointer-events-none" />

        {/* Header */}
        <div className="text-center border-b border-zinc-800 pb-3">
          <div className="retro text-lg font-black text-emerald-400 tracking-wider">
            BLUFF.AI
          </div>
          <div className="retro text-[8px] text-zinc-400 mt-1">
            {t.result.summaryTitle}
          </div>
        </div>

        {/* Readability & Breaks Metrics */}
        <div className="grid grid-cols-2 gap-3 my-4">
          <div className="border-2 border-zinc-800 bg-zinc-950 p-2.5 text-center flex flex-col items-center">
            <span className="retro text-[8px] text-zinc-400">{t.result.aiReadability}</span>
            <span className="retro text-2xl font-black text-cyan-400 font-mono mt-1">
              {readability}%
            </span>
            <span className="text-[8px] text-zinc-500 mt-0.5">{t.result.machineReadError}</span>
          </div>

          <div className="border-2 border-zinc-800 bg-zinc-950 p-2.5 text-center flex flex-col items-center">
            <span className="retro text-[8px] text-zinc-400">{t.result.modelBreaks}</span>
            <span className="retro text-2xl font-black text-red-500 font-mono mt-1">
              {modelBreaks}
            </span>
            <span className="text-[8px] text-zinc-500 mt-0.5">{t.result.highConfMisjudge}</span>
          </div>
        </div>

        {/* Archetype */}
        <div className="border-2 border-yellow-500/80 bg-zinc-950 p-3 my-1">
          <div className="retro text-[8px] text-yellow-400">{t.result.cognitiveArchetype}</div>
          <div className="retro text-xs font-bold text-zinc-100 mt-1">
            {archetypeObj.title}
          </div>
          <p className="text-[10px] text-zinc-400 mt-1 leading-relaxed">
            {archetypeObj.desc}
          </p>
        </div>

        {/* Biggest Lie Exhibition */}
        <div className="border-2 border-zinc-800 bg-zinc-950 p-3 my-2 flex flex-col items-center">
          <div className="retro text-[8px] text-zinc-400 mb-2 text-center">
            {t.result.biggestLieExhibit}
          </div>
          <div className="flex items-center gap-2 mb-2">
            {biggestLieCards.map((c, i) => (
              <PokerCard key={i} card={c} size="sm" />
            ))}
          </div>
          <div className="text-center font-mono text-[9px] text-zinc-300">
            {t.result.aiConfidenceLabel}: <strong className="text-red-400">96% STRONG</strong>
            <br />
            <span className="text-zinc-500">{t.result.actualLabel}</span>
          </div>
        </div>

        {/* Chips Total */}
        <div className="flex items-center justify-between border-t border-zinc-800 pt-3 text-[9px] font-mono">
          <span className="text-zinc-400">{t.result.finalChips}</span>
          <span className="text-emerald-400 font-bold text-sm">{playerChips}</span>
        </div>

        <div className="mt-3 text-center">
          <span className="retro text-[7px] text-zinc-600">
            {t.result.watermark}
          </span>
        </div>
      </div>

      {/* Control Buttons */}
      <div className="w-full flex flex-col gap-2.5">
        <Button
          variant="default"
          size="lg"
          onClick={handleShare}
          disabled={downloading}
          className="w-full h-14 min-h-[56px] retro text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-black active:scale-95"
        >
          {downloading ? t.result.generatingPoster : t.result.sharePoster}
        </Button>

        <Button
          variant="secondary"
          size="lg"
          onClick={onPlayAgain}
          className="w-full h-14 min-h-[56px] retro text-xs font-bold bg-zinc-800 hover:bg-zinc-700 text-zinc-100 active:scale-95"
        >
          {t.result.playAgain}
        </Button>
      </div>
    </div>
  );
}
