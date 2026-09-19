import { useState, useEffect, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { GameRunRecord } from '@/lib/history/types';
import { TranslationDictionary } from '@/lib/i18n/translations';
import {
  getAllGameRuns,
  deleteGameRun,
  clearAllGameRuns,
  importRunFromJson,
} from '@/lib/history/db';
import { RunsCloudService } from '@/services/runs-cloud-service';

export function useHistoryRuns(t: TranslationDictionary) {
  const { data: session } = useSession();
  const [runs, setRuns] = useState<GameRunRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadRuns = useCallback(async () => {
    setLoading(true);
    try {
      const localRuns = await getAllGameRuns();
      if (session?.user) {
        const cloudRuns = await RunsCloudService.fetchCloudRuns();
        const runMap = new Map<string, GameRunRecord>();
        localRuns.forEach((r) => runMap.set(r.id, r));
        cloudRuns.forEach((r) => runMap.set(r.id, r));

        const merged = Array.from(runMap.values());
        merged.sort((a, b) => b.startTime - a.startTime);
        setRuns(merged);
      } else {
        setRuns(localRuns);
      }
    } catch (err) {
      console.error('Failed to load runs:', err);
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const localRuns = await getAllGameRuns();
        if (session?.user) {
          const cloudRuns = await RunsCloudService.fetchCloudRuns();
          const runMap = new Map<string, GameRunRecord>();
          localRuns.forEach((r) => runMap.set(r.id, r));
          cloudRuns.forEach((r) => runMap.set(r.id, r));
          const merged = Array.from(runMap.values());
          merged.sort((a, b) => b.startTime - a.startTime);
          if (mounted) setRuns(merged);
        } else {
          if (mounted) setRuns(localRuns);
        }
      } catch (err) {
        console.error('Failed to load runs:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [session]);

  const handleDelete = async (runId: string) => {
    await deleteGameRun(runId);
    if (session?.user) {
      await RunsCloudService.deleteCloudRun(runId);
    }
    setRuns((prev) => prev.filter((r) => r.id !== runId));
  };

  const handleClearAll = async () => {
    if (window.confirm(t.history.clearConfirm)) {
      await clearAllGameRuns();
      setRuns([]);
    }
  };

  const handleSyncToCloud = async () => {
    if (!session?.user) return;
    setIsSyncing(true);
    try {
      const localRuns = await getAllGameRuns();
      const count = await RunsCloudService.syncLocalRunsToCloud(localRuns);
      setStatusMessage(t.history?.syncedSuccess || `Successfully synced ${count} runs to cloud database!`);
      await loadRuns();
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err) {
      console.error('Failed to sync to cloud:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string;
        await importRunFromJson(content);
        setStatusMessage(t.history.importedSuccess);
        await loadRuns();
        setTimeout(() => setStatusMessage(null), 3000);
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : t.history.importFailed;
        alert(errorMsg);
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return {
    runs,
    loading,
    isSyncing,
    isCloudConnected: Boolean(session?.user),
    statusMessage,
    fileInputRef,
    handleDelete,
    handleClearAll,
    handleFileUpload,
    handleSyncToCloud,
  };
}
