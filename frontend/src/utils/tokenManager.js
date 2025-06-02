// ================================================
// ✅ FILE: /frontend/src/utils/tokenManager.js
// Secure Token Management with Enhanced Security
// Version: 3.1.3 — Fixed Exports and Structure
// ================================================

import { v4 as uuidv4 } from 'uuid';
import { memoize } from 'lodash';
import { openDB } from 'idb';
import { encrypt, decrypt, hashSHA256 } from './encryption';
import { createLogger } from './logging';
import { emitTelemetry } from './telemetry';
import { SecurityEventEmitter } from './security/eventEmitter';
import { RateLimiter } from './RateLimiter';

// Logger
const logger = createLogger('TokenManager');

// Safe metrics handler
const metricsHandler = {
  increment: (metric, tags = {}) => {
    try {
      window?.metrics?.increment?.(metric, tags);
    } catch (e) {
      logger.warn('Metrics increment failed', { metric, error: e.message });
    }
  },
  gauge: (metric, value, tags = {}) => {
    try {
      window?.metrics?.gauge?.(metric, value, tags);
    } catch (e) {
      logger.warn('Metrics gauge failed', { metric, error: e.message });
    }
  }
};

// TokenError class
class TokenError extends Error {
  constructor(message, code, details = {}) {
    super(message);
    this.name = 'TokenError';
    this.code = code;
    this.details = details;
    this.timestamp = new Date().toISOString();
    metricsHandler.increment('token.error', { code });
  }
}

// Token config
const TOKEN_CONFIG = {
  ACCESS: {
    key: 'accessToken',
    prefix: 'auth_v3_',
    encryption: true,
    maxAge: 3600000,
    minLength: 100,
    algorithm: 'AES-GCM'
  },
  REFRESH: {
    key: 'refreshToken',
    prefix: 'refresh_v3_',
    encryption: true,
    maxAge: 7 * 24 * 3600000,
    minLength: 100,
    algorithm: 'AES-GCM'
  },
  SESSION: {
    key: 'sessionKey',
    prefix: 'session_v3_',
    encryption: true,
    maxAge: 24 * 3600000,
    keyLength: 32
  },
  SECURITY: {
    ivLength: 12,
    saltLength: 16,
    keyLength: 256,
    passwordIterations: 100000,
    fingerprintTimeout: 3600000
  },
  JWT: {
    clockSkew: 300,
    refreshThreshold: 3600,
    allowedAlgorithms: ['RS256', 'ES256']
  },
  STORAGE: {
    preferred: 'indexedDB',
    fallback: 'localStorage',
    dbName: 'tokenStore_v3',
    dbVersion: 1
  }
};

const DB_STORE = {
  TOKENS: 'tokens_v3',
  METADATA: 'metadata_v3'
};

const securityEvents = new SecurityEventEmitter();
const rateLimiter = new RateLimiter({
  maxAttempts: 5,
  timeWindow: 15 * 60 * 1000,
  blockDuration: 30 * 60 * 1000
});

// Utility: Security
const securityUtils = {
  async generateRandomBytes(length) {
    return crypto.getRandomValues(new Uint8Array(length));
  },
  bufferToHex(buffer) {
    return Array.from(new Uint8Array(buffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  },
  hexToBuffer(hex) {
    const pairs = hex.match(/[\dA-F]{2}/gi);
    return new Uint8Array(pairs.map(s => parseInt(s, 16))).buffer;
  },
  async generateDeviceFingerprint() {
    try {
      const components = [
        navigator.userAgent,
        navigator.language,
        new Date().getTimezoneOffset(),
        screen.width,
        screen.height,
        screen.colorDepth,
        navigator.hardwareConcurrency,
        navigator.deviceMemory
      ].filter(Boolean).join('|');

      const fingerprint = await hashSHA256(components);
      metricsHandler.increment('security.fingerprint.generated');
      return fingerprint;
    } catch (error) {
      metricsHandler.increment('security.fingerprint.error');
      throw new TokenError('Failed to generate device fingerprint', 'FINGERPRINT_ERROR', { error: error.message });
    }
  }
};

// Utility: DB Management
let dbInstance = null;
const dbManager = {
  async getConnection() {
    if (dbInstance) return dbInstance;
    try {
      dbInstance = await openDB(TOKEN_CONFIG.STORAGE.dbName, TOKEN_CONFIG.STORAGE.dbVersion, {
        upgrade(db, oldVersion, newVersion) {
          if (!db.objectStoreNames.contains(DB_STORE.TOKENS)) {
            db.createObjectStore(DB_STORE.TOKENS);
          }
          if (!db.objectStoreNames.contains(DB_STORE.METADATA)) {
            db.createObjectStore(DB_STORE.METADATA);
          }
          logger.info(`DB upgraded from v${oldVersion} to v${newVersion}`);
          metricsHandler.increment('storage.db.upgraded');
        },
        blocked() {
          logger.warn('DB upgrade blocked');
          metricsHandler.increment('storage.db.blocked');
        },
        blocking() {
          logger.warn('This tab is blocking DB upgrade');
          metricsHandler.increment('storage.db.blocking');
        }
      });
      metricsHandler.increment('storage.db.connected');
      return dbInstance;
    } catch (error) {
      metricsHandler.increment('storage.db.error');
      logger.error('DB initialization failed', error);
      return null;
    }
  },
  async closeConnection() {
    if (dbInstance) {
      await dbInstance.close();
      dbInstance = null;
      metricsHandler.increment('storage.db.closed');
    }
  }
};

// Crypto operations
const cryptoOperations = {
  async deriveKey(fingerprint, salt, purpose = ['encrypt', 'decrypt']) {
    try {
      const keyMaterial = await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(fingerprint + securityUtils.bufferToHex(salt)),
        'PBKDF2',
        false,
        ['deriveKey']
      );

      const key = await crypto.subtle.deriveKey(
        {
          name: 'PBKDF2',
          salt,
          iterations: TOKEN_CONFIG.SECURITY.passwordIterations,
          hash: 'SHA-256'
        },
        keyMaterial,
        {
          name: TOKEN_CONFIG.ACCESS.algorithm,
          length: TOKEN_CONFIG.SECURITY.keyLength
        },
        false,
        purpose
      );

      metricsHandler.increment('crypto.key.derived');
      return key;
    } catch (error) {
      metricsHandler.increment('crypto.key.error');
      throw new TokenError('Key derivation failed', 'KEY_DERIVATION_ERROR', { error: error.message });
    }
  },

  async encryptData(data) {
    try {
      const iv = await securityUtils.generateRandomBytes(TOKEN_CONFIG.SECURITY.ivLength);
      const salt = await securityUtils.generateRandomBytes(TOKEN_CONFIG.SECURITY.saltLength);
      const fingerprint = await securityUtils.generateDeviceFingerprint();
      const key = await this.deriveKey(fingerprint, salt, ['encrypt']);
      const encrypted = await encrypt(data, key, iv);

      metricsHandler.increment('crypto.encrypt.success');
      return {
        data: encrypted,
        iv: securityUtils.bufferToHex(iv),
        salt: securityUtils.bufferToHex(salt),
        timestamp: Date.now(),
        version: TOKEN_CONFIG.STORAGE.dbVersion
      };
    } catch (error) {
      metricsHandler.increment('crypto.encrypt.error');
      throw new TokenError('Encryption failed', 'ENCRYPTION_ERROR', { error: error.message });
    }
  },

  async decryptData({ data, iv, salt }) {
    try {
      if (!data || !iv || !salt) {
        throw new TokenError('Invalid encrypted data format', 'INVALID_FORMAT');
      }

      const fingerprint = await securityUtils.generateDeviceFingerprint();
      const key = await this.deriveKey(
        fingerprint,
        securityUtils.hexToBuffer(salt),
        ['decrypt']
      );

      const decrypted = await decrypt(data, key, securityUtils.hexToBuffer(iv));
      metricsHandler.increment('crypto.decrypt.success');
      return decrypted;
    } catch (error) {
      metricsHandler.increment('crypto.decrypt.error');
      throw new TokenError('Decryption failed', 'DECRYPTION_ERROR', { error: error.message });
    }
  }
};

// Storage operations
const storageOperations = {
  async store(key, value, storeType = DB_STORE.TOKENS) {
    try {
      const db = await dbManager.getConnection();
      const encrypted = await cryptoOperations.encryptData(
        typeof value === 'string' ? value : JSON.stringify(value)
      );

      if (db) {
        await db.put(storeType, encrypted, key);
      } else {
        localStorage.setItem(key, JSON.stringify(encrypted));
      }

      metricsHandler.increment('storage.write.success', { storeType });
    } catch (error) {
      metricsHandler.increment('storage.write.error', { storeType });
      throw new TokenError('Storage operation failed', 'STORAGE_ERROR', { error: error.message });
    }
  },

  async retrieve(key, storeType = DB_STORE.TOKENS) {
    try {
      const db = await dbManager.getConnection();
      const stored = db
        ? await db.get(storeType, key)
        : JSON.parse(localStorage.getItem(key));

      if (!stored) return null;

      const decrypted = await cryptoOperations.decryptData(stored);
      metricsHandler.increment('storage.read.success', { storeType });

      try {
        return JSON.parse(decrypted);
      } catch {
        return decrypted;
      }
    } catch (error) {
      metricsHandler.increment('storage.read.error', { storeType });
      throw new TokenError('Retrieval failed', 'RETRIEVAL_ERROR', { error: error.message });
    }
  },

  async remove(key, storeType = DB_STORE.TOKENS) {
    try {
      const db = await dbManager.getConnection();
      if (db) {
        await db.delete(storeType, key);
      }
      localStorage.removeItem(key);
      metricsHandler.increment('storage.delete.success', { storeType });
    } catch (error) {
      metricsHandler.increment('storage.delete.error', { storeType });
      throw new TokenError('Removal failed', 'REMOVAL_ERROR', { error: error.message });
    }
  }
};
// ================================================
// ✅ PART 2: Session and TokenManager Methods
// ================================================

// Session Key Management
const sessionKeyManager = {
  async generateSessionKey() {
    try {
      const randomBytes = await securityUtils.generateRandomBytes(TOKEN_CONFIG.SESSION.keyLength);
      const sessionKey = securityUtils.bufferToHex(randomBytes);
      await storageOperations.store(TOKEN_CONFIG.SESSION.key, sessionKey);
      metricsHandler.increment('session.key.generated');
      return sessionKey;
    } catch (error) {
      metricsHandler.increment('session.key.generation.error');
      throw new TokenError('Failed to generate session key', 'SESSION_KEY_GENERATION_ERROR', { error: error.message });
    }
  },

  async getSessionKey() {
    try {
      let sessionKey = await storageOperations.retrieve(TOKEN_CONFIG.SESSION.key);
      if (!sessionKey) {
        sessionKey = await this.generateSessionKey();
      }
      metricsHandler.increment('session.key.retrieved');
      return sessionKey;
    } catch (error) {
      metricsHandler.increment('session.key.retrieval.error');
      throw new TokenError('Failed to get session key', 'SESSION_KEY_RETRIEVAL_ERROR', { error: error.message });
    }
  },

  async removeSessionKey() {
    try {
      await storageOperations.remove(TOKEN_CONFIG.SESSION.key);
      metricsHandler.increment('session.key.removed');
    } catch (error) {
      metricsHandler.increment('session.key.removal.error');
      throw new TokenError('Failed to remove session key', 'SESSION_KEY_REMOVAL_ERROR', { error: error.message });
    }
  }
};

// Token Manager
class TokenManager {
  static async setToken(token) {
    try {
      await rateLimiter.checkLimit('setToken');

      if (!token) {
        throw new TokenError('Token is required', 'TOKEN_REQUIRED');
      }

      if (!await this.validateTokenIntegrity(token)) {
        throw new TokenError('Invalid token format', 'INVALID_TOKEN');
      }

      await storageOperations.store(TOKEN_CONFIG.ACCESS.key, token);
      securityEvents.emit('tokenSet', {
        type: 'access',
        timestamp: Date.now()
      });

      metricsHandler.increment('token.set.success');
      logger.debug('Access token set successfully');
    } catch (error) {
      metricsHandler.increment('token.set.error', { code: error.code });
      logger.error('Failed to set token', error);
      throw error;
    }
  }

  static async getToken() {
    try {
      await rateLimiter.checkLimit('getToken');

      const token = await storageOperations.retrieve(TOKEN_CONFIG.ACCESS.key);

      if (token) {
        const isValid = await this.validateTokenIntegrity(token);
        if (!isValid) {
          throw new TokenError('Retrieved token is invalid', 'INVALID_STORED_TOKEN');
        }

        if (await this.shouldRefreshToken(token)) {
          securityEvents.emit('tokenRefreshNeeded', {
            timestamp: Date.now()
          });
        }
      }

      metricsHandler.increment('token.get.success');
      return token;
    } catch (error) {
      metricsHandler.increment('token.get.error', { code: error.code });
      logger.error('Failed to get token', error);
      throw error;
    }
  }

  static async removeToken() {
    try {
      await rateLimiter.checkLimit('removeToken');
      await storageOperations.remove(TOKEN_CONFIG.ACCESS.key);

      securityEvents.emit('tokenRemoved', {
        type: 'access',
        timestamp: Date.now()
      });

      metricsHandler.increment('token.remove.success');
      logger.debug('Access token removed successfully');
    } catch (error) {
      metricsHandler.increment('token.remove.error', { code: error.code });
      logger.error('Failed to remove token', error);
      throw error;
    }
  }

  static async setRefreshToken(token) {
    try {
      await rateLimiter.checkLimit('setRefreshToken');

      if (!token) {
        throw new TokenError('Refresh token is required', 'REFRESH_TOKEN_REQUIRED');
      }

      if (!await this.validateTokenIntegrity(token)) {
        throw new TokenError('Invalid refresh token format', 'INVALID_REFRESH_TOKEN');
      }

      await storageOperations.store(TOKEN_CONFIG.REFRESH.key, token);

      securityEvents.emit('tokenSet', {
        type: 'refresh',
        timestamp: Date.now()
      });

      metricsHandler.increment('refreshToken.set.success');
      logger.debug('Refresh token set successfully');
    } catch (error) {
      metricsHandler.increment('refreshToken.set.error', { code: error.code });
      logger.error('Failed to set refresh token', error);
      throw error;
    }
  }

  static async getRefreshToken() {
    try {
      await rateLimiter.checkLimit('getRefreshToken');

      const token = await storageOperations.retrieve(TOKEN_CONFIG.REFRESH.key);

      if (token && !await this.validateTokenIntegrity(token)) {
        throw new TokenError('Retrieved refresh token is invalid', 'INVALID_STORED_REFRESH_TOKEN');
      }

      metricsHandler.increment('refreshToken.get.success');
      return token;
    } catch (error) {
      metricsHandler.increment('refreshToken.get.error', { code: error.code });
      logger.error('Failed to get refresh token', error);
      throw error;
    }
  }

  static async removeRefreshToken() {
    try {
      await rateLimiter.checkLimit('removeRefreshToken');
      await storageOperations.remove(TOKEN_CONFIG.REFRESH.key);

      securityEvents.emit('tokenRemoved', {
        type: 'refresh',
        timestamp: Date.now()
      });

      metricsHandler.increment('refreshToken.remove.success');
      logger.debug('Refresh token removed successfully');
    } catch (error) {
      metricsHandler.increment('refreshToken.remove.error', { code: error.code });
      logger.error('Failed to remove refresh token', error);
      throw error;
    }
  }

  static decodeToken(token) {
    try {
      if (!token) return null;

      const [header, payload, signature] = token.split('.');
      if (!header || !payload || !signature) {
        throw new TokenError('Invalid token structure', 'INVALID_TOKEN_STRUCTURE');
      }

      const base64UrlDecode = str => {
        try {
          const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
          const decoded = atob(base64);
          return JSON.parse(decoded);
        } catch (error) {
          throw new TokenError('Token decode failed', 'TOKEN_DECODE_ERROR');
        }
      };

      const decoded = {
        ...base64UrlDecode(header),
        ...base64UrlDecode(payload)
      };

      metricsHandler.increment('token.decode.success');
      return decoded;
    } catch (error) {
      metricsHandler.increment('token.decode.error', { code: error.code });
      logger.error('Token decode failed', error);
      return null;
    }
  }

  static async validateTokenIntegrity(token) {
    try {
      if (!token || typeof token !== 'string') {
        return false;
      }

      const decoded = this.decodeToken(token);
      if (!decoded) {
        return false;
      }

      const now = Math.floor(Date.now() / 1000);

      if (!TOKEN_CONFIG.JWT.allowedAlgorithms.includes(decoded.alg)) {
        logger.warn('Invalid token algorithm', { alg: decoded.alg });
        return false;
      }

      if (decoded.exp <= now - TOKEN_CONFIG.JWT.clockSkew) {
        logger.debug('Token expired');
        return false;
      }

      if (decoded.iat > now + TOKEN_CONFIG.JWT.clockSkew) {
        logger.warn('Token issued in future');
        return false;
      }

      if (!decoded.sub || !decoded.jti) {
        logger.warn('Missing required claims');
        return false;
      }

      metricsHandler.increment('token.validate.success');
      return true;
    } catch (error) {
      metricsHandler.increment('token.validate.error', { code: error.code });
      logger.error('Token validation failed', error);
      return false;
    }
  }

  static async shouldRefreshToken(token) {
    try {
      const decoded = this.decodeToken(token);
      if (!decoded) {
        return true;
      }

      const now = Math.floor(Date.now() / 1000);
      const timeUntilExpiry = decoded.exp - now;

      if (timeUntilExpiry < TOKEN_CONFIG.JWT.refreshThreshold) {
        logger.debug('Token needs refresh', { timeUntilExpiry });
        return true;
      }

      return false;
    } catch (error) {
      metricsHandler.increment('token.refresh.check.error');
      logger.error('Refresh check failed', error);
      return true;
    }
  }
}
// ================================================
// ✅ PART 3: Cleanup, Events, Exports
// ================================================

TokenManager.clearTokens = async function () {
  try {
    await Promise.all([
      this.removeToken(),
      this.removeRefreshToken(),
      sessionKeyManager.removeSessionKey()
    ]);

    securityEvents.emit('tokensCleared', {
      timestamp: Date.now()
    });

    metricsHandler.increment('tokens.clear.success');
    logger.info('All tokens cleared successfully');
  } catch (error) {
    metricsHandler.increment('tokens.clear.error', { code: error.code });
    logger.error('Failed to clear tokens', error);
    throw new TokenError('Failed to clear tokens', 'CLEAR_TOKENS_ERROR', { error: error.message });
  }
};

// ✅ Public Event Subscription
export const subscribeToTokenEvents = (callback) => {
  if (typeof callback !== 'function') {
    throw new TokenError('Callback must be a function', 'INVALID_CALLBACK');
  }
  return securityEvents.subscribe(callback);
};

// ✅ Enhanced Cleanup Routine
export const cleanup = async () => {
  try {
    await Promise.all([
      dbManager.closeConnection(),
      rateLimiter.reset()
    ]);

    securityEvents.clear();
    metricsHandler.increment('system.cleanup.success');
    logger.info('Token system cleanup completed successfully');

    return { success: true };
  } catch (error) {
    metricsHandler.increment('system.cleanup.error');
    logger.error('Cleanup failed', error);
    throw new TokenError('Cleanup failed', 'CLEANUP_ERROR', { error: error.message });
  }
};

// ✅ Named Exports - TokenManager Methods
export const setToken = TokenManager.setToken;
export const getToken = TokenManager.getToken;
export const removeToken = TokenManager.removeToken;
export const setRefreshToken = TokenManager.setRefreshToken;
export const getRefreshToken = TokenManager.getRefreshToken;
export const removeRefreshToken = TokenManager.removeRefreshToken;
export const decodeToken = TokenManager.decodeToken;
export const validateTokenIntegrity = TokenManager.validateTokenIntegrity;
export const shouldRefreshToken = TokenManager.shouldRefreshToken;
export const clearTokens = TokenManager.clearTokens;

// ✅ Named Exports - Session Management
export const getSessionKey = sessionKeyManager.getSessionKey;
export const generateSessionKey = sessionKeyManager.generateSessionKey;
export const removeSessionKey = sessionKeyManager.removeSessionKey;

// ✅ Named Exports - Storage Operations
export const storage = {
  store: storageOperations.store,
  retrieve: storageOperations.retrieve,
  remove: storageOperations.remove
};

// ✅ Named Exports - Security Utils
export const security = {
  generateDeviceFingerprint: securityUtils.generateDeviceFingerprint,
  generateRandomBytes: securityUtils.generateRandomBytes
};

// ✅ Named Exports - Crypto Operations
export const crypto = {
  encryptData: cryptoOperations.encryptData,
  decryptData: cryptoOperations.decryptData
};

// ✅ Configuration Exports
export const config = {
  ...TOKEN_CONFIG,
  VERSION: '3.1.3',
  BUILD_DATE: new Date().toISOString(),
  SUPPORTED_ALGORITHMS: TOKEN_CONFIG.JWT.allowedAlgorithms,
  STORAGE_VERSION: TOKEN_CONFIG.STORAGE.dbVersion
};

// ✅ Error Types Export
export const Errors = {
  TokenError
};

// ✅ Event Types Export
export const Events = {
  TOKEN_SET: 'tokenSet',
  TOKEN_REMOVED: 'tokenRemoved',
  TOKENS_CLEARED: 'tokensCleared',
  TOKEN_REFRESH_NEEDED: 'tokenRefreshNeeded',
  SECURITY_VIOLATION: 'securityViolation',
  RATE_LIMIT_EXCEEDED: 'rateLimitExceeded'
};

// ✅ Metrics Export
export const metrics = {
  increment: metricsHandler.increment,
  gauge: metricsHandler.gauge
};

// ✅ Debug Utilities (Development Only)
if (process.env.NODE_ENV === 'development') {
  Object.assign(TokenManager, {
    _debug: {
      getConfig: () => ({ ...TOKEN_CONFIG }),
      getRateLimiter: () => rateLimiter,
      getSecurityEvents: () => securityEvents,
      getMetrics: () => metricsHandler,
      getStorageStatus: async () => {
        const db = await dbManager.getConnection();
        return {
          dbConnected: !!db,
          dbVersion: TOKEN_CONFIG.STORAGE.dbVersion,
          storageType: db ? 'indexedDB' : 'localStorage'
        };
      }
    }
  });
}

// ✅ Type Definitions Export
export const types = {
  TokenConfig: TOKEN_CONFIG,
  DbStore: DB_STORE,
  SecurityConfig: TOKEN_CONFIG.SECURITY,
  JwtConfig: TOKEN_CONFIG.JWT
};

// ✅ Default Export
export default Object.freeze({
  ...TokenManager,
  Events,
  Errors,
  config,
  storage,
  security,
  crypto,
  metrics,
  subscribeToTokenEvents,
  cleanup,
  VERSION: config.VERSION
});
