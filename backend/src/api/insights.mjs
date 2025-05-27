// ================================================
// ✅ FILE: /backend/src/api/insights.mjs
// Returns AI insights for the authenticated user
// ================================================

import express from 'express';
import { query } from '../config/db.mjs';
import { requireAuth } from '../middleware/authMiddleware.mjs';
import { validateRequestContext } from '../middleware/contextValidationMiddleware.mjs';
import logger from '../utils/logger.mjs';

const router = express.Router();

/**
 * @route GET /api/insights
 * @desc Get AI insights for the current user
 * @access Protected
 */
router.get('/', requireAuth, validateRequestContext, async (req, res) => {
  const userId = req.user?.id;

  try {
    const sql = `
      SELECT id, user_id, insight_type, insight_text, context_json, created_at
      FROM ai_insights
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT 100;
    `;

    const { rows } = await query(sql, [userId]);

    res.status(200).json(rows);
  } catch (err) {
    logger.error('insights.mjs: Failed to fetch insights', { userId, error: err.message });
    res.status(500).json({ error: 'Failed to retrieve AI insights' });
  }
});

export default router;
