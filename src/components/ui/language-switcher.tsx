'use client';

import React from 'react';
import { useLanguageStore } from '@/store/language-store';

interface LanguageSwitcherProps {
  className?: string;
}

export function LanguageSwitcher({ className = '' }: LanguageSwitcherProps) {
  const { language, toggleLanguage } = useLanguageStore();

  return (
    <button
      onClick={toggleLanguage}
      className={`px-2.5 py-1.5 retro text-xs font-bold border-2 border-zinc-600 bg-zinc-950 text-zinc-300 hover:border-emerald-400 hover:text-emerald-300 shadow-[2px_2px_0px_#000] active:translate-y-0.5 transition-all inline-flex items-center justify-center gap-1.5 cursor-pointer z-50 leading-none ${className}`}
      title="Toggle Language / 切换语言"
    >
      <span className="text-xs leading-none inline-flex items-center">🌐</span>
      <span className="leading-none inline-flex items-center">{language === 'zh' ? 'EN' : '中文'}</span>
    </button>
  );
}
