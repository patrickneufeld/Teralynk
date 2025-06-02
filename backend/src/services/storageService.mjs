// ✅ FILE: /backend/src/services/storageService.mjs

/**
 * Teralynk Storage Service
 * -------------------------
 * Enterprise-grade logic for managing storage across cloud and database sources.
 * Supports usage, cost analysis, optimization recommendations, S3 object management,
 * and dynamic user storage location records.
 */

import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { query } from '../config/db.mjs';
import logger from '../utils/logger.mjs';

/**
 * AWS S3 Client Configuration
 */
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

/**
 * List all S3 files for a specific user
 * @param {string} userId
 * @returns {Promise<Array<{ key: string, size: number, lastModified: string }>>}
 */
export async function listUserFiles(userId) {
  try {
    const prefix = `users/${userId}/`;
    const command = new ListObjectsV2Command({
      Bucket: process.env.S3_BUCKET_NAME,
      Prefix: prefix,
    });

    const data = await s3.send(command);
    const files = data?.Contents || [];

    return files.map(file => ({
      key: file.Key,
      size: file.Size,
      lastModified: file.LastModified,
    }));
  } catch (err) {
    logger.error('storageService:listUserFiles failed', { userId, error: err.message });
    throw new Error('Failed to retrieve user files from S3');
  }
}

/**
 * Calculate total S3 storage used by a user
 * @param {string} userId
 * @returns {Promise<number>} Total bytes used
 */
export async function getUserTotalStorage(userId) {
  try {
    const files = await listUserFiles(userId);
    const totalBytes = files.reduce((sum, file) => sum + (file.size || 0), 0);
    logger.info('storageService:getUserTotalStorage success', { userId, totalBytes });
    return totalBytes;
  } catch (err) {
    logger.error('storageService:getUserTotalStorage failed', { userId, error: err.message });
    throw new Error('Failed to calculate total user storage');
  }
}

/**
 * Retrieve latest storage usage record from PostgreSQL
 * @param {string} userId
 * @returns {Promise<{ user_id: string, total_bytes: number, last_updated: string }>}
 */
export async function getStorageUsage(userId) {
  try {
    const sql = `
      SELECT user_id, total_bytes, last_updated
      FROM storage_usage
      WHERE user_id = $1
      ORDER BY last_updated DESC
      LIMIT 1;
    `;
    const { rows } = await query(sql, [userId]);
    if (!rows.length) {
      logger.warn('storageService:getStorageUsage - no records found', { userId });
      return { user_id: userId, total_bytes: 0, last_updated: null };
    }
    logger.debug('storageService:getStorageUsage - success', { userId, result: rows[0] });
    return rows[0];
  } catch (err) {
    logger.error('storageService:getStorageUsage failed', { userId, error: err.message });
    throw new Error('Database error while fetching storage usage');
  }
}

/**
 * Calculate estimated monthly storage cost for a user
 * @param {string} userId
 * @returns {Promise<{ totalBytes: number, estimatedCostUSD: number, fileCount: number }>}
 */
export async function getStorageCostAnalysis(userId) {
  try {
    const sql = `
      SELECT
        COALESCE(SUM(size_bytes), 0) AS total_bytes,
        ROUND(COALESCE(SUM(size_bytes), 0) / 1e9 * 0.023, 2) AS estimated_cost_usd,
        COUNT(*) AS file_count
      FROM storage_usage
      WHERE user_id = $1;
    `;
    const { rows } = await query(sql, [userId]);
    const row = rows?.[0] || {};
    return {
      totalBytes: Number(row.total_bytes || 0),
      estimatedCostUSD: Number(row.estimated_cost_usd || 0),
      fileCount: Number(row.file_count || 0)
    };
  } catch (err) {
    logger.error('storageService:getStorageCostAnalysis failed', { userId, error: err.message });
    throw new Error('Database error while calculating storage cost');
  }
}
/**
 * Recommend cloud storage options based on usage, latency, speed, and pricing
 * @param {string} userId
 * @returns {Promise<Array>} Ranked storage provider recommendations
 */
export async function getStorageRecommendations(userId) {
  try {
    const usage = await getStorageUsage(userId);
    const providers = [
      { name: 'AWS S3', region: 'us-east-1', pricePerGB: 0.023, writeLatencyMs: 40, readLatencyMs: 20, durability: '11 9s', sla: '99.99%', apiCost: 0.005 },
      { name: 'Google Cloud Storage', region: 'us-central1', pricePerGB: 0.020, writeLatencyMs: 50, readLatencyMs: 30, durability: '11 9s', sla: '99.95%', apiCost: 0.006 },
      { name: 'Backblaze B2', region: 'us-west-001', pricePerGB: 0.005, writeLatencyMs: 80, readLatencyMs: 60, durability: '8 9s', sla: '99.9%', apiCost: 0.004 },
      { name: 'Dropbox Business', region: 'multi', pricePerGB: 0.10, writeLatencyMs: 30, readLatencyMs: 15, durability: '9 9s', sla: '99.99%', apiCost: 0.01 }
    ];

    const scored = providers.map(provider => {
      const costScore = 1 / (provider.pricePerGB + provider.apiCost);
      const speedScore = 1 / (provider.writeLatencyMs + provider.readLatencyMs);
      const latencyScore = 1 / Math.max(provider.readLatencyMs, 1);
      const durabilityScore = provider.durability.includes('11') ? 1 : 0.8;
      const regionBonus = provider.region === 'us-east-1' ? 1 : 0.9;
      const finalScore = (
        costScore * 0.4 +
        speedScore * 0.25 +
        latencyScore * 0.2 +
        durabilityScore * 0.1 +
        regionBonus * 0.05
      );
      return {
        ...provider,
        estimatedMonthlyCost: (usage.total_bytes / 1e9) * provider.pricePerGB,
        recommendationScore: parseFloat(finalScore.toFixed(4))
      };
    });

    return scored.sort((a, b) => b.recommendationScore - a.recommendationScore);
  } catch (err) {
    logger.error('storageService:getStorageRecommendations failed', { userId, error: err.message });
    throw new Error('Failed to generate storage recommendations');
  }
}

// ─────────────────────────────────────────────────────────────
// Storage Location Management (DB-backed)
// ─────────────────────────────────────────────────────────────

/**
 * Insert new storage location
 * @param {string} userId
 * @param {object} locationData
 * @returns {Promise<object>}
 */
export async function addUserStorageLocation(userId, locationData) {
  try {
    const sql = `
      INSERT INTO storage_locations (
        user_id, provider, location_name, tier, price_per_gb_usd,
        latency_ms, speed_rating, notes, is_active
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, COALESCE($9, true)
      )
      RETURNING *;
    `;
    const params = [
      userId,
      locationData.provider,
      locationData.location_name,
      locationData.tier,
      locationData.price_per_gb_usd,
      locationData.latency_ms,
      locationData.speed_rating,
      locationData.notes,
      locationData.is_active
    ];
    const { rows } = await query(sql, params);
    return rows[0];
  } catch (err) {
    logger.error('storageService:addUserStorageLocation failed', { userId, error: err.message });
    throw new Error('Failed to add storage location');
  }
}

/**
 * Get all storage locations for a user
 * @param {string} userId
 * @returns {Promise<Array>}
 */
export async function getUserStorageLocations(userId) {
  try {
    const { rows } = await query(
      `SELECT * FROM storage_locations WHERE user_id = $1 AND is_active = true ORDER BY updated_at DESC;`,
      [userId]
    );
    return rows;
  } catch (err) {
    logger.error('storageService:getUserStorageLocations failed', { userId, error: err.message });
    throw new Error('Failed to retrieve storage locations');
  }
}

/**
 * Update storage location by ID
 * @param {string} locationId
 * @param {object} update
 * @returns {Promise<object>}
 */
export async function updateStorageLocation(locationId, update) {
  try {
    const fields = [];
    const values = [];
    let i = 1;
    for (const key in update) {
      fields.push(`${key} = $${i++}`);
      values.push(update[key]);
    }
    values.push(locationId);

    const sql = `
      UPDATE storage_locations
      SET ${fields.join(', ')}, updated_at = NOW()
      WHERE id = $${i}
      RETURNING *;
    `;
    const { rows } = await query(sql, values);
    return rows[0];
  } catch (err) {
    logger.error('storageService:updateStorageLocation failed', { locationId, error: err.message });
    throw new Error('Failed to update storage location');
  }
}

/**
 * Soft delete storage location
 * @param {string} locationId
 * @returns {Promise<boolean>}
 */
export async function deleteStorageLocation(locationId) {
  try {
    await query(
      `UPDATE storage_locations SET is_active = false, updated_at = NOW() WHERE id = $1;`,
      [locationId]
    );
    return true;
  } catch (err) {
    logger.error('storageService:deleteStorageLocation failed', { locationId, error: err.message });
    throw new Error('Failed to delete storage location');
  }
}
/**
 * Fetch a single storage location by ID
 * @param {string} locationId
 * @returns {Promise<object|null>}
 */
export async function getStorageLocationById(locationId) {
  try {
    const sql = `SELECT * FROM storage_locations WHERE id = $1 LIMIT 1;`;
    const { rows } = await query(sql, [locationId]);
    return rows?.[0] || null;
  } catch (err) {
    logger.error('storageService:getStorageLocationById failed', { locationId, error: err.message });
    throw new Error('Failed to retrieve storage location by ID');
  }
}

/**
 * Restore (reactivate) a previously deleted location
 * @param {string} locationId
 * @returns {Promise<object>}
 */
export async function restoreStorageLocation(locationId) {
  try {
    const sql = `
      UPDATE storage_locations
      SET is_active = true, updated_at = NOW()
      WHERE id = $1
      RETURNING *;
    `;
    const { rows } = await query(sql, [locationId]);
    return rows[0];
  } catch (err) {
    logger.error('storageService:restoreStorageLocation failed', { locationId, error: err.message });
    throw new Error('Failed to restore storage location');
  }
}

/**
 * Validate existence of storage location for given user
 * @param {string} userId
 * @param {string} locationId
 * @returns {Promise<boolean>}
 */
export async function validateUserLocationAccess(userId, locationId) {
  try {
    const sql = `
      SELECT 1 FROM storage_locations
      WHERE id = $1 AND user_id = $2 AND is_active = true
      LIMIT 1;
    `;
    const { rowCount } = await query(sql, [locationId, userId]);
    return rowCount > 0;
  } catch (err) {
    logger.error('storageService:validateUserLocationAccess failed', { userId, locationId, error: err.message });
    return false;
  }
}

/**
 * Admin function: Get all locations across users (for dashboard use)
 * @returns {Promise<Array>}
 */
export async function getAllStorageLocations() {
  try {
    const sql = `
      SELECT * FROM storage_locations
      WHERE is_active = true
      ORDER BY updated_at DESC;
    `;
    const { rows } = await query(sql);
    return rows;
  } catch (err) {
    logger.error('storageService:getAllStorageLocations failed', { error: err.message });
    throw new Error('Failed to fetch all storage locations');
  }
}
/**
 * Count active storage locations for a user
 * @param {string} userId
 * @returns {Promise<number>}
 */
export async function countUserLocations(userId) {
  try {
    const sql = `
      SELECT COUNT(*) AS count
      FROM storage_locations
      WHERE user_id = $1 AND is_active = true;
    `;
    const { rows } = await query(sql, [userId]);
    return parseInt(rows[0]?.count || '0', 10);
  } catch (err) {
    logger.error('storageService:countUserLocations failed', { userId, error: err.message });
    throw new Error('Failed to count user storage locations');
  }
}

/**
 * Simple health check logic to test storage service DB access
 * @returns {Promise<boolean>}
 */
export async function healthCheckStorageService() {
  try {
    const result = await query('SELECT 1');
    return result.rowCount === 1;
  } catch (err) {
    logger.error('storageService:healthCheck failed', { error: err.message });
    return false;
  }
}
/**
 * Add a new storage location record for the specified user
 * @param {string} userId
 * @param {object} data
 * @returns {Promise<object>}
 */
export async function addStorageLocation(userId, data) {
  try {
    const sql = `
      INSERT INTO storage_locations (
        user_id,
        provider,
        location_name,
        tier,
        price_per_gb_usd,
        latency_ms,
        speed_rating,
        notes,
        is_active,
        created_at,
        updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8,
        COALESCE($9, true),
        NOW(),
        NOW()
      )
      RETURNING *;
    `;

    const params = [
      userId,
      data.provider,
      data.location_name,
      data.tier,
      data.price_per_gb_usd,
      data.latency_ms,
      data.speed_rating,
      data.notes || '',
      data.is_active
    ];

    const { rows } = await query(sql, params);
    return rows[0];
  } catch (err) {
    logger.error('storageService:addStorageLocation failed', {
      userId,
      input: data,
      error: err.message
    });
    throw new Error('Failed to add new storage location');
  }
}
