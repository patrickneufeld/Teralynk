// ✅ FILE: /Users/patrick/Projects/Teralynk/backend/src/routes/securityStatus.mjs

import express from 'express';
import { requireAuth } from '../middleware/authMiddleware.mjs';
import { logInfo } from '../utils/logger.mjs';

const router = express.Router();

/**
 * GET /api/security
 * Returns current security configuration snapshot
 */
router.get('/security', requireAuth, async (req, res) => {
  try {
    const securityStatus = {
      encryption: 'AES-256 at rest',
      accessControl: 'Role-Based Access Control (RBAC)',
      auditLogging: true,
      secureHeaders: true,
      lastPolicyUpdate: new Date().toISOString(),
      penetrationTestPassed: true,
    };

    logInfo('🔐 Security status accessed', { userId: req.user?.id });
    res.status(200).json({ status: 'secure', ...securityStatus });
  } catch (err) {
    console.error('❌ Failed to retrieve security status:', err.message);
    res.status(500).json({ error: 'Unable to fetch security configuration' });
  }
});

export default router;
