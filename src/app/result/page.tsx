'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/store/game-store';
import { ResultCard } from '@/components/game/result-card';
import { LanguageSwitcher } from '@/components/ui/language-switcher';

export default function ResultPage() {
  const router = useRouter();
  const { publicState, startGame } = useGameStore();

  const handlePlayAgain = async () => {
    await startGame();
    router.push('/game');
  };

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-3 relative overflow-x-hidden">
      <div className="crt-screen absolute inset-0 pointer-events-none" />

      {/* Language Switcher in upper right */}
      <div className="absolute top-3 right-3 z-50">
        <LanguageSwitcher />
      </div>

      <div className="w-full max-w-[430px] pt-8">
        <ResultCard
          state={publicState}
          onPlayAgain={handlePlayAgain}
        />
      </div>
    </main>
  );
}
