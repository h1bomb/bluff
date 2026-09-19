'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Hero3 from '@/components/ui/8bit/blocks/hero3';
import { useGameStore } from '@/store/game-store';
import { useLanguageStore } from '@/store/language-store';
import { useAutopilotStore } from '@/store/autopilot-store';
import { useSession } from 'next-auth/react';
import { LanguageSwitcher } from '@/components/ui/language-switcher';
import { SoundToggle } from '@/components/ui/sound-toggle';
import { UserProfileBadge } from '@/components/auth/user-profile-badge';
import { AuthModal } from '@/components/auth/auth-modal';
import { AutopilotConfirmModal } from '@/components/game/autopilot/autopilot-confirm-modal';
import { getActiveSession } from '@/lib/history/db';
import type { ActiveGameSession } from '@/lib/history/types';

export default function TitlePage() {
  const router = useRouter();
  const { data: session } = useSession();
  const startGame = useGameStore(s => s.startGame);
  const setAutopilot = useAutopilotStore(s => s.setAutopilot);
  const { t } = useLanguageStore();
  const [activeSession, setActiveSession] = useState<ActiveGameSession | null>(null);
  const [pendingAction, setPendingAction] = useState<'new' | 'continue' | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    getActiveSession().then((sessionData) => {
      if (sessionData && sessionData.replayRun?.status === 'IN_PROGRESS') {
        setActiveSession(sessionData);
      }
    });
  }, []);

  const handleActionClick = (action: 'new' | 'continue') => {
    if (!session?.user) {
      setShowAuthModal(true);
      return;
    }
    setPendingAction(action);
  };

  const handleConfirmAutopilot = async (enableAutopilot: boolean) => {
    setAutopilot(enableAutopilot);
    if (pendingAction === 'new') {
      setIsLoading(true);
      try {
        await startGame();
        router.push('/game');
      } finally {
        setIsLoading(false);
        setPendingAction(null);
      }
    } else if (pendingAction === 'continue') {
      setPendingAction(null);
      router.push('/game');
    }
  };

  const actions = activeSession
    ? [
        {
          label: `▶ ${t.title.continueRun} (ANTE ${activeSession.publicState.ante ?? 1})`,
          variant: 'default' as const,
          onClick: () => handleActionClick('continue'),
        },
        {
          label: t.title.newRun,
          variant: 'outline' as const,
          onClick: () => handleActionClick('new'),
        },
        {
          label: t.history.title,
          variant: 'outline' as const,
          onClick: () => router.push('/history'),
        },
      ]
    : [
        {
          label: t.title.startRun,
          variant: 'default' as const,
          onClick: () => handleActionClick('new'),
        },
        {
          label: t.history.title,
          variant: 'outline' as const,
          onClick: () => router.push('/history'),
        },
      ];

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background CRT scanline */}
      <div className="crt-screen absolute inset-0 pointer-events-none" />

      {/* Top Controls: User Profile, Sound & Language Switcher */}
      <div className="absolute top-4 right-4 z-50 flex items-center gap-2">
        <UserProfileBadge />
        <SoundToggle />
        <LanguageSwitcher />
      </div>

      <div className="w-full max-w-[430px] flex flex-col items-center justify-center">
        <Hero3
          title={
            <div className="flex flex-col items-center justify-center gap-2 w-full select-none">
              <span className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-none inline-flex items-center justify-center">
                {t.title.gameTitle}
              </span>
              <span className="text-xs sm:text-sm md:text-base text-emerald-400 font-mono tracking-widest opacity-90 leading-none inline-flex items-center justify-center">
                / {t.title.gameTitleSub} /
              </span>
            </div>
          }
          subtitle={t.title.subtitle}
          description={t.title.description}
          stats={[
            { label: t.title.statHands, value: '5' },
            { label: t.title.statReader, value: '1' },
            { label: t.title.statMercy, value: '0' },
          ]}
          actions={actions}
        />

        {/* Dev tool link at the bottom */}
        <div className="mt-8 flex items-center gap-4 text-[9px] retro text-zinc-600">
          <Link
            href="/dev/jev"
            className="hover:text-emerald-400 underline transition-colors"
          >
            {t.common.devPlayground}
          </Link>
        </div>
      </div>

      <AutopilotConfirmModal
        isOpen={!!pendingAction}
        isLoading={isLoading}
        onConfirm={handleConfirmAutopilot}
        onClose={() => setPendingAction(null)}
      />

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        reason={t.auth?.loginRequiredToPlay || '进入对局前需先进行三方登录，以便持久化记录战局与统计数据。'}
      />
    </main>
  );
}
