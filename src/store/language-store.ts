import { create } from 'zustand';
import { Language, TRANSLATIONS } from '@/lib/i18n/translations';

interface LanguageState {
  language: Language;
  t: typeof TRANSLATIONS['zh'];
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  initLanguage: () => void;
}

// Always initialize with default 'zh' matching SSR / static pre-rendering.
// Post-hydration client synchronization is performed safely via initLanguage().
const DEFAULT_LANG: Language = 'zh';

export const useLanguageStore = create<LanguageState>((set, get) => ({
  language: DEFAULT_LANG,
  t: TRANSLATIONS[DEFAULT_LANG],

  setLanguage: (lang: Language) => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('bluff_lang', lang);
      } catch {}
      document.documentElement.lang = lang;
      document.documentElement.setAttribute('data-lang', lang);
    }
    set({
      language: lang,
      t: TRANSLATIONS[lang],
    });
  },

  toggleLanguage: () => {
    const nextLang: Language = get().language === 'zh' ? 'en' : 'zh';
    get().setLanguage(nextLang);
  },

  initLanguage: () => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('bluff_lang') as Language;
        if (saved === 'en' || saved === 'zh') {
          if (saved !== get().language) {
            get().setLanguage(saved);
          }
          return;
        }
      } catch {}
      const browserLang: Language = navigator.language?.toLowerCase().startsWith('zh')
        ? 'zh'
        : 'en';
      if (browserLang !== get().language) {
        get().setLanguage(browserLang);
      }
    }
  },
}));
