import express from 'express';
import { atlasDb } from '../db/index.mjs';
import { downloadJobs, tickerLists } from '../db/schema.mjs';
import { eq } from 'drizzle-orm';

const router = express.Router();

// POST /api/data/download - Queue ticker download
router.post('/download', async (req, res) => {
  try {
    const { ticker, startDate, endDate } = req.body;

    // Insert download job
    const result = await atlasDb.insert(downloadJobs).values({
      ticker,
      startDate,
      endDate,
      status: 'pending',
    }).returning();

    // TODO: Trigger Python download script

    res.json({ success: true, job: result[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/data/downloads - List download jobs
router.get('/downloads', async (req, res) => {
  try {
    const jobs = await atlasDb.select().from(downloadJobs).orderBy(downloadJobs.createdAt);
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/data/downloads/:id - Cancel download
router.delete('/downloads/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await atlasDb.update(downloadJobs)
      .set({ status: 'cancelled' })
      .where(eq(downloadJobs.id, parseInt(id)));
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/data/tickers - List available parquet files
router.get('/tickers', async (req, res) => {
  try {
    // TODO: Scan parquet directory for available files
    res.json({ tickers: [] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/data/ticker-lists - Create/update ticker list
router.post('/ticker-lists', async (req, res) => {
  try {
    const { name, type, tickers } = req.body;
    const result = await atlasDb.insert(tickerLists).values({
      name,
      type,
      tickers: JSON.stringify(tickers),
    }).returning();
    res.json({ success: true, list: result[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/data/ticker-lists - Get all lists
router.get('/ticker-lists', async (req, res) => {
  try {
    const lists = await atlasDb.select().from(tickerLists);
    const parsed = lists.map(list => ({
      ...list,
      tickers: JSON.parse(list.tickers),
    }));
    res.json(parsed);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
