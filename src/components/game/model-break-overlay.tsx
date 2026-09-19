'use client';

import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { ModelBreakPayload } from '@/game/types';
import { PokerCard } from './poker-card';
import { Button } from '@/components/ui/8bit/button';
import { useLanguageStore } from '@/store/language-store';
import { audioManager } from '@/lib/audio/audio-manager';

interface ModelBreakOverlayProps {
  payload?: ModelBreakPayload | null;
  onDismiss: () => void;
}

export function ModelBreakOverlay({ payload, onDismiss }: ModelBreakOverlayProps) {
  const { t } = useLanguageStore();
  const [step, setStep] = useState<number>(0);
  const [prevPayload, setPrevPayload] = useState(payload);

  if (payload !== prevPayload) {
    setPrevPayload(payload);
    setStep(0);
  }

  useEffect(() => {
    if (!payload) return;

    // Trigger glitch & system collapse SFX immediately
    audioManager.playSfx('modelBreak');

    const t1 = setTimeout(() => setStep(1), 350);
    const t2 = setTimeout(() => {
      setStep(2);
      audioManager.playSfx('stampHit');
    }, 600);
    const t3 = setTimeout(() => setStep(3), 750);
    const t4 = setTimeout(() => {
      setStep(4);
      audioManager.playSfx('modelBreak');
    }, 900);
    const t5 = setTimeout(() => {
      setStep(5);
      audioManager.playSfx('winChime');
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#ef4444', '#10b981', '#fbbf24', '#06b6d4'],
        });
      } catch {
        // Confetti is optional visual flair
      }
    }, 1200);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(t5);
    };
  }, [payload]);

  if (!payload) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md select-none">
      {/* Glitch CRT flash container */}
      <div
        className={`w-full max-w-[390px] border-4 border-red-600 bg-black p-5 flex flex-col items-center justify-between text-center relative overflow-hidden shadow-[0_0_40px_rgba(239,68,68,0.6)] ${
          step >= 3 ? 'animate-pixel-shake' : ''
        } ${step === 3 ? 'animate-model-break-flash' : ''}`}
      >
        {/* CRT Scanline Layer */}
        <div className="crt-screen absolute inset-0 pointer-events-none" />

        {/* Top Header: AI prediction */}
        <div className="w-full border-b border-red-900 pb-3 flex flex-col items-center">
          <span className="retro text-[9px] text-zinc-400">
            {t.modelBreak.aiConfidence}
          </span>
          <div className="flex items-center gap-2 mt-1">
            <span className="retro text-xs text-red-400 font-bold">
              {payload.aiPredicted}
            </span>
            <span
              className={`retro text-xl font-extrabold text-red-500 font-mono ${
                step >= 1 ? 'animate-pulse scale-110' : ''
              }`}
            >
              {payload.aiConfidence}%
            </span>
          </div>
        </div>

        {/* Middle: Revealed Hand vs WRONG */}
        <div className="my-5 flex flex-col items-center gap-3 relative w-full">
          <div className="retro text-[8px] text-zinc-400">
            {t.modelBreak.actualHolding}
          </div>

          <div className="flex items-center justify-center gap-2">
            {payload.actualCards.map((c, i) => (
              <PokerCard key={i} card={c} size="md" highlight />
            ))}
          </div>

          <div className="retro text-[9px] text-zinc-300 font-mono mt-1">
            {payload.actualHandType.replace(/_/g, ' ')} ({t.modelBreak.strength}:{' '}
            {Math.round(payload.actualStrength * 100)}%)
          </div>

          {/* Red WRONG Stamp overlay */}
          {step >= 2 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none animate-in zoom-in-150 duration-150">
              <div className="retro text-4xl font-black text-red-600 border-4 border-red-600 px-4 py-2 -rotate-12 bg-black/80 shadow-[0_0_20px_#dc2626]">
                {t.modelBreak.wrong}
              </div>
            </div>
          )}
        </div>

        {/* CLIMAX: MODEL BREAK TEXT BURST */}
        {step >= 4 && (
          <div className="my-2 flex flex-col items-center gap-1 animate-in zoom-in-75 duration-200">
            <div
              className="retro text-2xl font-black text-yellow-400 glitch-text tracking-wider"
              data-text={t.modelBreak.title}
            >
              {t.modelBreak.title}
            </div>
            <div className="retro text-[8px] text-yellow-300">
              {t.modelBreak.subtitle}
            </div>
          </div>
        )}

        {/* Bonus Reward Count Up */}
        {step >= 5 && (
          <div className="w-full bg-zinc-950 border-2 border-yellow-500 p-2.5 mt-2 flex flex-col items-center gap-1 animate-in fade-in slide-in-from-bottom-2 duration-200">
            <div className="retro text-[8px] text-zinc-400">
              {t.modelBreak.bonus}
            </div>
            <div className="retro text-lg font-bold text-emerald-400 font-mono">
              +{payload.rewardBonus} {t.modelBreak.chipsReward}
            </div>
            <div className="retro text-[8px] text-purple-400">
              {t.modelBreak.damage} -{payload.understandingDamage}
            </div>
          </div>
        )}

        {/* Dismiss Button */}
        {step >= 5 && (
          <Button
            variant="default"
            size="lg"
            onClick={onDismiss}
            className="mt-4 w-full h-12 retro text-[10px] font-bold tracking-wider bg-red-600 hover:bg-red-500 text-white active:scale-95"
          >
            {t.modelBreak.continueRun}
          </Button>
        )}
      </div>
    </div>
  );
}
