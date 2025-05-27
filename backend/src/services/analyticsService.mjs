// ✅ FILE: /backend/src/services/analyticsService.mjs

import { query } from '../config/db.mjs';
import logger from '../utils/logger.mjs';

/**
 * Retrieves activity statistics for a user or admin.
 * @param {string|null} userId - ID of the user making the request.
 * @param {string} role - Role of the user (e.g., 'admin', 'user').
 * @returns {Promise<Object>} - Object containing aggregated activity data.
 */
export async function getActivityStats(userId, role) {
  try {
    logger.logInfo('📈 Fetching activity stats', { userId, role });

    let sql;
    let params = [];

    if (role === 'admin') {
      // Admins get system-wide stats
      sql = `
        SELECT 
          COUNT(*) AS total_activities,
          COUNT(DISTINCT user_id) AS unique_users,
          MAX(timestamp) AS last_activity,
          MIN(timestamp) AS first_activity
        FROM activity_logs
        WHERE timestamp >= NOW() - INTERVAL '30 days'
      `;
    } else if (userId) {
      // Regular users get their own stats
      sql = `
        SELECT 
          COUNT(*) AS total_activities,
          MAX(timestamp) AS last_activity,
          MIN(timestamp) AS first_activity
        FROM activity_logs
        WHERE user_id = $1
          AND timestamp >= NOW() - INTERVAL '30 days'
      `;
      params = [userId];
    } else {
      throw new Error('Unauthorized or unauthenticated request');
    }

    const { rows } = await query(sql, params);
    const stats = rows?.[0] || {};

    logger.logInfo('✅ Activity stats retrieved', { userId, role, stats });

    return {
      totalActivities: Number(stats.total_activities || 0),
      uniqueUsers: stats.unique_users ? Number(stats.unique_users) : undefined,
      lastActivity: stats.last_activity || null,
      firstActivity: stats.first_activity || null
    };
  } catch (error) {
    logger.logError('❌ Error retrieving activity stats', { error: error.message, userId });
    throw error;
  }
}
