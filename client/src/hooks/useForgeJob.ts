/**
 * useForgeJob Hook
 *
 * Manages Forge job lifecycle including start, cancel, and restoration.
 * Handles localStorage persistence for active job state across tab switches.
 *
 * @example
 * ```tsx
 * const { jobId, running, startTime, startJob, cancelJob } = useForgeJob();
 * ```
 */

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import type { ForgeConfig } from '@/types';
import { useForgeJobPersistence } from './useForgeJobPersistence';

export interface UseForgeJobReturn {
  jobId: number | null;
  running: boolean;
  startTime: number | null;
  startJob: (config: ForgeConfig) => Promise<void>;
  cancelJob: () => Promise<void>;
  completeJob: () => void;
}

/**
 * Hook for managing Forge job lifecycle
 *
 * Features:
 * - Starts new jobs with API call
 * - Cancels running jobs
 * - Restores active job on mount (from localStorage)
 * - Saves active job to localStorage
 * - Clears localStorage when job completes
 * - Memoized start/cancel functions
 */
export function useForgeJob(): UseForgeJobReturn {
  const [jobId, setJobId] = useState<number | null>(null);
  const [running, setRunning] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);

  const { saveActiveJob, clearActiveJob, restoreActiveJob } = useForgeJobPersistence();

  // Restore active job on mount
  useEffect(() => {
    const restored = restoreActiveJob();
    if (restored) {
      setJobId(restored.jobId);
      setStartTime(restored.startTime);
      setRunning(true);
    }
  }, [restoreActiveJob]);

  // Start a new job
  const startJob = useCallback(
    async (config: ForgeConfig) => {
      try {
        const response = await api.forge.start(config);
        const newJobId = response.jobId;
        const now = Date.now();

        setJobId(newJobId);
        setStartTime(now);
        setRunning(true);

        // Save to localStorage
        saveActiveJob(newJobId, now);
      } catch (error) {
        console.error('Failed to start job:', error);
        throw error;
      }
    },
    [saveActiveJob]
  );

  // Cancel the current job
  const cancelJob = useCallback(async () => {
    if (!jobId) return;

    try {
      await api.forge.cancel(jobId);

      // Clear state
      setJobId(null);
      setStartTime(null);
      setRunning(false);

      // Clear localStorage
      clearActiveJob();
    } catch (error) {
      console.error('Failed to cancel job:', error);
      throw error;
    }
  }, [jobId, clearActiveJob]);

  // Mark job as completed (called when status shows completed)
  const completeJob = useCallback(() => {
    setRunning(false);
    clearActiveJob();
  }, [clearActiveJob]);

  return {
    jobId,
    running,
    startTime,
    startJob,
    cancelJob,
    completeJob,
  };
}
