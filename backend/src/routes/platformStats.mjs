// ✅ FILE: /Users/patrick/Projects/Teralynk/backend/src/routes/platformStats.mjs

import express from 'express';
import { requireAuth } from '../middleware/authMiddleware.mjs';
import { logInfo } from '../utils/logger.mjs';

const router = express.Router();

/**
 * GET /api/platform
 * Provides system-level platform metadata
 */
router.get('/platform', requireAuth, async (req, res) => {
  try {
    const data = {
      name: 'Teralynk',
      region: process.env.AWS_REGION || 'us-east-1',
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0',
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    };

    logInfo('📊 Platform stats retrieved', data);
    res.status(200).json({ status: 'operational', ...data });
  } catch (err) {
    console.error('❌ Failed to retrieve platform stats:', err.message);
    res.status(500).json({ error: 'Unable to fetch platform stats' });
  }
});

export default router;
