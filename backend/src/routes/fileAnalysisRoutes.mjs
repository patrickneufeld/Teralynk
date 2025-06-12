// ✅ FILE: /backend/src/routes/fileAnalysisRoutes.mjs

import express from 'express';
import { requireAuth as authenticate } from '../middleware/authMiddleware.mjs';
import {
  analyzeFile,
  searchFiles,
  detectDuplicates,
  autoCategorizeFiles
} from '../ai/aiFileAnalyzer.mjs';
import aiLearningManager from '../ai/aiLearningManager.mjs';
import { getStorageClient } from '../config/dynamicStorageManager.mjs';
import { PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';

const router = express.Router();

/**
 * POST /api/files/analyze
 */
router.post('/analyze', authenticate, async (req, res) => {
  const { id: userId } = req.user;
  const { fileId } = req.body;

  if (!fileId) return res.status(400).json({ error: 'File ID is required.' });

  try {
    const analysisResult = await analyzeFile(userId, fileId);
    await aiLearningManager.logAILearning(userId, 'file_analyzed', { fileId, analysisResult });
    res.status(200).json({ message: 'File analysis completed', analysisResult });
  } catch (err) {
    console.error('❌ analyzeFile error:', err.message);
    res.status(500).json({ error: 'Failed to analyze file.' });
  }
});

/**
 * GET /api/files/search
 */
router.get('/search', authenticate, async (req, res) => {
  const { id: userId } = req.user;
  const { query } = req.query;

  if (!query) return res.status(400).json({ error: 'Search query is required.' });

  try {
    const searchResults = await searchFiles(userId, query);
    res.status(200).json({ message: 'Search results retrieved', searchResults });
  } catch (err) {
    console.error('❌ searchFiles error:', err.message);
    res.status(500).json({ error: 'Failed to search files.' });
  }
});

/**
 * POST /api/files/replace
 */
router.post('/replace', authenticate, async (req, res) => {
  const { id: userId } = req.user;
  const { fileId, searchKeyword, replaceKeyword } = req.body;

  if (!fileId || !searchKeyword || !replaceKeyword)
    return res.status(400).json({ error: 'fileId, searchKeyword, and replaceKeyword are required.' });

  try {
    const storageClient = getStorageClient('s3');
    const params = {
      Bucket: process.env.BUCKET_NAME,
      Key: `users/${userId}/${fileId}`
    };

    const file = await storageClient.client.send(new GetObjectCommand(params));
    const originalContent = await file.Body.transformToString(); // Compatible method for streams

    const updatedContent = originalContent.replace(new RegExp(searchKeyword, 'g'), replaceKeyword);
    const newFileName = `${fileId}_updated.txt`;

    const putParams = {
      Bucket: process.env.BUCKET_NAME,
      Key: `users/${userId}/${newFileName}`,
      Body: updatedContent,
      ContentType: 'text/plain'
    };

    await storageClient.client.send(new PutObjectCommand(putParams));

    await aiLearningManager.logAILearning(userId, 'file_keyword_replacement', {
      fileId,
      searchKeyword,
      replaceKeyword
    });

    res.status(200).json({ message: 'File updated and saved successfully.', newFileName });
  } catch (err) {
    console.error('❌ replace keywords error:', err.message);
    res.status(500).json({ error: 'Failed to replace keywords in the file.' });
  }
});

/**
 * POST /api/files/copy
 */
router.post('/copy', authenticate, async (req, res) => {
  const { id: userId } = req.user;
  const { fileId } = req.body;

  if (!fileId) return res.status(400).json({ error: 'File ID is required.' });

  try {
    const storageClient = getStorageClient('s3');
    const params = {
      Bucket: process.env.BUCKET_NAME,
      Key: `users/${userId}/${fileId}`
    };

    const file = await storageClient.client.send(new GetObjectCommand(params));
    const content = await file.Body.transformToString(); // Stream to string

    const newFileName = `${fileId}_copy`;

    const newParams = {
      Bucket: process.env.BUCKET_NAME,
      Key: `users/${userId}/${newFileName}`,
      Body: content,
      ContentType: 'application/octet-stream'
    };

    await storageClient.client.send(new PutObjectCommand(newParams));
    await aiLearningManager.logAILearning(userId, 'file_copied', { fileId, newFileName });

    res.status(200).json({ message: 'File copied successfully.', newFileName });
  } catch (err) {
    console.error('❌ copy file error:', err.message);
    res.status(500).json({ error: 'Failed to copy file.' });
  }
});

/**
 * GET /api/files/duplicates
 */
router.get('/duplicates', authenticate, async (req, res) => {
  const { id: userId } = req.user;

  try {
    const duplicateFiles = await detectDuplicates(userId);
    res.status(200).json({ message: 'Duplicate files detected.', duplicateFiles });
  } catch (err) {
    console.error('❌ duplicate detection error:', err.message);
    res.status(500).json({ error: 'Failed to detect duplicate files.' });
  }
});

/**
 * POST /api/files/auto-categorize
 */
router.post('/auto-categorize', authenticate, async (req, res) => {
  const { id: userId } = req.user;

  try {
    const categorizationResults = await autoCategorizeFiles(userId);
    await aiLearningManager.logAILearning(userId, 'files_categorized', { categorizationResults });
    res.status(200).json({ message: 'Files auto-categorized successfully.', categorizationResults });
  } catch (err) {
    console.error('❌ auto-categorize error:', err.message);
    res.status(500).json({ error: 'Failed to auto-categorize files.' });
  }
});

export default router;
