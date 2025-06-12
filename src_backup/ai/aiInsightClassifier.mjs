// /backend/src/ai/aiInsightClassifier.js

import { sha3Hash } from '../security/quantumResistant.mjs';
import logger from '../utils/logger.mjs';

/**
 * Classifies AI insights into severity buckets and tags.
 * @param {Object} insight - Insight object
 * @returns {Object} classification - { category, severity, tags }
 */
export const classifyInsight = (insight) => {
  try {
    const { type, source, content, tags = [] } = insight;

    let severity = 'low';
    const normalizedContent = content?.toLowerCase() || '';

    if (/vulnerability|exploit|breach/.test(normalizedContent)) {
      severity = 'critical';
    } else if (/failure|crash|exception/.test(normalizedContent)) {
      severity = 'high';
    } else if (/timeout|retry|performance/.test(normalizedContent)) {
      severity = 'medium';
    }

    const category = detectCategory(type, source, normalizedContent);

    return {
      category,
      severity,
      tags: [...new Set(tags.concat(detectTags(normalizedContent)))],
    };
  } catch (err) {
    logger.error(`[InsightClassifier] Classification failed: ${err.message}`);
    return {
      category: 'unknown',
      severity: 'low',
      tags: [],
    };
  }
};

const detectCategory = (type, source, content) => {
  if (/file|storage|disk/.test(content)) return 'storage';
  if (/auth|token|session/.test(content)) return 'authentication';
  if (/network|latency|timeout/.test(content)) return 'network';
  if (/ml|model|training/.test(content)) return 'ai';
  if (/security|encryption|leak/.test(content)) return 'security';
  return type || source || 'general';
};

const detectTags = (content) => {
  const tags = [];
  if (/latency/.test(content)) tags.push('latency');
  if (/timeout/.test(content)) tags.push('timeout');
  if (/breach/.test(content)) tags.push('breach');
  if (/retry/.test(content)) tags.push('retry');
  if (/token/.test(content)) tags.push('token');
  return tags;
};

/**
 * Generates a unique hash key for insight caching or deduplication.
 */
export const getInsightHash = (insight) => {
  try {
    return sha3Hash(JSON.stringify(insight));
  } catch (err) {
    logger.error(`[InsightClassifier] Hashing failed: ${err.message}`);
    return null;
  }
};
