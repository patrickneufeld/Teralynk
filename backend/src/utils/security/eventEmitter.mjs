import EventEmitter from 'events';  // Using Node's EventEmitter instead of eventemitter3
import { v4 as uuidv4 } from 'uuid';
import { logInfo, logError, logWarn } from '../logging/index.mjs';

/**
 * Enhanced security event types enumeration
 */
export const SECURITY_EVENTS = {
  // AI Storage Events (from your aiStorageOptimizer.js)
  AI_STORAGE_OPTIMIZATION_FAILED: 'security:ai:storage:optimization:failed',
  AI_STORAGE_SCHEDULE_FAILED: 'security:ai:storage:schedule:failed',
  AI_STORAGE_STATUS_FAILED: 'security:ai:storage:status:failed',
  AI_OPTIMIZATION_FEEDBACK_FAILED: 'security:ai:optimization:feedback:failed',
  AI_STORAGE_CANCEL_FAILED: 'security:ai:storage:cancel:failed',
  AI_PATTERN_LEARNING_FAILED: 'security:ai:pattern:learning:failed',
  AI_PATCHING_FAILED: 'security:ai:patching:failed',
  AI_EXTERNAL_QUERY_FAILED: 'security:ai:external:query:failed',

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
  
  // Network Security Events
  NETWORK_FAILURE: 'security:network:failure',
  API_BREACH: 'security:network:breach',
  RATE_LIMIT_EXCEEDED: 'security:network:rate-limit',
  API_ERROR: 'security:network:error',
  
  // General Security Events
  SECURITY_WARNING: 'security:warning',
  SECURITY_ERROR: 'security:error',
  SECURITY_INFO: 'security:info'
};

class SecurityEvent {
  constructor(type, data = {}) {
    this.eventId = uuidv4();
    this.type = type;
    this.timestamp = new Date().toISOString();
    this.traceId = data.traceId || uuidv4();
    this.parentId = data.parentId || null;
    this.data = data;
    this.source = 'backend-security-event-emitter';
    this.sequence = SecurityEvent.getSequence();
  }

  static sequence = 0;
  static getSequence() {
    return ++SecurityEvent.sequence;
  }
}

class SecurityEventEmitter extends EventEmitter {
  constructor(options = {}) {
    super();
    this.eventHistory = new Map();
    this.MAX_HISTORY = options.maxHistory || 100;
    this.HISTORY_RETENTION = options.historyRetention || 24 * 60 * 60 * 1000; // 24 hours
    
    this.cleanupInterval = setInterval(() => {
      this._cleanupOldEvents();
    }, 60 * 60 * 1000);
  }

  emit(eventName, data = {}) {
    try {
      if (!Object.values(SECURITY_EVENTS).includes(eventName)) {
        throw new Error(`Invalid security event type: ${eventName}`);
      }

      const event = new SecurityEvent(eventName, {
        ...data,
        traceId: data.traceId || uuidv4(),
        parentId: data.parentId
      });

      this._logEvent(eventName, event);
      this._addToHistory(eventName, event);

      return super.emit(eventName, event);
    } catch (error) {
      logError('Security event emission failed', {
        eventName,
        error: error.message,
        data,
        traceId: data.traceId
      });
      return false;
    }
  }

  _addToHistory(eventName, event) {
    if (!this.eventHistory.has(eventName)) {
      this.eventHistory.set(eventName, []);
    }

    const events = this.eventHistory.get(eventName);
    events.push(event);

    if (events.length > this.MAX_HISTORY) {
      events.shift();
    }
  }

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

  destroy() {
    clearInterval(this.cleanupInterval);
    this.removeAllListeners();
    this.eventHistory.clear();
  }
}

// Create singleton instance
const securityEmitter = new SecurityEventEmitter();

// Export the emitSecurityEvent function that matches your aiStorageOptimizer usage
export const emitSecurityEvent = (type, payload = {}) => {
  return securityEmitter.emit(type, payload);
};

export default securityEmitter;
