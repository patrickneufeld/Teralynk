// ================================================
// ✅ FILE: /backend/src/api/dashboardMetrics.mjs
// Dashboard-wide metrics aggregation API
// ================================================

import express from 'express';
import { query } from '../config/db.mjs';
import logger from '../utils/logger.mjs';
import { requireAuth } from '../middleware/authMiddleware.mjs';

const router = express.Router();

/**
 * @route GET /api/dashboard/metrics
 * @desc Returns AI + storage + usage metrics for dashboard visualizations
 * @query userId=UUID
 */
router.get('/', requireAuth, async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({ error: 'Missing required query parameter: userId' });
    }

    // Query 1: Total workflows executed
    const { rows: workflowRows } = await query(
      `SELECT COUNT(*) AS total_workflows FROM workflow_usage WHERE user_id = $1;`,
      [userId]
    );
    const totalWorkflows = parseInt(workflowRows[0]?.total_workflows || 0, 10);

    // Query 2: Storage usage in bytes
    const { rows: storageRows } = await query(
      `SELECT COALESCE(SUM(size_bytes), 0) AS total_storage_bytes FROM storage_usage WHERE user_id = $1;`,
      [userId]
    );
    const totalStorageBytes = parseInt(storageRows[0]?.total_storage_bytes || 0, 10);

    // Query 3: AI interactions logged
    const { rows: aiRows } = await query(
      `SELECT COUNT(*) AS total_ai_interactions FROM ai_interactions WHERE user_id = $1;`,
      [userId]
    );
    const totalAIInteractions = parseInt(aiRows[0]?.total_ai_interactions || 0, 10);

    // Query 4: Files uploaded
    const { rows: fileRows } = await query(
      `SELECT COUNT(*) AS total_files FROM user_files WHERE user_id = $1;`,
      [userId]
    );
    const totalFiles = parseInt(fileRows[0]?.total_files || 0, 10);

    // Final aggregated response
    const metrics = {
      totalWorkflows,
      totalStorageGB: +(totalStorageBytes / 1e9).toFixed(2),
      totalAIInteractions,
      totalFiles,
    };

    logger.info('📊 Dashboard metrics fetched', { userId, metrics });
    res.status(200).json(metrics);
  } catch (err) {
    logger.error('❌ Failed to fetch dashboard metrics', { error: err.message });
    res.status(500).json({ error: 'Failed to retrieve dashboard metrics' });
  }
});

export default router;
