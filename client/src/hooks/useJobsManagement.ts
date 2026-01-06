/**
 * useJobsManagement Hook
 *
 * Manages job loading and selection for the Results tab.
 * Auto-selects the first completed job when jobs are loaded.
 *
 * @example
 * ```tsx
 * const { jobs, selectedJobId, setSelectedJobId, loading, error, refetch } = useJobsManagement();
 * ```
 */

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import type { Job } from '@/types';

export interface UseJobsManagementReturn {
  jobs: Job[];
  selectedJobId: number | null;
  setSelectedJobId: (id: number | null) => void;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook for managing jobs list and selection
 *
 * Features:
 * - Loads all jobs on mount
 * - Auto-selects first completed job
 * - Memoized load and selection functions
 * - Loading and error states
 * - Refetch capability
 */
export function useJobsManagement(): UseJobsManagementReturn {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadJobs = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await api.results.getJobs();
      const jobList = Array.isArray(data) ? data : [];
      setJobs(jobList);

      // Auto-select first completed job if none selected
      if (!selectedJobId && jobList.length > 0) {
        const firstCompleted = jobList.find((j) => j.status === 'completed');
        if (firstCompleted) {
          setSelectedJobId(firstCompleted.id);
        }
      }
    } catch (err) {
      console.error('Failed to load jobs:', err);
      setError(err instanceof Error ? err.message : 'Failed to load jobs');
      setJobs([]);
    } finally {
      setLoading(false);
    }
  }, [selectedJobId]);

  // Load jobs on mount
  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  return {
    jobs,
    selectedJobId,
    setSelectedJobId,
    loading,
    error,
    refetch: loadJobs,
  };
}
