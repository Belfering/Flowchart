/**
 * useSyncSettings Hook
 *
 * Manages batch download configuration settings (batch size, pause intervals).
 * Provides memoized state and update functionality with change tracking.
 *
 * @example
 * ```tsx
 * const { batchSize, yfinancePause, tiingoPause, setBatchSize, setYfinancePause, setTiingoPause, updateSettings, hasChanges } = useSyncSettings();
 * ```
 */

import { useState, useCallback, useMemo } from 'react';
import { api } from '@/lib/api';

export interface UseSyncSettingsReturn {
  batchSize: number;
  yfinancePause: number;
  tiingoPause: number;
  setBatchSize: (size: number) => void;
  setYfinancePause: (pause: number) => void;
  setTiingoPause: (pause: number) => void;
  updateSettings: () => Promise<void>;
  hasChanges: boolean;
  loading: boolean;
  error: string | null;
}

// Default settings
const DEFAULT_BATCH_SIZE = 100;
const DEFAULT_YFINANCE_PAUSE = 2;
const DEFAULT_TIINGO_PAUSE = 0.2;

/**
 * Hook for sync settings management
 *
 * Features:
 * - Manages batch download configuration
 * - Tracks unsaved changes
 * - Memoized update function
 * - Loading and error states
 */
export function useSyncSettings(): UseSyncSettingsReturn {
  const [batchSize, setBatchSize] = useState(DEFAULT_BATCH_SIZE);
  const [yfinancePause, setYfinancePause] = useState(DEFAULT_YFINANCE_PAUSE);
  const [tiingoPause, setTiingoPause] = useState(DEFAULT_TIINGO_PAUSE);
  const [savedBatchSize, setSavedBatchSize] = useState(DEFAULT_BATCH_SIZE);
  const [savedYfinancePause, setSavedYfinancePause] = useState(DEFAULT_YFINANCE_PAUSE);
  const [savedTiingoPause, setSavedTiingoPause] = useState(DEFAULT_TIINGO_PAUSE);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if there are unsaved changes
  const hasChanges = useMemo(() => {
    return (
      batchSize !== savedBatchSize ||
      yfinancePause !== savedYfinancePause ||
      tiingoPause !== savedTiingoPause
    );
  }, [batchSize, yfinancePause, tiingoPause, savedBatchSize, savedYfinancePause, savedTiingoPause]);

  // Update settings on server
  const updateSettings = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      await api.data.updateSyncSettings({
        batchSize,
        yfinancePause,
        tiingoPause,
      });

      // Update saved values
      setSavedBatchSize(batchSize);
      setSavedYfinancePause(yfinancePause);
      setSavedTiingoPause(tiingoPause);
    } catch (err) {
      console.error('Failed to update sync settings:', err);
      setError(err instanceof Error ? err.message : 'Failed to update settings');
    } finally {
      setLoading(false);
    }
  }, [batchSize, yfinancePause, tiingoPause]);

  return {
    batchSize,
    yfinancePause,
    tiingoPause,
    setBatchSize,
    setYfinancePause,
    setTiingoPause,
    updateSettings,
    hasChanges,
    loading,
    error,
  };
}
