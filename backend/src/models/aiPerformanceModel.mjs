// ✅ FILE: /backend/src/models/aiPerformanceModel.mjs

/**
 * PostgreSQL-backed AI Performance Model Service
 * Replaces Mongoose model with hardened, enterprise-grade SQL logic.
 * Includes full metric tracking and safe default export for ESM compatibility.
 */

import { query } from '../config/db.mjs';
import logger from '../utils/logger.mjs';

/**
 * Inserts a new AI model performance metric entry into ai_model_metrics.
 *
 * @param {Object} payload
 * @param {string} payload.model_id - Unique identifier for the AI model
 * @param {Object} payload.metrics - JSON object of performance metrics (e.g. { mse, mae, rse })
 * @returns {Promise<Object>} Inserted record
 */
export async function insertAIPerformanceMetric({ model_id, metrics }) {
  try {
    const result = await query(
      `INSERT INTO ai_model_metrics (model_id, metrics)
       VALUES ($1, $2)
       RETURNING *`,
      [model_id, metrics]
    );
    logger.logInfo('✅ AI performance metric inserted', { model_id });
    return result.rows[0];
  } catch (error) {
    logger.logError('❌ insertAIPerformanceMetric failed', { error, model_id });
    throw error;
  }
}

/**
 * Retrieves all performance metrics for a specific AI model.
 *
 * @param {string} modelId - Unique identifier for the AI model
 * @returns {Promise<Object[]>} Array of metrics sorted by recorded_at
 */
export async function getAIPerformanceMetrics(modelId) {
  try {
    const result = await query(
      `SELECT * FROM ai_model_metrics
       WHERE model_id = $1
       ORDER BY recorded_at DESC`,
      [modelId]
    );
    logger.logInfo('📊 Retrieved performance metrics', { modelId, count: result.rows.length });
    return result.rows;
  } catch (error) {
    logger.logError('❌ getAIPerformanceMetrics failed', { error, modelId });
    throw error;
  }
}

/**
 * Retrieves the most recent performance record for a given model.
 *
 * @param {string} modelId
 * @returns {Promise<Object|null>}
 */
export async function getLatestAIPerformanceMetric(modelId) {
  try {
    const result = await query(
      `SELECT * FROM ai_model_metrics
       WHERE model_id = $1
       ORDER BY recorded_at DESC
       LIMIT 1`,
      [modelId]
    );
    const latest = result.rows[0] || null;
    logger.logInfo('📈 Latest AI performance metric fetched', { modelId, exists: !!latest });
    return latest;
  } catch (error) {
    logger.logError('❌ getLatestAIPerformanceMetric failed', { error, modelId });
    throw error;
  }
}

/**
 * Backwards-compatible export alias to support legacy imports.
 * Allows usage like: `import { AIModelPerformance } from 'aiPerformanceModel.mjs'`
 */
export const AIModelPerformance = {
  insert: insertAIPerformanceMetric,
  getAll: getAIPerformanceMetrics,
  getLatest: getLatestAIPerformanceMetric,
};

export default {
  insertAIPerformanceMetric,
  getAIPerformanceMetrics,
  getLatestAIPerformanceMetric,
  AIModelPerformance,
};
