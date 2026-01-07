import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format ISO timestamp to readable date-time string
 * @param timestamp ISO timestamp string
 * @returns Formatted string like "2026-01-06 14:30:22" or "N/A" if invalid
 */
export function formatDateTime(timestamp?: string | null): string {
  if (!timestamp) return 'N/A';
  try {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  } catch {
    return 'N/A';
  }
}

/**
 * Format duration between two timestamps
 * @param startTime ISO timestamp string
 * @param endTime ISO timestamp string or null for incomplete
 * @returns Formatted string like "2h 15m 30s" or "In progress" if no end time
 */
export function formatDuration(startTime?: string | null, endTime?: string | null): string {
  if (!startTime) return 'N/A';
  if (!endTime) return 'In progress';

  try {
    const start = new Date(startTime).getTime();
    const end = new Date(endTime).getTime();
    const durationMs = end - start;

    if (durationMs < 0) return 'N/A';

    const seconds = Math.floor(durationMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    const parts: string[] = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours % 24 > 0) parts.push(`${hours % 24}h`);
    if (minutes % 60 > 0) parts.push(`${minutes % 60}m`);
    if (seconds % 60 > 0 || parts.length === 0) parts.push(`${seconds % 60}s`);

    return parts.join(' ');
  } catch {
    return 'N/A';
  }
}
