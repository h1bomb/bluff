import { useEffect } from 'react';
import { PublicGameState } from '@/game/types';

interface UseGameSessionParams {
  publicState: PublicGameState | null;
  loading: boolean;
  latestToast: string | null;
  resumeActiveGame: () => Promise<boolean>;
  startGame: (mode: 'roguelike' | 'classic') => Promise<void>;
  clearLatestToast: () => void;
  updateDecisions: (state: PublicGameState) => void;
}

export function useGameSession({
  publicState,
  loading,
  latestToast,
  resumeActiveGame,
  startGame,
  clearLatestToast,
  updateDecisions,
}: UseGameSessionParams) {
  useEffect(() => {
    // Skip while a startGame is already in flight (e.g. pre-warmed on the
    // title page) — otherwise we'd create a duplicate run.
    if (!publicState && !loading) {
      resumeActiveGame().then((resumed) => {
        if (!resumed) {
          startGame('roguelike');
        }
      });
    }
  }, [publicState, loading, resumeActiveGame, startGame]);

  useEffect(() => {
    if (latestToast) {
      const timer = setTimeout(() => {
        clearLatestToast();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [latestToast, clearLatestToast]);

  useEffect(() => {
    if (publicState) {
      updateDecisions(publicState);
    }
  }, [publicState, updateDecisions]);
}
