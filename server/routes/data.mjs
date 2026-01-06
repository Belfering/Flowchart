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

    let tickersToDownload = [];

    if (fillGaps) {
      // Get missing tickers only
      const registryTickers = await atlasDb.getTickerRegistry();
      const parquetDir = path.join(__dirname, '../../data/parquet');
      await fs.mkdir(parquetDir, { recursive: true });
      const files = await fs.readdir(parquetDir);
      const parquetTickers = files
        .filter(f => f.endsWith('.parquet'))
        .map(f => f.replace('.parquet', '').toUpperCase());

      const parquetSet = new Set(parquetTickers);
      const missing = registryTickers.filter(t => !parquetSet.has(t.ticker.toUpperCase()));

      tickersToDownload = missing.map(t => t.originalTicker);
    } else {
      // Download all tickers from registry
      const registryTickers = await atlasDb.getTickerRegistry();

      if (registryTickers.length === 0) {
        return res.status(400).json({
          error: 'No tickers in registry. Sync Tiingo registry first.'
        });
      }

      tickersToDownload = registryTickers.map(t => t.originalTicker);
    }

    if (tickersToDownload.length === 0) {
      return res.json({
        success: true,
        message: 'No tickers to download',
        tickerCount: 0,
      });
    }

    syncState.status.isRunning = true;
    syncState.status.currentJob = {
      pid: null,
      syncedCount: 0,
      tickerCount: tickersToDownload.length,
      startedAt: Date.now(),
      phase: 'downloading',
      source: 'yfinance',
    };

    res.json({
      success: true,
      jobId: 'yfinance-' + Date.now(),
      tickerCount: tickersToDownload.length,
    });

    // Run batch download in background
    runBatchDownload(tickersToDownload, 'yfinance');
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

// Helper function to run batch download
async function runBatchDownload(tickers, source) {
  const pythonScript = path.join(__dirname, '../../python/batch_download.py');
  const params = JSON.stringify({
    tickers,
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

  currentProcess.on('close', (code) => {
    syncState.status.isRunning = false;

    if (code === 0) {
      syncState.lastSync[source] = {
        date: new Date().toLocaleString(),
        status: 'success',
        syncedCount: syncState.status.currentJob?.syncedCount || 0,
        tickerCount: syncState.status.currentJob?.tickerCount || 0,
      };
    } else {
      syncState.lastSync[source] = {
        date: new Date().toLocaleString(),
        status: 'error',
        syncedCount: syncState.status.currentJob?.syncedCount || 0,
        tickerCount: syncState.status.currentJob?.tickerCount || 0,
      };
    }

    syncState.status.currentJob = null;
    currentProcess = null;
  });
}

export default router;
