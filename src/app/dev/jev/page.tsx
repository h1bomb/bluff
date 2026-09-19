'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/8bit/button';
import { Progress } from '@/components/ui/8bit/progress';
import { Badge } from '@/components/ui/8bit/badge';
import { ObservablePlayerState, PlayerBelief, PokerAction } from '@/game/types';
import { useLanguageStore } from '@/store/language-store';
import { LanguageSwitcher } from '@/components/ui/language-switcher';
import { SoundToggle } from '@/components/ui/sound-toggle';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/8bit/card';

export default function JevPlayground() {
  const { t } = useLanguageStore();
  const [currentAction, setCurrentAction] = useState<PokerAction>('RAISE');
  const [delayMs, setDelayMs] = useState<number>(350);
  const [pot, setPot] = useState<number>(200);
  const [betAmount, setBetAmount] = useState<number>(100);
  const [providerMode, setProviderMode] = useState<'auto' | 'typesafe' | 'heuristic'>('auto');

  // History hands for testing patterns
  const [history, setHistory] = useState<Array<{ action: PokerAction; delay: number; won: boolean }>>([
    { action: 'RAISE', delay: 400, won: true },
    { action: 'RAISE', delay: 350, won: true },
  ]);

  const [loading, setLoading] = useState<boolean>(false);
  const [belief, setBelief] = useState<PlayerBelief | null>(null);
  const [latency, setLatency] = useState<number | null>(null);
  const [providerUsed, setProviderUsed] = useState<string | null>(null);

  // Preset scenarios
  const applyPreset = (preset: 'conditioned_bluff' | 'tilt' | 'passive') => {
    if (preset === 'conditioned_bluff') {
      setHistory([
        { action: 'RAISE', delay: 380, won: true },
        { action: 'RAISE', delay: 320, won: true },
      ]);
      setCurrentAction('RAISE');
      setDelayMs(300);
      setBetAmount(120);
    } else if (preset === 'tilt') {
      setHistory([
        { action: 'RAISE', delay: 1200, won: false },
      ]);
      setCurrentAction('ALL_IN');
      setDelayMs(450);
      setBetAmount(800);
    } else {
      setHistory([
        { action: 'CALL', delay: 1800, won: false },
      ]);
      setCurrentAction('CALL');
      setDelayMs(2200);
      setBetAmount(20);
    }
  };

  const runEvaluation = async () => {
    setLoading(true);

    const raiseCount = history.filter(h => h.action === 'RAISE').length + (currentAction === 'RAISE' ? 1 : 0);
    const totalCount = history.length + 1;
    const fastCount = history.filter(h => h.action === 'RAISE' && h.delay <= 800).length + (currentAction === 'RAISE' && delayMs <= 800 ? 1 : 0);

    const observableState: ObservablePlayerState = {
      handIndex: history.length + 1,
      pot,
      currentBet: betAmount,
      player: {
        chips: 1000 - betAmount,
        currentAction,
        betAmount,
        actionDelayMs: delayMs,
      },
      recentHands: history.map((h, i) => ({
        handIndex: i + 1,
        playerAction: h.action,
        actionDelayMs: h.delay,
        betAmount: 100,
        won: h.won,
        showdown: true,
        revealedHandStrength: h.won ? 0.85 : 0.35,
      })),
      patterns: {
        raiseRate: raiseCount / totalCount,
        foldRate: 0,
        allInRate: currentAction === 'ALL_IN' ? 1 / totalCount : 0,
        fastRaiseRate: raiseCount > 0 ? fastCount / raiseCount : 0,
        raisesAfterLoss: history.some(h => !h.won) && currentAction === 'RAISE' ? 1 : 0,
        successfulBluffs: 0,
        failedBluffs: 0,
        repeatedSequences: fastCount >= 2 ? ['FAST_RAISEx2'] : [],
      },
    };

    try {
      const res = await fetch('/api/dev/jev', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          observableState,
          useProvider: providerMode,
        }),
      });
      const data = await res.json();
      if (data.success && data.belief) {
        setBelief(data.belief);
        setLatency(data.latency);
        setProviderUsed(data.providerUsed);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-black text-white p-4 sm:p-6 font-mono select-none">
      <div className="max-w-5xl mx-auto flex flex-col gap-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-zinc-800 pb-3">
          <div>
            <div className="retro text-base font-bold text-emerald-400">
              {t.devPlayground.title}
            </div>
            <div className="retro text-[9px] text-zinc-400 mt-1">
              {t.devPlayground.subtitle}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <SoundToggle />
            <LanguageSwitcher />
            <Button variant="outline" size="sm" asChild>
              <Link href="/game">{t.common.backToGame}</Link>
            </Button>
          </div>
        </div>

        {/* Preset scenario shortcuts */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="retro text-[8px] text-zinc-500">
            {t.devPlayground.quickPresets}
          </span>
          <button
            onClick={() => applyPreset('conditioned_bluff')}
            className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 border border-emerald-500/60 text-emerald-300 retro text-[8px]"
          >
            {t.devPlayground.presetA}
          </button>
          <button
            onClick={() => applyPreset('tilt')}
            className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 border border-red-500/60 text-red-300 retro text-[8px]"
          >
            {t.devPlayground.presetB}
          </button>
          <button
            onClick={() => applyPreset('passive')}
            className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 border border-blue-500/60 text-blue-300 retro text-[8px]"
          >
            {t.devPlayground.presetC}
          </button>
        </div>

        {/* 2-Column Playground Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* LEFT: INPUT OBSERVABLE STATE */}
          <div className="border-2 border-zinc-700 bg-zinc-950 p-4 flex flex-col gap-4 shadow-[4px_4px_0px_#000]">
            <div className="retro text-xs text-yellow-400 border-b border-zinc-800 pb-2">
              {t.devPlayground.inputState}
            </div>

            {/* Current Action */}
            <div className="space-y-1">
              <label className="retro text-[9px] text-zinc-400">
                {t.devPlayground.currentAction}
              </label>
              <div className="grid grid-cols-4 gap-2">
                {(['FOLD', 'CALL', 'RAISE', 'ALL_IN'] as PokerAction[]).map(act => (
                  <button
                    key={act}
                    onClick={() => setCurrentAction(act)}
                    className={`py-2 retro text-[9px] font-bold border transition-colors ${
                      currentAction === act
                        ? 'border-emerald-400 bg-emerald-950 text-emerald-300'
                        : 'border-zinc-800 bg-zinc-900 text-zinc-400'
                    }`}
                  >
                    {act}
                  </button>
                ))}
              </div>
            </div>

            {/* Delay ms */}
            <div className="space-y-1">
              <div className="flex justify-between retro text-[9px]">
                <span className="text-zinc-400">
                  {t.devPlayground.actionDelay}
                </span>
                <span className={`font-bold ${delayMs <= 800 ? 'text-emerald-400' : 'text-zinc-300'}`}>
                  {delayMs} ms {delayMs <= 800 ? t.devPlayground.fastTell : t.devPlayground.slowTell}
                </span>
              </div>
              <input
                type="range"
                min="100"
                max="3000"
                step="50"
                value={delayMs}
                onChange={e => setDelayMs(Number(e.target.value))}
                className="w-full accent-emerald-500 bg-zinc-800"
              />
            </div>

            {/* Pot & Bet */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="retro text-[9px] text-zinc-400">
                  {t.devPlayground.potSize}
                </label>
                <input
                  type="number"
                  value={pot}
                  onChange={e => setPot(Number(e.target.value))}
                  className="w-full p-2 bg-zinc-900 border border-zinc-800 retro text-xs text-white"
                />
              </div>
              <div className="space-y-1">
                <label className="retro text-[9px] text-zinc-400">
                  {t.devPlayground.betAmount}
                </label>
                <input
                  type="number"
                  value={betAmount}
                  onChange={e => setBetAmount(Number(e.target.value))}
                  className="w-full p-2 bg-zinc-900 border border-zinc-800 retro text-xs text-white"
                />
              </div>
            </div>

            {/* Provider Mode */}
            <div className="space-y-1">
              <label className="retro text-[9px] text-zinc-400">
                {t.devPlayground.providerEngine}
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['auto', 'typesafe', 'heuristic'] as const).map(p => (
                  <button
                    key={p}
                    onClick={() => setProviderMode(p)}
                    className={`py-1.5 retro text-[8px] font-bold border transition-colors ${
                      providerMode === p
                        ? 'border-yellow-400 bg-yellow-950 text-yellow-300'
                        : 'border-zinc-800 bg-zinc-900 text-zinc-500'
                    }`}
                  >
                    {p.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* History Summary */}
            <div className="space-y-1">
              <div className="flex justify-between items-center retro text-[9px] text-zinc-400">
                <span>
                  {t.devPlayground.pastHands(history.length)}
                </span>
                <button
                  onClick={() =>
                    setHistory([
                      ...history,
                      { action: 'RAISE', delay: 400, won: true },
                    ])
                  }
                  className="text-emerald-400 hover:underline"
                >
                  + {t.devPlayground.addHand}
                </button>
              </div>
              <div className="space-y-1">
                {history.map((h, i) => (
                  <div
                    key={i}
                    className="p-1.5 bg-zinc-900 border border-zinc-800 flex items-center justify-between text-[10px]"
                  >
                    <span>Hand #{i + 1}: {h.action} ({h.delay}ms)</span>
                    <div className="flex items-center gap-2">
                      <span className={h.won ? 'text-emerald-400' : 'text-red-400'}>
                        {h.won ? t.devPlayground.won : t.devPlayground.lost}
                      </span>
                      <button
                        onClick={() => setHistory(history.filter((_, idx) => idx !== i))}
                        className="text-zinc-600 hover:text-red-400 text-xs font-bold"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Button
              variant="default"
              size="lg"
              onClick={runEvaluation}
              disabled={loading}
              className="mt-2 h-14 min-h-[56px] retro text-xs font-bold bg-emerald-500 text-black hover:bg-emerald-400 active:scale-95"
            >
              {loading ? t.devPlayground.runningInference : t.devPlayground.runEvaluation}
            </Button>
          </div>

          {/* RIGHT: OUTPUT JEV BELIEF */}
          <div className="border-2 border-zinc-700 bg-zinc-950 p-4 flex flex-col gap-4 shadow-[4px_4px_0px_#000]">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
              <div className="retro text-xs text-cyan-400">
                {t.devPlayground.realtimeOutput}
              </div>
              {latency !== null && (
                <div className="text-[9px] font-mono text-zinc-400">
                  {latency}ms ({providerUsed})
                </div>
              )}
            </div>

            {belief ? (
              <div className="space-y-4">
                {/* Top Prediction */}
                <div className="p-3 border-2 border-cyan-500/80 bg-zinc-900/60 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="retro text-[9px] text-zinc-400">
                      {t.devPlayground.dominantRead}
                    </span>
                    <Badge variant="default" className="retro text-xs text-cyan-300">
                      {t.behaviors[belief.behavior.value] || belief.behavior.value}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3">
                    <Progress
                      variant="retro"
                      value={Math.round(belief.behavior.confidence * 100)}
                      className="h-3"
                      progressBg="bg-cyan-500"
                    />
                    <span className="retro text-sm font-bold text-cyan-400 font-mono">
                      {Math.round(belief.behavior.confidence * 100)}%
                    </span>
                  </div>
                </div>

                {/* Sub-Probability Bars */}
                <div className="space-y-2 text-xs">
                  <div className="retro text-[9px] text-zinc-400">
                    {t.devPlayground.probabilityDistribution}
                  </div>
                  {Object.entries(belief.behavior.probabilities).map(([key, prob]) => {
                    const pct = Math.round((prob as number) * 100);
                    const label = t.behaviors[key as keyof typeof t.behaviors] || key;
                    return (
                      <div key={key} className="space-y-0.5">
                        <div className="flex justify-between text-[10px]">
                          <span className="text-zinc-400">{label}:</span>
                          <span className="font-bold text-zinc-200">{pct}%</span>
                        </div>
                        <div className="w-full bg-zinc-900 h-1.5 overflow-hidden">
                          <div
                            className="bg-emerald-500 h-full transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Scores */}
                <div className="grid grid-cols-3 gap-2 text-center pt-2 border-t border-zinc-850">
                  <div className="p-2 bg-zinc-900 border border-zinc-800">
                    <div className="text-[8px] retro text-zinc-500">{t.game.aggression}</div>
                    <div className="retro text-xs font-bold text-red-400 mt-1">
                      {Math.round(belief.aggression * 100)}%
                    </div>
                  </div>
                  <div className="p-2 bg-zinc-900 border border-zinc-800">
                    <div className="text-[8px] retro text-zinc-500">{t.game.predictability}</div>
                    <div className="retro text-xs font-bold text-yellow-400 mt-1">
                      {Math.round(belief.predictability * 100)}%
                    </div>
                  </div>
                  <div className="p-2 bg-zinc-900 border border-zinc-800">
                    <div className="text-[8px] retro text-zinc-500">{t.game.tilt}</div>
                    <div className="retro text-xs font-bold text-orange-400 mt-1">
                      {Math.round(belief.tilt * 100)}%
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-64 flex flex-col items-center justify-center text-center p-4">
                <span className="retro text-xs text-zinc-600 mb-2">
                  {t.devPlayground.awaitingInput}
                </span>
                <p className="text-[11px] text-zinc-500 max-w-xs">
                  {t.devPlayground.awaitingDesc}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
