'use client';

import React, { useState } from 'react';
import { GameRunRecord } from '@/lib/history/types';
import { useLanguageStore } from '@/store/language-store';
import { RunsCloudService } from '@/services/runs-cloud-service';
import { ReplayPlayer } from './replay-player';
import { useHistoryRuns } from './use-history-runs';
import { HistoryHeader } from './history-header';
import { HistoryFilterTabs } from './history-filter-tabs';
import { HistoryRunCard } from './history-run-card';

interface HistoryListProps {
  onClose?: () => void;
}

export function HistoryList({ onClose }: HistoryListProps) {
  const { t } = useLanguageStore();
  const [filter, setFilter] = useState<'ALL' | 'VICTORY' | 'DEFEAT'>('ALL');
  const [activeReplayRun, setActiveReplayRun] = useState<GameRunRecord | null>(null);

  const {
    runs,
    loading,
    isSyncing,
    isCloudConnected,
    statusMessage,
    fileInputRef,
    handleDelete,
    handleClearAll,
    handleFileUpload,
    handleSyncToCloud,
  } = useHistoryRuns(t);

  const filteredRuns = runs.filter((r) => {
    if (filter === 'ALL') return true;
    return r.status === filter;
  });

  const handleStartReplay = async (run: GameRunRecord) => {
    if (run.steps && run.steps.length > 0) {
      setActiveReplayRun(run);
      return;
    }
    // Fetch full run steps from cloud if needed
    try {
      const full = await RunsCloudService.fetchCloudRunDetail(run.id);
      setActiveReplayRun(full || run);
    } catch {
      setActiveReplayRun(run);
    }
  };

  return (
    <div className="w-full max-w-[880px] mx-auto p-3 sm:p-4 flex flex-col gap-3 relative select-none">
      {activeReplayRun && (
        <ReplayPlayer
          run={activeReplayRun}
          onClose={() => setActiveReplayRun(null)}
        />
      )}

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept=".json"
        className="hidden"
      />

      <HistoryHeader
        t={t}
        runsCount={runs.length}
        isCloudConnected={isCloudConnected}
        isSyncing={isSyncing}
        onSyncToCloud={handleSyncToCloud}
        onClose={onClose}
        onImportClick={() => fileInputRef.current?.click()}
        onClearAll={handleClearAll}
      />

      {statusMessage && (
        <div className="p-2 border border-emerald-400 bg-emerald-950 text-emerald-300 retro text-xs font-bold text-center animate-in fade-in">
          ★ {statusMessage}
        </div>
      )}

      <HistoryFilterTabs
        t={t}
        runs={runs}
        filter={filter}
        setFilter={setFilter}
      />

      {loading ? (
        <div className="p-8 text-center retro text-xs text-emerald-400 animate-pulse">
          {t.history.loading}
        </div>
      ) : filteredRuns.length === 0 ? (
        <div className="p-8 border border-dashed border-zinc-800 bg-zinc-950/60 text-center flex flex-col items-center gap-2">
          <span className="text-3xl">📭</span>
          <p className="retro text-[10px] text-zinc-400 max-w-[360px]">
            {t.history.empty}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {filteredRuns.map((run) => (
            <HistoryRunCard
              key={run.id}
              run={run}
              t={t}
              onReplay={handleStartReplay}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
