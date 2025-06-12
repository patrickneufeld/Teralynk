// ================================================
// ✅ FILE: /backend/src/api/dashboardFeedback.mjs
// Hardened endpoint for retrieving AI learning feedback
// ================================================

import express from 'express';
import { query } from '../config/db.mjs';
import logger from '../utils/logger.mjs';
import { requireAuth } from '../middleware/authMiddleware.mjs';

const router = express.Router();

/**
 * @route GET /api/dashboard/feedback
 * @desc Retrieve recent AI learning feedback entries for the dashboard
 * @returns {Array<{ id: string, message: string, timestamp: string }>}
 */
router.get('/', requireAuth, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(400).json({ error: 'Missing user context' });
    }

    const sql = `
      SELECT id, message, timestamp
      FROM ai_learning_feedback
      WHERE user_id = $1
      ORDER BY timestamp DESC
      LIMIT 10;
    `;

    const { rows } = await query(sql, [userId]);

    logger.info('📥 Dashboard AI feedback retrieved', {
      userId,
      count: rows.length
    });

    res.status(200).json({ feedback: rows });
  } catch (err) {
    logger.error('❌ Failed to retrieve AI feedback', { error: err.message });
    res.status(500).json({ error: 'Server error while retrieving feedback' });
  }
});

export default router;
