// File: /backend/src/ai/modelManager.js

import { logInfo, logError, logDebug } from '../utils/logger.mjs';
import { db } from '../database/connection.mjs';

export class AIModelManager {
  constructor() {
    this.models = new Map();
    this.activeVersions = new Map();
    this.modelMetrics = new Map();
  }

  async initializeModel(modelId, config = {}) {
    try {
      const model = {
        id: modelId,
        version: config.version || '1.0.0',
        created: new Date().toISOString(),
        parameters: config.parameters || {},
        status: 'initialized'
      };

      this.models.set(modelId, model);
      await this.persistModelState(model);

      logInfo('Model initialized successfully', { modelId, version: model.version });
      return model;
    } catch (error) {
      logError('Failed to initialize model', { modelId, error: error.message });
      throw error;
    }
  }

  async updateModel(modelId, updates) {
    try {
      const model = this.models.get(modelId);
      if (!model) {
        throw new Error(`Model ${modelId} not found`);
      }

      const updatedModel = {
        ...model,
        ...updates,
        lastUpdated: new Date().toISOString()
      };

      this.models.set(modelId, updatedModel);
      await this.persistModelState(updatedModel);

      logInfo('Model updated successfully', { modelId, version: updatedModel.version });
      return updatedModel;
    } catch (error) {
      logError('Failed to update model', { modelId, error: error.message });
      throw error;
    }
  }

  async getModelState(modelId) {
    try {
      const model = this.models.get(modelId);
      if (!model) {
        const persistedModel = await this.loadModelState(modelId);
        if (persistedModel) {
          this.models.set(modelId, persistedModel);
          return persistedModel;
        }
        throw new Error(`Model ${modelId} not found`);
      }
      return model;
    } catch (error) {
      logError('Failed to get model state', { modelId, error: error.message });
      throw error;
    }
  }

  async persistModelState(model) {
    try {
      await db.query(
        `INSERT INTO ai_models (model_id, version, state, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (model_id) 
         DO UPDATE SET state = $3, version = $2, updated_at = $5`,
        [
          model.id,
          model.version,
          JSON.stringify(model),
          new Date(model.created),
          new Date()
        ]
      );
      logDebug('Model state persisted', { modelId: model.id, version: model.version });
    } catch (error) {
      logError('Failed to persist model state', { modelId: model.id, error: error.message });
      throw error;
    }
  }

  async loadModelState(modelId) {
    try {
      const result = await db.query(
        'SELECT state FROM ai_models WHERE model_id = $1',
        [modelId]
      );
      return result.rows[0]?.state || null;
    } catch (error) {
      logError('Failed to load model state', { modelId, error: error.message });
      throw error;
    }
  }

  async trackMetrics(modelId, metrics) {
    try {
      const currentMetrics = this.modelMetrics.get(modelId) || [];
      currentMetrics.push({
        ...metrics,
        timestamp: new Date().toISOString()
      });
      this.modelMetrics.set(modelId, currentMetrics);

      await db.query(
        `INSERT INTO ai_model_metrics (model_id, metrics, recorded_at)
         VALUES ($1, $2, NOW())`,
        [modelId, JSON.stringify(metrics)]
      );

      logDebug('Model metrics tracked', { modelId, metrics });
    } catch (error) {
      logError('Failed to track model metrics', { modelId, error: error.message });
      throw error;
    }
  }

  async getModelMetrics(modelId, timeRange = '24h') {
    try {
      const result = await db.query(
        `SELECT metrics FROM ai_model_metrics 
         WHERE model_id = $1 
         AND recorded_at >= NOW() - interval '1 hour' * $2
         ORDER BY recorded_at DESC`,
        [modelId, this.parseTimeRange(timeRange)]
      );
      return result.rows.map(row => row.metrics);
    } catch (error) {
      logError('Failed to get model metrics', { modelId, error: error.message });
      throw error;
    }
  }

  parseTimeRange(timeRange) {
    const match = timeRange.match(/(\d+)([hd])/);
    if (!match) throw new Error('Invalid time range format');
    const [, value, unit] = match;
    return unit === 'h' ? value : value * 24;
  }
}

// Create necessary database tables if they don't exist
export async function initializeModelTables() {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS ai_models (
        model_id VARCHAR(255) PRIMARY KEY,
        version VARCHAR(50) NOT NULL,
        state JSONB NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL
      )
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS ai_model_metrics (
        id SERIAL PRIMARY KEY,
        model_id VARCHAR(255) NOT NULL,
        metrics JSONB NOT NULL,
        recorded_at TIMESTAMP WITH TIME ZONE NOT NULL,
        FOREIGN KEY (model_id) REFERENCES ai_models(model_id)
      )
    `);

    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_model_metrics_timestamp 
      ON ai_model_metrics(recorded_at)
    `);

    logInfo('Model management tables initialized successfully');
  } catch (error) {
    logError('Failed to initialize model management tables', { error: error.message });
    throw error;
  }
}
