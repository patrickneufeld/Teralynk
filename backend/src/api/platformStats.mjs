// ✅ FILE: /backend/src/api/platformStats.mjs

import express from 'express';
import { query } from '../config/db.mjs';
import { logInfo, logError } from '../utils/logger.mjs';
import { requireAuth } from '../middleware/authMiddleware.mjs';

const router = express.Router();

/**
 * @route GET /api/platform/stats
 * @desc Returns platform-wide statistics for display in dashboard
 */
router.get('/', requireAuth, async (req, res) => {
  try {
    const [usersQuery, filesQuery, sessionsQuery, storageQuery] = [
      `SELECT COUNT(*) AS total_users FROM users WHERE is_active IS NOT FALSE;`,
      `SELECT COUNT(*) AS total_files FROM user_files WHERE is_deleted IS NOT TRUE;`,
      `SELECT COUNT(*) AS active_sessions FROM auth_sessions WHERE expires_at > NOW();`,
      `SELECT ROUND(SUM(total_bytes)::numeric / 1e9, 2) AS total_storage_gb FROM storage_usage;`
    ];

    const [{ rows: userRows }, { rows: fileRows }, { rows: sessionRows }, { rows: storageRows }] = await Promise.all([
      query(usersQuery),
      query(filesQuery),
      query(sessionsQuery),
      query(storageQuery),
    ]);

    const totalUsers = parseInt(userRows?.[0]?.total_users || 0, 10);
    const totalFiles = parseInt(fileRows?.[0]?.total_files || 0, 10);
    const activeSessions = parseInt(sessionRows?.[0]?.active_sessions || 0, 10);
    const totalStorageUsed = parseFloat(storageRows?.[0]?.total_storage_gb || 0);

    const stats = {
      totalUsers,
      totalFiles,
      activeSessions,
      totalStorageUsed,
    };

    logInfo('📊 Platform stats fetched successfully', stats);
    res.status(200).json(stats);
  } catch (error) {
    logError('❌ Failed to fetch platform stats', { error: error.message });
    res.status(500).json({ error: 'Failed to fetch platform statistics.' });
  }
});

export default router;
