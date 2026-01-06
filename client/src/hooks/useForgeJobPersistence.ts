/**
 * useForgeJobPersistence Hook
 *
 * Abstracts all localStorage operations for Forge jobs and configuration.
 * Provides memoized functions for saving/loading/clearing persisted state.
 *
 * @example
 * ```tsx
 * const { saveActiveJob, clearActiveJob, restoreActiveJob } = useForgeJobPersistence();
 * ```
 */

import { useCallback } from 'react';
import type { ForgeConfig, ActiveJob } from '@/types';

export interface UseForgeJobPersistenceReturn {
  saveActiveJob: (jobId: number, startTime: number) => void;
  clearActiveJob: () => void;
  saveConfig: (config: ForgeConfig) => void;
  restoreConfig: () => ForgeConfig | null;
  restoreActiveJob: () => ActiveJob | null;
}

const STORAGE_KEYS = {
  ACTIVE_JOB: 'forge_active_job',
  CONFIG: 'forge_config',
};

/**
 * Hook for managing localStorage persistence for Forge jobs and config
 *
 * Features:
 * - Save/restore active job state
 * - Save/restore configuration
 * - Error handling for JSON parse failures
 * - Type validation for restored data
 * - All functions memoized with useCallback
 */
export function useForgeJobPersistence(): UseForgeJobPersistenceReturn {
  const saveActiveJob = useCallback((jobId: number, startTime: number) => {
    try {
      const activeJob: ActiveJob = { jobId, startTime };
      localStorage.setItem(STORAGE_KEYS.ACTIVE_JOB, JSON.stringify(activeJob));
    } catch (error) {
      console.error('Failed to save active job to localStorage:', error);
    }
  }, []);

  const clearActiveJob = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_JOB);
    } catch (error) {
      console.error('Failed to clear active job from localStorage:', error);
    }
  }, []);

  const saveConfig = useCallback((config: ForgeConfig) => {
    try {
      localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(config));
    } catch (error) {
      console.error('Failed to save config to localStorage:', error);
    }
  }, []);

  const restoreConfig = useCallback((): ForgeConfig | null => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.CONFIG);
      if (!stored) return null;

      const config = JSON.parse(stored);
      // Basic validation - ensure it's an object
      if (typeof config !== 'object' || config === null) {
        console.warn('Invalid config format in localStorage');
        return null;
      }

      return config as ForgeConfig;
    } catch (error) {
      console.error('Failed to restore config from localStorage:', error);
      return null;
    }
  }, []);

  const restoreActiveJob = useCallback((): ActiveJob | null => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.ACTIVE_JOB);
      if (!stored) return null;

      const activeJob = JSON.parse(stored);
      // Validate structure
      if (
        typeof activeJob !== 'object' ||
        activeJob === null ||
        typeof activeJob.jobId !== 'number' ||
        typeof activeJob.startTime !== 'number'
      ) {
        console.warn('Invalid active job format in localStorage');
        return null;
      }

      return activeJob as ActiveJob;
    } catch (error) {
      console.error('Failed to restore active job from localStorage:', error);
      return null;
    }
  }, []);

  return {
    saveActiveJob,
    clearActiveJob,
    saveConfig,
    restoreConfig,
    restoreActiveJob,
  };
}
