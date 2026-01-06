/**
 * useTickerRegistry Hook
 *
 * Manages ticker registry state including stats, missing tickers, and sync operations.
 * Provides methods to sync Tiingo registry and view missing/available tickers.
 *
 * @example
 * ```tsx
 * const { stats, missing, syncRegistry, loading } = useTickerRegistry();
 * ```
 */

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import type { RegistryStats, MissingTickersResponse } from '@/types';

export interface UseTickerRegistryReturn {
  stats: RegistryStats | null;
  missing: MissingTickersResponse | null;
  loading: boolean;
  syncing: boolean;
  error: string | null;
  loadStats: () => Promise<void>;
  loadMissing: () => Promise<void>;
  syncRegistry: () => Promise<void>;
  refresh: () => Promise<void>;
}

/**
 * Hook for ticker registry management
 *
 * Features:
 * - Loads registry statistics on mount
 * - Syncs Tiingo ticker registry
 * - Calculates missing tickers
 * - Memoized refresh function
 */
export function useTickerRegistry(): UseTickerRegistryReturn {
  const [stats, setStats] = useState<RegistryStats | null>(null);
  const [missing, setMissing] = useState<MissingTickersResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load registry statistics
  const loadStats = useCallback(async () => {
    try {
      const data = await api.data.getRegistryStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to load registry stats:', err);
      setError(err instanceof Error ? err.message : 'Failed to load registry stats');
    }
  }, []);

  // Load missing tickers
  const loadMissing = useCallback(async () => {
    try {
      const data = await api.data.getMissingTickers();
      setMissing(data);
    } catch (err) {
      console.error('Failed to load missing tickers:', err);
      setError(err instanceof Error ? err.message : 'Failed to load missing tickers');
    }
  }, []);

  // Sync Tiingo registry
  const syncRegistry = useCallback(async () => {
    setSyncing(true);
    setError(null);

    try {
      const result = await api.data.syncRegistry();

      if (!result.success) {
        throw new Error(result.error || 'Failed to sync registry');
      }

      // Reload stats and missing after sync
      await loadStats();
      await loadMissing();
    } catch (err) {
      console.error('Failed to sync registry:', err);
      setError(err instanceof Error ? err.message : 'Failed to sync registry');
    } finally {
      setSyncing(false);
    }
  }, [loadStats, loadMissing]);

  // Refresh both stats and missing
  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      await Promise.all([loadStats(), loadMissing()]);
    } catch (err) {
      console.error('Failed to refresh registry data:', err);
      setError(err instanceof Error ? err.message : 'Failed to refresh');
    } finally {
      setLoading(false);
    }
  }, [loadStats, loadMissing]);

  // Load initial data on mount
  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    stats,
    missing,
    loading,
    syncing,
    error,
    loadStats,
    loadMissing,
    syncRegistry,
    refresh,
  };
}
