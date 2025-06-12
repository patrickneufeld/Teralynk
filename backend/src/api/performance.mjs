// ✅ FILE: /backend/src/api/performance.mjs

import express from 'express';
import { spawn } from 'child_process';
import logger from '../utils/logger.mjs';
import { requireAuth } from '../middleware/authMiddleware.mjs';

const router = express.Router();

/**
 * @route GET /api/performance
 * @desc Executes performance analyzer Python script and returns AI trend suggestion
 */
router.get('/', requireAuth, async (req, res) => {
  try {
    const scriptPath = new URL('./performance_analyzer.py', import.meta.url).pathname;
    logger.info('📈 Executing AI performance analyzer script...', { scriptPath });

    const python = spawn('python3', [scriptPath]);

    let output = '';
    let errorOutput = '';

    python.stdout.on('data', (data) => {
      output += data.toString();
    });

    python.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    python.on('close', (code) => {
      if (code !== 0) {
        logger.error('❌ Python script exited with error', { code, errorOutput });
        return res.status(500).json({ error: 'Failed to analyze AI performance trends' });
      }

      const suggestion = output.trim();
      logger.info('✅ AI performance suggestion generated', { suggestion });
      res.status(200).json({ suggestion });
    });
  } catch (err) {
    logger.error('❌ Internal server error during performance analysis', { error: err.message });
    res.status(500).json({ error: 'Internal server error during AI trend analysis' });
  }
});

export default router;
