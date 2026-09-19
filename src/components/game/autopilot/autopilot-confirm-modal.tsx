'use client';

import React, { useEffect } from 'react';
import { useLanguageStore } from '@/store/language-store';
import { audioManager } from '@/lib/audio/audio-manager';

export interface AutopilotConfirmModalProps {
  isOpen: boolean;
  onConfirm: (enableAutopilot: boolean) => void | Promise<void>;
  onClose: () => void;
  isLoading?: boolean;
}

export function AutopilotConfirmModal({
  isOpen,
  onConfirm,
  onClose,
  isLoading = false,
}: AutopilotConfirmModalProps) {
  const { t } = useLanguageStore();

  useEffect(() => {
    if (!isOpen) return;
    audioManager.playSfx('modalOpen');
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isLoading) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, isLoading]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150 select-none"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isLoading) {
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
            <span className="text-lg animate-pulse">🤖</span>
            <div className="flex flex-col">
              <span className="retro text-xs font-black tracking-wider text-emerald-400">
                {t.autopilot.confirmTitle}
              </span>
              <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest">
                [AUTONOMOUS CO-PILOT]
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isLoading}
            aria-label={t.autopilot.cancel}
            className="w-7 h-7 flex items-center justify-center border border-zinc-700 bg-zinc-900 hover:border-emerald-400 hover:text-emerald-400 text-zinc-400 text-xs retro transition-colors disabled:opacity-50"
          >
            ✕
          </button>
        </div>

        {/* Question & Description */}
        <div className="flex flex-col gap-2">
          <h3 className="retro text-sm sm:text-base font-black text-white leading-snug">
            {t.autopilot.confirmPrompt}
          </h3>
          <p className="text-xs text-zinc-300 leading-relaxed font-mono">
            {t.autopilot.confirmDesc}
          </p>
        </div>

        {/* Highlighted Feature Points */}
        <div className="bg-zinc-900/80 border border-emerald-500/20 p-2.5 flex flex-col gap-1.5 text-[11px] font-mono text-zinc-300">
          <div className="flex items-start gap-2">
            <span className="text-emerald-400 shrink-0">⚡</span>
            <span>{t.autopilot.featureAutoPlay}</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-purple-400 shrink-0">🃏</span>
            <span>{t.autopilot.featureAutoShop}</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-cyan-400 shrink-0">🕹️</span>
            <span>{t.autopilot.featureSeamless}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2 pt-1">
          <button
            type="button"
            disabled={isLoading}
            onClick={() => onConfirm(true)}
            className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] border border-emerald-400 text-black font-black text-xs retro shadow-[0_0_15px_rgba(16,185,129,0.35)] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
          >
            {isLoading ? (
              <span className="animate-pulse">{t.autopilot.starting}</span>
            ) : (
              <span>{t.autopilot.enableOption}</span>
            )}
          </button>

          <button
            type="button"
            disabled={isLoading}
            onClick={() => onConfirm(false)}
            className="w-full py-2 px-4 bg-zinc-900 hover:bg-zinc-800 active:scale-[0.98] border border-zinc-700 hover:border-zinc-500 text-zinc-200 font-bold text-xs retro transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
          >
            <span>{t.autopilot.manualOption}</span>
          </button>
        </div>

        {/* Subtle Cancel Button */}
        <div className="flex justify-center pt-0.5">
          <button
            type="button"
            disabled={isLoading}
            onClick={onClose}
            className="text-[10px] text-zinc-500 hover:text-zinc-300 retro uppercase tracking-wider transition-colors disabled:opacity-50"
          >
            {t.autopilot.cancel}
          </button>
        </div>
      </div>
    </div>
  );
}
