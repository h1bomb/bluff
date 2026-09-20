import React from 'react';
import Link from 'next/link';
import { downloadAllRunsAsJson } from '@/lib/history/db';
import { TranslationDictionary } from '@/lib/i18n/translations';

interface HistoryHeaderProps {
  t: TranslationDictionary;
  runsCount: number;
  isCloudConnected?: boolean;
  isSyncing?: boolean;
  onSyncToCloud?: () => void;
  onClose?: () => void;
  onImportClick: () => void;
  onClearAll: () => void;
}

export function HistoryHeader({
  t,
  runsCount,
  isCloudConnected = false,
  isSyncing = false,
  onSyncToCloud,
  onClose,
  onImportClick,
  onClearAll,
}: HistoryHeaderProps) {
  return (
    <div className="border-2 border-emerald-500 bg-zinc-950 p-3 shadow-[3px_3px_0px_#000]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl sm:text-2xl font-black retro text-emerald-400">
              📜 {t.history.title}
            </span>
            {isCloudConnected ? (
              <span className="text-[10px] retro font-bold text-emerald-400 bg-emerald-950 border border-emerald-500 px-2 py-0.5 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {t.history.cloudBadge}
              </span>
            ) : (
              <span className="text-[10px] retro font-bold text-zinc-500 bg-zinc-900 border border-zinc-800 px-2 py-0.5">
                {t.history.localBadge}
              </span>
            )}
          </div>
          <p className="text-[10px] text-zinc-400 font-mono mt-0.5">
            {t.history.subtitle} ({runsCount} {t.history.runsUnit})
          </p>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="px-3 py-1 bg-zinc-900 border border-zinc-700 text-zinc-300 retro text-[9px] hover:text-white active:scale-95 shrink-0"
          >
            ✕
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-zinc-800">
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 bg-emerald-950 border border-emerald-500 text-emerald-300 retro text-[9px] font-bold hover:bg-emerald-900 active:scale-95 shadow-[0_0_8px_rgba(16,185,129,0.2)]"
          >
            {t.history.backToGame}
          </button>
        ) : (
          <Link
            href="/game"
            className="px-3 py-1.5 bg-emerald-950 border border-emerald-500 text-emerald-300 retro text-[9px] font-bold hover:bg-emerald-900 active:scale-95 shadow-[0_0_8px_rgba(16,185,129,0.2)]"
          >
            {t.history.backToGame}
          </Link>
        )}

        <div className="w-px h-5 bg-zinc-800 hidden sm:block" />

        {isCloudConnected && onSyncToCloud && (
          <button
            onClick={onSyncToCloud}
            disabled={isSyncing}
            className="px-2.5 py-1 bg-emerald-950/80 border border-emerald-600 text-emerald-300 hover:bg-emerald-900 retro text-[9px] active:scale-95 disabled:opacity-50 flex items-center gap-1 transition-all"
          >
            <span>☁️</span>
            <span>{isSyncing ? (t.history?.syncing || 'SYNCING...') : (t.history?.cloudSync || 'SYNC TO CLOUD')}</span>
          </button>
        )}

        <button
          onClick={onImportClick}
          className="px-2.5 py-1 bg-zinc-900 border border-zinc-700 text-zinc-200 retro text-[9px] hover:border-emerald-400 active:scale-95"
        >
          ⬆ {t.history.importJson}
        </button>

        {runsCount > 0 && (
          <>
            <button
              onClick={() => downloadAllRunsAsJson()}
              className="px-2.5 py-1 bg-zinc-900 border border-zinc-700 text-yellow-300 retro text-[9px] hover:border-yellow-400 active:scale-95"
            >
              ⬇ {t.history.exportAll}
            </button>
            <button
              onClick={onClearAll}
              className="px-2.5 py-1 bg-zinc-950 border border-red-900 text-red-400 retro text-[9px] hover:border-red-500 active:scale-95"
            >
              🗑 {t.history.clearAll}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
