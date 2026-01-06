/**
 * TypeScript types for Data Management functionality
 */

export interface SyncSchedule {
  status: {
    isRunning: boolean;
    currentJob: CurrentJob | null;
  };
  config: {
    batchSize: number;
    sleepSeconds: number;
    tiingoSleepSeconds: number;
  };
  lastSync: {
    yfinance: LastSyncInfo | null;
    tiingo: LastSyncInfo | null;
  };
}

export interface CurrentJob {
  pid: number | null;
  syncedCount: number;
  tickerCount: number;
  startedAt: number;
  phase: 'downloading' | 'processing';
  source: 'yfinance' | 'tiingo';
}

export interface LastSyncInfo {
  date: string;
  status: 'success' | 'error';
  syncedCount: number;
  tickerCount: number;
}

export interface TiingoKeyStatus {
  hasKey: boolean;
}

export interface TickerSearchResult {
  ticker: string;
  name: string | null;
  description: string | null;
  assetType: string | null;
}

export interface TickerPreview {
  Date: string;
  Open: number;
  High: number;
  Low: number;
  Close: number;
}

export interface TickerPreviewResponse {
  ticker: string;
  preview: TickerPreview[];
}

export interface TickerRegistryEntry {
  ticker: string;
  originalTicker: string;
  name: string;
  description: string;
  assetType: 'Stock' | 'ETF';
  exchange: string;
  priceCurrency: string;
  startDate: string;
  endDate: string;
  isActive?: boolean;
  syncedAt?: string;
}

export interface RegistryStats {
  total: number;
  active: number;
  stocks: number;
  etfs: number;
  lastSync: string | null;
}

export interface MissingTickersResponse {
  missing: TickerRegistryEntry[];
  count: number;
  registryTotal: number;
  parquetTotal: number;
}
