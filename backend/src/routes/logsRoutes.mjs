// ✅ FILE: /backend/src/routes/logRoutes.mjs

import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { query } from '../config/db.mjs';
import { logInfo, logError } from '../utils/bootstrapLogger.mjs';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const LOG_DIR = path.resolve(__dirname, '../../logs');

// Ensure log directory exists
try {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true, mode: 0o755 });
  }
} catch (err) {
  console.error('❌ Failed to create logs directory:', err);
  process.exit(1);
}

// --------------------------------------
// ✅ POST /logs/activity
// --------------------------------------
router.post('/activity', async (req, res) => {
  try {
    const {
      userId,
      action,
      timestamp = new Date().toISOString(),
      details = {}
    } = req.body;

    if (!userId || !action) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: userId and action'
      });
    }

    await query(
      `INSERT INTO activity_logs (user_id, action, timestamp, details)
       VALUES ($1, $2, $3, $4)`,
      [userId, action, timestamp, JSON.stringify(details)]
    );

    logInfo('✅ Activity log saved', { userId, action, timestamp });
    return res.status(200).json({ success: true });
  } catch (err) {
    logError('❌ Failed to save activity log', { error: err.message });
    return res.status(500).json({
      success: false,
      error: 'Failed to save activity log'
    });
  }
});

// --------------------------------------
// ✅ POST /logs
// --------------------------------------
router.post('/', async (req, res) => {
  try {
    const { level = 'info', message, meta = {} } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Missing or invalid log message'
      });
    }

    const timestamp = new Date().toISOString();
    const safeMeta = typeof meta === 'object' ? meta : { invalidMeta: meta };

    const entry = JSON.stringify({
      timestamp,
      level: level.toUpperCase(),
      message,
      meta: safeMeta
    }) + '\n';

    const logFile = path.join(LOG_DIR, 'frontend.log');

    await fs.promises.appendFile(logFile, entry, {
      encoding: 'utf8',
      mode: 0o644,
      flag: 'a'
    });

    logInfo('📥 Frontend log recorded', { level, message });
    res.status(204).end();
  } catch (err) {
    logError('❌ Frontend logging failed', { error: err.message });
    res.status(500).json({
      success: false,
      error: 'Failed to save frontend log'
    });
  }
});

export default router;
