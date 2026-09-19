import { GameRunRecord, GameReplayStep } from '@/lib/history/types';
import { ensureHighFidelityStep } from '@/lib/history/recorder';
import { useState, useEffect } from 'react';

export function useReplayPlayback(run: GameRunRecord) {
  const [stepIndex, setStepIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [speed, setSpeed] = useState<1 | 2>(1);
  const [activeTab, setActiveTab] = useState<'AUTO' | 'TABLE' | 'SPECIAL'>('AUTO');
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState<boolean>(false);

  const rawSteps = run.steps || [];
  const steps: GameReplayStep[] = rawSteps.map((step) => ensureHighFidelityStep(step));
  const currentStep: GameReplayStep | undefined = steps[stepIndex] || steps[0];
  const publicState = currentStep?.publicStateSnapshot;
  const autopilotSnapshot = currentStep?.autopilotSnapshot;

  useEffect(() => {
    if (!isPlaying) return;

    const intervalMs = speed === 1 ? 1600 : 800;
    const timer = setInterval(() => {
      setStepIndex((prev) => {
        if (prev >= steps.length - 1) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isPlaying, speed, steps.length]);

  const handlePrev = () => {
    setIsPlaying(false);
    setStepIndex((prev) => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    setIsPlaying(false);
    setStepIndex((prev) => Math.min(steps.length - 1, prev + 1));
  };

  const handleFirst = () => {
    setIsPlaying(false);
    setStepIndex(0);
  };

  const handleLast = () => {
    setIsPlaying(false);
    setStepIndex(steps.length - 1);
  };

  const isVictory = run.status === 'VICTORY';
  const isDefeat = run.status === 'DEFEAT';
  
  const isShopStep =
    currentStep?.actionType === 'BUY_ITEM' || publicState?.phase === 'SHOP';
  const isTallyStep =
    currentStep?.actionType === 'PLAY_HAND' || Boolean(currentStep?.payload?.scoreResult);
  const isResultStep =
    currentStep?.actionType === 'RUN_COMPLETE' ||
    currentStep?.actionType === 'GAME_OVER' ||
    (stepIndex === steps.length - 1 && (isVictory || isDefeat));
  const hasSpecialView = isShopStep || isTallyStep || isResultStep;

  const showSpecial =
    activeTab === 'SPECIAL' || (activeTab === 'AUTO' && hasSpecialView);

  return {
    stepIndex, setStepIndex,
    isPlaying, setIsPlaying,
    speed, setSpeed,
    activeTab, setActiveTab,
    isMobileDrawerOpen, setIsMobileDrawerOpen,
    steps, currentStep, publicState, autopilotSnapshot,
    handlePrev, handleNext, handleFirst, handleLast,
    isVictory, isDefeat,
    isShopStep, isTallyStep, isResultStep, hasSpecialView, showSpecial,
  };
}
