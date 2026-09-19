import enJson from './locales/en.json';
import zhJson from './locales/zh.json';

export type Language = 'en' | 'zh';

/**
 * Universal string interpolation helper.
 * Replaces placeholders like "{variable}" with corresponding values.
 */
export function format(template?: string, params?: Record<string, string | number>): string {
  if (!template) return '';
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    return params[key] !== undefined ? String(params[key]) : match;
  });
}

/**
 * Builds runtime translation dictionary by loading pure JSON locales
 * and attaching typed helper functions for dynamic templates.
 */
function buildTranslationDict(locale: typeof zhJson) {
  return {
    ...locale,
    playControls: {
      ...locale.playControls,
      remainingCount: (count: number) => format(locale.playControls.remainingCount, { count }),
      remainingScore: (needed: number) => format(locale.playControls.remainingScore, { needed }),
    },
    historyReplay: {
      ...locale.historyReplay,
      tableStatus: (cards: number, hands: number, discards: number) =>
        format(locale.historyReplay.tableStatus, { cards, hands, discards }),
    },
    devPlayground: {
      ...locale.devPlayground,
      pastHands: (count: number) => format(locale.devPlayground.pastHands, { count }),
    },
    scoring: {
      ...locale.scoring,
      baseHandMessage: (desc: string, level: number, chips: number, mult: number) =>
        format(locale.scoring.baseHandMessage, { desc, level, chips, mult }),
      cardBonusMessage: (chips: number) => format(locale.scoring.cardBonusMessage, { chips }),
      tellFastMessage: (ms: number) => format(locale.scoring.tellFastMessage, { ms }),
      tellSlowMessage: (ms: number) => format(locale.scoring.tellSlowMessage, { ms }),
      modelBreakMessage: (xMult: number) => format(locale.scoring.modelBreakMessage, { xMult }),
      deceptionBonusMessage: (chips: number) => format(locale.scoring.deceptionBonusMessage, { chips }),
      reverseBaitMessage: (mult: number) => format(locale.scoring.reverseBaitMessage, { mult }),
      totalMessage: (chips: number, mult: number, cog: number, total: number) =>
        format(locale.scoring.totalMessage, { chips, mult, cog, total }),
    },
    shop: {
      ...locale.shop,
      purchasedSuccess: (name: string, cost: number) =>
        format(locale.shop.purchasedSuccess, { name, cost }),
    },
    resultRoguelike: {
      ...locale.resultRoguelike,
      defeatSub: (ante: number, blindName?: string) =>
        format(locale.resultRoguelike.defeatSub, { ante, blindName: blindName ? ` (${blindName})` : '' }),
      finalJokerLineup: (count: number) =>
        format(locale.resultRoguelike.finalJokerLineup, { count }),
    },
  };
}

export const TRANSLATIONS = {
  en: buildTranslationDict(enJson),
  zh: buildTranslationDict(zhJson),
} as const;

export type TranslationDictionary = typeof TRANSLATIONS['zh'];
export { enJson, zhJson };
