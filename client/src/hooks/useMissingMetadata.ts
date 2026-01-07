/**
 * useMissingMetadata Hook
 *
 * Manages tickers with missing metadata (no name or description).
 * Provides enrichment functionality via Tiingo API.
 */

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';

export interface TickerWithMissingMetadata {
  ticker: string;
  name?: string;
  description?: string;
  assetType?: string;
  exchange?: string;
}

export interface UseMissingMetadataReturn {
  missingMetadata: TickerWithMissingMetadata[];
  loading: boolean;
  error: string | null;
  enriching: boolean;
  enrichError: string | null;
  loadMissing: () => Promise<void>;
  enrichAll: () => Promise<void>;
  refresh: () => Promise<void>;
}

export function useMissingMetadata(): UseMissingMetadataReturn {
  const [missingMetadata, setMissingMetadata] = useState<TickerWithMissingMetadata[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enriching, setEnriching] = useState(false);
  const [enrichError, setEnrichError] = useState<string | null>(null);

  const loadMissing = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.data.getMissingMetadata();
      setMissingMetadata(response.tickers || []);
    } catch (err) {
      console.error('Failed to load missing metadata:', err);
      setError(err instanceof Error ? err.message : 'Failed to load missing metadata');
      setMissingMetadata([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const enrichAll = useCallback(async () => {
    if (missingMetadata.length === 0) return;

    setEnriching(true);
    setEnrichError(null);

    try {
      const tickers = missingMetadata.map(t => t.ticker);
      const response = await api.data.enrichMetadata(tickers);

      if (response.success) {
        // Reload missing metadata to see updated list
        await loadMissing();
      } else {
        setEnrichError(`Enriched ${response.enrichedCount}/${response.totalRequested} tickers`);
      }
    } catch (err) {
      console.error('Failed to enrich metadata:', err);
      setEnrichError(err instanceof Error ? err.message : 'Failed to enrich metadata');
    } finally {
      setEnriching(false);
    }
  }, [missingMetadata, loadMissing]);

  const refresh = useCallback(async () => {
    await loadMissing();
  }, [loadMissing]);

  // Load on mount
  useEffect(() => {
    loadMissing();
  }, [loadMissing]);

  return {
    missingMetadata,
    loading,
    error,
    enriching,
    enrichError,
    loadMissing,
    enrichAll,
    refresh,
  };
}
