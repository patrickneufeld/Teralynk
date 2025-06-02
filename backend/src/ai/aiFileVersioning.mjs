// ✅ FILE: /Users/patrick/Projects/Teralynk/backend/src/ai/aiFileVersioning.mjs

import fs from 'fs';
import axios from 'axios';
import path from 'path';
import aiLearningManager from './aiLearningManager.mjs';
import { logInfo, logError } from '../utils/logger.mjs';

const versionDir = './file_versions';

if (!fs.existsSync(versionDir)) {
  fs.mkdirSync(versionDir, { recursive: true });
}

/**
 * Create a new version of a file.
 */
export async function createFileVersion(userId, fileId, newContent) {
  const versionId = `${fileId}-${Date.now()}`;
  const filePath = path.join(versionDir, `${versionId}.txt`);

  try {
    fs.writeFileSync(filePath, newContent, 'utf-8');
    await aiLearningManager.logAILearning(userId, 'file_versioned', { fileId, versionId });
    return { versionId, message: 'New version created successfully' };
  } catch (error) {
    logError('❌ createFileVersion failed', { error: error.message, userId, fileId });
    throw error;
  }
}

/**
 * Retrieve version history for a file (stubbed).
 */
export async function getFileHistory(userId, fileId) {
  try {
    return [
      { versionId: `${fileId}-1700000000000`, timestamp: '2025-01-01T12:00:00Z' },
      { versionId: `${fileId}-1700010000000`, timestamp: '2025-01-02T15:30:00Z' },
    ];
  } catch (error) {
    logError('❌ getFileHistory failed', { error: error.message, userId, fileId });
    throw error;
  }
}

/**
 * Restore a file to a specific version.
 */
export async function restoreFileVersion(userId, fileId, versionId) {
  const filePath = path.join(versionDir, `${versionId}.txt`);

  try {
    if (!fs.existsSync(filePath)) {
      throw new Error('Version not found.');
    }

    const restoredContent = fs.readFileSync(filePath, 'utf-8');
    await aiLearningManager.logAILearning(userId, 'file_restored', { fileId, versionId });

    return { fileId, versionId, restoredContent };
  } catch (error) {
    logError('❌ restoreFileVersion failed', { error: error.message, userId, versionId });
    throw error;
  }
}

/**
 * Compare two versions of a file using OpenAI.
 */
export async function compareFileVersions(userId, fileId, versionId1, versionId2) {
  const path1 = path.join(versionDir, `${versionId1}.txt`);
  const path2 = path.join(versionDir, `${versionId2}.txt`);

  try {
    if (!fs.existsSync(path1) || !fs.existsSync(path2)) {
      throw new Error('One or both versions not found.');
    }

    const content1 = fs.readFileSync(path1, 'utf-8');
    const content2 = fs.readFileSync(path2, 'utf-8');

    const response = await axios.post(
      'https://api.openai.com/v1/completions',
      {
        model: 'gpt-4',
        prompt: `Compare the following two versions and summarize the key differences:\n\nVersion 1:\n${content1}\n\nVersion 2:\n${content2}`,
        max_tokens: 500,
        temperature: 0.3,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
      }
    );

    const comparison = response.data.choices?.[0]?.text?.trim() || 'No comparison result.';

    await aiLearningManager.logAILearning(userId, 'file_compared', {
      fileId,
      versionId1,
      versionId2,
    });

    return { comparison };
  } catch (error) {
    logError('❌ compareFileVersions failed', { error: error.message, userId, fileId });
    throw error;
  }
}

/**
 * Merge two file versions using OpenAI.
 */
export async function mergeFileVersions(userId, fileId, versionId1, versionId2) {
  const path1 = path.join(versionDir, `${versionId1}.txt`);
  const path2 = path.join(versionDir, `${versionId2}.txt`);

  try {
    if (!fs.existsSync(path1) || !fs.existsSync(path2)) {
      throw new Error('One or both versions not found.');
    }

    const content1 = fs.readFileSync(path1, 'utf-8');
    const content2 = fs.readFileSync(path2, 'utf-8');

    const response = await axios.post(
      'https://api.openai.com/v1/completions',
      {
        model: 'gpt-4',
        prompt: `Merge the following two file versions into one coherent file:\n\nVersion 1:\n${content1}\n\nVersion 2:\n${content2}`,
        max_tokens: 1000,
        temperature: 0.3,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
      }
    );

    const mergedContent = response.data.choices?.[0]?.text?.trim() || '';
    const newVersionId = `${fileId}-${Date.now()}`;
    const outputPath = path.join(versionDir, `${newVersionId}.txt`);

    fs.writeFileSync(outputPath, mergedContent, 'utf-8');

    await aiLearningManager.logAILearning(userId, 'file_merged', {
      fileId,
      versionId1,
      versionId2,
      newVersionId,
    });

    return { newVersionId, mergedContent };
  } catch (error) {
    logError('❌ mergeFileVersions failed', { error: error.message, userId, fileId });
    throw error;
  }
}
