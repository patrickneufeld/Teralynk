// ✅ FILE: /Users/patrick/Projects/Teralynk/backend/src/ai/aiFileAnalyzer.mjs

import { getFileContent } from '../config/dynamicStorageManager.mjs';
import aiLearningManager from './aiLearningManager.mjs';
import { franc } from 'franc';
import { logInfo, logError } from '../utils/logger.mjs';

// Optional analysis utilities
let analyzeFileContent = (content) => ({ summary: 'Basic analysis fallback', language: 'und' });
let extractKeyData = () => ({});

try {
  const utils = await import('../utils/fileAnalysisUtils.js');
  analyzeFileContent = utils.analyzeFileContent || analyzeFileContent;
  extractKeyData = utils.extractKeyData || extractKeyData;
} catch (err) {
  logError('⚠️ Could not load fileAnalysisUtils, using fallback logic', { error: err.message });
}

/**
 * Analyze file content and extract key metadata.
 */
export async function analyzeFile(userId, fileId) {
  try {
    const fileContent = await getFileContent(userId, fileId);
    if (!fileContent || typeof fileContent !== 'string') {
      throw new Error('File content is empty or invalid.');
    }

    const language = franc(fileContent.slice(0, 500)) || 'und';
    logInfo('📈 Language detected', { fileId, userId, language });

    const analysisResult = analyzeFileContent(fileContent, language);
    await aiLearningManager.logAILearning(userId, 'file_analyzed', {
      fileId,
      language,
      analysisResult,
    });

    return analysisResult;
  } catch (error) {
    logError('❌ analyzeFile failed', { error: error.message, userId, fileId });
    throw new Error('Failed to analyze file content.');
  }
}

/**
 * Perform a semantic search across user files.
 */
export async function searchFiles(userId, query) {
  try {
    const matchingFiles = await findMatchingFiles(userId, query);
    await aiLearningManager.logAILearning(userId, 'file_search_performed', { query, matchingFiles });
    return matchingFiles;
  } catch (error) {
    logError('❌ searchFiles failed', { error: error.message, userId, query });
    throw new Error('Failed to search files.');
  }
}

async function findMatchingFiles(userId, query) {
  const files = await getUserFiles(userId);
  return files.filter(file =>
    file.content.toLowerCase().includes(query.toLowerCase())
  );
}

/**
 * Retrieve all user files (mocked here for testing).
 */
async function getUserFiles(userId) {
  return [
    { fileId: 'file1', content: 'Business proposal for client ABC' },
    { fileId: 'file2', content: 'Budget report for 2023' },
    { fileId: 'file3', content: 'Internal memo on project roadmap' },
  ];
}

/**
 * Detect duplicate files by content.
 */
export async function detectDuplicates(userId) {
  try {
    const files = await getUserFiles(userId);
    const seen = new Set();
    const duplicates = [];

    for (const file of files) {
      if (seen.has(file.content)) {
        duplicates.push(file);
      } else {
        seen.add(file.content);
      }
    }

    await aiLearningManager.logAILearning(userId, 'duplicate_files_detected', { duplicates });
    return duplicates;
  } catch (error) {
    logError('❌ detectDuplicates failed', { error: error.message, userId });
    throw new Error('Failed to detect duplicate files.');
  }
}

/**
 * Automatically categorize files based on keywords or rules.
 */
export async function autoCategorizeFiles(userId) {
  try {
    const files = await getUserFiles(userId);
    const categorized = files.map(file => {
      const content = file.content.toLowerCase();
      let category = 'Miscellaneous';

      if (content.includes('proposal')) category = 'Proposals';
      else if (content.includes('budget')) category = 'Reports';
      else if (content.includes('memo')) category = 'Memos';

      return { ...file, category };
    });

    await aiLearningManager.logAILearning(userId, 'files_categorized', { categorized });
    return categorized;
  } catch (error) {
    logError('❌ autoCategorizeFiles failed', { error: error.message, userId });
    throw new Error('Failed to auto-categorize files.');
  }
}
