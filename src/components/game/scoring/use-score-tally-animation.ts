import { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { ScoreTallyStep } from '@/game/types';
import { audioManager } from '@/lib/audio/audio-manager';

export interface ScoreTallyResultData {
  evaluatedHand?: {
    description?: string;
    descriptionZh?: string;
    handType?: string;
  };
  handType?: string;
  handTypeZh?: string;
  handLevel?: number;
  baseChips?: number;
  baseMult?: number;
  totalChips?: number;
  totalMult?: number;
  cognitiveMult?: number;
  isModelBreak?: boolean;
  finalScore?: number;
  tallySteps?: ScoreTallyStep[];
  jokerTriggers?: Array<{
    jokerKey?: string;
    jokerName?: string;
    message?: string;
    chipsAdded?: number;
    multAdded?: number;
    xMult?: number;
  }>;
}

export function useScoreTallyAnimation(
  scoreResult: ScoreTallyResultData | null | undefined,
  isReplayMode: boolean
) {
  const tallySteps: ScoreTallyStep[] = scoreResult?.tallySteps || [];
  const hasSteps = tallySteps.length > 0;
  const [animStepIndex, setAnimStepIndex] = useState<number>(0);
  const [prevResult, setPrevResult] = useState(scoreResult);

  if (scoreResult !== prevResult) {
    setPrevResult(scoreResult);
    setAnimStepIndex(0);
  }

  const currentStepIndex = isReplayMode
    ? (hasSteps ? tallySteps.length - 1 : 0)
    : animStepIndex;

  // Play ascending Balatro-style chime on each tally animation step
  useEffect(() => {
    if (!scoreResult || isReplayMode || !hasSteps) return;
    audioManager.playSfx('scoreTick', { stepIndex: animStepIndex });
  }, [animStepIndex, scoreResult, isReplayMode, hasSteps]);

  useEffect(() => {
    if (!scoreResult || isReplayMode) return;

    const intervalMs = 380;
    const timer = setInterval(() => {
      setAnimStepIndex((prev) => {
        if (prev < tallySteps.length - 1) {
          return prev + 1;
        }
        clearInterval(timer);
        return prev;
      });
    }, intervalMs);

    if (scoreResult.isModelBreak) {
      const confettiTimer = setTimeout(() => {
        try {
          confetti({
            particleCount: 50,
            spread: 70,
            origin: { y: 0.6 },
          });
        } catch {
          // ignore in headless
        }
      }, 700);

      return () => {
        clearInterval(timer);
        clearTimeout(confettiTimer);
      };
    }

    return () => clearInterval(timer);
  }, [scoreResult, isReplayMode, tallySteps.length]);

  return { currentStepIndex, hasSteps, tallySteps };
}
