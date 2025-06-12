// ✅ FILE: /backend/src/routes/fileOrganizationRoutes.mjs

import express from 'express';
import { authenticate } from '../middleware/authMiddleware.mjs';
import aiFileOrganization from '../ai/aiFileOrganization.mjs';
import aiLearningManager from '../ai/aiLearningManager.mjs';
import { getStorageClient } from '../config/dynamicStorageManager.mjs';
import { PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';

const router = express.Router();

/**
 * POST /api/files/organize
 * Auto-categorize a file based on its content
 */
router.post('/organize', authenticate, async (req, res) => {
  const { userId } = req.user;
  const { fileId } = req.body;

  if (!fileId) return res.status(400).json({ error: 'File ID is required.' });

  try {
    const categoryInfo = await aiFileOrganization.categorizeFile(userId, fileId);
    await aiLearningManager.logAILearning(userId, 'file_categorized', { fileId, categoryInfo });

    res.status(200).json({ message: 'File categorized successfully', categoryInfo });
  } catch (err) {
    console.error('[Organize Error]', err.message);
    res.status(500).json({ error: 'Failed to categorize file.' });
  }
});

/**
 * POST /api/files/replace
 * Replace keywords in a file and save as a new version
 */
router.post('/replace', authenticate, async (req, res) => {
  const { userId } = req.user;
  const { fileId, searchKeyword, replaceKeyword } = req.body;

  if (!fileId || !searchKeyword || !replaceKeyword) {
    return res.status(400).json({ error: 'fileId, searchKeyword, and replaceKeyword are required.' });
  }

  try {
    const s3 = getStorageClient('s3');
    const input = {
      Bucket: process.env.BUCKET_NAME,
      Key: `users/${userId}/${fileId}`,
    };

    const fileObj = await s3.client.send(new GetObjectCommand(input));
    const fileContent = await fileObj.Body.transformToString();
    const updatedContent = fileContent.replace(new RegExp(searchKeyword, 'g'), replaceKeyword);

    const newFileId = `${fileId}_updated`;
    const output = {
      Bucket: process.env.BUCKET_NAME,
      Key: `users/${userId}/${newFileId}`,
      Body: updatedContent,
      ContentType: 'text/plain',
    };

    await s3.client.send(new PutObjectCommand(output));
    await aiLearningManager.logAILearning(userId, 'file_keyword_replacement', {
      fileId, searchKeyword, replaceKeyword, newFileId,
    });

    res.status(200).json({ message: 'File updated successfully', newFileId });
  } catch (err) {
    console.error('[Replace Error]', err.message);
    res.status(500).json({ error: 'Failed to replace keywords in file.' });
  }
});

/**
 * POST /api/files/copy
 * Copy a file to a new file with _copy suffix
 */
router.post('/copy', authenticate, async (req, res) => {
  const { userId } = req.user;
  const { fileId } = req.body;

  if (!fileId) return res.status(400).json({ error: 'File ID is required.' });

  try {
    const s3 = getStorageClient('s3');
    const input = {
      Bucket: process.env.BUCKET_NAME,
      Key: `users/${userId}/${fileId}`,
    };

    const fileObj = await s3.client.send(new GetObjectCommand(input));
    const newFileId = `${fileId}_copy`;

    const output = {
      Bucket: process.env.BUCKET_NAME,
      Key: `users/${userId}/${newFileId}`,
      Body: fileObj.Body,
      ContentType: fileObj.ContentType || 'application/octet-stream',
    };

    await s3.client.send(new PutObjectCommand(output));
    await aiLearningManager.logAILearning(userId, 'file_copied', { fileId, newFileId });

    res.status(200).json({ message: 'File copied successfully', newFileId });
  } catch (err) {
    console.error('[Copy Error]', err.message);
    res.status(500).json({ error: 'Failed to copy file.' });
  }
});

/**
 * GET /api/files/category
 * Retrieve file's assigned category
 */
router.get('/category', authenticate, async (req, res) => {
  const { userId } = req.user;
  const { fileId } = req.query;

  if (!fileId) return res.status(400).json({ error: 'File ID is required.' });

  try {
    const fileCategory = await aiFileOrganization.getFileCategory(userId, fileId);
    res.status(200).json({ message: 'File category retrieved successfully', fileCategory });
  } catch (err) {
    console.error('[Category Error]', err.message);
    res.status(500).json({ error: 'Failed to retrieve file category.' });
  }
});

export default router;
