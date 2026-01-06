/**
 * useProgressMetrics Hook
 *
 * Calculates progress metrics with proper timer implementation.
 * Fixes the Date.now() performance issue by using setInterval.
 *
 * @example
 * ```tsx
 * const { progress, elapsed, speed, eta } = useProgressMetrics(status, startTime);
 * ```
 */

import { useState, useEffect, useMemo } from 'react';
import type { JobStatus } from '@/types';

export interface UseProgressMetricsReturn {
  progress: number;
  elapsed: number;
  speed: number;
  eta: number;
}

/**
 * Hook for calculating Forge job progress metrics
 *
 * Features:
 * - Memoized progress, speed, and ETA calculations
 * - Timer-based elapsed time (updates every second)
 * - Fixes Date.now() performance bug
 * - Handles null/undefined status gracefully
 */
export function useProgressMetrics(
  status: JobStatus | null,
  startTime: number | null
): UseProgressMetricsReturn {
  const [elapsed, setElapsed] = useState(0);

  // Timer effect for updating elapsed time
  useEffect(() => {
    if (!startTime || !status) {
      setElapsed(0);
      return;
    }

    const calculateElapsed = () => {
      const now = Date.now();
      const elapsedMs = now - startTime;
      return Math.round(elapsedMs / 1000);
    };

    // Set initial elapsed time
    setElapsed(calculateElapsed());

    // Update every second
    const interval = setInterval(() => {
      setElapsed(calculateElapsed());
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime, status]);

  // Calculate progress percentage
  const progress = useMemo(() => {
    if (!status || status.totalBranches === 0) return 0;
    return Math.round((status.completedBranches / status.totalBranches) * 100);
  }, [status?.completedBranches, status?.totalBranches]);

  // Calculate speed (branches per second)
  const speed = useMemo(() => {
    if (!status || elapsed === 0) return 0;
    return Math.round(status.completedBranches / elapsed);
  }, [status?.completedBranches, elapsed]);

  // Calculate ETA (seconds remaining)
  const eta = useMemo(() => {
    if (!status || speed === 0) return 0;
    const remaining = status.totalBranches - status.completedBranches;
    return Math.round(remaining / speed);
  }, [status?.totalBranches, status?.completedBranches, speed]);

  return {
    progress,
    elapsed,
    speed,
    eta,
  };
}
