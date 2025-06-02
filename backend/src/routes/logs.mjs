// ✅ FILE: /Users/patrick/Projects/Teralynk/backend/src/routes/logs.js

import express from 'express';
import logger from '../utils/logger.mjs';

const router = express.Router();

/**
 * ✅ General logging endpoint
 */
router.post('/', async (req, res) => {
  try {
    const logData = req.body;
    
    // Log to console for development
    console.log('[LOG]', JSON.stringify(logData));
    
    // In production, you would store this in a database
    
    res.status(200).json({ success: true, message: 'Log recorded' });
  } catch (error) {
    console.error('[Logs Error]', error);
    res.status(500).json({ success: false, error: 'Failed to record log' });
  }
});

/**
 * ✅ Error logging endpoint
 */
router.post('/error', async (req, res) => {
  try {
    const errorData = req.body;
    
    // Log to console for development
    console.error('[ERROR LOG]', JSON.stringify(errorData));
    
    // In production, you would store this in a database
    
    res.status(200).json({ success: true, message: 'Error log recorded' });
  } catch (error) {
    console.error('[Error Logs Error]', error);
    res.status(500).json({ success: false, error: 'Failed to record error log' });
  }
});

export default router;
