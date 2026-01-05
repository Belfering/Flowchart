// Forge configuration types

export interface ForgeConfig {
  // Indicator selection
  indicator: string;
  periodMin: number;
  periodMax: number;

  // Ticker configuration
  tickerFilter: 'etf' | 'stock' | 'both';
  selectedTickerList?: number;
  tickers: string[];
  useAltTickers: boolean;
  altTicker?: string;

  // Signal configuration
  comparator: 'GT' | 'LT' | 'BOTH';
  thresholdMin: number;
  thresholdMax: number;
  thresholdStep: number;

  // L2 conditions
  enableL2: boolean;
  l2Indicator?: string;
  l2Period?: number;
  l2Comparator?: 'GT' | 'LT';
  l2Threshold?: number;

  // Pass/fail criteria
  minTIM: number;         // Minimum Time In Market %
  minTIMAR: number;       // Minimum TIMAR (CAGR/TIM)
  maxDD: number;          // Maximum Drawdown %
  minTrades: number;      // Minimum number of trades
  minTIMARDD: number;     // Minimum TIMAR/MaxDD ratio

  // Validation
  enableMC: boolean;
  enableKF: boolean;
  mcSimulations: number;
  mcYears: number;
  kfFolds: number;
  kfShards: number;

  // Data split
  splitStrategy: 'even_odd_month' | 'even_odd_year' | 'chronological';
  oosStartDate?: string;

  // Run configuration
  numWorkers: number;
}

export interface BranchResult {
  id: number;
  jobId: number;

  // Definition
  signalTicker: string;
  investTicker: string;
  indicator: string;
  period: number;
  comparator: 'GT' | 'LT';
  threshold: number;

  // L2 (optional)
  l2Indicator?: string;
  l2Period?: number;
  l2Comparator?: 'GT' | 'LT';
  l2Threshold?: number;

  // IS metrics
  isTim: number;
  isTimar: number;
  isMaxdd: number;
  isCagr: number;
  isTrades: number;
  isAvgHold: number;
  isDd3: number;
  isTimar3: number;
  isDd50: number;
  isDd95: number;

  // OOS metrics
  oosTim: number;
  oosTimar: number;
  oosMaxdd: number;
  oosCagr: number;
  oosTrades: number;
  oosAvgHold: number;
  oosDd3: number;
  oosTimar3: number;
  oosDd50: number;
  oosDd95: number;

  // MC/KF (optional)
  mcMeanTimar?: number;
  mcStdTimar?: number;
  kfMeanTimar?: number;
  kfStdTimar?: number;

  // Metadata
  tradeLogPath?: string;
  createdAt: string;
}

export interface ForgeJob {
  id: number;
  configId?: number;
  status: 'pending' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled';
  totalBranches: number;
  completedBranches: number;
  passingBranches: number;
  startedAt?: string;
  completedAt?: string;
  error?: string;
}

export interface TickerList {
  id: number;
  name: string;
  type: 'etf' | 'stock' | 'mixed';
  tickers: string[];
  createdAt: string;
}

export interface DownloadJob {
  id: number;
  ticker: string;
  startDate?: string;
  endDate?: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  error?: string;
  filePath?: string;
  createdAt: string;
  completedAt?: string;
}
