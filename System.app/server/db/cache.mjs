/**
 * FRD-014: Backtest Cache Database
 * Separate SQLite database for caching backtest results
 *
 * Cache invalidation triggers:
 * - Payload hash mismatch (bot payload changed)
 * - Data date mismatch (new ticker data downloaded)
 * - First-user-login-of-day (daily refresh for all bots)
 */

import Database from 'better-sqlite3'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'
import crypto from 'crypto'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Separate database file for cache (user specified separate DB)
const CACHE_DB_PATH = process.env.CACHE_DATABASE_PATH || path.join(__dirname, '..', 'data', 'backtest_cache.db')

// Ensure data directory exists
const dataDir = path.dirname(CACHE_DB_PATH)
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}

// Create SQLite connection for cache
const cacheDb = new Database(CACHE_DB_PATH)
cacheDb.pragma('journal_mode = WAL')

// ============================================
// INITIALIZATION - Create cache tables
// ============================================
export function initializeCacheDatabase() {
  cacheDb.exec(`
    -- Backtest results cache
    CREATE TABLE IF NOT EXISTS backtest_cache (
      bot_id TEXT PRIMARY KEY,
      payload_hash TEXT NOT NULL,
      data_date TEXT NOT NULL,
      results TEXT NOT NULL,
      computed_at INTEGER NOT NULL,
      created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
      updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000)
    );

    -- Track last refresh date for daily refresh logic
    CREATE TABLE IF NOT EXISTS cache_metadata (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000)
    );

    -- Index for efficient lookups
    CREATE INDEX IF NOT EXISTS idx_cache_payload_hash ON backtest_cache(payload_hash);
    CREATE INDEX IF NOT EXISTS idx_cache_data_date ON backtest_cache(data_date);
    CREATE INDEX IF NOT EXISTS idx_cache_computed_at ON backtest_cache(computed_at);
  `)

  console.log('[Cache] Backtest cache database initialized')
}

// ============================================
// HASH FUNCTIONS
// ============================================

/**
 * Generate SHA-256 hash of payload for change detection
 */
export function hashPayload(payload) {
  const str = typeof payload === 'string' ? payload : JSON.stringify(payload)
  return crypto.createHash('sha256').update(str).digest('hex')
}

// ============================================
// CACHE OPERATIONS
// ============================================

/**
 * Get cached backtest result for a bot
 * @param {string} botId - Bot ID
 * @param {string} currentPayloadHash - Hash of current payload
 * @param {string} currentDataDate - Current ticker data date (YYYY-MM-DD)
 * @returns {object|null} Cached result or null if cache miss/invalid
 */
export function getCachedBacktest(botId, currentPayloadHash, currentDataDate) {
  const row = cacheDb.prepare(`
    SELECT bot_id, payload_hash, data_date, results, computed_at
    FROM backtest_cache
    WHERE bot_id = ?
  `).get(botId)

  if (!row) {
    return null // Cache miss - no entry
  }

  // Validate cache - payload hash must match
  if (row.payload_hash !== currentPayloadHash) {
    console.log(`[Cache] Miss for ${botId}: payload changed`)
    return null
  }

  // Validate cache - data date must match (new ticker data invalidates)
  if (row.data_date !== currentDataDate) {
    console.log(`[Cache] Miss for ${botId}: data date changed (${row.data_date} -> ${currentDataDate})`)
    return null
  }

  try {
    const results = JSON.parse(row.results)
    console.log(`[Cache] Hit for ${botId} (computed ${new Date(row.computed_at).toISOString()})`)
    return {
      ...results,
      cached: true,
      cachedAt: row.computed_at,
    }
  } catch (e) {
    console.error(`[Cache] Failed to parse cached results for ${botId}:`, e)
    return null
  }
}

/**
 * Store backtest result in cache
 * @param {string} botId - Bot ID
 * @param {string} payloadHash - Hash of payload
 * @param {string} dataDate - Ticker data date (YYYY-MM-DD)
 * @param {object} results - Backtest results to cache
 */
export function setCachedBacktest(botId, payloadHash, dataDate, results) {
  const now = Date.now()
  const resultsJson = JSON.stringify(results)

  cacheDb.prepare(`
    INSERT INTO backtest_cache (bot_id, payload_hash, data_date, results, computed_at, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(bot_id) DO UPDATE SET
      payload_hash = excluded.payload_hash,
      data_date = excluded.data_date,
      results = excluded.results,
      computed_at = excluded.computed_at,
      updated_at = excluded.updated_at
  `).run(botId, payloadHash, dataDate, resultsJson, now, now, now)

  console.log(`[Cache] Stored backtest for ${botId} (payload hash: ${payloadHash.substring(0, 8)}..., data: ${dataDate})`)
}

/**
 * Invalidate cache for a specific bot
 */
export function invalidateBotCache(botId) {
  const result = cacheDb.prepare('DELETE FROM backtest_cache WHERE bot_id = ?').run(botId)
  if (result.changes > 0) {
    console.log(`[Cache] Invalidated cache for ${botId}`)
  }
  return result.changes > 0
}

/**
 * Invalidate ALL cache entries (for daily refresh)
 */
export function invalidateAllCache() {
  const result = cacheDb.prepare('DELETE FROM backtest_cache').run()
  console.log(`[Cache] Invalidated all cache entries (${result.changes} removed)`)
  return result.changes
}

// ============================================
// DAILY REFRESH LOGIC
// ============================================

/**
 * Get the last refresh date
 * @returns {string|null} Date string (YYYY-MM-DD) or null
 */
export function getLastRefreshDate() {
  const row = cacheDb.prepare(`
    SELECT value FROM cache_metadata WHERE key = 'last_refresh_date'
  `).get()
  return row?.value || null
}

/**
 * Set the last refresh date to today
 */
export function setLastRefreshDate() {
  const today = new Date().toISOString().split('T')[0]
  const now = Date.now()

  cacheDb.prepare(`
    INSERT INTO cache_metadata (key, value, updated_at)
    VALUES ('last_refresh_date', ?, ?)
    ON CONFLICT(key) DO UPDATE SET
      value = excluded.value,
      updated_at = excluded.updated_at
  `).run(today, now)

  console.log(`[Cache] Set last refresh date to ${today}`)
  return today
}

/**
 * Check if daily refresh is needed (first login of the day)
 * If needed, invalidates all cache and updates the refresh date
 * @returns {boolean} True if refresh was triggered
 */
export function checkAndTriggerDailyRefresh() {
  const today = new Date().toISOString().split('T')[0]
  const lastRefresh = getLastRefreshDate()

  if (lastRefresh === today) {
    // Already refreshed today
    return false
  }

  console.log(`[Cache] Daily refresh triggered (last: ${lastRefresh || 'never'}, today: ${today})`)

  // Invalidate all cache entries
  invalidateAllCache()

  // Update last refresh date
  setLastRefreshDate()

  return true
}

// ============================================
// CACHE STATISTICS
// ============================================

/**
 * Get cache statistics
 */
export function getCacheStats() {
  const countRow = cacheDb.prepare('SELECT COUNT(*) as count FROM backtest_cache').get()
  const sizeRow = cacheDb.prepare(`
    SELECT SUM(LENGTH(results)) as total_size FROM backtest_cache
  `).get()
  const oldestRow = cacheDb.prepare(`
    SELECT MIN(computed_at) as oldest FROM backtest_cache
  `).get()
  const newestRow = cacheDb.prepare(`
    SELECT MAX(computed_at) as newest FROM backtest_cache
  `).get()

  return {
    entryCount: countRow?.count || 0,
    totalSizeBytes: sizeRow?.total_size || 0,
    oldestEntry: oldestRow?.oldest ? new Date(oldestRow.oldest).toISOString() : null,
    newestEntry: newestRow?.newest ? new Date(newestRow.newest).toISOString() : null,
    lastRefreshDate: getLastRefreshDate(),
  }
}

// Export the raw cache database for advanced queries if needed
export { cacheDb }
