'use client';

import { useEffect } from 'react';
import { useLanguageStore } from '@/store/language-store';
import { Language } from '@/lib/i18n/translations';

export function LanguageInit() {
  const initLanguage = useLanguageStore((s) => s.initLanguage);
  const setLanguage = useLanguageStore((s) => s.setLanguage);

  useEffect(() => {
    initLanguage();

    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'bluff_lang' && (e.newValue === 'en' || e.newValue === 'zh')) {
        setLanguage(e.newValue as Language);
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [initLanguage, setLanguage]);

  return null;
}
