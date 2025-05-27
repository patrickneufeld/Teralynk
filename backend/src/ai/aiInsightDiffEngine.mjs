// /backend/src/ai/aiInsightDiffEngine.js

import crypto from 'crypto';
import logger from '../utils/logger.mjs';

/**
 * Compares two AI insight objects and returns a detailed diff result.
 * Used for drift detection, insight updates, and anomaly detection.
 */
export function diffInsights(oldInsight, newInsight) {
  const result = {
    changedKeys: [],
    addedKeys: [],
    removedKeys: [],
    modified: false,
    diffHash: null
  };

  const allKeys = new Set([...Object.keys(oldInsight || {}), ...Object.keys(newInsight || {})]);

  for (const key of allKeys) {
    if (!(key in oldInsight)) {
      result.addedKeys.push(key);
    } else if (!(key in newInsight)) {
      result.removedKeys.push(key);
    } else if (JSON.stringify(oldInsight[key]) !== JSON.stringify(newInsight[key])) {
      result.changedKeys.push(key);
    }
  }

  result.modified = result.changedKeys.length > 0 || result.addedKeys.length > 0 || result.removedKeys.length > 0;
  result.diffHash = generateDiffHash(result);

  return result;
}

function generateDiffHash(diff) {
  const hash = crypto.createHash('sha256');
  hash.update(JSON.stringify(diff));
  return hash.digest('hex');
}

export default {
  diffInsights
};