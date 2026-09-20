'use client';

import React, { useState } from 'react';
import { useAudioStore } from '@/store/audio-store';
import { useLanguageStore } from '@/store/language-store';
import { audioManager } from '@/lib/audio/audio-manager';
import { Volume2, VolumeX, Sliders } from 'lucide-react';

interface SoundToggleProps {
  className?: string;
  showSliders?: boolean;
}

export function SoundToggle({ className = '', showSliders = true }: SoundToggleProps) {
  const { isMuted, masterVolume, sfxVolume, bgmVolume, toggleMute, setMasterVolume, setSfxVolume, setBgmVolume } =
    useAudioStore();
  const { t } = useLanguageStore();
  const [isOpen, setIsOpen] = useState(false);

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleMute();
    if (isMuted) {
      // Unmuting, play a confirmation blip and start BGM
      setTimeout(() => {
        audioManager.playSfx('uiClick');
        audioManager.startBgm();
      }, 50);
    }
  };

  return (
    <div className={`relative inline-flex items-center ${className}`}>
      <button
        type="button"
        onClick={handleToggle}
        title={isMuted ? '取消静音 (Unmute)' : '静音 (Mute)'}
        className={`p-1.5 border transition-all text-xs retro flex items-center gap-1 cursor-pointer select-none ${
          isMuted
            ? 'bg-zinc-900/80 border-red-500/50 text-red-400 hover:border-red-400'
            : 'bg-zinc-950 border-emerald-500/60 text-emerald-400 hover:border-emerald-300 hover:shadow-[0_0_8px_rgba(16,185,129,0.3)]'
        }`}
      >
        {isMuted ? (
          <VolumeX className="w-3.5 h-3.5 text-red-400" />
        ) : (
          <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
        )}
      </button>

      {showSliders && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(!isOpen);
          }}
          title="音频设置 (Audio Settings)"
          className="p-1.5 border-y border-r border-zinc-700 bg-zinc-900/80 text-zinc-400 hover:text-zinc-200 cursor-pointer"
        >
          <Sliders className="w-3 h-3" />
        </button>
      )}

      {/* Retro Audio Settings Popover */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div
            className="absolute right-0 top-full mt-2 w-48 bg-zinc-950/95 border border-zinc-700 p-3 shadow-2xl z-50 flex flex-col gap-2.5 retro text-[10px] text-zinc-300 backdrop-blur"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-zinc-800 pb-1 text-emerald-400 font-bold">
              <span>{t.common.audioControls}</span>
              <button
                onClick={() => setIsOpen(false)}
                className="text-zinc-500 hover:text-zinc-300 px-1"
              >
                ✕
              </button>
            </div>

            {/* Master Volume */}
            <div className="flex flex-col gap-1">
              <div className="flex justify-between text-zinc-400">
                <span>{t.common.master}</span>
                <span className="font-mono">{Math.round(masterVolume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={masterVolume}
                onChange={(e) => setMasterVolume(parseFloat(e.target.value))}
                className="w-full h-1 bg-zinc-800 accent-emerald-400 cursor-pointer"
              />
            </div>

            {/* SFX Volume */}
            <div className="flex flex-col gap-1">
              <div className="flex justify-between text-zinc-400">
                <span>{t.common.sfx}</span>
                <span className="font-mono">{Math.round(sfxVolume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={sfxVolume}
                onChange={(e) => setSfxVolume(parseFloat(e.target.value))}
                className="w-full h-1 bg-zinc-800 accent-emerald-400 cursor-pointer"
              />
            </div>

            {/* BGM Volume */}
            <div className="flex flex-col gap-1">
              <div className="flex justify-between text-zinc-400">
                <span>{t.common.bgm}</span>
                <span className="font-mono">{Math.round(bgmVolume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={bgmVolume}
                onChange={(e) => setBgmVolume(parseFloat(e.target.value))}
                className="w-full h-1 bg-zinc-800 accent-emerald-400 cursor-pointer"
              />
            </div>

            <div className="grid grid-cols-2 gap-1.5 mt-1">
              <button
                onClick={() => {
                  audioManager.playSfx('chipClink');
                }}
                className="py-1 px-1 border border-zinc-700 hover:border-emerald-500 text-zinc-400 hover:text-emerald-300 text-center transition-colors text-[9px]"
              >
                {t.common.testSfx}
              </button>
              <button
                onClick={() => {
                  audioManager.startBgm();
                }}
                className="py-1 px-1 border border-zinc-700 hover:border-emerald-500 text-zinc-400 hover:text-emerald-300 text-center transition-colors text-[9px]"
              >
                {t.common.playBgm}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
