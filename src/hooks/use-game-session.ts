import { useEffect } from 'react';
import { PublicGameState } from '@/game/types';

interface UseGameSessionParams {
  publicState: PublicGameState | null;
  latestToast: string | null;
  resumeActiveGame: () => Promise<boolean>;
  startGame: (mode: 'roguelike' | 'classic') => Promise<void>;
  clearLatestToast: () => void;
  updateDecisions: (state: PublicGameState) => void;
}

export function useGameSession({
  publicState,
  latestToast,
  resumeActiveGame,
  startGame,
  clearLatestToast,
  updateDecisions,
}: UseGameSessionParams) {
  useEffect(() => {
    if (!publicState) {
      resumeActiveGame().then((resumed) => {
        if (!resumed) {
          startGame('roguelike');
        }
      });
    }
  }, [publicState, resumeActiveGame, startGame]);

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
