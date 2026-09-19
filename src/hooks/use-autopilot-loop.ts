import { useEffect } from 'react';
import { PublicGameState } from '@/game/types';
import { AutopilotDecision } from '@/game/autopilot/types';

interface UseAutopilotLoopParams {
  isAutopilotEnabled: boolean;
  isAutopilotExecuting: boolean;
  loading: boolean;
  publicState: PublicGameState | null;
  showScoreTally: boolean;
  showModelBreak: boolean;
  decisions: AutopilotDecision[];
  autopilotSpeed: '1x' | '2x';
  dismissModelBreak: () => void;
  dismissScoreTally: () => void;
  handleExecuteDecision: (decision: AutopilotDecision) => void;
}

export function useAutopilotLoop({
  isAutopilotEnabled,
  isAutopilotExecuting,
  loading,
  publicState,
  showScoreTally,
  showModelBreak,
  decisions,
  autopilotSpeed,
  dismissModelBreak,
  dismissScoreTally,
  handleExecuteDecision,
}: UseAutopilotLoopParams) {
  useEffect(() => {
    if (!isAutopilotEnabled || isAutopilotExecuting || loading || !publicState) return;

    // Auto-dismiss Model Break Climax Burst Overlay
    if (showModelBreak) {
      const timer = setTimeout(() => {
        dismissModelBreak();
      }, autopilotSpeed === '2x' ? 800 : 1500);
      return () => clearTimeout(timer);
    }

    // Auto-dismiss Score Tally
    if (showScoreTally) {
      const timer = setTimeout(() => {
        dismissScoreTally();
      }, autopilotSpeed === '2x' ? 800 : 1600);
      return () => clearTimeout(timer);
    }

    // Auto-play or auto-shop
    if (publicState.phase === 'PLAYER_TURN' || publicState.phase === 'SHOP') {
      if (decisions.length > 0) {
        const topDecision = decisions[0];
        const timer = setTimeout(() => {
          handleExecuteDecision(topDecision);
        }, autopilotSpeed === '2x' ? 350 : 800);
        return () => clearTimeout(timer);
      }
    }
  }, [
    isAutopilotEnabled,
    isAutopilotExecuting,
    loading,
    publicState,
    showScoreTally,
    showModelBreak,
    decisions,
    autopilotSpeed,
    dismissModelBreak,
    dismissScoreTally,
    handleExecuteDecision,
  ]);
}
