import express from 'express';
import { atlasDb } from '../db/index.mjs';
import { forgeJobs, forgeConfigs } from '../db/schema.mjs';
import { eq } from 'drizzle-orm';

const router = express.Router();

// POST /api/forge/start - Start branch generation
router.post('/start', async (req, res) => {
  try {
    const { config } = req.body;

    // Save config
    const configResult = await atlasDb.insert(forgeConfigs).values({
      name: `Run ${new Date().toISOString()}`,
      configJson: JSON.stringify(config),
    }).returning();

    // Create job
    const jobResult = await atlasDb.insert(forgeJobs).values({
      configId: configResult[0].id,
      status: 'pending',
      totalBranches: 0, // Will be calculated
      completedBranches: 0,
      passingBranches: 0,
      startedAt: new Date().toISOString(),
    }).returning();

    // TODO: Start worker pool and begin processing

    res.json({ success: true, jobId: jobResult[0].id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/forge/cancel/:jobId - Cancel job
router.post('/cancel/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;
    await atlasDb.update(forgeJobs)
      .set({ status: 'cancelled' })
      .where(eq(forgeJobs.id, parseInt(jobId)));
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/forge/status/:jobId - Get job status (for SSE)
router.get('/status/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;
    const job = await atlasDb.select()
      .from(forgeJobs)
      .where(eq(forgeJobs.id, parseInt(jobId)))
      .limit(1);

    if (job.length === 0) {
      return res.status(404).json({ error: 'Job not found' });
    }

    res.json(job[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/forge/estimate - Estimate branch count & ETA
router.post('/estimate', async (req, res) => {
  try {
    const { config } = req.body;

    // Calculate branch count
    const {
      periodMin = 5,
      periodMax = 200,
      thresholdMin = 1,
      thresholdMax = 99,
      thresholdStep = 1,
      tickers = [],
      comparators = ['LT', 'GT'],
      enableL2 = false,
    } = config;

    const periods = periodMax - periodMin + 1;
    const thresholds = Math.floor((thresholdMax - thresholdMin) / thresholdStep) + 1;
    const tickerCount = tickers.length || 1;
    const comparatorCount = comparators.length;

    let totalBranches = periods * thresholds * tickerCount * comparatorCount;

    if (enableL2) {
      // Multiply by L2 combinations (simplified)
      totalBranches *= 10; // Rough estimate
    }

    // Estimate speed: 10-50 branches/sec
    const avgSpeed = 20; // branches/sec
    const estimatedSeconds = Math.ceil(totalBranches / avgSpeed);
    const estimatedMinutes = Math.ceil(estimatedSeconds / 60);

    res.json({
      totalBranches,
      estimatedSeconds,
      estimatedMinutes,
      branchesPerSecond: avgSpeed,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/forge/configs - Save config preset
router.post('/configs', async (req, res) => {
  try {
    const { name, config } = req.body;
    const result = await atlasDb.insert(forgeConfigs).values({
      name,
      configJson: JSON.stringify(config),
    }).returning();
    res.json({ success: true, config: result[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/forge/configs - List saved presets
router.get('/configs', async (req, res) => {
  try {
    const configs = await atlasDb.select().from(forgeConfigs);
    const parsed = configs.map(c => ({
      ...c,
      config: JSON.parse(c.configJson),
    }));
    res.json(parsed);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
