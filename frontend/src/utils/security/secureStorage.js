// File: /frontend/src/utils/security/secureStorage.js

import { logSecurityEvent } from '@/utils/auditLogger';
import { logError, logInfo } from '@/utils/logging';
import { generateTraceId } from '@/utils/logger';
import { encryptData, decryptData } from '@/utils/encryption';

// Constants
const STORAGE_PREFIX = 'teralynk.secure.';
const STORAGE_VERSION = '1.0.0';
const storage = typeof window !== 'undefined' ? window.localStorage : null;

// Device fingerprint implementation (moved from authUtils to avoid circular dependency)
const getDeviceFingerprint = async () => {
  try {
    const components = [
      navigator.userAgent,
      screen.width,
      screen.height,
      navigator.language,
      navigator.hardwareConcurrency || '',
      navigator.deviceMemory || '',
      new Date().getTimezoneOffset(),
      navigator.platform,
      navigator.vendor,
      (await navigator.mediaDevices?.enumerateDevices())?.length
    ].filter(Boolean);

    const fingerprint = components.join('|');
    const encoder = new TextEncoder();
    const data = encoder.encode(fingerprint);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    
    return Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  } catch (error) {
    logError('Device fingerprint generation failed', { error });
    return crypto.randomUUID(); // Fallback
  }
};

class SecureStorage {
  constructor(config = {}) {
    this.prefix = config.namespace ? `${config.namespace}.` : STORAGE_PREFIX;
    this.fallbackToLocalStorage = config.fallbackToLocalStorage ?? true;
    this.version = STORAGE_VERSION;
    this.initialize();
  }

  async initialize() {
    if (!storage) return;
    
    try {
      const version = storage.getItem(`${this.prefix}version`);
      if (version !== this.version) {
        await this.migrateStorage(version);
        storage.setItem(`${this.prefix}version`, this.version);
      }

      logInfo('SecureStorage initialized', { 
        namespace: this.prefix, 
        version: this.version 
      });
    } catch (err) {
      logError('SecureStorage initialization failed', err);
    }
  }

  async setItem(key, value, options = {}) {
    const traceId = generateTraceId();
    try {
      if (!storage) throw new Error('SecureStorage unavailable');

      const fingerprint = await getDeviceFingerprint();
      const payload = {
        value,
        meta: {
          ts: Date.now(),
          ttl: options.ttl || null,
          fingerprint,
          traceId,
          context: options.context || 'generic',
          version: this.version
        },
      };

      const encrypted = await encryptData(payload);
      storage.setItem(this.prefix + key, encrypted);

      logSecurityEvent('secureStorage.set.success', {
        key,
        traceId,
        context: options.context || 'generic'
      });
    } catch (err) {
      logError(`[SecureStorage:set] ${key} failed`, err);
      logSecurityEvent('secureStorage.set.failure', {
        key,
        traceId,
        error: err.message,
        context: options.context || 'generic',
      });
      throw err;
    }
  }

  async getItem(key, context = 'generic') {
    const traceId = generateTraceId();
    try {
      if (!storage) throw new Error('SecureStorage unavailable');

      const encrypted = storage.getItem(this.prefix + key);
      if (!encrypted) return null;

      const decrypted = await decryptData(encrypted);
      const { value, meta } = decrypted;

      if (!meta || typeof meta !== 'object') {
        throw new Error('Invalid secret metadata');
      }

      const fingerprint = await getDeviceFingerprint();
      if (meta.fingerprint !== fingerprint) {
        logSecurityEvent('secureStorage.fingerprint.mismatch', {
          key,
          context,
          traceId
        });
        throw new Error('Fingerprint mismatch');
      }

      if (meta.ttl && Date.now() > meta.ts + meta.ttl) {
        storage.removeItem(this.prefix + key);
        return null;
      }

      logSecurityEvent('secureStorage.get.success', {
        key,
        context,
        traceId
      });

      return value;
    } catch (err) {
      logError(`[SecureStorage:get] ${key} failed`, err);
      logSecurityEvent('secureStorage.get.failure', {
        key,
        context,
        traceId,
        error: err.message,
      });
      return null;
    }
  }

  async removeItem(key, context = 'generic') {
    const traceId = generateTraceId();
    try {
      if (!storage) return;
      storage.removeItem(this.prefix + key);
      
      logSecurityEvent('secureStorage.remove.success', {
        key,
        context,
        traceId
      });
    } catch (err) {
      logError(`[SecureStorage:remove] ${key} failed`, err);
      logSecurityEvent('secureStorage.remove.failure', {
        key,
        traceId,
        error: err.message,
      });
    }
  }

  async clearAll(context = 'generic') {
    const traceId = generateTraceId();
    try {
      if (!storage) return;
      
      const keys = Object.keys(storage).filter(key => 
        key.startsWith(this.prefix) && key !== `${this.prefix}version`
      );
      
      keys.forEach(key => storage.removeItem(key));
      
      logSecurityEvent('secureStorage.clearAll.success', {
        context,
        traceId,
        keysCleared: keys.length
      });
    } catch (err) {
      logError('[SecureStorage:clearAll] failed', err);
      logSecurityEvent('secureStorage.clearAll.failure', {
        context,
        traceId,
        error: err.message,
      });
    }
  }

  async keys() {
    try {
      if (!storage) return [];
      return Object.keys(storage)
        .filter(key => key.startsWith(this.prefix))
        .map(key => key.slice(this.prefix.length));
    } catch (err) {
      logError('[SecureStorage:keys] failed', err);
      return [];
    }
  }

  async has(key) {
    return await this.getItem(key) !== null;
  }

  async getMetadata(key) {
    try {
      if (!storage) return null;
      const encrypted = storage.getItem(this.prefix + key);
      if (!encrypted) return null;

      const decrypted = await decryptData(encrypted);
      return decrypted.meta;
    } catch (err) {
      logError(`[SecureStorage:getMetadata] ${key} failed`, err);
      return null;
    }
  }

  async migrateStorage(oldVersion) {
    logInfo('Storage migration complete', { 
      from: oldVersion, 
      to: this.version 
    });
  }
}

// Create and export single instance
export const secureStorage = new SecureStorage({ 
  namespace: 'auth', 
  fallbackToLocalStorage: true 
});

// Export class for testing/extension
export { SecureStorage };
