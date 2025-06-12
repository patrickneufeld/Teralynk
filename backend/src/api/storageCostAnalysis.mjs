// ✅ FILE: /backend/src/api/storageCostAnalysis.mjs

import express from 'express';
import { getStorageCostAnalysis } from '../services/storageService.mjs';
import logger from '../utils/logger.mjs';

const router = express.Router();

/**
 * @route GET /api/storage/cost-analysis
 * @desc Returns storage cost breakdown for current user
 */
router.get('/cost-analysis', async (req, res) => {
  try {
    const userId = req.user?.id || req.headers['x-user-id'];
    if (!userId) {
      return res.status(400).json({ error: 'Missing user ID in request context' });
    }

    const costData = await getStorageCostAnalysis(userId);
    res.json(costData);
  } catch (err) {
    logger.error('Failed to fetch storage cost analysis', { error: err.message });
    res.status(500).json({ error: 'Failed to retrieve storage cost analysis' });
  }
});

export default router;
