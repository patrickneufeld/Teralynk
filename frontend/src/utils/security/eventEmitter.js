// ================================================
// ✅ FILE: /frontend/src/utils/security/eventEmitter.js
// Secure Event Emitter with All Fixes Applied (v2.2.6)
// ================================================

import EventEmitter from 'eventemitter3';
import { v4 as uuidv4 } from 'uuid';
import { logInfo, logWarn, logError } from '../logging';

// 🎯 VALID SECURITY EVENTS
export const SECURITY_EVENTS = Object.freeze({
  AUTH_SUCCESS: 'security:auth:success',
  AUTH_FAILURE: 'security:auth:failure',
  AUTH_ATTEMPT: 'security:auth:attempt',
  AUTH_LOGOUT: 'security:auth:logout',
  TOKEN_EXPIRED: 'security:token:expired',
  TOKEN_REFRESH: 'security:token:refresh',
  TOKEN_INVALID: 'security:token:invalid',
  SESSION_START: 'security:session:start',
  SESSION_END: 'security:session:end',
  SESSION_TIMEOUT: 'security:session:timeout',
  SESSION_EXTEND: 'security:session:extend',
  SECURITY_VIOLATION: 'security:violation',
  SECURITY_WARNING: 'security:warning',
  SECURITY_ERROR: 'security:error',
  MFA_REQUIRED: 'security:mfa:required',
  MFA_SUCCESS: 'security:mfa:success',
  MFA_FAILURE: 'security:mfa:failure',
  DEVICE_VERIFIED: 'security:device:verified',
  DEVICE_BLOCKED: 'security:device:blocked',
  DEVICE_SUSPICIOUS: 'security:device:suspicious',
  DATA_ACCESS: 'security:data:access',
  DATA_MODIFY: 'security:data:modify',
  DATA_DELETE: 'security:data:delete',
  NETWORK_FAILURE: 'security:network:failure',
  API_ERROR: 'security:api:error',
  REQUEST_BLOCKED: 'security:request:blocked'
});

class SecurityEvent {
  static sequence = 0;

  constructor(type, data = {}) {
    if (typeof type !== 'string' || !type.trim()) {
      throw new Error('Event name must be a non-empty string');
    }
    if (!Object.values(SECURITY_EVENTS).includes(type)) {
      throw new Error(`Invalid security event type: ${type}`);
    }

    this.eventId = uuidv4();
    this.timestamp = new Date().toISOString();
    this.traceId = data.traceId || uuidv4();
    this.type = type;
    this.data = this.sanitize(data);
    this.sequence = ++SecurityEvent.sequence;
    this.severity = this.determineSeverity(type);
    this.source = data.source || 'application';
    this.userId = data.userId || null;
  }

  sanitize(data) {
    const clean = { ...data };
    const sensitive = ['token', 'password', 'secret', 'key', 'auth', 'credential'];
    for (const k of Object.keys(clean)) {
      if (sensitive.some(s => k.toLowerCase().includes(s))) delete clean[k];
    }
    return clean;
  }

  determineSeverity(type) {
    const severityMap = {
      high: /(violation|error|failure|blocked|invalid)/i,
      medium: /(warning|timeout|suspicious|required)/i,
      low: /(success|verified|start|extend)/i
    };
    return Object.entries(severityMap).find(([_, pattern]) => pattern.test(type))?.[0] || 'low';
  }

  toJSON() {
    return {
      eventId: this.eventId,
      timestamp: this.timestamp,
      traceId: this.traceId,
      type: this.type,
      data: this.data,
      severity: this.severity,
      sequence: this.sequence,
      source: this.source,
      userId: this.userId
    };
  }
}

export class SecurityEventEmitter extends EventEmitter {
  constructor({ maxHistory = 1000, historyRetention = 86400000, enableDebug = false } = {}) {
    super();
    this.handlers = new Map();
    this.eventHistory = new Map();
    this.MAX_HISTORY = maxHistory;
    this.HISTORY_RETENTION = historyRetention;
    this.debug = enableDebug;
  }

  emitSecurityEvent(type, payload = {}) {
    if (typeof type !== 'string' || !type.trim()) {
      logError('❌ emitSecurityEvent missing name', { type, traceId: payload.traceId || null });
      return null;
    }

    if (!Object.values(SECURITY_EVENTS).includes(type)) {
      logWarn('⚠️ Unknown security event type', { type, traceId: payload.traceId || null });
      return null;
    }

    try {
      const event = new SecurityEvent(type, {
        ...payload,
        traceId: payload.traceId || uuidv4()
      });

      this._logEvent(event);
      this._storeEvent(type, event);

      this.emit(type, event);
      this.emit(`severity:${event.severity}`, event);
      this.emit('*', event);

      return event;
    } catch (err) {
      logError('❌ emitSecurityEvent failed during instantiation', {
        type,
        error: err.message,
        traceId: payload.traceId || null
      });
      return null;
    }
  }

  // Wrapped handlers
  on(eventName, handler) {
    const wrapped = (event) => {
      try {
        handler(event);
      } catch (err) {
        logError('Handler failed', { eventName, error: err.message, traceId: event?.traceId });
      }
    };
    this.handlers.set(handler, wrapped);
    super.on(eventName, wrapped);
    return () => this.off(eventName, handler);
  }

  once(eventName, handler) {
    const wrapped = (event) => {
      try {
        handler(event);
      } catch (err) {
        logError('One-time handler failed', { eventName, error: err.message, traceId: event?.traceId });
      }
    };
    this.handlers.set(handler, wrapped);
    super.once(eventName, wrapped);
    return () => this.off(eventName, handler);
  }

  off(eventName, handler) {
    const wrapped = this.handlers.get(handler);
    if (wrapped) {
      super.off(eventName, wrapped);
      this.handlers.delete(handler);
    }
  }

  subscribe(callback) {
    return this.on('*', callback);
  }

  subscribeTo(types, callback) {
    const unsubscribers = types.map(t => this.on(t, callback));
    return () => unsubscribers.forEach(unsub => unsub());
  }

  clear() {
    this.handlers.clear();
    this.eventHistory.clear();
    this.removeAllListeners();
  }

  getEventHistory(eventName) {
    if (eventName) return [...(this.eventHistory.get(eventName) || [])];
    return Array.from(this.eventHistory.values()).flat().sort((a, b) => b.sequence - a.sequence);
  }

  _logEvent(event) {
    const log = event.severity === 'high' ? logError : event.severity === 'medium' ? logWarn : logInfo;
    log(`Security Event: ${event.type}`, event.toJSON());
    if (this.debug) console.debug('[SecurityEvent]', event.toJSON());
  }

  _storeEvent(name, event) {
    if (!this.eventHistory.has(name)) this.eventHistory.set(name, []);
    const list = this.eventHistory.get(name);
    list.push(event);

    const cutoff = Date.now() - this.HISTORY_RETENTION;
    while (list.length > this.MAX_HISTORY || (list[0] && new Date(list[0].timestamp).getTime() < cutoff)) {
      list.shift();
    }
  }
}

// ✅ Final clean exports — DO NOT DUPLICATE
export const securityEvents = new SecurityEventEmitter();
export const emitSecurityEvent = (type, details = {}) => securityEvents.emitSecurityEvent(type, details);
export const subscribeToSecurityEvents = (callback) => securityEvents.subscribe(callback);
export const clearSecurityEvents = () => securityEvents.clear();
export default securityEvents;
export const VERSION = '2.2.6';
