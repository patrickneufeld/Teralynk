// ✅ FILE: /Users/patrick/Projects/Teralynk/backend/src/routes/fileSearchRoutes.mjs

import express from 'express';
import { requireAuth as authenticate } from '../middleware/authMiddleware.mjs';
import aiFileSearch from '../ai/aiFileSearch.mjs';
import aiLearningManager from '../ai/aiLearningManager.mjs';
import { getStorageClient } from '../config/dynamicStorageManager.mjs';
import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
  ListObjectsV2Command
} from '@aws-sdk/client-s3';

const router = express.Router();

/**
 * Route: POST /api/files/replace
 * Description: Replace keywords in a file and save as a new file.
 */
router.post('/replace', authenticate, async (req, res) => {
  const { id: userId } = req.user;
  const { fileId, searchKeyword, replaceKeyword } = req.body;

  if (!fileId || !searchKeyword || !replaceKeyword) {
    return res.status(400).json({ error: 'File ID, searchKeyword, and replaceKeyword are required.' });
  }

  try {
    const storageClient = getStorageClient('s3');
    const params = {
      Bucket: process.env.BUCKET_NAME,
      Key: `users/${userId}/${fileId}`,
    };

    const file = await storageClient.client.send(new GetObjectCommand(params));
    const fileContent = await file.Body.transformToString(); // ✅ Stream-safe
    const updatedContent = fileContent.replace(new RegExp(searchKeyword, 'g'), replaceKeyword);

    const newFileName = `${fileId}_updated`;
    const newParams = {
      Bucket: process.env.BUCKET_NAME,
      Key: `users/${userId}/${newFileName}`,
      Body: updatedContent,
      ContentType: 'text/plain',
    };

    await storageClient.client.send(new PutObjectCommand(newParams));

    await aiLearningManager.logAILearning(userId, 'file_keyword_replacement', {
      fileId,
      searchKeyword,
      replaceKeyword,
    });

    res.status(200).json({ message: 'File updated and saved successfully', newFileName });
  } catch (error) {
    console.error('❌ Error replacing keywords in file:', error.message);
    res.status(500).json({ error: 'Failed to replace keywords in the file.' });
  }
});

/**
 * Route: POST /api/files/copy
 * Description: Copy a file and save it as a new file.
 */
router.post('/copy', authenticate, async (req, res) => {
  const { id: userId } = req.user;
  const { fileId } = req.body;

  if (!fileId) {
    return res.status(400).json({ error: 'File ID is required.' });
  }

  try {
    const storageClient = getStorageClient('s3');
    const params = {
      Bucket: process.env.BUCKET_NAME,
      Key: `users/${userId}/${fileId}`,
    };

    const file = await storageClient.client.send(new GetObjectCommand(params));
    const content = await file.Body.transformToString();

    const newFileName = `${fileId}_copy`;
    const newParams = {
      Bucket: process.env.BUCKET_NAME,
      Key: `users/${userId}/${newFileName}`,
      Body: content,
      ContentType: 'application/octet-stream',
    };

    await storageClient.client.send(new PutObjectCommand(newParams));

    await aiLearningManager.logAILearning(userId, 'file_copied', { fileId, newFileName });

    res.status(200).json({ message: 'File copied successfully', newFileName });
  } catch (error) {
    console.error('❌ Error copying file:', error.message);
    res.status(500).json({ error: 'Failed to copy the file.' });
  }
});

/**
 * Route: GET /api/files/search
 * Description: AI performs a semantic file search.
 */
router.get('/search', authenticate, async (req, res) => {
  const { id: userId } = req.user;
  const { query } = req.query;

  if (!query) {
    return res.status(400).json({ error: 'Search query is required.' });
  }

  try {
    const searchResults = await aiFileSearch.searchFiles(userId, query);

    await aiLearningManager.logAILearning(userId, 'file_search_performed', {
      query,
      searchResults,
    });

    res.status(200).json({ message: 'File search completed', searchResults });
  } catch (error) {
    console.error('❌ Error searching files:', error.message);
    res.status(500).json({ error: 'Failed to perform file search.' });
  }
});

export default router;
