import express from 'express';
import { atlasDb } from '../db/index.mjs';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const router = express.Router();

// Global sync state
let syncState = {
  status: {
    isRunning: false,
    currentJob: null,
  },
  config: {
    batchSize: 100,
    sleepSeconds: 2,
    tiingoSleepSeconds: 0.2,
  },
  lastSync: {
    yfinance: null,
    tiingo: null,
  },
};

let currentProcess = null;
let tiingoApiKey = null;

// Load persisted lastSync state on startup
(async () => {
  try {
    const lastSyncState = await atlasDb.getLastSyncState();
    syncState.lastSync = lastSyncState;
  } catch (e) {
    console.error('Failed to load lastSync state:', e);
  }
})();

// Single ticker download (original functionality)
router.post('/download', async (req, res) => {
  try {
    const { ticker } = req.body;
    const job = await atlasDb.createDownload({ ticker, status: 'running' });

    const pythonScript = path.join(__dirname, '../../python/download_data.py');
    const params = JSON.stringify({ ticker });
    const python = spawn('python', [pythonScript, params]);

    let stdoutData = '';
    let stderrData = '';

    python.stdout.on('data', (data) => {
      stdoutData += data.toString();
    });

    python.stderr.on('data', (data) => {
      stderrData += data.toString();
      console.log('Python stderr:', data.toString());
    });

    python.on('close', async (code) => {
      try {
        const result = JSON.parse(stdoutData.trim());
        await atlasDb.updateDownload(job.id, {
          status: result.success ? 'completed' : 'failed',
          filePath: result.file_path,
          error: result.error,
          completedAt: new Date().toISOString(),
        });
      } catch (e) {
        console.error('Failed to parse Python output:', e);
        await atlasDb.updateDownload(job.id, {
          status: 'failed',
          error: `Python error: ${stderrData || e.message}`,
          completedAt: new Date().toISOString(),
        });
      }
    });

    res.json({ success: true, job });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/downloads', async (req, res) => {
  const jobs = await atlasDb.getDownloads();
  res.json(jobs);
});

router.get('/tickers', async (req, res) => {
  try {
    const dir = path.join(__dirname, '../../data/parquet');
    await fs.mkdir(dir, { recursive: true });
    const files = await fs.readdir(dir);
    const tickers = files.filter(f => f.endsWith('.parquet')).map(f => f.replace('.parquet', ''));
    res.json({ tickers });
  } catch (e) {
    res.json({ tickers: [] });
  }
});

// Sync status endpoint
router.get('/sync-status', (req, res) => {
  res.json(syncState);
});

// Update sync settings
router.put('/sync-settings', (req, res) => {
  const { batchSize, yfinancePause, tiingoPause } = req.body;
  if (batchSize) syncState.config.batchSize = batchSize;
  if (yfinancePause !== undefined) syncState.config.sleepSeconds = yfinancePause;
  if (tiingoPause !== undefined) syncState.config.tiingoSleepSeconds = tiingoPause;
  res.json({ success: true, config: syncState.config });
});

// Start yFinance batch download
router.post('/sync/yfinance', async (req, res) => {
  if (syncState.status.isRunning) {
    return res.status(400).json({ error: 'Download already in progress' });
  }

  try {
    const { fillGaps } = req.body; // If true, download only missing tickers

    // Check if registry exists
    const registryTickers = await atlasDb.getTickerRegistry();
    if (registryTickers.length === 0) {
      return res.status(400).json({
        error: 'No tickers in registry. Sync Tiingo registry first.'
      });
    }

    const tickerCount = registryTickers.length;

    syncState.status.isRunning = true;
    syncState.status.currentJob = {
      pid: null,
      syncedCount: 0,
      tickerCount: tickerCount,
      startedAt: Date.now(),
      phase: 'downloading',
      source: 'yfinance',
    };

    res.json({
      success: true,
      jobId: 'yfinance-' + Date.now(),
      tickerCount: tickerCount,
    });

    // Run batch download in background (Python script reads registry directly)
    runBatchDownload(fillGaps || false, 'yfinance');
  } catch (error) {
    syncState.status.isRunning = false;
    syncState.status.currentJob = null;
    res.status(500).json({ error: error.message });
  }
});

// Start Tiingo batch download
router.post('/sync/tiingo', async (req, res) => {
  if (syncState.status.isRunning) {
    return res.status(400).json({ error: 'Download already in progress' });
  }

  if (!tiingoApiKey) {
    return res.status(400).json({ error: 'Tiingo API key not configured' });
  }

  try {
    // For now, just update status (Tiingo integration to be implemented)
    syncState.status.isRunning = true;
    syncState.status.currentJob = {
      pid: null,
      syncedCount: 0,
      tickerCount: 0,
      startedAt: Date.now(),
      phase: 'downloading',
      source: 'tiingo',
    };

    res.json({ success: true, jobId: 'tiingo-' + Date.now() });

    // Simulate completion (actual Tiingo implementation needed)
    setTimeout(() => {
      syncState.status.isRunning = false;
      syncState.lastSync.tiingo = {
        date: new Date().toLocaleString(),
        status: 'success',
        syncedCount: 0,
        tickerCount: 0,
      };
      syncState.status.currentJob = null;
    }, 2000);
  } catch (error) {
    syncState.status.isRunning = false;
    syncState.status.currentJob = null;
    res.status(500).json({ error: error.message });
  }
});

// Stop download
router.post('/sync/stop', (req, res) => {
  if (currentProcess) {
    currentProcess.kill();
    currentProcess = null;
  }

  syncState.status.isRunning = false;
  syncState.status.currentJob = null;

  res.json({ success: true });
});

// Tiingo API key management
router.get('/tiingo-key', (req, res) => {
  res.json({ hasKey: !!tiingoApiKey });
});

router.post('/tiingo-key', (req, res) => {
  const { key } = req.body;
  if (!key) {
    return res.status(400).json({ error: 'API key required' });
  }
  tiingoApiKey = key;
  res.json({ success: true });
});

router.delete('/tiingo-key', (req, res) => {
  tiingoApiKey = null;
  res.json({ success: true });
});

// Ticker search
router.get('/search', async (req, res) => {
  try {
    const { q, limit = 10 } = req.query;

    if (!q) {
      return res.json([]);
    }

    const dir = path.join(__dirname, '../../data/parquet');
    await fs.mkdir(dir, { recursive: true });
    const files = await fs.readdir(dir);
    const tickers = files
      .filter(f => f.endsWith('.parquet'))
      .map(f => f.replace('.parquet', ''));

    // Simple search: filter tickers that start with query
    const query = q.toUpperCase();
    const results = tickers
      .filter(ticker => ticker.includes(query))
      .slice(0, parseInt(limit))
      .map(ticker => ({
        ticker,
        name: null,
        description: null,
        assetType: null,
      }));

    res.json(results);
  } catch (e) {
    res.json([]);
  }
});

// Ticker data preview
router.get('/preview/:ticker', async (req, res) => {
  try {
    const { ticker } = req.params;
    const { limit = 50 } = req.query;

    const parquetPath = path.join(__dirname, '../../data/parquet', `${ticker}.parquet`);

    // Check if file exists
    try {
      await fs.access(parquetPath);
    } catch (e) {
      return res.status(404).json({ error: 'Ticker data not found' });
    }

    // Use Python to read parquet file
    const pythonScript = path.join(__dirname, '../../python/read_parquet.py');
    const params = JSON.stringify({ file_path: parquetPath, limit: parseInt(limit) });

    const python = spawn('python', [pythonScript, params]);

    let stdout = '';
    let stderr = '';

    python.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    python.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    python.on('close', (code) => {
      if (code !== 0) {
        return res.status(500).json({ error: 'Failed to read parquet file', details: stderr });
      }

      try {
        const data = JSON.parse(stdout);
        res.json({
          ticker,
          preview: data.preview || [],
        });
      } catch (e) {
        res.status(500).json({ error: 'Failed to parse parquet data' });
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/ticker-lists', async (req, res) => { res.json([]); });
router.post('/ticker-lists', async (req, res) => { res.json({ success: true }); });

// Ticker registry endpoints
router.post('/registry/sync', async (req, res) => {
  try {
    const pythonScript = path.join(__dirname, '../../python/sync_tiingo_registry.py');
    const python = spawn('python', [pythonScript, JSON.stringify({})]);

    let stdout = '';
    let stderr = '';

    python.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    python.stderr.on('data', (data) => {
      stderr += data.toString();
      console.log('[Tiingo Sync] stderr:', data.toString());
    });

    python.on('close', async (code) => {
      if (code !== 0) {
        return res.status(500).json({ error: 'Failed to sync Tiingo registry', details: stderr });
      }

      try {
        const result = JSON.parse(stdout.trim());

        if (!result.success) {
          return res.status(500).json({ error: result.error });
        }

        // Load the registry file and save to database
        const registryPath = path.join(__dirname, '../../data/tiingo_registry.json');
        const registryData = JSON.parse(await fs.readFile(registryPath, 'utf-8'));

        // Convert tickers object to array
        const tickers = Object.values(registryData.tickers);

        await atlasDb.syncTickerRegistry(tickers);

        res.json({
          success: true,
          stats: result,
        });
      } catch (e) {
        res.status(500).json({ error: 'Failed to parse sync result', details: e.message });
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/registry/stats', async (req, res) => {
  try {
    const stats = await atlasDb.getRegistryStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/registry/search', async (req, res) => {
  try {
    const { q } = req.query;
    const results = await atlasDb.searchRegistry(q || '');
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/registry/tickers', async (req, res) => {
  try {
    const tickers = await atlasDb.getTickerRegistry();
    res.json(tickers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/registry/missing', async (req, res) => {
  try {
    // Get all registry tickers
    const registryTickers = await atlasDb.getTickerRegistry();

    // Get all parquet files
    const parquetDir = path.join(__dirname, '../../data/parquet');
    await fs.mkdir(parquetDir, { recursive: true });
    const files = await fs.readdir(parquetDir);
    const parquetTickers = files
      .filter(f => f.endsWith('.parquet'))
      .map(f => f.replace('.parquet', '').toUpperCase());

    // Find missing tickers (in registry but not in parquet)
    const parquetSet = new Set(parquetTickers);
    const missing = registryTickers.filter(t => !parquetSet.has(t.ticker.toUpperCase()));

    res.json({
      missing,
      count: missing.length,
      registryTotal: registryTickers.length,
      parquetTotal: parquetTickers.length,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Download queue (what will be downloaded based on fillGaps setting)
router.get('/queue', async (req, res) => {
  try {
    const fillGaps = req.query.fillGaps === 'true';

    // Get all registry tickers
    const registryTickers = await atlasDb.getTickerRegistry();
    const activeTickers = registryTickers.filter(t => t.isActive !== false);

    if (!fillGaps) {
      // Full download: return all active tickers
      res.json({
        tickers: activeTickers.map(t => ({
          ticker: t.ticker,
          name: t.name,
          assetType: t.assetType,
          isActive: t.isActive,
        })),
        count: activeTickers.length,
      });
    } else {
      // Fill gaps: return only missing tickers
      const parquetDir = path.join(__dirname, '../../data/parquet');
      await fs.mkdir(parquetDir, { recursive: true });
      const files = await fs.readdir(parquetDir);
      const parquetTickers = new Set(
        files
          .filter(f => f.endsWith('.parquet'))
          .map(f => f.replace('.parquet', '').toUpperCase())
      );

      const missingTickers = activeTickers.filter(
        t => !parquetTickers.has(t.ticker.toUpperCase())
      );

      res.json({
        tickers: missingTickers.map(t => ({
          ticker: t.ticker,
          name: t.name,
          assetType: t.assetType,
          isActive: t.isActive,
        })),
        count: missingTickers.length,
      });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get tickers with missing metadata
router.get('/registry/missing-metadata', async (req, res) => {
  try {
    const missing = await atlasDb.getMissingMetadata();
    res.json({
      tickers: missing,
      count: missing.length,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Enrich ticker metadata from Tiingo API
router.post('/registry/enrich', async (req, res) => {
  try {
    const { tickers } = req.body;

    if (!tickers || !Array.isArray(tickers) || tickers.length === 0) {
      return res.status(400).json({ error: 'Tickers array required' });
    }

    if (!tiingoApiKey) {
      return res.status(400).json({ error: 'Tiingo API key not configured' });
    }

    let enrichedCount = 0;
    const errors = [];

    // Enrich each ticker (with rate limiting)
    for (let i = 0; i < tickers.length; i++) {
      const ticker = tickers[i];

      try {
        // Call Tiingo metadata endpoint
        const url = `https://api.tiingo.com/tiingo/daily/${ticker}`;
        const response = await fetch(url, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Token ${tiingoApiKey}`,
          },
        });

        if (response.ok) {
          const metadata = await response.json();
          await atlasDb.updateTickerMetadata(ticker, {
            name: metadata.name,
            description: metadata.description,
            exchange: metadata.exchangeCode,
            startDate: metadata.startDate,
            endDate: metadata.endDate,
          });
          enrichedCount++;
        } else {
          errors.push({ ticker, error: `HTTP ${response.status}` });
        }

        // Rate limiting: 0.2 second delay between requests
        if (i < tickers.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      } catch (error) {
        errors.push({ ticker, error: error.message });
      }
    }

    res.json({
      success: true,
      enrichedCount,
      totalRequested: tickers.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get full ticker database (combines parquet files with registry metadata)
router.get('/database', async (req, res) => {
  try {
    const parquetDir = path.join(__dirname, '../../data/parquet');
    await fs.mkdir(parquetDir, { recursive: true });

    // Get all parquet files with their modification times
    const files = await fs.readdir(parquetDir);
    const parquetFiles = files.filter(f => f.endsWith('.parquet'));

    // Get file stats for last_synced timestamps
    const fileStats = await Promise.all(
      parquetFiles.map(async (file) => {
        const filePath = path.join(parquetDir, file);
        const stats = await fs.stat(filePath);
        return {
          ticker: file.replace('.parquet', ''),
          lastSynced: stats.mtime.toISOString(),
        };
      })
    );

    // Create a map of ticker -> lastSynced
    const lastSyncedMap = new Map(
      fileStats.map(f => [f.ticker.toUpperCase(), f.lastSynced])
    );

    // Get registry metadata
    const registryTickers = await atlasDb.getTickerRegistry();

    // Combine parquet file info with registry metadata
    const database = registryTickers.map(ticker => ({
      ticker: ticker.ticker,
      name: ticker.name || '—',
      assetType: ticker.assetType || '—',
      exchange: ticker.exchange || '—',
      isActive: ticker.isActive !== false,
      lastSynced: lastSyncedMap.get(ticker.ticker?.toUpperCase()) || null,
      startDate: ticker.startDate || '—',
      endDate: ticker.endDate || '—',
      currency: ticker.currency || 'USD',
    }));

    // Sort by ticker name
    database.sort((a, b) => a.ticker.localeCompare(b.ticker));

    res.json({
      tickers: database,
      total: database.length,
      withData: fileStats.length,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Helper function to run batch download
async function runBatchDownload(fillGaps, source) {
  const pythonScript = path.join(__dirname, '../../python/batch_download.py');
  const params = JSON.stringify({
    fill_gaps: fillGaps,
    batch_size: syncState.config.batchSize,
    sleep_seconds: syncState.config.sleepSeconds,
  });

  currentProcess = spawn('python', [pythonScript, params]);

  let stdout = '';
  let stderr = '';

  currentProcess.stdout.on('data', (data) => {
    stdout += data.toString();

    // Try to parse progress updates
    const lines = data.toString().split('\n');
    for (const line of lines) {
      if (line.includes('PROGRESS:')) {
        try {
          const progressData = JSON.parse(line.replace('PROGRESS:', ''));
          syncState.status.currentJob.syncedCount = progressData.completed;
          syncState.status.currentJob.tickerCount = progressData.total;
        } catch (e) {
          // Ignore parse errors
        }
      }
    }
  });

  currentProcess.stderr.on('data', (data) => {
    stderr += data.toString();
    console.log('[Batch Download] stderr:', data.toString());
  });

  currentProcess.on('close', async (code) => {
    syncState.status.isRunning = false;

    const syncData = {
      date: new Date().toLocaleString(),
      status: code === 0 ? 'success' : 'error',
      syncedCount: syncState.status.currentJob?.syncedCount || 0,
      tickerCount: syncState.status.currentJob?.tickerCount || 0,
    };

    syncState.lastSync[source] = syncData;

    // Persist to database
    try {
      await atlasDb.setLastSyncState(source, syncData);
    } catch (e) {
      console.error('Failed to persist lastSync state:', e);
    }

    syncState.status.currentJob = null;
    currentProcess = null;
  });
}

export default router;
