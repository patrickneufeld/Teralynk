// File: /backend/src/utils/monitoring/TelemetryManager.js

// File: /backend/src/utils/monitoring/TelemetryManager.js

import { v4 as uuidv4 } from 'uuid';
import { performance } from 'perf_hooks';
import { logInfo, logError, logDebug } from '../logger.mjs';
import { recordEventTelemetry, recordBatchTelemetry } from '../../monitoring/telemetry.mjs';
import { getTraceId } from '../trace.mjs';

// ... rest of TelemetryManager class remains unchanged ...


export class TelemetryManager {
    constructor(component = 'TelemetryManager') {
        this.component = component;
        this.sessionId = uuidv4();
        this.events = [];
        this.performanceMarks = {};
        this.traceId = getTraceId() || uuidv4();
    }

    markStart(label) {
        const mark = `${label}-start`;
        performance.mark(mark);
        this.performanceMarks[label] = { start: Date.now(), label, traceId: this.traceId };
        logDebug(`[${this.component}] Marked start: ${label}`);
    }

    markEnd(label) {
        const mark = `${label}-end`;
        performance.mark(mark);
        performance.measure(label, `${label}-start`, mark);
        const end = Date.now();
        const duration = end - (this.performanceMarks[label]?.start || end);
        const event = {
            type: 'performance',
            label,
            duration,
            timestamp: new Date().toISOString(),
            traceId: this.traceId,
            sessionId: this.sessionId,
            component: this.component
        };
        this.events.push(event);
        logDebug(`[${this.component}] Marked end: ${label}, duration=${duration}ms`);
    }

    emitEvent({ type = 'custom', label, details = {}, severity = 'info' }) {
        const event = {
            type,
            label,
            details,
            timestamp: new Date().toISOString(),
            traceId: this.traceId,
            sessionId: this.sessionId,
            component: this.component,
            severity
        };
        this.events.push(event);
        logInfo(`[${this.component}] Telemetry event: ${label}`, event);
    }

    emitError(error, label = 'error') {
        const event = {
            type: 'error',
            label,
            error: {
                message: error.message,
                stack: error.stack
            },
            timestamp: new Date().toISOString(),
            traceId: this.traceId,
            sessionId: this.sessionId,
            component: this.component
        };
        this.events.push(event);
        logError(`[${this.component}] Error captured: ${label}`, error);
    }

    async flush() {
        if (this.events.length === 0) return;
        try {
            await recordBatchTelemetry(this.events);
            logInfo(`[${this.component}] Flushed ${this.events.length} telemetry events.`);
            this.events = [];
        } catch (err) {
            logError(`[${this.component}] Failed to flush telemetry`, err);
        }
    }
}
