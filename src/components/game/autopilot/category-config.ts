import { DecisionCategory } from '@/game/autopilot/types';
import { TranslationDictionary } from '@/lib/i18n/translations';

export function getCategoryBadge(cat: DecisionCategory, t: TranslationDictionary) {
  switch (cat) {
    case 'BEST':
      return {
        label: t.autopilot.categories.BEST,
        className: 'bg-emerald-950 text-emerald-300 border-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]',
        barColor: 'bg-emerald-400',
      };
    case 'BLUFF':
      return {
        label: t.autopilot.categories.BLUFF,
        className: 'bg-red-950 text-red-300 border-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)] animate-pulse',
        barColor: 'bg-red-500',
      };
    case 'SAFE':
      return {
        label: t.autopilot.categories.SAFE,
        className: 'bg-cyan-950 text-cyan-300 border-cyan-500',
        barColor: 'bg-cyan-400',
      };
    case 'SYNERGY':
      return {
        label: t.autopilot.categories.SYNERGY,
        className: 'bg-purple-950 text-purple-300 border-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.3)]',
        barColor: 'bg-purple-400',
      };
    case 'GREED':
      return {
        label: t.autopilot.categories.GREED,
        className: 'bg-yellow-950 text-yellow-300 border-yellow-500',
        barColor: 'bg-yellow-400',
      };
    default:
      return {
        label: 'ACTION',
        className: 'bg-zinc-900 text-zinc-300 border-zinc-700',
        barColor: 'bg-zinc-400',
      };
  }
}
