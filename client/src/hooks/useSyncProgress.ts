/**
 * useSyncProgress Hook
 *
 * Calculates progress metrics from sync schedule state.
 * Provides memoized calculations for progress percentage, elapsed time, rate, and ETA.
 * Uses a timer to update elapsed time every second.
 *
 * @example
 * ```tsx
 * const { currentJob, progress, elapsed, rate, eta } = useSyncProgress(syncSchedule);
 * ```
 */

import { useState, useEffect, useMemo } from 'react';
import type { SyncSchedule, CurrentJob } from '@/types';

export interface UseSyncProgressReturn {
  currentJob: CurrentJob | null;
  progress: number;     // 0-100
  elapsed: number;      // seconds
  rate: number;         // items/sec
  eta: number;          // seconds remaining
}

/**
 * Hook for sync progress calculations
 *
 * Features:
 * - Memoized progress calculations
 * - Timer-based elapsed time updates (every 1 second)
 * - Automatic cleanup on unmount
 * - Handles null/undefined sync schedules
 */
export function useSyncProgress(syncSchedule: SyncSchedule | null): UseSyncProgressReturn {
  const [elapsed, setElapsed] = useState(0);

  const currentJob = syncSchedule?.status?.currentJob || null;

  // Timer effect for updating elapsed time
  useEffect(() => {
    if (!currentJob || !currentJob.startedAt) {
      setElapsed(0);
      return;
    }

    // Initial calculation
    const calculateElapsed = () => {
      const now = Date.now();
      const elapsedMs = now - currentJob.startedAt;
      return Math.round(elapsedMs / 1000);
    };

    setElapsed(calculateElapsed());

    // Update every second
    const interval = setInterval(() => {
      setElapsed(calculateElapsed());
    }, 1000);

    return () => clearInterval(interval);
  }, [currentJob?.startedAt, currentJob]);

  // Memoized progress calculation (0-100)
  const progress = useMemo(() => {
    if (!currentJob || currentJob.tickerCount === 0) {
      return 0;
    }
    return Math.round((currentJob.syncedCount / currentJob.tickerCount) * 100);
  }, [currentJob?.syncedCount, currentJob?.tickerCount]);

  // Memoized rate calculation (items/second)
  const rate = useMemo(() => {
    if (!currentJob || elapsed === 0) {
      return 0;
    }
    return Math.round(currentJob.syncedCount / elapsed);
  }, [currentJob?.syncedCount, elapsed]);

  // Memoized ETA calculation (seconds remaining)
  const eta = useMemo(() => {
    if (!currentJob || rate === 0) {
      return 0;
    }
    const remaining = currentJob.tickerCount - currentJob.syncedCount;
    return Math.round(remaining / rate);
  }, [currentJob?.tickerCount, currentJob?.syncedCount, rate]);

  return {
    currentJob,
    progress,
    elapsed,
    rate,
    eta,
  };
}
