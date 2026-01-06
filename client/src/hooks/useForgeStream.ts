/**
 * useForgeStream Hook
 *
 * Manages Server-Sent Events (SSE) connection for real-time job progress.
 * Handles connection lifecycle, message parsing, and debug logging.
 *
 * @example
 * ```tsx
 * const { status, debugLog } = useForgeStream(jobId);
 * ```
 */

import { useState, useEffect } from 'react';
import type { JobStatus } from '@/types';

export interface UseForgeStreamReturn {
  status: JobStatus | null;
  debugLog: string[];
}

/**
 * Hook for managing SSE stream for Forge job updates
 *
 * Features:
 * - Creates EventSource when jobId changes
 * - Parses SSE messages and updates status
 * - Maintains debug log of raw messages
 * - Properly cleans up connection on unmount
 * - Handles connection errors
 */
export function useForgeStream(jobId: number | null): UseForgeStreamReturn {
  const [status, setStatus] = useState<JobStatus | null>(null);
  const [debugLog, setDebugLog] = useState<string[]>([]);

  useEffect(() => {
    if (!jobId) {
      setStatus(null);
      setDebugLog([]);
      return;
    }

    // Create EventSource connection
    const eventSource = new EventSource(`/api/forge/stream/${jobId}`);
    let pollInterval: ReturnType<typeof setInterval> | null = null;

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        // Update debug log
        setDebugLog((prev) => {
          const newLog = [...prev, `[${new Date().toISOString()}] ${event.data}`];
          return newLog.slice(-50); // Keep last 50 messages
        });

        // Update status
        setStatus(data);

        // If job is complete, close connection
        if (data.status === 'completed' || data.status === 'failed' || data.status === 'cancelled') {
          eventSource.close();
          if (pollInterval) clearInterval(pollInterval);
        }
      } catch (error) {
        console.error('Failed to parse SSE message:', error);
        setDebugLog((prev) => [
          ...prev,
          `[${new Date().toISOString()}] ERROR: Failed to parse message`,
        ]);
      }
    };

    eventSource.onerror = (error) => {
      console.error('SSE connection error:', error);
      setDebugLog((prev) => [
        ...prev,
        `[${new Date().toISOString()}] ERROR: Connection failed, falling back to polling`,
      ]);
      eventSource.close();

      // Fallback: Poll job status every 2 seconds when SSE fails
      pollInterval = setInterval(async () => {
        try {
          const response = await fetch(`/api/forge/status/${jobId}`);
          if (response.ok) {
            const data = await response.json();
            setStatus({
              jobId: data.id,
              status: data.status,
              totalBranches: data.totalBranches,
              completedBranches: data.completedBranches,
              passingBranches: data.passingBranches,
            });

            // Stop polling if job is done
            if (data.status === 'completed' || data.status === 'failed' || data.status === 'cancelled') {
              if (pollInterval) clearInterval(pollInterval);
            }
          }
        } catch (err) {
          console.error('Failed to poll job status:', err);
        }
      }, 2000);
    };

    // Cleanup on unmount or jobId change
    return () => {
      eventSource.close();
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [jobId]);

  return {
    status,
    debugLog,
  };
}
