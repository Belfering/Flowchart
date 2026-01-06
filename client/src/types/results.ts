/**
 * TypeScript types for Results functionality
 */

export interface Job {
  id: number;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  totalBranches: number;
  completedBranches: number;
  passingBranches: number;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  config?: any;
  error?: string;
}

export interface Result {
  id: number;
  jobId: number;
  signalTicker: string;
  investTicker: string;
  indicator: string;
  period: number;
  comparator: string;
  threshold: number;
  // In-sample metrics
  isTim: number | null;
  isTimar: number | null;
  isMaxdd: number | null;
  isCagr: number | null;
  isTrades: number;
  isAvgHold: number | null;
  isSharpe: number | null;
  isDd3: number | null;
  isDd50: number | null;
  isDd95: number | null;
  isTimardd: number | null;
  // Out-of-sample metrics
  oosTim: number | null;
  oosTimar: number | null;
  oosMaxdd: number | null;
  oosCagr: number | null;
  oosTrades: number;
  oosAvgHold: number | null;
  oosSharpe: number | null;
  oosDd3: number | null;
  oosDd50: number | null;
  oosDd95: number | null;
  oosTimardd: number | null;
  createdAt: string;
}
