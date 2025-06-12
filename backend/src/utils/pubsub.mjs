// ✅ FILE: /backend/src/utils/pubsub.js

import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import { logInfo, logError, logWarn } from './logger.mjs';

// 🔒 Hardened PubSub class
class PubSub extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(100);
    this.subscriptions = new Map(); // Map<traceId, { event, original, wrapped }>
  }

  /**
   * ✅ Subscribe with safe error isolation and trace logging
   * @param {string} event - Event name
   * @param {Function} callback - Handler function
   * @param {string} [traceId] - Optional trace ID
   * @returns {string} traceId
   */
  subscribe(event, callback, traceId = uuidv4()) {
    if (!event || typeof callback !== 'function') {
      const msg = `Invalid subscription args: event=${event}, callback=${typeof callback}`;
      logError(msg);
      throw new Error(msg);
    }

    const wrapped = (...args) => {
      try {
        callback(...args);
      } catch (err) {
        logError('❌ PubSub callback error', { traceId, event, error: err.message, stack: err.stack });
      }
    };

    this.on(event, wrapped);
    this.subscriptions.set(traceId, { event, original: callback, wrapped });

    logInfo(`🧩 Subscribed to '${event}' [${traceId}]`);
    return traceId;
  }

  /**
   * ✅ Unsubscribe by traceId with fallback logging
   * @param {string} traceId
   */
  unsubscribe(traceId) {
    const sub = this.subscriptions.get(traceId);
    if (sub) {
      this.removeListener(sub.event, sub.wrapped);
      this.subscriptions.delete(traceId);
      logInfo(`❎ Unsubscribed from '${sub.event}' [${traceId}]`);
    } else {
      logWarn('⚠️ PubSub unsubscribe failed: Unknown traceId', { traceId });
    }
  }

  /**
   * ✅ Publish an event with contextual metadata
   * @param {string} event
   * @param {any} payload
   */
  publish(event, payload) {
    try {
      logInfo(`📣 Publishing event: '${event}'`, { payload });
      this.emit(event, payload);
    } catch (err) {
      logError('❌ PubSub emit error', { event, payloadType: typeof payload, error: err.message });
    }
  }

  /**
   * ✅ Clear all subscriptions safely
   */
  clearAll() {
    this.removeAllListeners();
    this.subscriptions.clear();
    logInfo('♻️ All PubSub subscriptions cleared.');
  }

  /**
   * ✅ Introspection helper
   */
  listActiveSubscriptions() {
    return Array.from(this.subscriptions.entries()).map(([traceId, { event }]) => ({ traceId, event }));
  }
}

// 🔁 Singleton
const pubsub = new PubSub();

// ✅ Named exports for pub/sub pattern use across AI modules
export function publishToChannel(event, payload) {
  pubsub.publish(event, payload);
}

export function subscribeToChannel(event, handler, traceId) {
  return pubsub.subscribe(event, handler, traceId);
}

export function unsubscribeFromChannel(traceId) {
  pubsub.unsubscribe(traceId);
}

export function clearPubSub() {
  pubsub.clearAll();
}

export function listSubscriptions() {
  return pubsub.listActiveSubscriptions();
}

export default pubsub;
