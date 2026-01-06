/**
 * useDataDownloadManager Hook
 *
 * Orchestrates data download management including parquet tickers,
 * sync schedule, polling logic, and download operations.
 * This is the main hook that coordinates all data management functionality.
 *
 * @example
 * ```tsx
 * const { parquetTickers, syncSchedule, loading, error, loadAllData, loadSyncStatus, startYFinanceDownload, startTiingoDownload, stopDownload } = useDataDownloadManager(activeTab);
 * ```
 */

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import type { SyncSchedule } from '@/types';

export interface UseDataDownloadManagerReturn {
  parquetTickers: string[];
  syncSchedule: SyncSchedule | null;
  loading: boolean;
  error: string | null;
  loadAllData: () => Promise<void>;
  loadSyncStatus: () => Promise<void>;
  startYFinanceDownload: (fillGaps?: boolean) => Promise<void>;
  startTiingoDownload: () => Promise<void>;
  stopDownload: () => Promise<void>;
}

/**
 * Hook for data download management
 *
 * Features:
 * - Loads parquet tickers and sync status on mount
 * - Polls sync status every 2 seconds when download is running
 * - Manages download operations (start/stop)
 * - Memoized callback functions
 * - FIXES dependency array bug by including activeTab
 */
export function useDataDownloadManager(activeTab: string): UseDataDownloadManagerReturn {
  const [parquetTickers, setParquetTickers] = useState<string[]>([]);
  const [syncSchedule, setSyncSchedule] = useState<SyncSchedule | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load parquet tickers from API
  const loadParquetTickers = useCallback(async () => {
    try {
      const response = await api.data.getTickers();
      const tickerList = response?.tickers || [];
      setParquetTickers(Array.isArray(tickerList) ? tickerList : []);
    } catch (err) {
      console.error('Failed to load parquet tickers:', err);
      setParquetTickers([]);
    }
  }, []);

  // Load sync status from API
  const loadSyncStatus = useCallback(async () => {
    try {
      const status = await api.data.getSyncStatus();
      setSyncSchedule(status || null);
    } catch (err) {
      console.error('Failed to load sync status:', err);
      setSyncSchedule(null);
    }
  }, []);

  // Load all data (tickers + sync status)
  const loadAllData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      await Promise.all([
        loadParquetTickers(),
        loadSyncStatus(),
      ]);
    } catch (err) {
      console.error('Failed to load data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [loadParquetTickers, loadSyncStatus]);

  // Start yFinance download
  const startYFinanceDownload = useCallback(async (fillGaps: boolean = false) => {
    setError(null);

    try {
      await api.data.startYFinanceDownload(fillGaps);
      await loadSyncStatus();
    } catch (err) {
      console.error('Failed to start yFinance download:', err);
      setError(err instanceof Error ? err.message : 'Failed to start download');
    }
  }, [loadSyncStatus]);

  // Start Tiingo download
  const startTiingoDownload = useCallback(async () => {
    setError(null);

    try {
      await api.data.startTiingoDownload();
      await loadSyncStatus();
    } catch (err) {
      console.error('Failed to start Tiingo download:', err);
      setError(err instanceof Error ? err.message : 'Failed to start download');
    }
  }, [loadSyncStatus]);

  // Stop download
  const stopDownload = useCallback(async () => {
    setError(null);

    try {
      await api.data.stopDownload();
      await loadSyncStatus();
    } catch (err) {
      console.error('Failed to stop download:', err);
      setError(err instanceof Error ? err.message : 'Failed to stop download');
    }
  }, [loadSyncStatus]);

  // Load data on mount
  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Polling effect for sync status (FIXED: includes activeTab in dependencies)
  useEffect(() => {
    const isRunning = syncSchedule?.status?.isRunning;

    // Only poll if on downloads tab and download is running
    if (activeTab === 'downloads' && isRunning) {
      const interval = setInterval(() => {
        loadSyncStatus();
      }, 2000);

      return () => clearInterval(interval);
    }
  }, [activeTab, syncSchedule?.status?.isRunning, loadSyncStatus]); // FIXED: activeTab now in deps

  return {
    parquetTickers,
    syncSchedule,
    loading,
    error,
    loadAllData,
    loadSyncStatus,
    startYFinanceDownload,
    startTiingoDownload,
    stopDownload,
  };
}
