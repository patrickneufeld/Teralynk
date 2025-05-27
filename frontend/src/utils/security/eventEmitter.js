// ✅ FILE: /frontend/src/utils/security/eventEmitter.js

import EventEmitter from 'eventemitter3';
import { v4 as uuidv4 } from 'uuid';
import { logInfo, logError, logWarn } from '../logging';

/**
 * Enhanced security event types enumeration
 */
export const SECURITY_EVENTS = {
  // Authentication Events
  AUTH_SUCCESS: 'security:auth:success',
  AUTH_FAILURE: 'security:auth:failure',
  AUTH_ATTEMPT: 'security:auth:attempt',
  
  // Token Events
  TOKEN_REFRESH: 'security:token:refresh',
  TOKEN_EXPIRED: 'security:token:expired',
  TOKEN_INVALID: 'security:token:invalid',
  
  // Session Events
  SESSION_START: 'security:session:start',
  SESSION_END: 'security:session:end',
  SESSION_EXPIRED: 'security:session:expired',
  
  // Security Violations
  SECURITY_VIOLATION: 'security:violation',
  CONCURRENT_SESSION: 'security:violation:concurrent',
  DEVICE_MISMATCH: 'security:violation:device',
  
  // MFA Events
  MFA_REQUIRED: 'security:mfa:required',
  MFA_SUCCESS: 'security:mfa:success',
  MFA_FAILURE: 'security:mfa:failure',
  
  // Network Security Events
  NETWORK_FAILURE: 'security:network:failure',
  API_BREACH: 'security:network:breach',
  RATE_LIMIT_EXCEEDED: 'security:network:rate-limit',
  API_ERROR: 'security:network:error',
  
  // History Events
  HISTORY_UPDATED: 'security:history:updated',
  HISTORY_CLEARED: 'security:history:cleared',
  
  // General Security Events
  SECURITY_WARNING: 'security:warning',
  SECURITY_ERROR: 'security:error',
  SECURITY_INFO: 'security:info'
};

/**
 * Enhanced security event with trace support
 */
class SecurityEvent {
  constructor(type, data = {}) {
    this.eventId = uuidv4();
    this.type = type;
    this.timestamp = new Date().toISOString();
    this.traceId = data.traceId || uuidv4();
    this.parentId = data.parentId || null;
    this.data = data;
    this.source = 'security-event-emitter';
    this.sequence = SecurityEvent.getSequence();
  }

  static sequence = 0;
  static getSequence() {
    return ++SecurityEvent.sequence;
  }
}

/**
 * Enhanced security event emitter with logging, validation, and tracing
 */
export class SecurityEventEmitter {
  constructor(options = {}) {
    this.emitter = new EventEmitter();
    this.handlers = new Map();
    this.eventHistory = new Map();
    this.MAX_HISTORY = options.maxHistory || 100;
    this.HISTORY_RETENTION = options.historyRetention || 24 * 60 * 60 * 1000; // 24 hours
    
    // Initialize cleanup interval
    this.cleanupInterval = setInterval(() => {
      this._cleanupOldEvents();
    }, 60 * 60 * 1000); // Hourly cleanup
  }

  /**
   * Enhanced event emission with tracing and validation
   */
  emit(eventName, data = {}) {
    try {
      // Validate event type
      if (!Object.values(SECURITY_EVENTS).includes(eventName)) {
        throw new Error(`Invalid security event type: ${eventName}`);
      }

      // Create security event
      const event = new SecurityEvent(eventName, {
        ...data,
        traceId: data.traceId || this._getTraceId(),
        parentId: data.parentId
      });

      // Log event
      this._logEvent(eventName, event);

      // Store in history
      this._addToHistory(eventName, event);

      // Emit event
      this.emitter.emit(eventName, event);

      // Emit history updated event (except for history events to prevent loops)
      if (!eventName.includes('history')) {
        this.emitter.emit(SECURITY_EVENTS.HISTORY_UPDATED, {
          eventType: eventName,
          historySize: this.getEventHistorySize(),
          timestamp: new Date().toISOString(),
          traceId: event.traceId
        });
      }

      return event;
    } catch (error) {
      logError('Security event emission failed', {
        eventName,
        error: error.message,
        data,
        traceId: data.traceId
      });
      return null;
    }
  }

  /**
   * Enhanced event subscription with trace support
   */
  on(eventName, handler) {
    try {
      // Validate event type
      if (!Object.values(SECURITY_EVENTS).includes(eventName)) {
        throw new Error(`Invalid security event type: ${eventName}`);
      }

      // Create wrapper to catch handler errors and maintain trace context
      const wrappedHandler = async (event) => {
        try {
          await handler(event);
        } catch (error) {
          logError('Security event handler failed', {
            eventName,
            eventId: event.eventId,
            traceId: event.traceId,
            error: error.message
          });
        }
      };

      // Store handler reference
      this.handlers.set(handler, wrappedHandler);

      // Add listener
      this.emitter.on(eventName, wrappedHandler);

      logInfo('Security event handler registered', {
        eventName,
        handlerId: handler.name || 'anonymous'
      });

      return () => this.off(eventName, handler);
    } catch (error) {
      logError('Security event subscription failed', {
        eventName,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Get event history with filtering options
   */
  getEventHistory(options = {}) {
    const {
      eventType,
      startTime,
      endTime,
      traceId,
      limit = this.MAX_HISTORY
    } = options;

    let events = [];

    if (eventType) {
      events = this.eventHistory.get(eventType) || [];
    } else {
      events = Array.from(this.eventHistory.values()).flat();
    }

    return events
      .filter(event => {
        if (startTime && new Date(event.timestamp) < new Date(startTime)) return false;
        if (endTime && new Date(event.timestamp) > new Date(endTime)) return false;
        if (traceId && event.traceId !== traceId) return false;
        return true;
      })
      .sort((a, b) => b.sequence - a.sequence)
      .slice(0, limit);
  }

  /**
   * Get current history size
   */
  getEventHistorySize() {
    return Array.from(this.eventHistory.values())
      .reduce((total, events) => total + events.length, 0);
  }

  /**
   * Clear event history with optional filtering
   */
  clearHistory(options = {}) {
    const { eventType, olderThan } = options;

    if (eventType) {
      this.eventHistory.delete(eventType);
    } else if (olderThan) {
      this._cleanupOldEvents(olderThan);
    } else {
      this.eventHistory.clear();
    }

    this.emit(SECURITY_EVENTS.HISTORY_CLEARED, {
      clearType: eventType ? 'specific' : 'all',
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Cleanup and shutdown
   */
  destroy() {
    clearInterval(this.cleanupInterval);
    this.removeAllListeners();
    this.eventHistory.clear();
    this.handlers.clear();
  }

  // Private methods

  /**
   * Get or create trace ID for request context
   */
  _getTraceId() {
    // Check for existing trace context (e.g., from request)
    if (typeof window !== 'undefined' && window.__TRACE_ID__) {
      return window.__TRACE_ID__;
    }
    return uuidv4();
  }

  /**
   * Add event to history with trace support
   */
  _addToHistory(eventName, event) {
    if (!this.eventHistory.has(eventName)) {
      this.eventHistory.set(eventName, []);
    }

    const events = this.eventHistory.get(eventName);
    events.push(event);

    // Maintain history size limit
    if (events.length > this.MAX_HISTORY) {
      events.shift();
    }
  }

  /**
   * Cleanup old events
   */
  _cleanupOldEvents(maxAge = this.HISTORY_RETENTION) {
    const cutoff = new Date(Date.now() - maxAge);

    this.eventHistory.forEach((events, eventName) => {
      const filtered = events.filter(event => 
        new Date(event.timestamp) > cutoff
      );
      
      if (filtered.length !== events.length) {
        this.eventHistory.set(eventName, filtered);
      }
    });
  }

  /**
   * Enhanced event logging with trace context
   */
  _logEvent(eventName, event) {
    const severity = this._getEventSeverity(eventName);
    const logMessage = `Security Event: ${eventName}`;
    const logData = {
      ...event,
      severity
    };

    switch (severity) {
      case 'error':
        logError(logMessage, logData);
        break;
      case 'warn':
        logWarn(logMessage, logData);
        break;
      default:
        logInfo(logMessage, logData);
    }
  }

  _getEventSeverity(eventName) {
    if (eventName.includes('violation') || eventName.includes('error') || eventName.includes('breach')) {
      return 'error';
    }
    if (eventName.includes('warning') || eventName.includes('failure')) {
      return 'warn';
    }
    return 'info';
  }
}

// Export singleton instance
export const securityEvents = new SecurityEventEmitter();

// Export default and named exports
export default {
  SecurityEventEmitter,
  securityEvents,
  SECURITY_EVENTS
};
// ✅ Add this line if it's missing
export const emitSecurityEvent = (type, payload = {}) => {
  const event = new CustomEvent('security-event', {
    detail: { type, payload, timestamp: Date.now() },
  });
  window.dispatchEvent(event);
};
