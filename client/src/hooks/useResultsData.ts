/**
 * useResultsData Hook
 *
 * Manages results data loading with sorting configuration.
 * Loads results for the selected job and provides sorting controls.
 *
 * @example
 * ```tsx
 * const { results, loading, error, sortBy, setSortBy, order, setOrder, refetch } = useResultsData(selectedJobId);
 * ```
 */

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import type { Result } from '@/types';

export interface UseResultsDataReturn {
  results: Result[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  sortBy: string;
  setSortBy: (field: string) => void;
  order: 'asc' | 'desc';
  setOrder: (order: 'asc' | 'desc') => void;
}

/**
 * Hook for loading and managing results data
 *
 * Features:
 * - Loads results when selectedJobId changes
 * - Configurable sorting (field and order)
 * - Loading and error states
 * - Memoized load function
 * - Refetch capability
 */
export function useResultsData(selectedJobId: number | null): UseResultsDataReturn {
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState('isTimar');
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');

  const loadResults = useCallback(async () => {
    if (!selectedJobId) {
      setResults([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await api.results.getResults(selectedJobId, sortBy, order, 1000);
      setResults(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load results:', err);
      setError(err instanceof Error ? err.message : 'Failed to load results');
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [selectedJobId, sortBy, order]);

  // Load results when selectedJobId or sorting changes
  useEffect(() => {
    loadResults();
  }, [loadResults]);

  return {
    results,
    loading,
    error,
    refetch: loadResults,
    sortBy,
    setSortBy,
    order,
    setOrder,
  };
}
