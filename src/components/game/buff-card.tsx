'use client';

import React from 'react';
import { BuffInstance } from '@/game/types';
import { Button } from '@/components/ui/8bit/button';
import { useLanguageStore } from '@/store/language-store';

interface BuffCardProps {
  buff: BuffInstance;
  onSelect: (buff: BuffInstance) => void;
  disabled?: boolean;
}

export function BuffCard({ buff, onSelect, disabled = false }: BuffCardProps) {
  const { t } = useLanguageStore();

  const buffI18n = t.buffs[buff.id as keyof typeof t.buffs] as {
    name: string;
    tagline: string;
    description: string;
  } | undefined;

  const name = buffI18n?.name || buff.name;
  const tagline = buffI18n?.tagline || buff.tagline;
  const description = buffI18n?.description || buff.description;

  return (
    <div className="w-full border-2 border-emerald-500/80 bg-zinc-950 p-3 select-none shadow-[3px_3px_0px_#064e3b] flex flex-col justify-between gap-2.5 transition-transform hover:-translate-y-1">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{buff.icon}</span>
          <div>
            <div className="retro text-[10px] font-bold text-zinc-100">
              {name}
            </div>
            <div className="retro text-[8px] text-emerald-400">
              {tagline}
            </div>
          </div>
        </div>
      </div>

      <p className="text-[11px] text-zinc-300 font-sans leading-relaxed border-t border-zinc-800 pt-2">
        {description}
      </p>

      <Button
        variant="default"
        size="sm"
        soundEffect="winChime"
        disabled={disabled}
        onClick={() => onSelect(buff)}
        className="w-full h-9 retro text-[9px] font-bold tracking-wider bg-emerald-600 hover:bg-emerald-500 text-black active:scale-95 transition-transform"
      >
        {t.buffs.select}
      </Button>
    </div>
  );
}
