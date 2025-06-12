// ✅ FILE: /backend/src/ai/aiTelemetryService.js

import db from '../config/db.mjs';
import { v4 as uuidv4 } from 'uuid';
import { logInfo, logError } from '../utils/logger.mjs';

const TELEMETRY_TABLE = 'ai_telemetry_events';

/**
 * Record a structured AI event with full trace and security context
 * @param {string} eventType - E.g. ai_query, ai_feedback, self_patch, anomaly_detected
 * @param {object} metadata - Includes traceId, userId, platform, etc.
 * @returns {string} telemetryId
 */
export async function recordEventTelemetry(eventType, metadata = {}) {
  const telemetryId = uuidv4();
  const timestamp = new Date().toISOString();

  const eventPayload = {
    telemetry_id: telemetryId,
    event_type: eventType,
    trace_id: metadata.traceId || uuidv4(),
    user_id: metadata.userId || null,
    platform: metadata.platform || null,
    details: JSON.stringify(metadata),
    created_at: timestamp,
  };

  try {
    await db.query(
      `INSERT INTO ${TELEMETRY_TABLE} 
        (telemetry_id, event_type, trace_id, user_id, platform, details, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        eventPayload.telemetry_id,
        eventPayload.event_type,
        eventPayload.trace_id,
        eventPayload.user_id,
        eventPayload.platform,
        eventPayload.details,
        eventPayload.created_at,
      ]
    );

    logInfo(`📡 Telemetry Recorded: ${eventType}`, eventPayload);
    return telemetryId;
  } catch (error) {
    logError('❌ Failed to record telemetry event', {
      error: error.message,
      eventPayload,
    });
    throw new Error('Telemetry recording failed');
  }
}
/**
 * Batch insert multiple telemetry events for high-volume logging
 * @param {Array<Object>} events - Array of { eventType, metadata } objects
 * @returns {number} insertedCount
 */
export async function recordBatchTelemetry(events = []) {
  if (!Array.isArray(events) || events.length === 0) return 0;

  const now = new Date().toISOString();
  const values = [];
  const placeholders = [];

  events.forEach((event, idx) => {
    const telemetryId = uuidv4();
    const traceId = event.metadata?.traceId || uuidv4();
    const userId = event.metadata?.userId || null;
    const platform = event.metadata?.platform || null;
    const details = JSON.stringify(event.metadata || {});
    const baseIndex = idx * 7;

    values.push(
      telemetryId,
      event.eventType,
      traceId,
      userId,
      platform,
      details,
      now
    );

    placeholders.push(
      `($${baseIndex + 1}, $${baseIndex + 2}, $${baseIndex + 3}, $${baseIndex + 4}, $${baseIndex + 5}, $${baseIndex + 6}, $${baseIndex + 7})`
    );
  });

  const query = `
    INSERT INTO ${TELEMETRY_TABLE} 
    (telemetry_id, event_type, trace_id, user_id, platform, details, created_at)
    VALUES ${placeholders.join(', ')}
  `;

  try {
    await db.query(query, values);
    logInfo(`📦 Batched Telemetry Inserted: ${events.length} events`);
    return events.length;
  } catch (error) {
    logError('❌ Failed to record batched telemetry', { error: error.message, events });
    throw new Error('Batched telemetry recording failed');
  }
}

/**
 * Retrieve recent telemetry logs for diagnostics or analytics
 * @param {object} options - { limit, userId, eventType, sinceDate }
 * @returns {array} logs
 */
export async function getTelemetryLogs({ limit = 50, userId, eventType, sinceDate } = {}) {
  const conditions = [];
  const params = [];
  let idx = 1;

  if (userId) {
    conditions.push(`user_id = $${idx++}`);
    params.push(userId);
  }

  if (eventType) {
    conditions.push(`event_type = $${idx++}`);
    params.push(eventType);
  }

  if (sinceDate) {
    conditions.push(`created_at >= $${idx++}`);
    params.push(sinceDate);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const query = `
    SELECT * FROM ${TELEMETRY_TABLE}
    ${whereClause}
    ORDER BY created_at DESC
    LIMIT $${idx}
  `;
  params.push(limit);

  try {
    const result = await db.query(query, params);
    return result.rows;
  } catch (error) {
    logError('❌ Failed to fetch telemetry logs', { error: error.message, options });
    throw new Error('Unable to retrieve telemetry logs');
  }
}


// Alias for compatibility with other files
export { recordEventTelemetry as recordTelemetryEvent };
