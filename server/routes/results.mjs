import express from 'express';
import { atlasDb } from '../db/index.mjs';

const router = express.Router();

// GET /api/results/jobs - Get all jobs (MUST come before /:jobId route)
router.get('/jobs', async (req, res) => {
  try {
    const jobs = await atlasDb.getAllJobs();
    res.json(jobs);
  } catch (error) {
    console.error('Get jobs error:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/results/:jobId/csv - Export results as CSV (MUST come before /:jobId route)
router.get('/:jobId/csv', async (req, res) => {
  try {
    const jobId = parseInt(req.params.jobId);
    const results = await atlasDb.getResults(jobId, 'isTimar', 'desc', null);

    if (results.length === 0) {
      return res.status(404).send('No results found');
    }

    // Generate CSV headers
    const headers = Object.keys(results[0]);
    const csvHeaders = headers.join(',');

    // Generate CSV rows
    const csvRows = results.map(result => {
      return headers.map(header => {
        const value = result[header];
        // Escape values with commas or quotes
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value !== null && value !== undefined ? value : '';
      }).join(',');
    });

    const csv = [csvHeaders, ...csvRows].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="results_job${jobId}.csv"`);
    res.send(csv);
  } catch (error) {
    console.error('CSV export error:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/results/:jobId - Get results for a job
router.get('/:jobId', async (req, res) => {
  try {
    const jobId = parseInt(req.params.jobId);
    const sortBy = req.query.sortBy || 'isTimar';
    const order = req.query.order || 'desc';
    const limit = req.query.limit ? parseInt(req.query.limit) : 1000;

    const results = await atlasDb.getResults(jobId, sortBy, order, limit);

    res.json(results);
  } catch (error) {
    console.error('Get results error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
