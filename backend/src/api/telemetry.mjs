// ✅ FILE: /backend/src/api/telemetry.mjs
// Hardened API handler for frontend telemetry events
// Handles validation, formatting, and structured backend emission

import express from 'express';
import { emitTelemetry, formatTelemetryEvent } from '../utils/telemetryUtils.mjs';
import logger from '../config/logger.mjs';

const router = express.Router();

/**
 * @route POST /api/telemetry
 * @desc Receives batched telemetry events from the frontend
 */
router.post('/', async (req, res) => {
  try {
    const { events = [] } = req.body;

    if (!Array.isArray(events) || events.length === 0) {
      logger.warn('[Telemetry] Invalid or empty event batch received', {
        received: typeof events,
        payload: req.body,
      });
      return res.status(400).json({ error: 'Invalid telemetry payload' });
    }

    let successCount = 0;

    for (const rawEvent of events) {
      try {
        const eventName = rawEvent?.eventName || 'unknown';
        const traceId = rawEvent?.traceId || undefined;
        const sessionId = rawEvent?.sessionId || undefined;
        const data = rawEvent?.data || {};

        const structuredEvent = formatTelemetryEvent(eventName, data, traceId, sessionId);
        emitTelemetry(structuredEvent);
        successCount++;
      } catch (innerErr) {
        logger.warn('[Telemetry] Skipped malformed event', {
          event: rawEvent,
          error: innerErr.message,
        });
      }
    }

    return res.status(200).json({
      success: true,
      processed: successCount,
      dropped: events.length - successCount,
    });
  } catch (error) {
    logger.error('[Telemetry] Failed to process telemetry batch', {
      error: error.message,
      stack: error.stack,
    });
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
