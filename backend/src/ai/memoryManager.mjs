import { logAuditEntry } from "../guardrails/AuditLogger.mjs";
import { isKillSwitchEnabled } from "../guardrails/KillSwitch.mjs";
// File: /backend/src/ai/memoryManager.js

import { logInfo, logError, logDebug, logWarn } from '../utils/logger.mjs';
import { db } from '../database/connection.mjs';
import { createHash } from 'crypto';
import { MetricsAggregator } from '../monitoring/metricsAggregator.mjs';
import { AnomalyDetector } from '../security/anomalyDetector.mjs';

export class MemoryManager {
  constructor() {
    this.shortTermMemory = new Map();
    this.workingMemory = new Map();
    this.metricsAggregator = new MetricsAggregator('memory_management');
    this.anomalyDetector = new AnomalyDetector();
    
    // Configuration
    this.config = {
      shortTermRetention: 1000 * 60 * 60, // 1 hour
      workingMemoryLimit: 1000, // entries
      compressionThreshold: 100, // entries
      cleanupInterval: 1000 * 60 * 5, // 5 minutes
      persistenceInterval: 1000 * 60 * 15 // 15 minutes
    };

    // Start maintenance tasks
    this.startMaintenanceTasks();
  }

  async storeMemory(memory, context = {}) {
    const memoryId = this.generateMemoryId(memory);
    
    try {
      // Validate memory structure
      this.validateMemory(memory);

      // Enrich memory with metadata
      const enrichedMemory = this.enrichMemory(memory, context);

      // Check for anomalies
      const anomalies = await this.anomalyDetector.analyze(enrichedMemory);
      if (anomalies.length > 0) {
        logWarn('Anomalies detected in memory', { memoryId, anomalies });
        enrichedMemory.anomalies = anomalies;
      }

      // Store in short-term memory
      this.shortTermMemory.set(memoryId, enrichedMemory);

      // Update working memory if relevant
      if (this.isRelevantForWorkingMemory(enrichedMemory)) {
        this.workingMemory.set(memoryId, enrichedMemory);
      }

      // Persist to long-term storage
      await this.persistMemory(enrichedMemory);

      // Update metrics
      await this.metricsAggregator.record({
        type: 'memory_stored',
        metadata: {
          memoryId,
          type: enrichedMemory.type,
          size: JSON.stringify(enrichedMemory).length
        }
      });

      logInfo('Memory stored successfully', { memoryId });
      return { memoryId, memory: enrichedMemory };

    } catch (error) {
      logError('Failed to store memory', { memoryId, error: error.message });
      throw error;
    }
  }

  async retrieveMemory(memoryId, options = {}) {
    try {
      // Check short-term memory first
      let memory = this.shortTermMemory.get(memoryId);
      
      // Check working memory if not found
      if (!memory) {
        memory = this.workingMemory.get(memoryId);
      }

      // If still not found, check long-term storage
      if (!memory) {
        memory = await this.retrieveFromLongTerm(memoryId);
        
        // Cache in short-term memory if found
        if (memory) {
          this.shortTermMemory.set(memoryId, memory);
        }
      }

      if (!memory) {
        throw new Error(`Memory not found: ${memoryId}`);
      }

      // Update access patterns
      await this.updateAccessPatterns(memoryId);

      return memory;

    } catch (error) {
      logError('Failed to retrieve memory', { memoryId, error: error.message });
      throw error;
    }
  }

  async searchMemories(query, options = {}) {
    try {
      const results = await db.query(
        `SELECT * FROM long_term_memories 
         WHERE memory_data @> $1
         ORDER BY last_accessed DESC
         LIMIT $2`,
        [JSON.stringify(query), options.limit || 10]
      );

      return results.rows.map(row => this.deserializeMemory(row.memory_data));

    } catch (error) {
      logError('Failed to search memories', { query, error: error.message });
      throw error;
    }
  }

  async consolidateMemories() {
    try {
      const memories = Array.from(this.shortTermMemory.values());
      const consolidated = await this.consolidationAlgorithm(memories);
      
      // Store consolidated memories
      for (const memory of consolidated) {
        await this.persistMemory(memory);
      }

      logInfo('Memory consolidation completed', { 
        processed: memories.length,
        consolidated: consolidated.length 
      });

    } catch (error) {
      logError('Memory consolidation failed', { error: error.message });
      throw error;
    }
  }

  async persistMemory(memory) {
    try {
      await db.query(
        `INSERT INTO long_term_memories 
         (memory_id, memory_type, memory_data, created_at, last_accessed)
         VALUES ($1, $2, $3, NOW(), NOW())
         ON CONFLICT (memory_id) 
         DO UPDATE SET 
           memory_data = $3,
           last_accessed = NOW()`,
        [
          memory.id,
          memory.type,
          JSON.stringify(memory)
        ]
      );
    } catch (error) {
      logError('Failed to persist memory', { 
        memoryId: memory.id, 
        error: error.message 
      });
      throw error;
    }
  }

  async updateAccessPatterns(memoryId) {
    try {
      await db.query(
        `UPDATE long_term_memories 
         SET access_count = access_count + 1,
             last_accessed = NOW()
         WHERE memory_id = $1`,
        [memoryId]
      );
    } catch (error) {
      logError('Failed to update access patterns', { 
        memoryId, 
        error: error.message 
      });
    }
  }

  // Maintenance methods
  startMaintenanceTasks() {
    setInterval(() => this.cleanup(), this.config.cleanupInterval);
    setInterval(() => this.consolidateMemories(), this.config.persistenceInterval);
  }

  async cleanup() {
    try {
      const now = Date.now();
      
      // Cleanup short-term memory
      for (const [id, memory] of this.shortTermMemory.entries()) {
        if (now - memory.timestamp > this.config.shortTermRetention) {
          this.shortTermMemory.delete(id);
        }
      }

      // Cleanup working memory if over limit
      if (this.workingMemory.size > this.config.workingMemoryLimit) {
        this.compressWorkingMemory();
      }

      logDebug('Memory cleanup completed');

    } catch (error) {
      logError('Memory cleanup failed', { error: error.message });
    }
  }

  // Utility methods
  generateMemoryId(memory) {
    const hash = createHash('sha256');
    hash.update(JSON.stringify(memory) + Date.now());
    return `mem_${hash.digest('hex').substr(0, 16)}`;
  }

  validateMemory(memory) {
    if (!memory || typeof memory !== 'object') {
      throw new Error('Invalid memory format');
    }

    const requiredFields = ['type', 'data'];
    for (const field of requiredFields) {
      if (!(field in memory)) {
        throw new Error(`Missing required field: ${field}`);
      }
    }
  }

  enrichMemory(memory, context) {
    return {
      ...memory,
      id: this.generateMemoryId(memory),
      timestamp: Date.now(),
      context: {
        ...context,
        created: new Date().toISOString()
      },
      metadata: {
        ...memory.metadata,
        version: '1.0.0'
      }
    };
  }

  isRelevantForWorkingMemory(memory) {
    // Implement relevance criteria
    return true;
  }

  async consolidationAlgorithm(memories) {
    // Implement memory consolidation logic
    return memories;
  }

  compressWorkingMemory() {
    // Implement working memory compression
    const entries = Array.from(this.workingMemory.entries());
    entries.sort((a, b) => b[1].timestamp - a[1].timestamp);
    
    // Keep only the most recent entries
    this.workingMemory = new Map(entries.slice(0, this.config.workingMemoryLimit));
  }

  deserializeMemory(data) {
    try {
      return typeof data === 'string' ? JSON.parse(data) : data;
    } catch (error) {
      logError('Failed to deserialize memory', { error: error.message });
      return null;
    }
  }
}

// Initialize database tables
export async function initializeMemoryTables() {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS long_term_memories (
        id SERIAL PRIMARY KEY,
        memory_id VARCHAR(255) UNIQUE NOT NULL,
        memory_type VARCHAR(50) NOT NULL,
        memory_data JSONB NOT NULL,
        access_count INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL,
        last_accessed TIMESTAMP WITH TIME ZONE NOT NULL
      )
    `);

    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_memories_type
      ON long_term_memories(memory_type)
    `);

    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_memories_accessed
      ON long_term_memories(last_accessed)
    `);

    logInfo('Memory management tables initialized successfully');
  } catch (error) {
    logError('Failed to initialize memory management tables', { 
      error: error.message 
    });
    throw error;
  }
}

// Export singleton instance
export const memoryManager = new MemoryManager();
