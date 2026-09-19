'use client';

import React from 'react';
import { BuffInstance } from '@/game/types';
import { BuffCard } from './buff-card';
import { useLanguageStore } from '@/store/language-store';

interface BuffSelectionProps {
  availableBuffs: BuffInstance[];
  onSelectBuff: (buff: BuffInstance) => void;
  loading?: boolean;
}

export function BuffSelection({
  availableBuffs,
  onSelectBuff,
  loading = false,
}: BuffSelectionProps) {
  const { t } = useLanguageStore();

  if (availableBuffs.length === 0) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-[390px] border-4 border-emerald-500 bg-zinc-950 p-4 flex flex-col gap-3.5 shadow-[0_0_25px_rgba(16,185,129,0.3)] animate-in fade-in zoom-in-95 duration-200">
        <div className="text-center space-y-1 border-b border-zinc-800 pb-2">
          <div className="retro text-xs font-bold text-emerald-400 tracking-wider">
            {t.buffs.title}
          </div>
          <div className="retro text-[8px] text-zinc-400">
            {t.buffs.subtitle}
          </div>
        </div>

        <div className="flex flex-col gap-3 max-h-[70vh] overflow-y-auto pr-0.5">
          {availableBuffs.map(buff => (
            <BuffCard
              key={buff.id}
              buff={buff}
              onSelect={onSelectBuff}
              disabled={loading}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
