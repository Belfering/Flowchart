import express from 'express';
import { atlasDb } from '../db/index.mjs';
import { generateBranches } from '../engine/branch-generator.mjs';
import { WorkerPool } from '../engine/worker-pool.mjs';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();
const activeJobs = new Map();
const sseClients = new Map();

// POST /api/forge/estimate - Estimate branch count and runtime
router.post('/estimate', async (req, res) => {
  try {
    const { config } = req.body;

    // Calculate total branches
    const periodRange = config.periodMax - config.periodMin + 1;
    const comparatorCount = config.comparator === 'BOTH' ? 2 : 1;
    const thresholdCount = Math.floor((config.thresholdMax - config.thresholdMin) / config.thresholdStep) + 1;
    const tickerCount = config.tickers.length;

    const totalBranches = periodRange * comparatorCount * thresholdCount * tickerCount;

    // Estimate: 100-500 branches/sec with optimized engine (use conservative 200)
    const estimatedSeconds = Math.ceil(totalBranches / 200);
    const estimatedMinutes = Math.round(estimatedSeconds / 60 * 10) / 10;

    res.json({
      totalBranches,
      estimatedSeconds,
      estimatedMinutes,
    });
  } catch (error) {
    console.error('Estimate error:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/forge/start - Start branch generation (OPTIMIZED)
router.post('/start', async (req, res) => {
  try {
    const { config } = req.body;

    // Calculate total branches
    const periodRange = config.periodMax - config.periodMin + 1;
    const comparatorCount = config.comparator === 'BOTH' ? 2 : 1;
    const thresholdCount = Math.floor((config.thresholdMax - config.thresholdMin) / config.thresholdStep) + 1;
    const tickerCount = config.tickers.length;
    const totalBranches = periodRange * comparatorCount * thresholdCount * tickerCount;

    // Create job
    const job = await atlasDb.createJob({
      config: config,
      status: 'running',
      totalBranches,
      completedBranches: 0,
      passingBranches: 0,
      startedAt: new Date().toISOString(),
    });

    const jobId = job.id;
    console.log(`[FORGE] Starting optimized job ${jobId} with ${totalBranches} branches`);

    // Send response immediately
    res.json({ jobId, totalBranches });

    // Start optimized Python forge engine (runs in background)
    const pythonScript = path.join(__dirname, '../../python/optimized_forge_engine.py');
    const configJson = JSON.stringify(config);

    const python = spawn('python', [pythonScript, configJson, jobId.toString()]);
    activeJobs.set(jobId, { python, status: 'running' });

    let stdout = '';
    let stderr = '';
    let lastProgressUpdate = Date.now();

    // Capture stderr for progress updates
    python.stderr.on('data', (data) => {
      stderr += data.toString();
      const lines = data.toString().split('\n');

      // Parse progress updates from stderr
      for (const line of lines) {
        if (line.includes('Progress:')) {
          // Extract progress information
          const match = line.match(/(\d+)\/(\d+) tickers.*?(\d+) passing/);
          if (match) {
            const tickersCompleted = parseInt(match[1]);
            const tickersTotal = parseInt(match[2]);
            const passingCount = parseInt(match[3]);

            // Calculate completed branches
            const branchesPerTicker = totalBranches / tickerCount;
            const completedBranches = Math.floor(tickersCompleted * branchesPerTicker);

            // Update database (throttled to every 2 seconds)
            const now = Date.now();
            if (now - lastProgressUpdate > 2000) {
              lastProgressUpdate = now;

              atlasDb.updateJob(jobId, {
                completedBranches,
                passingBranches: passingCount,
              }).catch(err => console.error('Failed to update job:', err));

              // Broadcast to SSE clients
              const clients = sseClients.get(jobId) || [];
              const message = {
                jobId,
                status: 'running',
                totalBranches,
                completedBranches,
                passingBranches: passingCount,
              };
              const data = JSON.stringify(message);
              clients.forEach(client => {
                client.write(`data: ${data}\n\n`);
              });
            }
          }
        }
      }
    });

    // Capture stdout for final result
    python.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    // Handle completion
    python.on('close', async (code) => {
      if (code !== 0) {
        console.error(`[FORGE] Job ${jobId} failed with code ${code}`);
        console.error(`[FORGE] stderr: ${stderr}`);

        await atlasDb.updateJob(jobId, {
          status: 'failed',
          error: `Python process exited with code ${code}`,
          completedAt: new Date().toISOString(),
        });

        // Notify SSE clients
        const clients = sseClients.get(jobId) || [];
        const message = {
          jobId,
          status: 'failed',
          error: `Process failed with code ${code}`,
        };
        const data = JSON.stringify(message);
        clients.forEach(client => {
          client.write(`data: ${data}\n\n`);
          client.end();
        });

        activeJobs.delete(jobId);
        sseClients.delete(jobId);
        return;
      }

      try {
        // Parse result from stdout
        const lines = stdout.trim().split('\n');
        const resultLine = lines[lines.length - 1];
        const result = JSON.parse(resultLine);

        if (!result.success) {
          throw new Error(result.error || 'Unknown error');
        }

        console.log(`[FORGE] Job ${jobId} completed: ${result.passingCount} passing branches`);
        console.log(`[FORGE] Performance: ${result.stats.branchesPerSecond.toFixed(1)} branches/sec`);

        // Save results to database (if any)
        if (result.results && result.results.length > 0) {
          console.log(`[FORGE] Saving ${result.results.length} results to database...`);

          const resultsData = result.results.map(branchResult => ({
            jobId: jobId,
            signalTicker: branchResult.ticker,
            investTicker: branchResult.ticker,
            indicator: branchResult.indicator,
            period: branchResult.period,
            comparator: branchResult.comparator,
            threshold: branchResult.threshold,
            isTim: branchResult.TIM,
            isTimar: branchResult.TIMAR,
            isMaxdd: branchResult.MaxDD,
            isCagr: branchResult.CAGR,
            isTrades: branchResult.Trades,
            isAvgHold: branchResult.AvgHold,
            isSharpe: branchResult.Sharpe,
            isDd3: branchResult.DD3,
            isDd50: branchResult.DD50,
            isDd95: branchResult.DD95,
            isTimar3: branchResult.TIMAR3,
          }));

          const savedCount = await atlasDb.batchCreateResults(resultsData);
          console.log(`[FORGE] Saved ${savedCount} results successfully`);
        }

        // Update job status
        await atlasDb.updateJob(jobId, {
          status: 'completed',
          completedBranches: totalBranches,
          passingBranches: result.passingCount,
          completedAt: new Date().toISOString(),
        });

        // Notify SSE clients
        const clients = sseClients.get(jobId) || [];
        const message = {
          jobId,
          status: 'completed',
          totalBranches,
          completedBranches: totalBranches,
          passingBranches: result.passingCount,
          stats: result.stats,
        };
        const data = JSON.stringify(message);
        clients.forEach(client => {
          client.write(`data: ${data}\n\n`);
          client.end();
        });

        activeJobs.delete(jobId);
        sseClients.delete(jobId);

      } catch (error) {
        console.error('[FORGE] Failed to parse result:', error);
        console.error('[FORGE] stdout:', stdout);

        await atlasDb.updateJob(jobId, {
          status: 'failed',
          error: `Failed to parse result: ${error.message}`,
          completedAt: new Date().toISOString(),
        });

        activeJobs.delete(jobId);
        sseClients.delete(jobId);
      }
    });

  } catch (error) {
    console.error('Start error:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/forge/stream/:jobId - SSE progress stream
router.get('/stream/:jobId', async (req, res) => {
  const jobId = parseInt(req.params.jobId);

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  // Add client to list
  if (!sseClients.has(jobId)) {
    sseClients.set(jobId, []);
  }
  sseClients.get(jobId).push(res);

  // Send initial status
  const job = await atlasDb.getJob(jobId);
  if (job) {
    const message = {
      jobId,
      status: job.status,
      totalBranches: job.totalBranches,
      completedBranches: job.completedBranches,
      passingBranches: job.passingBranches,
    };
    res.write(`data: ${JSON.stringify(message)}\n\n`);
  }

  // Remove client on disconnect
  req.on('close', () => {
    const clients = sseClients.get(jobId) || [];
    const index = clients.indexOf(res);
    if (index !== -1) {
      clients.splice(index, 1);
    }
  });
});

// POST /api/forge/cancel/:jobId - Cancel job
router.post('/cancel/:jobId', async (req, res) => {
  try {
    const jobId = parseInt(req.params.jobId);
    const activeJob = activeJobs.get(jobId);

    if (activeJob && activeJob.python) {
      // Kill Python process
      activeJob.python.kill();

      await atlasDb.updateJob(jobId, {
        status: 'cancelled',
        completedAt: new Date().toISOString(),
      });

      activeJobs.delete(jobId);

      // Notify SSE clients
      const clients = sseClients.get(jobId) || [];
      const message = {
        jobId,
        status: 'cancelled',
      };
      const data = JSON.stringify(message);
      clients.forEach(client => {
        client.write(`data: ${data}\n\n`);
        client.end();
      });
      sseClients.delete(jobId);
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Cancel error:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/forge/status/:jobId - Get job status
router.get('/status/:jobId', async (req, res) => {
  try {
    const jobId = parseInt(req.params.jobId);
    const job = await atlasDb.getJob(jobId);

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    res.json(job);
  } catch (error) {
    console.error('Status error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
