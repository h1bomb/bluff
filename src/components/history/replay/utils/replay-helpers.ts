import { TranslationDictionary } from '@/lib/i18n/translations';

export function getActionBadge(type: string | undefined, t: TranslationDictionary) {
  switch (type) {
    case 'PLAY_HAND':
      return {
        label: t.historyReplay.stepLabels.PLAY_HAND,
        className: 'border-emerald-400 bg-emerald-950 text-emerald-300 shadow-[0_0_8px_rgba(16,185,129,0.3)]',
      };
    case 'DISCARD':
      return {
        label: t.historyReplay.stepLabels.DISCARD,
        className: 'border-cyan-400 bg-cyan-950 text-cyan-300',
      };
    case 'BUY_ITEM':
      return {
        label: t.historyReplay.stepLabels.SHOP_PURCHASE,
        className: 'border-purple-400 bg-purple-950 text-purple-300 shadow-[0_0_8px_rgba(168,85,247,0.3)]',
      };
    case 'SELL_JOKER':
      return {
        label: t.historyReplay.stepLabels.SELL_JOKER,
        className: 'border-yellow-400 bg-yellow-950 text-yellow-300',
      };
    case 'NEXT_BLIND':
      return {
        label: t.historyReplay.stepLabels.NEXT_BLIND,
        className: 'border-blue-400 bg-blue-950 text-blue-300',
      };
    case 'MODEL_BREAK':
      return {
        label: t.historyReplay.stepLabels.MODEL_BREAK,
        className: 'border-red-500 bg-red-950 text-red-300 animate-pulse',
      };
    case 'RUN_COMPLETE':
      return {
        label: t.historyReplay.stepLabels.VICTORY,
        className: 'border-yellow-400 bg-yellow-950 text-yellow-300 animate-pulse',
      };
    case 'GAME_OVER':
      return {
        label: t.historyReplay.stepLabels.DEFEAT,
        className: 'border-red-500 bg-red-950 text-red-400',
      };
    default:
      return {
        label: t.historyReplay.stepLabels.GAME_INIT,
        className: 'border-zinc-700 bg-zinc-900 text-zinc-300',
      };
  }
}

export function resolveLocalizedText(zh: string | undefined, en: string | undefined, lang: string) {
  return lang === 'zh' ? zh : en;
}
