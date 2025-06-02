///Users/patrick/Projects/Teralynk/backend/src/api/storageRecommendations.mjs
/**
 * Teralynk API – Storage Recommendations Endpoint
 * -----------------------------------------------
 * Recommends optimal storage providers by price, speed, latency, region, and usage patterns.
 */

import express from 'express';
import logger from '../utils/logger.mjs';
import { getStorageRecommendations } from '../services/storageService.mjs';

const router = express.Router();

/**
 * GET /api/storage/recommendations
 * Returns a list of optimized storage provider recommendations.
 */
router.get('/recommendations', async (req, res) => {
  const userId = req.headers['x-user-id'] || req.query.userId;

  if (!userId) {
    logger.warn('Missing userId in request to /storage/recommendations');
    return res.status(400).json({ error: 'Missing required userId header or query param' });
  }

  try {
    const recommendations = await getStorageRecommendations(userId);
    res.json({ userId, recommendations });
  } catch (error) {
    logger.error('Failed to fetch storage recommendations', { userId, error: error.message });
    res.status(500).json({ error: 'Failed to generate storage recommendations' });
  }
});

export default router;
