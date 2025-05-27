///Users/patrick/Projects/Teralynk/backend/src/api/storageUsage.mjs
// ================================================
// 🔐 Hardened API Route: Storage Usage API
// ================================================

import express from 'express';
import { getStorageUsage } from '../services/storageService.mjs';
import { validateRequestContext } from '../middleware/contextValidationMiddleware.mjs';
import logger, { logInfo, logError } from '../utils/logger.mjs';

const router = express.Router();

/**
 * GET /api/storage/usage
 * Retrieves storage usage details for the authenticated user
 */
router.get('/usage', validateRequestContext, async (req, res) => {
  const userId = req.context?.user?.id;

  if (!userId) {
    logError('Storage Usage: Missing user ID in context', { route: '/api/storage/usage' });
    return res.status(400).json({ error: 'User ID is required' });
  }

  try {
    logInfo('Fetching storage usage', { userId });

    const usageData = await getStorageUsage(userId);

    if (!usageData) {
      logError('No storage usage data returned', { userId });
      return res.status(404).json({ error: 'No storage usage data found' });
    }

    res.json({
      userId,
      usage: usageData.usage || 0,
      quota: usageData.quota || null,
      locations: usageData.locations || [],
      lastUpdated: usageData.lastUpdated || new Date().toISOString(),
    });
  } catch (error) {
    logError('Error fetching storage usage', { error, userId });
    res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
});

export default router;
