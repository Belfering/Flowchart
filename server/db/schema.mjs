import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// ============================================================================
// ATLAS.DB - Configuration & Jobs
// ============================================================================

export const tickerLists = sqliteTable('ticker_lists', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  type: text('type').notNull(), // 'etf' | 'stock' | 'mixed'
  tickers: text('tickers').notNull(), // JSON array
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

export const tickerRegistry = sqliteTable('ticker_registry', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  ticker: text('ticker').notNull().unique(), // Sanitized ticker (e.g., BRK-B)
  originalTicker: text('original_ticker').notNull(), // Original symbol (e.g., BRK.B)
  name: text('name'),
  description: text('description'),
  assetType: text('asset_type'), // 'Stock' | 'ETF'
  exchange: text('exchange'),
  priceCurrency: text('price_currency'),
  startDate: text('start_date'), // First available date from Tiingo
  endDate: text('end_date'), // Last available date from Tiingo
  isActive: integer('is_active').default(1), // 1 = active, 0 = delisted/inactive
  syncedAt: text('synced_at').default(sql`CURRENT_TIMESTAMP`),
});

export const downloadJobs = sqliteTable('download_jobs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  ticker: text('ticker').notNull(),
  startDate: text('start_date'),
  endDate: text('end_date'),
  status: text('status').notNull(), // 'pending' | 'running' | 'completed' | 'failed'
  error: text('error'),
  filePath: text('file_path'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  completedAt: text('completed_at'),
});

export const forgeConfigs = sqliteTable('forge_configs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  configJson: text('config_json').notNull(), // Full JSON of all settings
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

export const forgeJobs = sqliteTable('forge_jobs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  configId: integer('config_id').references(() => forgeConfigs.id),
  status: text('status').notNull(), // 'pending' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled'
  totalBranches: integer('total_branches'),
  completedBranches: integer('completed_branches').default(0),
  passingBranches: integer('passing_branches').default(0),
  startedAt: text('started_at'),
  completedAt: text('completed_at'),
  error: text('error'),
});

// ============================================================================
// RESULTS.DB - Branch Results
// ============================================================================

export const branches = sqliteTable('branches', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  jobId: integer('job_id').notNull(),

  // Branch definition
  signalTicker: text('signal_ticker').notNull(),
  investTicker: text('invest_ticker').notNull(),
  indicator: text('indicator').notNull(),
  period: integer('period').notNull(),
  comparator: text('comparator').notNull(), // 'GT' | 'LT'
  threshold: real('threshold').notNull(),

  // L2 conditions (optional)
  l2Indicator: text('l2_indicator'),
  l2Period: integer('l2_period'),
  l2Comparator: text('l2_comparator'),
  l2Threshold: real('l2_threshold'),

  // IS metrics (in-sample) - Core 10 for MVP
  isTim: real('is_tim'),
  isTimar: real('is_timar'),
  isMaxdd: real('is_maxdd'),
  isCagr: real('is_cagr'),
  isTrades: integer('is_trades'),
  isAvgHold: real('is_avghold'),
  isDd3: real('is_dd3'),
  isTimar3: real('is_timar3'),
  isDd50: real('is_dd50'),
  isDd95: real('is_dd95'),

  // OOS metrics (out-of-sample) - Core 10 for MVP
  oosTim: real('oos_tim'),
  oosTimar: real('oos_timar'),
  oosMaxdd: real('oos_maxdd'),
  oosCagr: real('oos_cagr'),
  oosTrades: integer('oos_trades'),
  oosAvgHold: real('oos_avghold'),
  oosDd3: real('oos_dd3'),
  oosTimar3: real('oos_timar3'),
  oosDd50: real('oos_dd50'),
  oosDd95: real('oos_dd95'),

  // MC/KF metrics (optional, for Phase 2)
  mcMeanTimar: real('mc_mean_timar'),
  mcStdTimar: real('mc_std_timar'),
  kfMeanTimar: real('kf_mean_timar'),
  kfStdTimar: real('kf_std_timar'),

  // Metadata
  tradeLogPath: text('trade_log_path'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});
