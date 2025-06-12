import express from 'express';
import { query } from '../config/db.mjs';
import { requireAuth } from '../middleware/authMiddleware.mjs';
import { validateRequestContext } from '../middleware/contextValidationMiddleware.mjs';
import logger from '../utils/logger.mjs';

const router = express.Router();

/**
 * @route GET /api/user-data
 * @desc Return comprehensive profile data for the logged-in user
 * Includes name, email, membership date, and optionally: storage stats, activity stats
 */
router.get('/user-data', requireAuth, validateRequestContext, async (req, res) => {
  const userId = req.user?.id;

  if (!userId) {
    logger.warn('[userData] Missing user ID in request context');
    return res.status(401).json({ error: 'Unauthorized. User ID missing.' });
  }

  try {
    // --- Pull user profile info
    const userQuery = `
      SELECT id, name, email, created_at AS member_since
      FROM users
      WHERE id = $1
      LIMIT 1;
    `;
    const { rows: userRows } = await query(userQuery, [userId]);
    if (!userRows.length) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const user = userRows[0];

    // --- Pull latest storage usage stats
    const usageQuery = `
      SELECT total_bytes, last_updated
      FROM storage_usage
      WHERE user_id = $1
      ORDER BY last_updated DESC
      LIMIT 1;
    `;
    const { rows: usageRows } = await query(usageQuery, [userId]);
    const storageUsage = usageRows[0] || { total_bytes: 0, last_updated: null };

    // --- Pull last 7-day activity count from activity_logs
    const activityQuery = `
      SELECT COUNT(*) AS recent_activity_count
      FROM activity_logs
      WHERE user_id = $1
        AND timestamp >= NOW() - INTERVAL '7 days';
    `;
    const { rows: activityRows } = await query(activityQuery, [userId]);
    const activityStats = activityRows[0] || { recent_activity_count: 0 };

    // --- Assemble full response
    const response = {
      id: user.id,
      name: user.name,
      email: user.email,
      memberSince: user.member_since,
      storage: {
        totalBytes: Number(storageUsage.total_bytes || 0),
        lastUpdated: storageUsage.last_updated,
      },
      recentActivity: {
        past7Days: parseInt(activityStats.recent_activity_count, 10),
      }
    };

    logger.info('[userData] User data retrieved', { userId });
    res.status(200).json(response);
  } catch (err) {
    logger.error('[userData] Failed to retrieve user data', { userId, error: err.message });
    res.status(500).json({ error: 'An error occurred while retrieving user data.' });
  }
});

export default router;
