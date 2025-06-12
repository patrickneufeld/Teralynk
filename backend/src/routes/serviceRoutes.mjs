// ✅ FILE PATH: backend/src/routes/serviceRoutes.mjs

import express from 'express';
import { requireAuth } from '../middleware/authMiddleware.mjs';
import { validateRequestContext } from '../middleware/contextValidationMiddleware.mjs';

const router = express.Router();

// ----------------------------
// ✅ Dynamic Controller Import (Hardened for ESM)
// ----------------------------
let controller;

try {
  controller = await import('../controllers/serviceController.mjs');
  const required = ['addUserService', 'getAvailableServices'];
  const missing = required.filter(fn => typeof controller[fn] !== 'function');

  if (missing.length > 0) {
    throw new Error(`Missing required functions in serviceController: ${missing.join(', ')}`);
  }

  console.log('✅ serviceController loaded successfully');
} catch (error) {
  console.error('❌ Failed to load serviceController', {
    error: error.message,
    stack: error.stack,
  });

  controller = {
    addUserService: (req, res) => {
      res.status(500).json({ error: 'Service unavailable - fallback active' });
    },
    getAvailableServices: (req, res) => {
      res.status(500).json({ error: 'Service list unavailable - fallback active' });
    },
  };
}

// ----------------------------
// ✅ Service Routes
// ----------------------------

/**
 * @route   POST /api/services
 * @desc    Add a new AI or storage service for a user
 * @access  Private
 */
router.post('/', requireAuth, validateRequestContext, controller.addUserService);

/**
 * @route   GET /api/services
 * @desc    List all globally available services
 * @access  Public
 */
router.get('/', controller.getAvailableServices);

export default router;
