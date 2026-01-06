/**
 * useTiingoKeyManagement Hook
 *
 * Manages Tiingo API key state and operations (save, remove, load status).
 * Provides memoized callback functions and loading/error states.
 *
 * @example
 * ```tsx
 * const { tiingoKey, setTiingoKey, hasKey, loading, error, saveTiingoKey, removeTiingoKey, loadStatus } = useTiingoKeyManagement();
 * ```
 */

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';

export interface UseTiingoKeyManagementReturn {
  tiingoKey: string;
  setTiingoKey: (key: string) => void;
  hasKey: boolean;
  loading: boolean;
  error: string | null;
  saveTiingoKey: () => Promise<void>;
  removeTiingoKey: () => Promise<void>;
  loadStatus: () => Promise<void>;
}

/**
 * Hook for Tiingo API key management
 *
 * Features:
 * - Load key status on mount
 * - Save/remove key operations
 * - Loading and error states
 * - Memoized callback functions
 */
export function useTiingoKeyManagement(): UseTiingoKeyManagementReturn {
  const [tiingoKey, setTiingoKey] = useState('');
  const [hasKey, setHasKey] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load Tiingo key status from API
  const loadStatus = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.data.getTiingoKeyStatus();
      setHasKey(response?.hasKey || false);
    } catch (err) {
      console.error('Failed to load Tiingo key status:', err);
      setError(err instanceof Error ? err.message : 'Failed to load key status');
      setHasKey(false);
    } finally {
      setLoading(false);
    }
  }, []);

  // Save Tiingo API key
  const saveTiingoKey = useCallback(async () => {
    if (!tiingoKey.trim()) {
      setError('API key cannot be empty');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await api.data.saveTiingoKey(tiingoKey);
      setHasKey(true);
      setTiingoKey(''); // Clear input after saving
    } catch (err) {
      console.error('Failed to save Tiingo key:', err);
      setError(err instanceof Error ? err.message : 'Failed to save API key');
    } finally {
      setLoading(false);
    }
  }, [tiingoKey]);

  // Remove Tiingo API key
  const removeTiingoKey = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      await api.data.removeTiingoKey();
      setHasKey(false);
      setTiingoKey('');
    } catch (err) {
      console.error('Failed to remove Tiingo key:', err);
      setError(err instanceof Error ? err.message : 'Failed to remove API key');
    } finally {
      setLoading(false);
    }
  }, []);

  // Load status on mount
  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  return {
    tiingoKey,
    setTiingoKey,
    hasKey,
    loading,
    error,
    saveTiingoKey,
    removeTiingoKey,
    loadStatus,
  };
}
