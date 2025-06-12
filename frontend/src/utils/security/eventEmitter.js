// ================================================
// ✅ FILE: /frontend/src/utils/security/eventEmitter.js
// Hardened Singleton EventEmitter for Security Events (v2.2.7)
// ================================================

import { v4 as uuidv4 } from 'uuid';
import { logInfo, logError } from '@/utils/logging';

// 🔒 Standardized Security Event Types
export const SECURITY_EVENTS = {
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILURE: 'LOGIN_FAILURE',
  LOGOUT: 'LOGOUT',
  TOKEN_STORED: 'TOKEN_STORED',
  TOKENS_CLEARED: 'TOKENS_CLEARED'
};

// 🧠 Internal event registry for legacy functional listeners
const listeners = {};

// 🎯 Functional style: subscribe to a security event
export function onSecurityEvent(event, callback) {
  if (!listeners[event]) {
    listeners[event] = [];
  }
  listeners[event].push(callback);
}

// 🚨 Functional style: emit a security event
export function emitSecurityEvent(event, payload = {}) {
  try {
    logInfo(`[SECURITY EVENT] ${event}`, payload);
    const traceId = uuidv4();

    if (listeners[event]) {
      listeners[event].forEach((cb) => {
        try {
          cb({ event, payload, traceId, timestamp: Date.now() });
        } catch (err) {
          logError(`Listener failed for ${event}`, err);
        }
      });
    }
  } catch (err) {
    logError('emitSecurityEvent failed', err);
  }
}

// 🧩 Optional OO-style: SecurityEventEmitter class for flexible integration
export class SecurityEventEmitter {
  constructor() {
    this._listeners = {};
  }

  on(event, callback) {
    this._listeners[event] ||= [];
    this._listeners[event].push(callback);
  }

  emit(event, payload = {}) {
    const traceId = uuidv4();
    const message = { event, payload, traceId, timestamp: Date.now() };

    try {
      logInfo(`[SecurityEventEmitter] ${event}`, message);
      if (this._listeners[event]) {
        this._listeners[event].forEach(cb => {
          try {
            cb(message);
          } catch (err) {
            logError(`Emitter callback failed: ${event}`, err);
          }
        });
      }
    } catch (err) {
      logError(`[SecurityEventEmitter] Failed to emit ${event}`, err);
    }
  }

  off(event, callback) {
    if (!this._listeners[event]) return;
    this._listeners[event] = this._listeners[event].filter(cb => cb !== callback);
  }

  clear(event) {
    if (event) {
      delete this._listeners[event];
    } else {
      this._listeners = {};
    }
  }
}

// ✅ Named exports are now fully compatible with: 
// import { emitSecurityEvent, SecurityEventEmitter } from '@/utils/security/eventEmitter';
