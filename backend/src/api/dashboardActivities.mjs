// ================================================
// ✅ FILE: /backend/src/api/dashboardActivities.mjs
// Hardened API for fetching recent user activities
// ================================================

import express from 'express';
import { query } from '../config/db.mjs';
import logger from '../utils/logger.mjs';
import { requireAuth } from '../middleware/authMiddleware.mjs';
import { validateRequestContext } from '../middleware/contextValidationMiddleware.mjs';

const router = express.Router();

/**
 * @route GET /api/dashboard/activities
 * @desc Retrieve recent user activity for dashboard display
 */
router.get('/', requireAuth, validateRequestContext, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(400).json({ error: 'Missing or invalid user ID' });
    }

    const sql = `
      SELECT id, user_id, action, file_path, details, timestamp
      FROM activity_logs
      WHERE user_id = $1
      ORDER BY timestamp DESC
      LIMIT 50;
    `;

    const { rows } = await query(sql, [userId]);

    const activities = rows.map(row => ({
      id: row.id,
      userId: row.user_id,
      action: row.action,
      filePath: row.file_path,
      details: row.details,
      timestamp: row.timestamp,
    }));

    logger.debug('✅ /api/dashboard/activities - fetched recent activities', {
      userId,
      count: activities.length,
    });

    res.status(200).json(activities);
  } catch (err) {
    logger.error('❌ Failed to fetch dashboard activities', {
      error: err.message,
      stack: err.stack,
    });
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
