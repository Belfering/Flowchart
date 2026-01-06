/**
 * useResultsExport Hook
 *
 * Handles CSV export functionality with loading states and error handling.
 * Provides a clean interface for exporting results to CSV format.
 *
 * @example
 * ```tsx
 * const { exportCSV, exporting, error } = useResultsExport();
 * ```
 */

import { useState, useCallback } from 'react';
import { api } from '@/lib/api';

export interface UseResultsExportReturn {
  exportCSV: (jobId: number) => Promise<void>;
  exporting: boolean;
  error: string | null;
}

/**
 * Hook for exporting results to CSV
 *
 * Features:
 * - Handles CSV export API call
 * - Downloads file via browser
 * - Loading state during export
 * - Error handling with messages
 * - Memoized export function
 */
export function useResultsExport(): UseResultsExportReturn {
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const exportCSV = useCallback(async (jobId: number) => {
    setExporting(true);
    setError(null);

    try {
      // Get CSV data from API
      const csvData = await api.results.exportCSV(jobId);

      // Create blob and download
      const blob = new Blob([csvData], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `results_job_${jobId}_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export CSV:', err);
      setError(err instanceof Error ? err.message : 'Failed to export CSV');
    } finally {
      setExporting(false);
    }
  }, []);

  return {
    exportCSV,
    exporting,
    error,
  };
}
