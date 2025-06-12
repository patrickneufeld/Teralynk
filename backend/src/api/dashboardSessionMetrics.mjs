import express from 'express';
import { query } from '../config/db.mjs';
import logger from '../utils/logger.mjs';
import { requireAuth } from '../middleware/authMiddleware.mjs';

const router = express.Router();

/**
 * @route GET /api/dashboard/session-metrics
 * @desc Returns active session metrics and trend data
 */
router.get('/', requireAuth, async (req, res) => {
  try {
    const userId = req.user?.id;

    // Total active sessions
    const activeQuery = `
      SELECT COUNT(*) AS active_sessions
      FROM auth_sessions
      WHERE expires_at > NOW();
    `;
    const { rows: activeRows } = await query(activeQuery);
    const activeSessions = parseInt(activeRows[0]?.active_sessions || 0, 10);

    // Total session count for user
    const userSessionQuery = `
      SELECT COUNT(*) AS total_user_sessions
      FROM auth_sessions
      WHERE user_id = $1;
    `;
    const { rows: userRows } = await query(userSessionQuery, [userId]);
    const totalUserSessions = parseInt(userRows[0]?.total_user_sessions || 0, 10);

    // Daily session breakdown (last 7 days)
    const dailyQuery = `
      SELECT DATE(created_at) AS day, COUNT(*) AS count
      FROM auth_sessions
      WHERE created_at >= NOW() - INTERVAL '7 days'
      GROUP BY day
      ORDER BY day ASC;
    `;
    const { rows: trendRows } = await query(dailyQuery);

    const sessionTrend = trendRows.map(row => ({
      date: row.day,
      count: parseInt(row.count, 10)
    }));

    logger.info('📈 dashboardSessionMetrics fetched', {
      userId,
      activeSessions,
      totalUserSessions,
      sessionTrend
    });

    res.status(200).json({
      activeSessions,
      totalUserSessions,
      sessionTrend
    });
  } catch (err) {
    logger.error('❌ dashboardSessionMetrics failed', { error: err.message });
    res.status(500).json({ error: 'Failed to retrieve session metrics' });
  }
});

export default router;
