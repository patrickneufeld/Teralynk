// File: /Users/patrick/Projects/Teralynk/backend/src/routes/aiRoutes.js

const express = require('express');
const AIIntegration = require('../ai/aiIntegration');
const AILearningManager = require('../ai/aiLearningManager');
const AICodeUpdater = require('../ai/aiCodeUpdater'); // New import
const db = require('../db');

const router = express.Router();

/**
 * Route: POST /api/ai/query
 * Description: Handle AI queries and return responses from connected platforms.
 */
router.post('/query', async (req, res) => {
  const { userId, query } = req.body;

  if (!userId || !query) {
    return res.status(400).json({ error: 'User ID and query are required.' });
  }

  try {
    // Define the queries for each platform (example with dummy API keys)
    const aiQueries = [
      {
        platform: 'openai',
        payload: { query },
        apiKey: process.env.OPENAI_API_KEY,
      },
      {
        platform: 'suno',
        payload: { query },
        apiKey: process.env.SUNO_API_KEY,
      },
    ];

    // Query AI platforms via AIIntegration
    const responses = await AIIntegration.queryAIPlatforms(userId, aiQueries);

    // Format and return the responses
    const formattedResponses = responses.map((response, index) => ({
      id: `${userId}-${index}`, // Unique response ID
      platform: aiQueries[index].platform,
      result: response.result || 'No result provided.',
    }));

    res.status(200).json({ responses: formattedResponses });
  } catch (error) {
    console.error('Error querying AI platforms:', error);
    res.status(500).json({ error: 'Failed to query AI platforms.' });
  }
});

/**
 * Route: POST /api/ai/feedback
 * Description: Accept and store user feedback for AI responses.
 */
router.post('/feedback', async (req, res) => {
  const { responseId, feedback } = req.body;

  if (!responseId || !feedback) {
    return res.status(400).json({ error: 'Response ID and feedback are required.' });
  }

  try {
    // Store feedback in the database
    await db.logInteraction({
      userId: responseId.split('-')[0], // Extract userId from responseId
      platform: null, // Not applicable for feedback
      request: null, // Not applicable for feedback
      response: { feedback },
      timestamp: new Date(),
    });

    res.status(200).json({ message: 'Feedback submitted successfully.' });
  } catch (error) {
    console.error('Error submitting feedback:', error);
    res.status(500).json({ error: 'Failed to submit feedback.' });
  }
});

/**
 * Route: POST /api/ai/self-update
 * Description: Trigger the AI self-updating mechanism.
 */
router.post('/self-update', async (req, res) => {
  const { filePath, context } = req.body;

  if (!filePath || !context) {
    return res.status(400).json({ error: 'File path and context are required.' });
  }

  try {
    // Query ChatGPT for suggestions
    const suggestions = await AICodeUpdater.queryChatGPTForCode(context);
    console.log('Received suggestions:', suggestions);

    // Apply the suggested improvements
    const success = await AICodeUpdater.applyCodeUpdate(filePath, suggestions);

    if (success) {
      res.status(200).json({ message: 'Self-update applied successfully.', suggestions });
    } else {
      res.status(500).json({ error: 'Failed to apply the self-update.' });
    }
  } catch (error) {
    console.error('Error during self-update:', error);
    res.status(500).json({ error: 'An error occurred during self-update.' });
  }
});

module.exports = router;
