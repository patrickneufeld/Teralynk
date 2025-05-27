// ✅ FILE: /backend/src/routes/fileVersioningRoutes.mjs

import express from 'express';
import { authenticate } from '../middleware/authMiddleware.mjs';
import {
  createFileVersion,
  getFileHistory,
  restoreFileVersion,
  compareFileVersions,
  mergeFileVersions
} from '../ai/aiFileVersioning.mjs';
import aiLearningManager from '../ai/aiLearningManager.mjs';
import { logInfo, logError } from '../utils/logger.mjs';

const router = express.Router();

/**
 * POST /api/files/version
 * Creates a new file version
 */
router.post('/version', authenticate, async (req, res) => {
  const { userId } = req.user;
  const { fileId, newContent } = req.body;

  if (!fileId || !newContent) {
    return res.status(400).json({ error: 'File ID and new content are required.' });
  }

  try {
    logInfo('📝 Creating new file version', { fileId, userId });

    const versionInfo = await createFileVersion(userId, fileId, newContent);

    await aiLearningManager.logAILearning(userId, 'file_versioned', { fileId, versionInfo });

    res.status(200).json({
      message: 'New file version created successfully',
      versionInfo
    });
  } catch (error) {
    logError('❌ Failed to create file version', { error: error.message, userId, fileId });
    res.status(500).json({ error: 'Failed to create file version.' });
  }
});

/**
 * GET /api/files/history
 * Retrieves file version history
 */
router.get('/history', authenticate, async (req, res) => {
  const { userId } = req.user;
  const { fileId } = req.query;

  if (!fileId) {
    return res.status(400).json({ error: 'File ID is required.' });
  }

  try {
    logInfo('📜 Retrieving file version history', { fileId, userId });

    const versionHistory = await getFileHistory(userId, fileId);

    res.status(200).json({
      message: 'File version history retrieved successfully',
      versionHistory
    });
  } catch (error) {
    logError('❌ Failed to retrieve file history', { error: error.message, userId, fileId });
    res.status(500).json({ error: 'Failed to retrieve file history.' });
  }
});

/**
 * POST /api/files/restore
 * Restores a file to a previous version
 */
router.post('/restore', authenticate, async (req, res) => {
  const { userId } = req.user;
  const { fileId, versionId } = req.body;

  if (!fileId || !versionId) {
    return res.status(400).json({ error: 'File ID and version ID are required.' });
  }

  try {
    logInfo('🔄 Restoring file version', { fileId, versionId, userId });

    const restoredFile = await restoreFileVersion(userId, fileId, versionId);

    await aiLearningManager.logAILearning(userId, 'file_restored', { fileId, versionId });

    res.status(200).json({
      message: 'File restored successfully',
      restoredFile
    });
  } catch (error) {
    logError('❌ Failed to restore file version', { error: error.message, userId, fileId });
    res.status(500).json({ error: 'Failed to restore file version.' });
  }
});

/**
 * GET /api/files/compare
 * Compares two file versions
 */
router.get('/compare', authenticate, async (req, res) => {
  const { userId } = req.user;
  const { fileId, versionId1, versionId2 } = req.query;

  if (!fileId || !versionId1 || !versionId2) {
    return res.status(400).json({ error: 'File ID and two version IDs are required.' });
  }

  try {
    logInfo('🔍 Comparing file versions', { fileId, versionId1, versionId2, userId });

    const comparisonResult = await compareFileVersions(userId, fileId, versionId1, versionId2);

    res.status(200).json({
      message: 'File versions compared successfully',
      comparisonResult
    });
  } catch (error) {
    logError('❌ Failed to compare file versions', { error: error.message, userId, fileId });
    res.status(500).json({ error: 'Failed to compare file versions.' });
  }
});

/**
 * POST /api/files/merge
 * Merges two file versions
 */
router.post('/merge', authenticate, async (req, res) => {
  const { userId } = req.user;
  const { fileId, versionId1, versionId2 } = req.body;

  if (!fileId || !versionId1 || !versionId2) {
    return res.status(400).json({ error: 'File ID and two version IDs are required.' });
  }

  try {
    logInfo('🔗 Merging file versions', { fileId, versionId1, versionId2, userId });

    const mergeResult = await mergeFileVersions(userId, fileId, versionId1, versionId2);

    await aiLearningManager.logAILearning(userId, 'file_merged', {
      fileId,
      versionId1,
      versionId2,
      newVersionId: mergeResult.newVersionId
    });

    res.status(200).json({
      message: 'File versions merged successfully',
      mergeResult
    });
  } catch (error) {
    logError('❌ Failed to merge file versions', { error: error.message, userId, fileId });
    res.status(500).json({ error: 'Failed to merge file versions.' });
  }
});

export default router;
