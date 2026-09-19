'use client';

import React from 'react';
import { useLanguageStore } from '@/store/language-store';
import { Button } from '@/components/ui/8bit/button';
import { ScoreTallyStep } from '@/game/types';
import { ScoreTallyResultData, useScoreTallyAnimation } from './scoring/use-score-tally-animation';
import { ScoreBreakdownGrid } from './scoring/score-breakdown-grid';

interface ScoreTallyInlineViewProps {
  scoreResult?: ScoreTallyResultData | null;
  onDismiss?: () => void;
  isReplayMode?: boolean;
  onNextStep?: () => void;
}

export function ScoreTallyInlineView({
  scoreResult,
  onDismiss,
  isReplayMode = false,
  onNextStep,
}: ScoreTallyInlineViewProps) {
  const { language, t } = useLanguageStore();
  const { currentStepIndex, hasSteps, tallySteps } = useScoreTallyAnimation(scoreResult, isReplayMode);

  if (!scoreResult) return null;

  const currentStep = hasSteps
    ? tallySteps[currentStepIndex] || tallySteps[tallySteps.length - 1]
    : null;
  const isFinished = !hasSteps || currentStepIndex >= tallySteps.length - 1;

  const handDesc = language === 'zh'
    ? (scoreResult.evaluatedHand?.descriptionZh || scoreResult.handTypeZh || scoreResult.evaluatedHand?.description || scoreResult.handType || t.pokerHands.HIGH_CARD)
    : (scoreResult.evaluatedHand?.description || scoreResult.handType || t.pokerHands.HIGH_CARD);
  const handLevel = scoreResult.handLevel || 1;

  const displayChips = currentStep
    ? currentStep.currentChips
    : scoreResult.totalChips || scoreResult.baseChips || 0;
  const displayMult = currentStep
    ? currentStep.currentMult
    : scoreResult.totalMult || scoreResult.baseMult || 0;
  const displayCogMult = currentStep
    ? currentStep.currentCognitiveMult ?? 1
    : 1;

  const finalScore = scoreResult.finalScore || 0;
  const currentCalculatedScore = currentStep
    ? Math.round(displayChips * displayMult * displayCogMult)
    : finalScore;

  return (
    <div
      className={`w-full border-2 ${
        scoreResult.isModelBreak
          ? 'border-red-500 shadow-[0_0_25px_rgba(239,68,68,0.4)]'
          : 'border-yellow-500/80 shadow-[0_0_20px_rgba(234,179,8,0.25)]'
      } bg-zinc-950 p-3 flex flex-col items-center gap-2.5 text-center relative select-none animate-in fade-in duration-150`}
    >
      {/* Header: Hand Type & Level Badge */}
      <div className="flex flex-col items-center gap-1 w-full border-b border-zinc-800/80 pb-2">
        {scoreResult.isModelBreak ? (
          <div className="px-2.5 py-0.5 bg-red-600 text-white font-black text-xs retro animate-pulse shadow-[0_0_10px_#ef4444]">
            {t.scoring.modelBreakBurst}
          </div>
        ) : (
          <div className="flex items-center justify-between w-full">
            <span className="retro text-xs font-black text-yellow-400 flex items-center gap-1.5">
              <span>★</span>
              <span>{t.scoring.tallyTitle}</span>
            </span>
            <span className="px-1.5 py-0.2 bg-yellow-950 border border-yellow-500 text-yellow-300 retro text-[9px] font-bold">
              Lv.{handLevel}
            </span>
          </div>
        )}

        <div className="retro text-xs font-bold text-zinc-200 mt-0.5">
          {handDesc}
        </div>
      </div>

      {/* Live Chips × Mult × CogMult Breakdown */}
      <ScoreBreakdownGrid
        displayChips={displayChips}
        displayMult={displayMult}
        displayCogMult={displayCogMult}
        currentCalculatedScore={currentCalculatedScore}
        finalScore={finalScore}
        isFinished={isFinished}
      />

      {/* Step-by-Step Tally Log or Joker Triggers */}
      {hasSteps ? (
        <div className="w-full max-h-[110px] overflow-y-auto border border-zinc-800 bg-zinc-900/60 p-2 flex flex-col gap-1 text-left text-[10px] retro font-mono">
          {tallySteps.slice(0, currentStepIndex + 1).map((step: ScoreTallyStep, idx: number) => (
            <div
              key={idx}
              className={`leading-tight flex items-center gap-1.5 ${
                step.type === 'TOTAL'
                  ? 'text-yellow-300 font-bold pt-1 border-t border-zinc-700'
                  : step.type === 'COGNITIVE_MULT'
                  ? 'text-purple-300 font-bold'
                  : step.type === 'JOKER_TRIGGER'
                  ? 'text-cyan-300'
                  : 'text-zinc-300'
              }`}
            >
              <span>{language === 'zh' ? (step.messageZh || step.message) : step.message}</span>
            </div>
          ))}
        </div>
      ) : scoreResult.jokerTriggers && scoreResult.jokerTriggers.length > 0 ? (
        <div className="w-full flex flex-wrap gap-1 justify-center py-1">
          {scoreResult.jokerTriggers.map((jt, i: number) => (
            <span
              key={i}
              className="px-1.5 py-0.5 bg-purple-950/80 border border-purple-500 text-purple-300 retro text-[8px] font-bold"
            >
              🃏 {jt.jokerName}: {jt.message || `+${jt.chipsAdded || jt.multAdded}`}
            </span>
          ))}
        </div>
      ) : null}

      {/* Big Score Summary Banner */}
      <div className="w-full py-1.5 bg-yellow-950/40 border border-yellow-500/40 flex items-center justify-between px-3">
        <span className="text-[9px] retro text-zinc-400 font-bold">
          {t.scoring.roundScoreGain}
        </span>
        <span className="text-2xl font-black text-yellow-400 font-mono tracking-wider">
          +{finalScore} PTS
        </span>
      </div>

      {/* Dismiss / Continue Button */}
      {!isReplayMode ? (
        <Button
          variant="default"
          onClick={onDismiss}
          className="w-full h-9 retro text-xs font-black bg-emerald-600 hover:bg-emerald-500 text-black shadow-[0_0_10px_rgba(16,185,129,0.3)] active:scale-95"
        >
          {t.scoring.continuePlay}
        </Button>
      ) : onNextStep ? (
        <Button
          variant="outline"
          onClick={onNextStep}
          className="w-full h-8 retro text-[9px] font-bold border-zinc-700 text-zinc-300 hover:border-emerald-400 hover:text-emerald-300 active:scale-95"
        >
          {t.scoring.nextStep}
        </Button>
      ) : null}
    </div>
  );
}
