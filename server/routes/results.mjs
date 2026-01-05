import express from 'express';
import { resultsDb } from '../db/index.mjs';
import { branches } from '../db/schema.mjs';
import { eq, desc } from 'drizzle-orm';

const router = express.Router();

// GET /api/results/:jobId - Get passing branches
router.get('/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;
    const { sortBy = 'is_timar', order = 'desc', limit = 1000 } = req.query;

    const results = await resultsDb.select()
      .from(branches)
      .where(eq(branches.jobId, parseInt(jobId)))
      .orderBy(order === 'desc' ? desc(branches[sortBy]) : branches[sortBy])
      .limit(parseInt(limit));

    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/results/:jobId/csv - Export to CSV
router.get('/:jobId/csv', async (req, res) => {
  try {
    const { jobId } = req.params;

    const results = await resultsDb.select()
      .from(branches)
      .where(eq(branches.jobId, parseInt(jobId)));

    if (results.length === 0) {
      return res.status(404).json({ error: 'No results found' });
    }

    // Generate CSV
    const headers = Object.keys(results[0]).join(',');
    const rows = results.map(row =>
      Object.values(row).map(v =>
        typeof v === 'string' && v.includes(',') ? `"${v}"` : v
      ).join(',')
    );
    const csv = [headers, ...rows].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="results_job${jobId}.csv"`);
    res.send(csv);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/results/:jobId/trade-log/:branchId - Get trade log
router.get('/:jobId/trade-log/:branchId', async (req, res) => {
  try {
    const { branchId } = req.params;

    const branch = await resultsDb.select()
      .from(branches)
      .where(eq(branches.id, parseInt(branchId)))
      .limit(1);

    if (branch.length === 0) {
      return res.status(404).json({ error: 'Branch not found' });
    }

    // TODO: Read trade log from file path
    const tradeLogPath = branch[0].tradeLogPath;

    res.json({ path: tradeLogPath, trades: [] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
