// ✅ FILE: /backend/src/api/aiFileNamingSuggestions.mjs
// ----------------------------------------------------
// Secure endpoint for AI-based filename suggestions
// Fully authenticated, traceable, and resilient
// ----------------------------------------------------

import express from 'express';
import { getAiFileNameSuggestions } from '../services/aiFileNamingService.mjs';
import { requireAuth } from '../middleware/authMiddleware.mjs';
import { validateRequestContext } from '../middleware/contextValidationMiddleware.mjs';
import { logError, logInfo } from '../utils/logger.mjs';

const router = express.Router();

/**
 * GET /api/ai/file-naming-suggestions
 * @desc Get AI-generated filename suggestions for the authenticated user
 * @access Authenticated users only
 */
router.get('/', requireAuth, validateRequestContext, async (req, res) => {
  const userId = req.user?.id;
  const requestId = req.headers['x-request-id'] || 'req_' + crypto.randomUUID();
  const sessionId = req.headers['x-session-id'] || 'unknown';

  logInfo('🔍 [AI:FileNaming] Incoming request for suggestions', {
    userId,
    requestId,
    sessionId,
    route: req.originalUrl,
  });

  if (!userId) {
    logError('[AI:FileNaming] Missing user ID in authenticated request', {
      requestId,
      sessionId,
    });
    return res.status(400).json({ error: 'Missing or invalid user context.' });
  }

  try {
    const suggestions = await getAiFileNameSuggestions(userId);

    if (!Array.isArray(suggestions)) {
      logError('[AI:FileNaming] Invalid suggestion response', {
        userId,
        requestId,
        responseType: typeof suggestions,
      });
      return res.status(502).json({ error: 'Unexpected response from AI service.' });
    }

    logInfo('✅ [AI:FileNaming] Suggestions fetched successfully', {
      userId,
      requestId,
      suggestionCount: suggestions.length,
    });

    return res.status(200).json({ suggestions });
  } catch (err) {
    logError('[AI:FileNaming] Failed to generate suggestions', {
      userId,
      requestId,
      sessionId,
      error: err.message,
      stack: err.stack,
    });

    return res.status(500).json({
      error: 'An internal error occurred while generating AI suggestions.',
    });
  }
});

export default router;
