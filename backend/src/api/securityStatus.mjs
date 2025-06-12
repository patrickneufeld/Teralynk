// ✅ FILE: /backend/src/api/securityStatus.mjs

import express from 'express';
import { query } from '../config/db.mjs';
import { logInfo, logError } from '../utils/logger.mjs';
import { requireAuth } from '../middleware/authMiddleware.mjs';

const router = express.Router();

/**
 * @route GET /api/security/status
 * @desc Returns security posture for a given user
 * @query userId=UUID
 */
router.get('/', requireAuth, async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: 'Missing required query parameter: userId' });
    }

    // 1. MFA check
    const mfaQuery = `SELECT mfa_enabled FROM users WHERE id = $1;`;
    const { rows: mfaRows } = await query(mfaQuery, [userId]);
    const mfaEnabled = mfaRows?.[0]?.mfa_enabled === true;

    // 2. Password hash length estimate
    const passwordQuery = `SELECT LENGTH(password_hash) AS hash_length FROM users WHERE id = $1;`;
    const { rows: pwRows } = await query(passwordQuery, [userId]);
    const hashLength = parseInt(pwRows?.[0]?.hash_length || 0, 10);

    let passwordStrength = 'weak';
    if (hashLength > 100) passwordStrength = 'strong';
    else if (hashLength > 60) passwordStrength = 'moderate';

    // 3. Session count
    const sessionQuery = `
      SELECT COUNT(*) AS active_sessions 
      FROM auth_sessions 
      WHERE user_id = $1 AND expires_at > NOW();
    `;
    const { rows: sessionRows } = await query(sessionQuery, [userId]);
    const activeSessions = parseInt(sessionRows?.[0]?.active_sessions || 0, 10);

    // 4. Risk score estimation
    let riskLevel = 'low';
    if (!mfaEnabled || passwordStrength === 'weak') riskLevel = 'high';
    else if (passwordStrength === 'moderate') riskLevel = 'medium';

    const securityStatus = {
      mfaEnabled,
      passwordStrength,
      securityScore: passwordStrength === 'strong' ? 90 : passwordStrength === 'moderate' ? 70 : 40,
      activeThreats: 0, // Reserved for future threat detection module
      activeSessions,
      riskLevel,
    };

    logInfo('🔐 Security status fetched', { userId, securityStatus });
    res.status(200).json(securityStatus);
  } catch (error) {
    logError('❌ Error fetching security status', { error: error.message });
    res.status(500).json({ error: 'Failed to retrieve security status' });
  }
});

export default router;
