'use client';

import React from 'react';
import Link from 'next/link';
import { HistoryList } from '@/components/history/history-list';
import { LanguageSwitcher } from '@/components/ui/language-switcher';
import { SoundToggle } from '@/components/ui/sound-toggle';
import { UserProfileBadge } from '@/components/auth/user-profile-badge';
import { useLanguageStore } from '@/store/language-store';

export default function HistoryPage() {
  const { t } = useLanguageStore();

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-start p-2 sm:p-4 relative select-none">
      {/* Background CRT scanline */}
      <div className="crt-screen absolute inset-0 pointer-events-none" />

      {/* Top Header Navigation */}
      <div className="w-full max-w-[880px] flex items-center justify-between py-2 mb-2 border-b border-zinc-800 z-10">
        <div className="flex items-center gap-3">
          <Link
            href="/game"
            className="px-2.5 py-1 bg-zinc-900 border border-zinc-700 text-zinc-300 retro text-[10px] hover:border-emerald-400 hover:text-emerald-300 active:scale-95"
          >
            {t.history.backToGame}
          </Link>
          <Link
            href="/"
            className="px-2 py-1 bg-zinc-950 text-zinc-500 retro text-[10px] hover:text-zinc-300"
          >
            🏠 {t.common.home}
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <UserProfileBadge />
          <SoundToggle />
          <LanguageSwitcher />
        </div>
      </div>

      {/* Main History View */}
      <div className="w-full z-10">
        <HistoryList />
      </div>
    </main>
  );
}
