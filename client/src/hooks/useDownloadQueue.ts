/**
 * useDownloadQueue Hook
 *
 * Manages download queue display - shows which tickers will be downloaded
 * based on current sync settings (fillGaps mode vs full download).
 */

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';

export interface QueuedTicker {
  ticker: string;
  name?: string;
  assetType?: string;
  isActive: boolean;
}

export interface UseDownloadQueueReturn {
  queuedTickers: QueuedTicker[];
  loading: boolean;
  error: string | null;
  loadQueue: (fillGaps: boolean) => Promise<void>;
  refresh: () => Promise<void>;
}

/**
 * Hook for download queue management
 *
 * Features:
 * - Load queue based on fillGaps mode
 * - Refresh queue when settings change
 * - Error handling and loading states
 */
export function useDownloadQueue(fillGaps: boolean = false): UseDownloadQueueReturn {
  const [queuedTickers, setQueuedTickers] = useState<QueuedTicker[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadQueue = useCallback(async (fillGapsMode: boolean) => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.data.getQueue(fillGapsMode);
      setQueuedTickers(response.tickers || []);
    } catch (err) {
      console.error('Failed to load download queue:', err);
      setError(err instanceof Error ? err.message : 'Failed to load queue');
      setQueuedTickers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    await loadQueue(fillGaps);
  }, [fillGaps, loadQueue]);

  // Load queue when fillGaps changes
  useEffect(() => {
    loadQueue(fillGaps);
  }, [fillGaps, loadQueue]);

  return {
    queuedTickers,
    loading,
    error,
    loadQueue,
    refresh,
  };
}
