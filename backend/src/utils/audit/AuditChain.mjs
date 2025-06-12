// /backend/src/utils/audit/AuditChain.js

import crypto from 'crypto';
import { logDebug, logError } from '../logger.mjs';
import { getTraceId } from '../trace.mjs';
import { emitTelemetry } from '../telemetryUtils.mjs';

/**
 * Class representing a linked audit event chain for integrity verification.
 */
export class AuditChain {
  constructor({ chainId = null, initiator = null } = {}) {
    this.chainId = chainId || crypto.randomUUID();
    this.events = [];
    this.initiator = initiator || 'system';
  }

  /**
   * Add an event to the chain.
   * @param {Object} event
   */
  addEvent(event = {}) {
    try {
      const previousHash = this.events.length > 0 ? this.events[this.events.length - 1].hash : null;
      const timestamp = new Date().toISOString();
      const traceId = getTraceId();

      const data = {
        chainId: this.chainId,
        initiator: this.initiator,
        event,
        timestamp,
        traceId,
        previousHash
      };

      const hash = this._computeHash(data);
      const chainEvent = { ...data, hash };

      this.events.push(chainEvent);

      emitTelemetry('audit_event_added', {
        traceId,
        chainId: this.chainId,
        eventType: event?.type || 'unknown',
        timestamp
      });

      logDebug(`AuditChain event added: ${event?.type}`, { chainId: this.chainId, traceId });

    } catch (error) {
      logError('Failed to add event to AuditChain', { error });
    }
  }

  /**
   * Returns a hash of the event payload using SHA-256.
   * @param {Object} data
   */
  _computeHash(data) {
    const stringified = JSON.stringify(data, Object.keys(data).sort());
    return crypto.createHash('sha256').update(stringified).digest('hex');
  }

  /**
   * Validates the integrity of the audit chain.
   * @returns {Boolean}
   */
  verifyChain() {
    for (let i = 1; i < this.events.length; i++) {
      const prev = this.events[i - 1];
      const current = this.events[i];

      const expectedHash = this._computeHash({
        ...current,
        previousHash: prev.hash,
        hash: undefined // avoid rehashing hash itself
      });

      if (current.previousHash !== prev.hash || current.hash !== expectedHash) {
        logError('AuditChain verification failed', {
          index: i,
          expectedHash,
          actualHash: current.hash,
          previousHashMismatch: current.previousHash !== prev.hash
        });
        return false;
      }
    }

    return true;
  }

  /**
   * Serialize the chain for storage or inspection.
   * @returns {Array}
   */
  toJSON() {
    return this.events;
  }

  /**
   * Clears the current event chain.
   */
  reset() {
    this.events = [];
  }
}
