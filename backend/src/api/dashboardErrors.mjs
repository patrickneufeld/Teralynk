// ✅ FILE: /backend/src/api/dashboardErrors.mjs
// Hardened API for fetching user-specific backend errors and exceptions

import express from 'express';
import { query } from '../config/db.mjs';
import { requireAuth } from '../middleware/authMiddleware.mjs';
import logger from '../utils/logger.mjs';

const router = express.Router();

/**
 * @route GET /api/dashboard/errors
 * @desc Fetches recent error logs related to the authenticated user
 * @returns {Array<Object>} List of recent error events
 */
router.get('/', requireAuth, async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      logger.warn('dashboardErrors: missing user ID from auth context');
      return res.status(400).json({ error: 'Missing user context' });
    }

    const sql = `
      SELECT id, user_id, message, context, stack, severity, created_at
      FROM error_logs
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT 20;
    `;

    const { rows } = await query(sql, [userId]);

    logger.info('✅ dashboardErrors: fetched recent errors', {
      userId,
      count: rows.length,
    });

    res.status(200).json({ errors: rows });
  } catch (err) {
    logger.error('❌ dashboardErrors: failed to retrieve error logs', {
      error: err.message,
    });
    res.status(500).json({ error: 'Failed to fetch error logs' });
  }
});

export default router;
