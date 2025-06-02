// ================================================
// ✅ FILE: /frontend/src/utils/security/secureStorage.js
// Secure storage implementation with encryption
// Version: 2.0.0
// ================================================

import { safeLogError as logError, safeLogInfo as logInfo } from '@/utils/logging/logStub';
import { logSecurityEvent } from '@/utils/auditLogger';
import { generateTraceId } from '@/utils/logger';
import { encryptData, decryptData } from '@/utils/encryption';
import { SECURITY_EVENTS } from '@/constants/securityConstants';

// ==============================
// 🔐 Core Constants
// ==============================

const CONFIG = Object.freeze({
  VERSION: '2.0.0',
  DEFAULT_NAMESPACE: 'teralynk.secure.',
  STORAGE_VERSION_KEY: 'storage_version',
  MAX_RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
});

const EVENTS = Object.freeze({
  INIT: 'storage.initialized',
  ERROR: 'storage.error',
  SET: 'storage.item.set',
  GET: 'storage.item.get',
  REMOVE: 'storage.item.remove',
  CLEAR: 'storage.clear',
  MIGRATION: 'storage.migration',
});

// ==============================
// 🛡️ Device Fingerprinting
// ==============================

const generateDeviceFingerprint = async () => {
  try {
    if (!window?.crypto?.subtle) {
      throw new Error('Crypto API not available');
    }

    const components = [
      navigator.userAgent,
      screen.width,
      screen.height,
      navigator.language,
      navigator.hardwareConcurrency,
      navigator.deviceMemory,
      new Date().getTimezoneOffset(),
      navigator.platform,
      navigator.vendor,
    ].filter(Boolean);

    const fingerprint = components.join('|');
    const encoder = new TextEncoder();
    const data = encoder.encode(fingerprint);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);

    return Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  } catch (error) {
    logError('Fingerprint generation failed', { error });
    return crypto.randomUUID?.() || `uuid-${Date.now()}`;
  }
};

// ==============================
// 🔒 Secure Storage Class
// ==============================

class SecureStorage {
  #initialized = false;
  #storage = null;
  #prefix = '';
  #fingerprint = null;
  #options = {};

  constructor(options = {}) {
    this.#options = {
      namespace: options.namespace || CONFIG.DEFAULT_NAMESPACE,
      version: options.version || CONFIG.VERSION,
      fallbackToMemory: options.fallbackToMemory || false,
      strict: options.strict || false,
      autoInit: options.autoInit !== false,
    };

    if (this.#options.autoInit) {
      this.initialize().catch(err => {
        logError('Auto-init failed', err);
      });
    }
  }

  // ==============================
  // 🚀 Initialization
  // ==============================

  async initialize() {
    if (this.#initialized) return;

    try {
      this.#storage = this.#setupStorage();
      this.#prefix = this.#options.namespace;
      this.#fingerprint = await generateDeviceFingerprint();
      await this.#handleVersionMigration();

      this.#initialized = true;

      logInfo('SecureStorage initialized', {
        namespace: this.#prefix,
        version: this.#options.version,
      });

      logSecurityEvent(EVENTS.INIT, {
        success: true,
        version: this.#options.version,
      });
    } catch (error) {
      logError('SecureStorage initialization failed', error);
      logSecurityEvent(EVENTS.ERROR, {
        type: 'initialization',
        error: error.message,
      });
      throw error;
    }
  }

  // ==============================
  // 📝 Public Methods
  // ==============================

  async setItem(key, value, options = {}) {
    const traceId = generateTraceId();
    try {
      await this.#ensureInitialized();

      const payload = {
        value,
        metadata: {
          timestamp: Date.now(),
          ttl: options.ttl || null,
          fingerprint: this.#fingerprint,
          traceId,
          context: options.context || 'generic',
          version: this.#options.version,
        },
      };

      const encrypted = await encryptData(payload);
      this.#storage.setItem(this.#prefix + key, encrypted);

      logSecurityEvent(EVENTS.SET, {
        success: true,
        key,
        traceId,
        context: options.context,
      });
    } catch (error) {
      logError(`Storage set failed: ${key}`, error);
      logSecurityEvent(EVENTS.ERROR, {
        type: 'set',
        key,
        traceId,
        error: error.message,
      });
      throw error;
    }
  }

  async getItem(key, options = {}) {
    const traceId = generateTraceId();
    try {
      await this.#ensureInitialized();

      const encrypted = this.#storage.getItem(this.#prefix + key);
      if (!encrypted) return null;

      const decrypted = await decryptData(encrypted);
      if (!this.#validatePayload(decrypted, options)) return null;

      logSecurityEvent(EVENTS.GET, {
        success: true,
        key,
        traceId,
        context: options.context,
      });

      return decrypted.value;
    } catch (error) {
      logError(`Storage get failed: ${key}`, error);
      logSecurityEvent(EVENTS.ERROR, {
        type: 'get',
        key,
        traceId,
        error: error.message,
      });
      return null;
    }
  }

  async removeItem(key, options = {}) {
    const traceId = generateTraceId();
    try {
      await this.#ensureInitialized();
      this.#storage.removeItem(this.#prefix + key);

      logSecurityEvent(EVENTS.REMOVE, {
        success: true,
        key,
        traceId,
        context: options.context,
      });
    } catch (error) {
      logError(`Storage remove failed: ${key}`, error);
      logSecurityEvent(EVENTS.ERROR, {
        type: 'remove',
        key,
        traceId,
        error: error.message,
      });
    }
  }

  async clear(options = {}) {
    const traceId = generateTraceId();
    try {
      await this.#ensureInitialized();
      const keys = await this.keys();
      keys.forEach((key) => this.#storage.removeItem(this.#prefix + key));

      logSecurityEvent(EVENTS.CLEAR, {
        success: true,
        keysCleared: keys.length,
        traceId,
        context: options.context,
      });
    } catch (error) {
      logError('Storage clear failed', error);
      logSecurityEvent(EVENTS.ERROR, {
        type: 'clear',
        traceId,
        error: error.message,
      });
    }
  }

  async keys() {
    try {
      await this.#ensureInitialized();
      return Object.keys(this.#storage)
        .filter((key) => key.startsWith(this.#prefix))
        .map((key) => key.slice(this.#prefix.length));
    } catch (error) {
      logError('Storage keys enumeration failed', error);
      return [];
    }
  }

  // ==============================
  // 🔧 Private Methods
  // ==============================

  #setupStorage() {
    if (typeof window === 'undefined') {
      if (this.#options.fallbackToMemory) {
        return new Map();
      }
      throw new Error('Storage not available');
    }
    return window.localStorage;
  }

  async #ensureInitialized() {
    if (!this.#initialized) {
      await this.initialize();
    }
  }

  #validatePayload(decrypted, options = {}) {
    if (!decrypted?.metadata) return false;

    if (decrypted.metadata.ttl) {
      const expired = Date.now() > decrypted.metadata.timestamp + decrypted.metadata.ttl;
      if (expired) return false;
    }

    if (
      this.#options.strict &&
      decrypted.metadata.fingerprint !== this.#fingerprint
    ) {
      return false;
    }

    return true;
  }

  async #handleVersionMigration() {
    const currentVersion = this.#storage.getItem(
      `${this.#prefix}${CONFIG.STORAGE_VERSION_KEY}`
    );

    if (currentVersion !== this.#options.version) {
      await this.#migrateStorage(currentVersion);
      this.#storage.setItem(
        `${this.#prefix}${CONFIG.STORAGE_VERSION_KEY}`,
        this.#options.version
      );

      logSecurityEvent(EVENTS.MIGRATION, {
        success: true,
        fromVersion: currentVersion,
        toVersion: this.#options.version,
      });
    }
  }

  async #migrateStorage(oldVersion) {
    logInfo('Storage migration complete', {
      from: oldVersion,
      to: this.#options.version,
    });
  }
}

// ==============================
// 📤 Exports
// ==============================

// Named export for use in modules
export { SecureStorage };

// Instance export for general use
export const secureStorage = new SecureStorage({
  namespace: 'auth.',
  version: CONFIG.VERSION,
  strict: true,
  autoInit: true,
});

// Default export for Vite/bundler compatibility
export default secureStorage;
