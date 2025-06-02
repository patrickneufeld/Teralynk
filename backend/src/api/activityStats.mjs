// ✅ FILE: /backend/src/api/activityStats.mjs

import express from 'express';
import { getActivityStats } from '../services/analyticsService.mjs';
import { validateRequestContext } from '../middleware/contextValidationMiddleware.mjs';
import { logError, logInfo } from '../utils/logger.mjs';

const router = express.Router();

/**
 * @route GET /api/activity/stats
 * @desc Retrieve system or user-level activity statistics
 * @access Authenticated users only
 */
router.get('/', validateRequestContext, async (req, res) => {
  const userId = req.user?.id || null;
  const role = req.user?.role || 'unknown';

  logInfo('📊 Request received for activity stats', { userId, role });

  try {
    const stats = await getActivityStats(userId, role);

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    logError('❌ Failed to fetch activity stats', { error: error.message, userId });

    res.status(500).json({
      success: false,
      message: 'Internal Server Error while retrieving activity statistics',
      error: error.message,
    });
  }
});

export default router;
