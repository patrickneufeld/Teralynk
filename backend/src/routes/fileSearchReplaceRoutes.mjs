// ✅ FILE: /Users/patrick/Projects/Teralynk/backend/src/routes/fileSearchReplaceRoutes.mjs

import express from 'express';
import { authenticate } from '../middleware/authMiddleware.mjs';
import aiFileSearchReplace from '../ai/aiFileSearchReplace.mjs';
import { logInfo, logError } from '../utils/logger.mjs';

const router = express.Router();

/**
 * POST /api/files/search-replace
 * AI searches and replaces keywords in the file's content
 */
router.post('/search-replace', authenticate, async (req, res) => {
  const { userId } = req.user;
  const { fileId, query, replaceText } = req.body;

  if (!fileId || !query || !replaceText) {
    return res.status(400).json({
      error: 'File ID, search query, and replacement text are required.'
    });
  }

  try {
    logInfo('🔍 AI Search-and-Replace triggered', {
      userId,
      fileId,
      query,
      replaceText
    });

    const updatedContent = await aiFileSearchReplace.searchAndReplace(
      userId,
      fileId,
      query,
      replaceText
    );

    res.status(200).json({
      message: 'Search and replace completed successfully.',
      updatedContent
    });
  } catch (error) {
    logError('❌ Search and replace failed', {
      error: error.message,
      userId,
      fileId
    });
    res.status(500).json({ error: 'Failed to perform search and replace.' });
  }
});

export default router;
