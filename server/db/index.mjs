import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import * as schema from './schema.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '../../data/sqlite');

// Initialize atlas.db (configuration & jobs)
const atlasDbPath = path.join(DATA_DIR, 'atlas.db');
const atlasSqlite = new Database(atlasDbPath);
atlasSqlite.pragma('journal_mode = WAL');
export const atlasDb = drizzle(atlasSqlite, { schema });

// Initialize results.db (branch results)
const resultsDbPath = path.join(DATA_DIR, 'results.db');
const resultsSqlite = new Database(resultsDbPath);
resultsSqlite.pragma('journal_mode = WAL');
export const resultsDb = drizzle(resultsSqlite, { schema });

// Create tables if they don't exist
export function initializeDatabase() {
  console.log('Initializing databases...');

  // Create tables in atlas.db
  atlasSqlite.exec(`
    CREATE TABLE IF NOT EXISTS ticker_lists (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      tickers TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS download_jobs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ticker TEXT NOT NULL,
      start_date TEXT,
      end_date TEXT,
      status TEXT NOT NULL,
      error TEXT,
      file_path TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      completed_at TEXT
    );

    CREATE TABLE IF NOT EXISTS forge_configs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      config_json TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS forge_jobs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      config_id INTEGER REFERENCES forge_configs(id),
      status TEXT NOT NULL,
      total_branches INTEGER,
      completed_branches INTEGER DEFAULT 0,
      passing_branches INTEGER DEFAULT 0,
      started_at TEXT,
      completed_at TEXT,
      error TEXT
    );
  `);

  // Create tables in results.db
  resultsSqlite.exec(`
    CREATE TABLE IF NOT EXISTS branches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      job_id INTEGER NOT NULL,
      signal_ticker TEXT NOT NULL,
      invest_ticker TEXT NOT NULL,
      indicator TEXT NOT NULL,
      period INTEGER NOT NULL,
      comparator TEXT NOT NULL,
      threshold REAL NOT NULL,
      l2_indicator TEXT,
      l2_period INTEGER,
      l2_comparator TEXT,
      l2_threshold REAL,
      is_tim REAL,
      is_timar REAL,
      is_maxdd REAL,
      is_cagr REAL,
      is_trades INTEGER,
      is_avghold REAL,
      is_dd3 REAL,
      is_timar3 REAL,
      is_dd50 REAL,
      is_dd95 REAL,
      oos_tim REAL,
      oos_timar REAL,
      oos_maxdd REAL,
      oos_cagr REAL,
      oos_trades INTEGER,
      oos_avghold REAL,
      oos_dd3 REAL,
      oos_timar3 REAL,
      oos_dd50 REAL,
      oos_dd95 REAL,
      mc_mean_timar REAL,
      mc_std_timar REAL,
      kf_mean_timar REAL,
      kf_std_timar REAL,
      trade_log_path TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_branches_job ON branches(job_id);
    CREATE INDEX IF NOT EXISTS idx_branches_is_timar ON branches(is_timar DESC);
    CREATE INDEX IF NOT EXISTS idx_branches_oos_timar ON branches(oos_timar DESC);
  `);

  console.log('Databases initialized successfully');
}

// Initialize on module load
initializeDatabase();
