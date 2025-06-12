// File: /backend/src/ai/aiFileNamingController.js

import { generateAIFileName } from './aiFileNamingEngine.mjs';
import { logInfo, logError } from '../utils/logging/logging.mjs';
import { validateFileNamingInput } from './aiFileNamingValidator.mjs';

/**
 * Controller to handle smart AI-based filename generation requests.
 * This is used by frontend clients to request optimized, personalized filenames.
 * 
 * Expected POST Body:
 * {
 *   userId: "user-123",
 *   originalName: "report_final.docx",
 *   mimeType: "application/msword",
 *   content: "<Buffer...>",
 *   tags: ["finance", "Q2"]
 * }
 */
export async function handleAIFileNamingRequest(req, res) {
  const { userId, originalName, mimeType, content, tags = [] } = req.body;

  if (!userId || !originalName || !mimeType || !content) {
    logError('❌ Missing required fields in AI naming request');
    return res.status(400).json({
      error: 'Missing required fields: userId, originalName, mimeType, content',
    });
  }

  try {
    logInfo(`📩 AI filename request received for user: ${userId} - ${originalName}`);

    const smartName = await generateAIFileName({
      userId,
      originalName,
      mimeType,
      content,
      tags,
    });

    res.status(200).json({ smartName });
  } catch (error) {
    logError(`❌ Error generating smart name for ${originalName}:`, error);
    res.status(500).json({ error: 'Failed to generate AI filename' });
  }
}
