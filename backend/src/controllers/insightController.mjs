import { query } from '../config/db.mjs';
import logger from '../utils/logger.mjs';

/**
 * Retrieves AI insights for the authenticated user from `ai_insights` table.
 * 
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 */
export async function getUserInsights(req, res) {
  const userId = req.user?.id;

  if (!userId) {
    logger.logWarn('Missing user ID in request context');
    return res.status(400).json({ error: 'User ID is required' });
  }

  try {
    const { rows } = await query(
      `SELECT id, insight_type, insight_content, created_at
       FROM ai_insights
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 50`,
      [userId]
    );

    res.status(200).json({ insights: rows });
  } catch (error) {
    logger.logError('getUserInsights failed', { error, userId });
    res.status(500).json({ error: 'Failed to retrieve AI insights' });
  }
}
