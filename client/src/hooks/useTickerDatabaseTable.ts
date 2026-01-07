/**
 * useTickerDatabaseTable Hook
 *
 * Manages the full ticker database table display.
 * Combines parquet file info with registry metadata.
 */

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';

export interface TickerDatabaseRow {
  ticker: string;
  name: string;
  assetType: string;
  exchange: string;
  isActive: boolean;
  lastSynced: string | null;
  startDate: string;
  endDate: string;
  currency: string;
}

export interface UseTickerDatabaseTableReturn {
  tickers: TickerDatabaseRow[];
  loading: boolean;
  error: string | null;
  total: number;
  withData: number;
  loadDatabase: () => Promise<void>;
  refresh: () => Promise<void>;
}

export function useTickerDatabaseTable(): UseTickerDatabaseTableReturn {
  const [tickers, setTickers] = useState<TickerDatabaseRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [withData, setWithData] = useState(0);

  const loadDatabase = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.data.getDatabase();
      setTickers(response.tickers || []);
      setTotal(response.total || 0);
      setWithData(response.withData || 0);
    } catch (err) {
      console.error('Failed to load ticker database:', err);
      setError(err instanceof Error ? err.message : 'Failed to load database');
      setTickers([]);
      setTotal(0);
      setWithData(0);
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    await loadDatabase();
  }, [loadDatabase]);

  // Load on mount
  useEffect(() => {
    loadDatabase();
  }, [loadDatabase]);

  return {
    tickers,
    loading,
    error,
    total,
    withData,
    loadDatabase,
    refresh,
  };
}
