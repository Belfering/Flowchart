/**
 * useTickerDatabase Hook
 *
 * Manages ticker selection and data preview functionality.
 * Handles loading ticker lists and displaying preview data for selected tickers.
 *
 * @example
 * ```tsx
 * const { tickers, selected, setSelected, preview, loading, error, loadTickers, loadPreview } = useTickerDatabase();
 * ```
 */

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import type { TickerPreview } from '@/types';

export interface UseTickerDatabaseReturn {
  tickers: string[];
  selected: string | null;
  setSelected: (ticker: string | null) => void;
  preview: TickerPreview[];
  loading: boolean;
  error: string | null;
  loadTickers: () => Promise<void>;
  loadPreview: () => Promise<void>;
}

/**
 * Hook for ticker database management
 *
 * Features:
 * - Loads available tickers on mount
 * - Manages selected ticker state
 * - Automatically loads preview when ticker is selected
 * - Error handling and loading states
 * - Memoized callback functions
 */
export function useTickerDatabase(): UseTickerDatabaseReturn {
  const [tickers, setTickers] = useState<string[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [preview, setPreview] = useState<TickerPreview[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load available tickers from API
  const loadTickers = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.data.getTickers();
      const tickerList = response?.tickers || [];
      setTickers(Array.isArray(tickerList) ? tickerList : []);
    } catch (err) {
      console.error('Failed to load tickers:', err);
      setError(err instanceof Error ? err.message : 'Failed to load tickers');
      setTickers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load preview data for selected ticker
  const loadPreview = useCallback(async () => {
    if (!selected) {
      setPreview([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await api.data.getTickerPreview(selected);
      const previewData = response?.preview || [];
      setPreview(Array.isArray(previewData) ? previewData : []);
    } catch (err) {
      console.error('Failed to load ticker preview:', err);
      setError(err instanceof Error ? err.message : 'Failed to load preview');
      setPreview([]);
    } finally {
      setLoading(false);
    }
  }, [selected]);

  // Load tickers on mount
  useEffect(() => {
    loadTickers();
  }, [loadTickers]);

  // Load preview when selected ticker changes
  useEffect(() => {
    if (selected) {
      loadPreview();
    } else {
      setPreview([]);
      setError(null);
    }
  }, [selected, loadPreview]);

  return {
    tickers,
    selected,
    setSelected,
    preview,
    loading,
    error,
    loadTickers,
    loadPreview,
  };
}
