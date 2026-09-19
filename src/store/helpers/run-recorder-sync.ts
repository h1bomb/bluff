import { PublicGameState } from '@/game/types';
import { GameRunRecord, GameReplayStep, GameRunSummary, ReplayAutopilotSnapshot } from '@/lib/history/types';
import { saveGameRun, saveActiveSession, clearActiveSession } from '@/lib/history/db';
import { RunsCloudService } from '@/services/runs-cloud-service';
import { createGameOverStep } from '@/lib/history/recorder';
import { useAutopilotStore } from '../autopilot-store';
import { evaluateAutopilotDecisions } from '@/game/autopilot/evaluator';
import { GameStoreState } from '../game-store';

export function captureCurrentAutopilotSnapshot(publicState: PublicGameState): ReplayAutopilotSnapshot {
  const ap = useAutopilotStore.getState();
  let decisions = ap.decisions;
  if (!decisions || decisions.length === 0) {
    try {
      decisions = evaluateAutopilotDecisions(publicState, publicState.shopInventory);
    } catch {
      decisions = [];
    }
  }

  return {
    isEnabled: ap.isEnabled,
    speed: ap.speed,
    decisions: JSON.parse(JSON.stringify(decisions)),
    thoughtLogs: [...ap.thoughtLogs],
    topDecisionConfidence: decisions[0]?.confidence,
    topDecisionTitle: decisions[0]?.title,
  };
}

export function updateAutopilotState(publicState: PublicGameState) {
  try {
    useAutopilotStore.getState().updateDecisions(publicState, publicState.shopInventory);
  } catch {}
}

export function syncRunProgress(
  get: () => GameStoreState,
  set: (partial: Partial<GameStoreState> | ((state: GameStoreState) => Partial<GameStoreState>)) => void,
  step: GameReplayStep,
  newPublicState: PublicGameState,
  newSequence: number,
  summaryDelta?: Partial<GameRunSummary>,
  isGameOver?: boolean,
  isVictory?: boolean
) {
  const { currentRunRecord, currentRunId } = get();
  if (!currentRunRecord || !currentRunId) return;

  const updatedSteps = [...currentRunRecord.steps, step];
  const rawFinalBlind =
    summaryDelta?.finalBlind ??
    newPublicState.blind?.bossNameZh ??
    newPublicState.blind?.bossName ??
    currentRunRecord.summary.finalBlind;

  let resolvedFinalBlind = 'SMALL';
  if (typeof rawFinalBlind === 'object' && rawFinalBlind !== null) {
    const b = rawFinalBlind as { nameZh?: string; name?: string; bossNameZh?: string; bossName?: string };
    resolvedFinalBlind = b.nameZh || b.name || b.bossNameZh || b.bossName || 'BOSS';
  } else if (typeof rawFinalBlind === 'string') {
    resolvedFinalBlind = rawFinalBlind;
  }

  const updatedSummary: GameRunSummary = {
    ...currentRunRecord.summary,
    finalAnte: summaryDelta?.finalAnte ?? newPublicState.ante ?? currentRunRecord.summary.finalAnte,
    finalBlind: resolvedFinalBlind,
    totalScore: currentRunRecord.summary.totalScore + (summaryDelta?.totalScore ?? 0),
    peakRoundScore: Math.max(currentRunRecord.summary.peakRoundScore, summaryDelta?.peakRoundScore ?? 0),
    totalHandsPlayed: currentRunRecord.summary.totalHandsPlayed + (summaryDelta?.totalHandsPlayed ?? 0),
    totalDiscards: currentRunRecord.summary.totalDiscards + (summaryDelta?.totalDiscards ?? 0),
    totalPurchases: currentRunRecord.summary.totalPurchases + (summaryDelta?.totalPurchases ?? 0),
    modelBreaksCount: currentRunRecord.summary.modelBreaksCount + (summaryDelta?.modelBreaksCount ?? 0),
    finalMoney: newPublicState.money ?? currentRunRecord.summary.finalMoney,
    jokersCount: (newPublicState.jokers || []).length,
    jokersSnapshot: newPublicState.jokers || [],
  };

  if (isGameOver) {
    const finalStatus = isVictory ? 'VICTORY' : 'DEFEAT';
    const apSnapshot = captureCurrentAutopilotSnapshot(newPublicState);
    const endStep = createGameOverStep(updatedSteps.length + 1, isVictory || false, newPublicState, apSnapshot);
    updatedSteps.push(endStep);

    const completedRun: GameRunRecord = {
      ...currentRunRecord,
      status: finalStatus,
      endTime: Date.now(),
      durationMs: Date.now() - currentRunRecord.startTime,
      summary: updatedSummary,
      steps: updatedSteps,
    };

    saveGameRun(completedRun).catch((err) => console.warn('Failed to save completed run to history:', err));
    RunsCloudService.saveCloudRun(completedRun).catch(() => {});
    clearActiveSession().catch(() => {});

    set({ currentRunRecord: null });
  } else {
    const ongoingRun: GameRunRecord = {
      ...currentRunRecord,
      summary: updatedSummary,
      steps: updatedSteps,
    };

    saveActiveSession({
      gameId: currentRunId,
      publicState: newPublicState,
      sequence: newSequence,
      replayRun: ongoingRun,
      lastUpdated: Date.now(),
    }).catch((err) => console.warn('Failed to update active session:', err));

    set({ currentRunRecord: ongoingRun });
  }
}
