// ✅ FILE: /frontend/src/utils/tokenManager.js

import { v4 as uuidv4 } from 'uuid';
import { memoize } from 'lodash';
import { openDB } from 'idb';
import { encrypt, decrypt, hashSHA256 } from './encryption';
import { logInfo, logError, logWarn } from './logging';
import { emitTelemetry } from './telemetry';
import { SecurityEventEmitter } from './security/eventEmitter';
import { MetricsCollector } from './metrics/MetricsCollector';
import { RateLimiter } from './RateLimiter';

// ====================== Configuration Constants ======================

const TOKEN_CONFIG = {
  ACCESS: {
    key: 'accessToken',
    prefix: 'auth_v2_',
    encryption: true,
    maxAge: 3600000, // 1 hour
    minLength: 100,
    algorithm: 'AES-GCM'
  },
  REFRESH: {
    key: 'refreshToken',
    prefix: 'refresh_v2_',
    encryption: true,
    maxAge: 7 * 24 * 3600000, // 7 days
    minLength: 100,
    algorithm: 'AES-GCM'
  },
  METADATA: {
    key: 'token_metadata',
    prefix: 'meta_v2_',
    encryption: true,
    maxAge: 30 * 24 * 3600000 // 30 days
  },
  STORAGE: {
    preferred: 'indexedDB',
    fallback: 'localStorage',
    dbName: 'tokenStore',
    dbVersion: 1,
    upgradeCallback: null
  },
  ROTATION: {
    interval: 30 * 24 * 3600000, // 30 days
    lastRotationKey: 'token_rotation_timestamp',
    forceRotateAfter: 90 * 24 * 3600000 // 90 days
  },
  SECURITY: {
    maxFailedAttempts: 5,
    lockoutDuration: 15 * 60 * 1000, // 15 minutes
    passwordIterations: 100000,
    keyLength: 256,
    saltLength: 16,
    ivLength: 12
  }
};

const DB_STORE = {
  TOKENS: 'tokens',
  METADATA: 'metadata',
  SECURITY: 'security'
};

// ====================== Infrastructure Setup ======================

let dbInstance = null;
const securityEvents = new SecurityEventEmitter();
const metrics = {
  recordEvent: (name, data) => {
    console.debug('[Metrics]', name, data);
  },
  incrementCounter: (name) => {
    console.debug('[Metrics] Increment', name);
  },
  recordLatency: (name, duration) => {
    console.debug('[Metrics] Latency', name, duration);
  },
  getMetrics: () => ({
    counters: {},
    latencies: {},
    events: []
  })
};
const rateLimiter = new RateLimiter({
  maxAttempts: TOKEN_CONFIG.SECURITY.maxFailedAttempts,
  timeWindow: TOKEN_CONFIG.SECURITY.lockoutDuration
});

class TokenError extends Error {
  constructor(message, code, context = {}) {
    super(message);
    this.name = 'TokenError';
    this.code = code;
    this.context = context;
    this.timestamp = new Date().toISOString();
  }
}

// ====================== Utility Functions ======================


const bufferToHex = (buffer) => Array.from(buffer)
  .map(b => b.toString(16).padStart(2, '0'))
  .join('');

const hexToBuffer = (hex) => new Uint8Array(
  hex.match(/.{1,2}/g).map(byte => parseInt(byte, 16))
);
// ====================== Core Security Functions ======================

export const getSessionKey = memoize(() => {
  const stored = localStorage.getItem('session_key');
  if (stored) return stored;
  
  const newKey = uuidv4();
  localStorage.setItem('session_key', newKey);
  return newKey;
});

export const generateDeviceFingerprint = memoize(async () => {
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
  ];

  const fingerprint = components.filter(Boolean).join('|');
  return await hashSHA256(fingerprint);
}, () => Math.floor(Date.now() / 86400000)); // Cache for 24 hours

export const getThreadId = () => {
  const threadId = uuidv4();
  metrics.recordEvent('thread_created', { threadId });
  return threadId;
};

// ====================== Database Management ======================

async function getDB() {
  if (dbInstance) return dbInstance;

  try {
    dbInstance = await openDB(TOKEN_CONFIG.STORAGE.dbName, TOKEN_CONFIG.STORAGE.dbVersion, {
      upgrade(db, oldVersion, newVersion, transaction) {
        if (!db.objectStoreNames.contains(DB_STORE.TOKENS)) {
          db.createObjectStore(DB_STORE.TOKENS);
        }
        if (!db.objectStoreNames.contains(DB_STORE.METADATA)) {
          db.createObjectStore(DB_STORE.METADATA);
        }
        if (!db.objectStoreNames.contains(DB_STORE.SECURITY)) {
          db.createObjectStore(DB_STORE.SECURITY);
        }

        if (TOKEN_CONFIG.STORAGE.upgradeCallback) {
          TOKEN_CONFIG.STORAGE.upgradeCallback(db, oldVersion, newVersion, transaction);
        }

        metrics.recordEvent('db_upgraded', {
          oldVersion,
          newVersion,
          stores: Array.from(db.objectStoreNames)
        });
      }
    });

    return dbInstance;
  } catch (error) {
    logWarn('[TokenManager] IndexedDB fallback to localStorage', error);
    metrics.incrementCounter('db_fallback_count');
    return null;
  }
}

// ====================== Encryption/Decryption ======================

async function secureEncryptToken(raw) {
  const startTime = Date.now();

  try {
    const iv = crypto.getRandomValues(new Uint8Array(TOKEN_CONFIG.SECURITY.ivLength));
    const salt = crypto.getRandomValues(new Uint8Array(TOKEN_CONFIG.SECURITY.saltLength));
    const fingerprint = await generateDeviceFingerprint();

    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(fingerprint + bufferToHex(salt)),
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
      ['encrypt']
    );

    const encrypted = await encrypt(raw, key, iv);
    metrics.recordLatency('encryption_time', Date.now() - startTime);

    return {
      data: encrypted,
      iv: bufferToHex(iv),
      salt: bufferToHex(salt),
      timestamp: Date.now(),
      version: TOKEN_CONFIG.STORAGE.dbVersion
    };
  } catch (error) {
    metrics.incrementCounter('encryption_failures');
    throw new TokenError('Encryption failed', 'ENCRYPTION_ERROR', { error: error.message });
  }
}

async function secureDecryptToken({ data, iv, salt, version }) {
  const startTime = Date.now();

  try {
    if (!data || !iv || !salt) {
      throw new TokenError('Invalid encrypted data format', 'INVALID_FORMAT');
    }

    if (version !== TOKEN_CONFIG.STORAGE.dbVersion) {
      metrics.incrementCounter('version_mismatch');
      logWarn('Token version mismatch', { stored: version, current: TOKEN_CONFIG.STORAGE.dbVersion });
    }

    const fingerprint = await generateDeviceFingerprint();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(fingerprint + salt),
      'PBKDF2',
      false,
      ['deriveKey']
    );

    const key = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: hexToBuffer(salt),
        iterations: TOKEN_CONFIG.SECURITY.passwordIterations,
        hash: 'SHA-256'
      },
      keyMaterial,
      {
        name: TOKEN_CONFIG.ACCESS.algorithm,
        length: TOKEN_CONFIG.SECURITY.keyLength
      },
      false,
      ['decrypt']
    );

    const decrypted = await decrypt(data, key, hexToBuffer(iv));
    metrics.recordLatency('decryption_time', Date.now() - startTime);
    
    return decrypted;
  } catch (error) {
    metrics.incrementCounter('decryption_failures');
    throw new TokenError('Decryption failed', 'DECRYPTION_ERROR', { error: error.message });
  }
}
// ====================== Token Management Functions ======================

export async function setToken(token) {
  const startTime = Date.now();

  try {
    if (!token || typeof token !== 'string' || token.length < TOKEN_CONFIG.ACCESS.minLength) {
      throw new TokenError('Invalid token format', 'INVALID_TOKEN');
    }

    await rateLimiter.checkLimit('token_operations');
    const db = await getDB();
    const encrypted = await secureEncryptToken(token);

    if (db) {
      await db.put(DB_STORE.TOKENS, encrypted, TOKEN_CONFIG.ACCESS.key);
    } else {
      localStorage.setItem(TOKEN_CONFIG.ACCESS.key, JSON.stringify(encrypted));
    }

    metrics.recordLatency('set_token_time', Date.now() - startTime);
    metrics.incrementCounter('successful_token_sets');

    emitTelemetry('token_set', {
      storage: db ? 'indexedDB' : 'localStorage',
      duration: Date.now() - startTime
    });

  } catch (error) {
    metrics.incrementCounter('token_set_failures');
    throw new TokenError('Failed to set token', 'SET_TOKEN_ERROR', { error: error.message });
  }
}

export async function getToken() {
  const startTime = Date.now();
  try {
    await rateLimiter.checkLimit('token_operations');
    const db = await getDB();
    const stored = db
      ? await db.get(DB_STORE.TOKENS, TOKEN_CONFIG.ACCESS.key)
      : JSON.parse(localStorage.getItem(TOKEN_CONFIG.ACCESS.key));

    if (!stored) return null;

    const decrypted = await secureDecryptToken(stored);
    metrics.recordLatency('get_token_time', Date.now() - startTime);
    return decrypted;
  } catch (error) {
    metrics.incrementCounter('token_get_failures');
    throw new TokenError('Failed to get token', 'GET_TOKEN_ERROR', { error: error.message });
  }
}

export async function removeToken() {
  const startTime = Date.now();
  try {
    await rateLimiter.checkLimit('token_operations');
    const db = await getDB();
    if (db) {
      await db.delete(DB_STORE.TOKENS, TOKEN_CONFIG.ACCESS.key);
    }
    localStorage.removeItem(TOKEN_CONFIG.ACCESS.key);
    metrics.recordLatency('remove_token_time', Date.now() - startTime);
    metrics.incrementCounter('successful_token_removals');
  } catch (error) {
    metrics.incrementCounter('token_remove_failures');
    throw new TokenError('Failed to remove token', 'REMOVE_TOKEN_ERROR', { error: error.message });
  }
}

export async function setRefreshToken(token) {
  const startTime = Date.now();
  try {
    if (!token || typeof token !== 'string' || token.length < TOKEN_CONFIG.REFRESH.minLength) {
      throw new TokenError('Invalid refresh token format', 'INVALID_REFRESH_TOKEN');
    }

    await rateLimiter.checkLimit('token_operations');
    const db = await getDB();
    const encrypted = await secureEncryptToken(token);

    if (db) {
      await db.put(DB_STORE.TOKENS, encrypted, TOKEN_CONFIG.REFRESH.key);
    } else {
      localStorage.setItem(TOKEN_CONFIG.REFRESH.key, JSON.stringify(encrypted));
    }

    metrics.recordLatency('set_refresh_token_time', Date.now() - startTime);
    metrics.incrementCounter('successful_refresh_token_sets');
  } catch (error) {
    metrics.incrementCounter('refresh_token_set_failures');
    throw new TokenError('Failed to set refresh token', 'SET_REFRESH_TOKEN_ERROR', { error: error.message });
  }
}

export async function getRefreshToken() {
  const startTime = Date.now();
  try {
    await rateLimiter.checkLimit('token_operations');
    const db = await getDB();
    const stored = db
      ? await db.get(DB_STORE.TOKENS, TOKEN_CONFIG.REFRESH.key)
      : JSON.parse(localStorage.getItem(TOKEN_CONFIG.REFRESH.key));

    if (!stored) return null;

    const decrypted = await secureDecryptToken(stored);
    metrics.recordLatency('get_refresh_token_time', Date.now() - startTime);
    return decrypted;
  } catch (error) {
    metrics.incrementCounter('refresh_token_get_failures');
    throw new TokenError('Failed to get refresh token', 'GET_REFRESH_TOKEN_ERROR', { error: error.message });
  }
}

export async function removeRefreshToken() {
  const startTime = Date.now();
  try {
    await rateLimiter.checkLimit('token_operations');
    const db = await getDB();
    if (db) {
      await db.delete(DB_STORE.TOKENS, TOKEN_CONFIG.REFRESH.key);
    }
    localStorage.removeItem(TOKEN_CONFIG.REFRESH.key);
    metrics.recordLatency('remove_refresh_token_time', Date.now() - startTime);
    metrics.incrementCounter('successful_refresh_token_removals');
  } catch (error) {
    metrics.incrementCounter('refresh_token_remove_failures');
    throw new TokenError('Failed to remove refresh token', 'REMOVE_REFRESH_TOKEN_ERROR', { error: error.message });
  }
}
// ====================== Token Validation and Refresh Functions ======================

export async function getTokenExpiry() {
  try {
    const token = await getToken();
    if (!token) return null;
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1]));
    return payload.exp ? payload.exp * 1000 : null;
  } catch (error) {
    metrics.incrementCounter('token_expiry_check_failures');
    return null;
  }
}

export async function shouldRefreshToken(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return true;
    const payload = JSON.parse(atob(parts[1]));
    const now = Date.now() / 1000;
    const timeUntilExpiry = payload.exp - now;
    return timeUntilExpiry < 300; // Refresh if less than 5 minutes until expiry
  } catch (error) {
    metrics.incrementCounter('refresh_check_failures');
    return true;
  }
}

export async function validateTokenIntegrity(token) {
  const startTime = Date.now();
  try {
    if (!token) return false;
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    
    const payload = JSON.parse(atob(parts[1]));
    const now = Math.floor(Date.now() / 1000);
    
    // Basic validation
    if (!payload.exp || !payload.iat) return false;
    if (payload.exp <= now) return false;
    if (payload.iat > now) return false;
    
    metrics.recordLatency('token_validation_time', Date.now() - startTime);
    return true;
  } catch (error) {
    metrics.incrementCounter('token_validation_failures');
    return false;
  }
}

// ====================== Batch Token Operations ======================

export async function setTokens({ accessToken, refreshToken, metadata = {} }) {
  try {
    await Promise.all([
      setToken(accessToken),
      setRefreshToken(refreshToken),
      storeTokenMetadata(metadata)
    ]);
  } catch (error) {
    metrics.incrementCounter('token_set_batch_failures');
    throw new TokenError('Failed to set tokens', 'SET_TOKENS_ERROR', { error: error.message });
  }
}

export async function getTokens() {
  try {
    const [accessToken, refreshToken, metadata] = await Promise.all([
      getToken(),
      getRefreshToken(),
      getTokenMetadata()
    ]);
    return { accessToken, refreshToken, metadata };
  } catch (error) {
    metrics.incrementCounter('token_get_batch_failures');
    throw new TokenError('Failed to get tokens', 'GET_TOKENS_ERROR', { error: error.message });
  }
}

export async function clearTokens() {
  try {
    await Promise.all([
      removeToken(),
      removeRefreshToken(),
      clearTokenMetadata()
    ]);
    metrics.incrementCounter('successful_token_clears');
  } catch (error) {
    metrics.incrementCounter('token_clear_failures');
    throw new TokenError('Failed to clear tokens', 'CLEAR_TOKENS_ERROR', { error: error.message });
  }
}

// ====================== Metadata Management ======================

async function storeTokenMetadata(metadata) {
  const db = await getDB();
  const encrypted = await secureEncryptToken(JSON.stringify(metadata));
  if (db) {
    await db.put(DB_STORE.METADATA, encrypted, TOKEN_CONFIG.METADATA.key);
  } else {
    localStorage.setItem(TOKEN_CONFIG.METADATA.key, JSON.stringify(encrypted));
  }
}

async function getTokenMetadata() {
  const db = await getDB();
  const stored = db
    ? await db.get(DB_STORE.METADATA, TOKEN_CONFIG.METADATA.key)
    : JSON.parse(localStorage.getItem(TOKEN_CONFIG.METADATA.key));
  
  if (!stored) return {};
  const decrypted = await secureDecryptToken(stored);
  return JSON.parse(decrypted);
}

async function clearTokenMetadata() {
  const db = await getDB();
  if (db) {
    await db.delete(DB_STORE.METADATA, TOKEN_CONFIG.METADATA.key);
  }
  localStorage.removeItem(TOKEN_CONFIG.METADATA.key);
}
// ====================== Service Interface ======================

/**
 * Token Manager Service Interface
 * Provides a unified interface for token management operations
 */
const tokenManager = {
  // Token Operations
  getToken,
  setToken,
  removeToken,
  getRefreshToken,
  setRefreshToken,
  removeRefreshToken,
  
  // Token Validation
  getTokenExpiry,
  shouldRefreshToken,
  validateTokenIntegrity,
  
  // Security Functions
  generateDeviceFingerprint,
  getThreadId,
  getSessionKey,
  
  // Batch Operations
  setTokens,
  getTokens,
  clearTokens,
  
  // Configuration
  TOKEN_CONFIG,

  // Additional Utilities
  getMetrics: () => metrics.getMetrics(),
  getRateLimiterStatus: () => rateLimiter.getStatus(),
  
  // Service Health
  getServiceHealth: () => ({
    storage: dbInstance ? 'indexedDB' : 'localStorage',
    metrics: metrics.getMetrics(),
    rateLimiter: rateLimiter.getStatus(),
    securityEvents: securityEvents.getStatus(),
    config: TOKEN_CONFIG,
    timestamp: new Date().toISOString()
  })
};

// Remove all export keywords from individual functions throughout the file
// And replace the entire exports section with just this:

// ====================== Export ======================

export default {
  // Token Operations
  getToken,
  setToken,
  removeToken,
  getRefreshToken,
  setRefreshToken,
  removeRefreshToken,
  
  // Token Validation
  getTokenExpiry,
  shouldRefreshToken,
  validateTokenIntegrity,
  
  // Security Functions
  generateDeviceFingerprint,
  getThreadId,
  getSessionKey,
  
  // Batch Operations
  setTokens,
  getTokens,
  clearTokens,
  
  // Configuration
  TOKEN_CONFIG,

  // Additional Utilities
  getMetrics: () => metrics.getMetrics(),
  getRateLimiterStatus: () => rateLimiter.getStatus(),
  
  // Service Health
  getServiceHealth: () => ({
    storage: dbInstance ? 'indexedDB' : 'localStorage',
    metrics: metrics.getMetrics(),
    rateLimiter: rateLimiter.getStatus(),
    securityEvents: securityEvents.getStatus(),
    config: TOKEN_CONFIG,
    timestamp: new Date().toISOString()
  })
};
