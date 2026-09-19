'use client';

import React, { useEffect, useState } from 'react';
import { signIn } from 'next-auth/react';
import { useLanguageStore } from '@/store/language-store';
import { audioManager } from '@/lib/audio/audio-manager';

export interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  reason?: string;
}

export function AuthModal({ isOpen, onClose, reason }: AuthModalProps) {
  const { t } = useLanguageStore();
  const authT = (t as unknown as { auth?: Record<string, string> }).auth;
  const [loadingProvider, setLoadingProvider] = useState<'google' | 'github' | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    audioManager.playSfx('modalOpen');
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !loadingProvider) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, loadingProvider]);

  if (!isOpen) return null;

  const handleSignIn = async (provider: 'google' | 'github') => {
    setLoadingProvider(provider);
    try {
      await signIn(provider, { callbackUrl: window.location.href });
    } catch (err) {
      console.error('Sign in error:', err);
      setLoadingProvider(null);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150 select-none"
      onClick={(e) => {
        if (e.target === e.currentTarget && !loadingProvider) {
          onClose();
        }
      }}
    >
      <div className="w-full max-w-[420px] bg-zinc-950 border-2 border-emerald-500/80 shadow-[0_0_30px_rgba(16,185,129,0.3)] relative my-auto p-5 text-white flex flex-col gap-4 overflow-hidden">
        {/* Retro CRT Scanline Effect */}
        <div className="crt-screen absolute inset-0 pointer-events-none opacity-40" />

        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-emerald-500/30 pb-2.5">
          <div className="flex items-center gap-2">
            <span className="text-lg animate-pulse">🔑</span>
            <div className="flex flex-col">
              <span className="retro text-xs font-black tracking-wider text-emerald-400">
                {authT?.modalTitle || 'IDENTITY TERMINAL'}
              </span>
              <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest">
                [SECURE CLOUD SYNC]
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={!!loadingProvider}
            className="text-zinc-500 hover:text-zinc-200 retro text-xs px-2 py-1 hover:bg-zinc-800 disabled:opacity-50 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Reason Alert if present */}
        {reason && (
          <div className="p-2 border border-yellow-500/80 bg-yellow-950/40 text-yellow-300 retro text-[10px] leading-tight">
            ★ {reason}
          </div>
        )}

        {/* Description */}
        <p className="retro text-[11px] text-zinc-300 leading-relaxed">
          {authT?.modalDescription || 'Connect your identity to persist game records and leaderboard metrics to the cloud database.'}
        </p>

        {/* Provider Buttons */}
        <div className="flex flex-col gap-3 my-2">
          {/* Google Button */}
          <button
            onClick={() => handleSignIn('google')}
            disabled={!!loadingProvider}
            className="flex items-center justify-center gap-3 w-full py-2.5 px-4 bg-zinc-900 border-2 border-zinc-700 hover:border-emerald-400 hover:bg-zinc-850 active:scale-[0.98] transition-all disabled:opacity-50 group"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#EA4335"
                d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z"
              />
              <path
                fill="#4285F4"
                d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z"
              />
              <path
                fill="#FBBC05"
                d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.8 0-1.3.2-2.1.4-2.8L1.9 6.3C.7 8.7 0 10.3 0 12s.7 3.3 1.9 5.7l3.7-2.9z"
              />
              <path
                fill="#34A853"
                d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.2L1.9 16c1.8 3.7 5.6 7 10.1 7z"
              />
            </svg>
            <span className="retro text-xs font-bold text-zinc-200 group-hover:text-emerald-300">
              {loadingProvider === 'google'
                ? (authT?.loggingIn || 'CONNECTING...')
                : (authT?.loginGoogle || 'LOGIN WITH GOOGLE')}
            </span>
          </button>

          {/* GitHub Button */}
          <button
            onClick={() => handleSignIn('github')}
            disabled={!!loadingProvider}
            className="flex items-center justify-center gap-3 w-full py-2.5 px-4 bg-zinc-900 border-2 border-zinc-700 hover:border-emerald-400 hover:bg-zinc-850 active:scale-[0.98] transition-all disabled:opacity-50 group"
          >
            <svg className="w-4 h-4 fill-white shrink-0" viewBox="0 0 24 24">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
            </svg>
            <span className="retro text-xs font-bold text-zinc-200 group-hover:text-emerald-300">
              {loadingProvider === 'github'
                ? (authT?.loggingIn || 'CONNECTING...')
                : (authT?.loginGithub || 'LOGIN WITH GITHUB')}
            </span>
          </button>
        </div>

        {/* Footer Note */}
        <div className="border-t border-zinc-800 pt-2.5 flex items-center justify-between text-[9px] font-mono text-zinc-500">
          <span>🔒 ENCRYPTED SESSION</span>
          <span>POSTGRESQL / SERVERLESS</span>
        </div>
      </div>
    </div>
  );
}
