/**
 * Simple JSON-based database (no SQLite dependencies)
 */
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_DIR = path.join(__dirname, '../../data/json');

// Ensure directory exists
await fs.mkdir(DB_DIR, { recursive: true });

const db = {
  downloads: [],
  tickers: [],
  jobs: [],
  results: [],
  tickerRegistry: [], // Tiingo ticker metadata
  lastSyncState: { // Last sync timestamps
    yfinance: null,
    tiingo: null,
  },
};

let nextId = {
  downloads: 1,
  jobs: 1,
  results: 1,
};

// Load from disk
async function load() {
  try {
    const data = await fs.readFile(path.join(DB_DIR, 'db.json'), 'utf-8');
    const loaded = JSON.parse(data);
    Object.assign(db, loaded.db || {});
    Object.assign(nextId, loaded.nextId || {});
  } catch (e) {
    // File doesn't exist yet, use defaults
  }
}

// Save to disk
async function save() {
  await fs.writeFile(
    path.join(DB_DIR, 'db.json'),
    JSON.stringify({ db, nextId }, null, 2)
  );
}

// Initialize
await load();

export const jsonDb = {
  // Download jobs
  async createDownload(data) {
    const job = { id: nextId.downloads++, ...data, createdAt: new Date().toISOString() };
    db.downloads.push(job);
    await save();
    return job;
  },

  async updateDownload(id, updates) {
    const job = db.downloads.find(j => j.id === id);
    if (job) {
      Object.assign(job, updates);
      await save();
    }
    return job;
  },

  async getDownloads() {
    return db.downloads.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  // Forge jobs
  async createJob(data) {
    const job = { id: nextId.jobs++, ...data, createdAt: new Date().toISOString() };
    db.jobs.push(job);
    await save();
    return job;
  },

  async updateJob(id, updates) {
    const job = db.jobs.find(j => j.id === id);
    if (job) {
      Object.assign(job, updates);
      await save();
    }
    return job;
  },

  async getJob(id) {
    return db.jobs.find(j => j.id === id);
  },

  async getAllJobs() {
    return db.jobs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  // Results
  async createResult(data) {
    const result = { id: nextId.results++, ...data, createdAt: new Date().toISOString() };
    db.results.push(result);
    await save();
    return result;
  },

  async batchCreateResults(resultsData) {
    const createdAt = new Date().toISOString();
    const results = resultsData.map(data => ({
      id: nextId.results++,
      ...data,
      createdAt,
    }));
    db.results.push(...results);
    await save();
    return results.length;
  },

  async getResults(jobId, sortBy = 'is_timar', order = 'desc', limit = null) {
    let results = db.results.filter(r => r.jobId === jobId);

    // Sort
    if (sortBy) {
      results.sort((a, b) => {
        const aVal = a[sortBy] || 0;
        const bVal = b[sortBy] || 0;
        return order === 'desc' ? bVal - aVal : aVal - bVal;
      });
    }

    // Limit
    if (limit) {
      results = results.slice(0, limit);
    }

    return results;
  },

  // Ticker registry methods
  async syncTickerRegistry(tickers) {
    // Replace entire registry with new data
    db.tickerRegistry = tickers.map(t => ({
      ...t,
      syncedAt: new Date().toISOString(),
    }));
    await save();
    return db.tickerRegistry.length;
  },

  async getTickerRegistry() {
    return db.tickerRegistry;
  },

  async getRegistryStats() {
    const total = db.tickerRegistry.length;
    const active = db.tickerRegistry.filter(t => t.isActive !== false).length;
    const stocks = db.tickerRegistry.filter(t => t.assetType === 'Stock').length;
    const etfs = db.tickerRegistry.filter(t => t.assetType === 'ETF').length;

    // Get last sync time
    const lastSync = db.tickerRegistry.length > 0
      ? db.tickerRegistry[0].syncedAt
      : null;

    return {
      total,
      active,
      stocks,
      etfs,
      lastSync,
    };
  },

  async searchRegistry(query) {
    if (!query) return [];

    const q = query.toUpperCase();
    return db.tickerRegistry
      .filter(t => {
        return (
          t.ticker?.toUpperCase().includes(q) ||
          t.originalTicker?.toUpperCase().includes(q) ||
          t.name?.toUpperCase().includes(q) ||
          t.description?.toUpperCase().includes(q)
        );
      })
      .slice(0, 10); // Limit to 10 results
  },

  // Missing metadata detection
  async getMissingMetadata() {
    // Find tickers with missing name or description
    return db.tickerRegistry.filter(t => !t.name || !t.description);
  },

  // Update ticker metadata (for enrichment)
  async updateTickerMetadata(ticker, metadata) {
    const record = db.tickerRegistry.find(t => t.ticker === ticker);
    if (record) {
      Object.assign(record, metadata);
      await save();
      return record;
    }
    return null;
  },

  // Last sync state persistence
  async getLastSyncState() {
    return db.lastSyncState || { yfinance: null, tiingo: null };
  },

  async setLastSyncState(source, syncData) {
    if (!db.lastSyncState) {
      db.lastSyncState = { yfinance: null, tiingo: null };
    }
    db.lastSyncState[source] = syncData;
    await save();
  },
};
