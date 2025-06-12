import express from 'express';
import { requireAuth } from '../middleware/authMiddleware.mjs';
import { validateRequestContext } from '../middleware/contextValidationMiddleware.mjs';

const router = express.Router();

// ✅ Dynamic Controller Import
let controller;
try {
  controller = await import('../controllers/insightController.mjs');
  if (!controller.getUserInsights) {
    throw new Error('Missing required function: getUserInsights');
  }
  console.log('✅ insightController loaded successfully');
} catch (error) {
  console.error('❌ Failed to load insightController', { error });
  controller = {
    getUserInsights: async (req, res) => {
      res.status(500).json({ error: 'Insight service unavailable' });
    },
  };
}

// ✅ Routes

/**
 * @route GET /api/insights
 * @desc Retrieve AI insights for the authenticated user
 * @access Private
 */
router.get('/', requireAuth, validateRequestContext, controller.getUserInsights);

export default router;
