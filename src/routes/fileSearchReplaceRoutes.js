const express = require('express');
const { authenticate } = require('../middleware/authMiddleware');
const aiFileSearchReplace = require('../ai/aiFileSearchReplace'); // Assuming AI integration for search-replace functionality
const router = express.Router();

/**
 * Route: POST /api/files/search-replace
 * Description: AI searches and replaces keywords in the file's content.
 */
router.post('/search-replace', authenticate, async (req, res) => {
  const { userId } = req.user;
  const { fileId, query, replaceText } = req.body;

  if (!fileId || !query || !replaceText) {
    return res.status(400).json({ error: 'File ID, search query, and replacement text are required.' });
  }

  try {
    console.log(`🔍 AI Searching and Replacing in File: ${fileId}`);

    // AI performs search and replace in file content
    const updatedContent = await aiFileSearchReplace.searchAndReplace(userId, fileId, query, replaceText);

    res.status(200).json({ message: 'Search and replace completed', updatedContent });
  } catch (error) {
    console.error('Error during search and replace:', error.message);
    res.status(500).json({ error: 'Failed to perform search and replace.' });
  }
});

module.exports = router;
