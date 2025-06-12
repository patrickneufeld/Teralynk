import { logAuditEntry } from "../guardrails/AuditLogger.mjs";
import { isKillSwitchEnabled } from "../guardrails/KillSwitch.mjs";
// File: /backend/src/ai/insightProcessor.js

import { logInfo, logError, logDebug, logWarn } from '../utils/logger.mjs';
import { db } from '../database/connection.mjs';
import { AnomalyDetector } from '../security/anomalyDetector.mjs';
import { MetricsAggregator } from '../monitoring/metricsAggregator.mjs';

export class InsightProcessor {
  constructor() {
    this.anomalyDetector = new AnomalyDetector();
    this.metricsAggregator = new MetricsAggregator('insights');
    this.processingQueue = new Map();
    this.batchSize = 100;
    this.processingInterval = 1000; // 1 second
  }

  async processInsight(insight, context = {}) {
    const insightId = this.generateInsightId();
    
    try {
      // Validate insight structure
      this.validateInsight(insight);

      // Enrich insight with metadata
      const enrichedInsight = await this.enrichInsight(insight, context);

      // Detect anomalies
      const anomalies = await this.anomalyDetector.analyze(enrichedInsight);
      
      if (anomalies.length > 0) {
        logWarn('Anomalies detected in insight', { insightId, anomalies });
        enrichedInsight.anomalies = anomalies;
      }

      // Store processed insight
      await this.storeInsight(enrichedInsight);

      // Update metrics
      await this.metricsAggregator.record({
        type: 'insight_processed',
        metadata: {
          insightId,
          hasAnomalies: anomalies.length > 0,
          processingTime: Date.now() - enrichedInsight.timestamp
        }
      });

      logInfo('Insight processed successfully', { insightId });
      return { insightId, insight: enrichedInsight };

    } catch (error) {
      logError('Failed to process insight', { insightId, error: error.message });
      throw error;
    }
  }

  async batchProcessInsights(insights, context = {}) {
    const batchId = this.generateBatchId();
    
    try {
      logInfo('Starting batch insight processing', { 
        batchId, 
        count: insights.length 
      });

      const results = [];
      const chunks = this.chunkArray(insights, this.batchSize);

      for (const chunk of chunks) {
        const processedChunk = await Promise.all(
          chunk.map(insight => this.processInsight(insight, context))
        );
        results.push(...processedChunk);

        // Add small delay between chunks to prevent overwhelming
        await this.delay(this.processingInterval);
      }

      logInfo('Batch processing completed', { 
        batchId, 
        processed: results.length 
      });

      return {
        batchId,
        processed: results.length,
        results
      };

    } catch (error) {
      logError('Batch processing failed', { batchId, error: error.message });
      throw error;
    }
  }

  async enrichInsight(insight, context) {
    return {
      ...insight,
      metadata: {
        ...insight.metadata,
        processedAt: new Date().toISOString(),
        processorVersion: '1.0.0',
        context
      },
      timestamp: insight.timestamp || Date.now(),
      correlationId: insight.correlationId || this.generateCorrelationId()
    };
  }

  validateInsight(insight) {
    if (!insight || typeof insight !== 'object') {
      throw new Error('Invalid insight format');
    }

    const requiredFields = ['data', 'source'];
    for (const field of requiredFields) {
      if (!(field in insight)) {
        throw new Error(`Missing required field: ${field}`);
      }
    }
  }

  async storeInsight(insight) {
    try {
      await db.query(
        `INSERT INTO processed_insights 
         (insight_id, correlation_id, data, metadata, timestamp)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          insight.id || this.generateInsightId(),
          insight.correlationId,
          JSON.stringify(insight.data),
          JSON.stringify(insight.metadata),
          new Date(insight.timestamp)
        ]
      );
    } catch (error) {
      logError('Failed to store insight', { error: error.message });
      throw error;
    }
  }

  async queryInsights(params = {}) {
    const {
      startDate,
      endDate,
      correlationId,
      limit = 100
    } = params;

    try {
      let query = `
        SELECT * FROM processed_insights
        WHERE 1=1
      `;
      const values = [];
      let valueIndex = 1;

      if (startDate) {
        query += ` AND timestamp >= $${valueIndex}`;
        values.push(new Date(startDate));
        valueIndex++;
      }

      if (endDate) {
        query += ` AND timestamp <= $${valueIndex}`;
        values.push(new Date(endDate));
        valueIndex++;
      }

      if (correlationId) {
        query += ` AND correlation_id = $${valueIndex}`;
        values.push(correlationId);
        valueIndex++;
      }

      query += ` ORDER BY timestamp DESC LIMIT $${valueIndex}`;
      values.push(limit);

      const result = await db.query(query, values);
      return result.rows;

    } catch (error) {
      logError('Failed to query insights', { error: error.message });
      throw error;
    }
  }

  // Utility methods
  generateInsightId() {
    return `ins_$${Date.now()}_$$ {Math.random().toString(36).substr(2, 9)}`;
  }

  generateBatchId() {
    return `batch_$${Date.now()}_$$ {Math.random().toString(36).substr(2, 9)}`;
  }

  generateCorrelationId() {
    return `corr_$${Date.now()}_$$ {Math.random().toString(36).substr(2, 9)}`;
  }

  chunkArray(array, size) {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Initialize database tables
export async function initializeInsightTables() {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS processed_insights (
        id SERIAL PRIMARY KEY,
        insight_id VARCHAR(255) UNIQUE NOT NULL,
        correlation_id VARCHAR(255) NOT NULL,
        data JSONB NOT NULL,
        metadata JSONB,
        timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_insights_correlation
      ON processed_insights(correlation_id)
    `);

    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_insights_timestamp
      ON processed_insights(timestamp)
    `);

    logInfo('Insight processing tables initialized successfully');
  } catch (error) {
    logError('Failed to initialize insight processing tables', { 
      error: error.message 
    });
    throw error;
  }
}

// Export singleton instance
export const insightProcessor = new InsightProcessor();
