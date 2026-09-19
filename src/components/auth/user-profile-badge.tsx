'use client';

import React, { useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { AuthModal } from './auth-modal';
import { useLanguageStore } from '@/store/language-store';

export function UserProfileBadge() {
  const { data: session, status } = useSession();
  const { t } = useLanguageStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  if (status === 'loading') {
    return (
      <div className="px-2.5 py-1 bg-zinc-950 border border-zinc-800 text-zinc-500 retro text-[10px] animate-pulse">
        ...
      </div>
    );
  }

  if (!session?.user) {
    return (
      <>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 px-2.5 py-1 bg-zinc-900 border border-zinc-700 hover:border-emerald-400 text-zinc-300 hover:text-emerald-300 retro text-[10px] active:scale-95 transition-all"
        >
          <span>🔑</span>
          <span>{t.auth?.loginButton || 'LOGIN'}</span>
        </button>

        <AuthModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      </>
    );
  }

  const displayName = session.user.name || session.user.email?.split('@')[0] || 'Player';
  const avatarUrl = session.user.image;

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu((prev) => !prev)}
        className="flex items-center gap-2 px-2 py-1 bg-zinc-900/90 border border-zinc-700 hover:border-emerald-400 text-zinc-200 retro text-[10px] active:scale-95 transition-all"
      >
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatarUrl}
            alt={displayName}
            className="w-4 h-4 rounded-none border border-emerald-500/80 object-cover"
          />
        ) : (
          <span className="text-xs">👤</span>
        )}
        <span className="max-w-[80px] sm:max-w-[120px] truncate">{displayName}</span>
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" title="Cloud Connected" />
      </button>

      {showMenu && (
        <div
          className="absolute right-0 mt-1 w-44 bg-zinc-950 border-2 border-zinc-700 shadow-xl p-2 z-50 flex flex-col gap-2 animate-in fade-in zoom-in-95"
          onMouseLeave={() => setShowMenu(false)}
        >
          <div className="flex flex-col border-b border-zinc-800 pb-1.5">
            <span className="retro text-[10px] text-zinc-400 uppercase">
              {t.auth?.signedInAs || 'Signed in as'}
            </span>
            <span className="retro text-xs font-bold text-emerald-400 truncate">
              {displayName}
            </span>
            {session.user.email && (
              <span className="text-[9px] font-mono text-zinc-500 truncate">
                {session.user.email}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 text-[9px] text-emerald-400 retro">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>{t.auth?.cloudConnected || 'CLOUD CONNECTED'}</span>
          </div>

          <button
            onClick={() => {
              setShowMenu(false);
              signOut();
            }}
            className="w-full text-left px-2 py-1 bg-zinc-900 hover:bg-rose-950/60 border border-zinc-800 hover:border-rose-500 text-zinc-300 hover:text-rose-300 retro text-[10px] transition-colors"
          >
            🚪 {t.auth?.logout || 'LOGOUT'}
          </button>
        </div>
      )}
    </div>
  );
}
