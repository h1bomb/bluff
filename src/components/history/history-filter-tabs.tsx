import { TranslationDictionary } from '@/lib/i18n/translations';
import { GameRunRecord } from '@/lib/history/types';

interface HistoryFilterTabsProps {
  t: TranslationDictionary;
  runs: GameRunRecord[];
  filter: 'ALL' | 'VICTORY' | 'DEFEAT';
  setFilter: (f: 'ALL' | 'VICTORY' | 'DEFEAT') => void;
}

export function HistoryFilterTabs({ t, runs, filter, setFilter }: HistoryFilterTabsProps) {
  const tabs = [
    { key: 'ALL', label: t.history.allRuns, count: runs.length },
    {
      key: 'VICTORY',
      label: t.history.victories,
      count: runs.filter((r) => r.status === 'VICTORY').length,
    },
    {
      key: 'DEFEAT',
      label: t.history.defeats,
      count: runs.filter((r) => r.status === 'DEFEAT').length,
    },
  ] as const;

  return (
    <div className="flex items-center gap-1.5 border-b border-zinc-800 pb-2 text-xs retro">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => setFilter(tab.key)}
          className={`px-2.5 py-1 border text-[9px] font-bold transition-all ${
            filter === tab.key
              ? 'border-emerald-400 bg-emerald-950 text-emerald-300 shadow-[0_0_8px_rgba(16,185,129,0.3)]'
              : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700'
          }`}
        >
          {tab.label} ({tab.count})
        </button>
      ))}
    </div>
  );
}
