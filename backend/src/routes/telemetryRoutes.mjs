// ✅ FILE: /backend/src/routes/telemetryRoutes.mjs

import express from 'express';
import logger from '../config/logger.mjs';
import { emitTelemetry, formatTelemetryEvent } from '../utils/telemetryUtils.mjs';

const router = express.Router();

/**
 * @route POST /api/telemetry
 * @desc Receives batched telemetry events from the frontend
 */
router.post('/', async (req, res) => {
  try {
    const { events = [] } = req.body;

    if (!Array.isArray(events) || events.length === 0) {
      logger.warn('[Telemetry] 🚫 Invalid or empty event batch received');
      return res.status(400).json({ error: 'Invalid payload: events must be a non-empty array' });
    }

    for (const rawEvent of events) {
      try {
        const structured = formatTelemetryEvent(
          rawEvent.eventName || 'unknown',
          rawEvent.data || {},
          rawEvent.traceId || 'trace_unknown'
        );
        emitTelemetry(structured);
      } catch (e) {
        logger.error('[Telemetry] ❌ Error formatting or emitting telemetry event', {
          error: e,
          rawEvent
        });
      }
    }

    return res.status(200).json({
      success: true,
      processed: events.length,
    });
  } catch (err) {
    logger.error('[Telemetry] ❌ Unhandled exception during telemetry POST', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
