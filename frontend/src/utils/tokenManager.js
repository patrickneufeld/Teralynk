// ================================================
// ✅ FILE: /frontend/src/utils/tokenManager.js
// Secure Token Management with Enhanced Security
// Version: 3.1.4 — Fixed removeToken export & structure
// ================================================

import { v4 as uuidv4 } from 'uuid';
import { memoize } from 'lodash';
import { openDB } from 'idb';
import { encrypt, decrypt, hashSHA256 } from './encryption';
import { logInfo, logError, logWarn } from './logging';
import { emitTelemetry } from './telemetry';
import { SecurityEventEmitter } from './security/eventEmitter';
import { RateLimiter } from './RateLimiter';
import secureStorage from '@/utils/security/secureStorage';

const DB_NAME = 'tokenStorage';
const DB_VERSION = 1;
const STORE_NAME = 'tokens';
const SESSION_KEY_STORE = 'sessionKeys';
const TTL = 1000 * 60 * 60 * 2;

const TOKEN_KEYS = {
  ACCESS: 'accessToken',
  REFRESH: 'refreshToken',
  EXPIRY: 'tokenExpiry',
  SESSION: 'sessionKey',
  DEVICE: 'deviceId',
};

// Initialize IndexedDB with error handling
let dbPromise;
try {
  dbPromise = openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
      if (!db.objectStoreNames.contains(SESSION_KEY_STORE)) {
        db.createObjectStore(SESSION_KEY_STORE);
      }
    },
  });
  logInfo('IndexedDB initialized for token storage');
} catch (err) {
  logError('Failed to initialize IndexedDB', err);
  dbPromise = null;
}

// IndexedDB operations with localStorage fallback
const getFromDB = async (key) => {
  try {
    if (!dbPromise) {
      return secureStorage.getItem(key);
    }
    const db = await dbPromise;
    return await db.get(STORE_NAME, key);
  } catch (e) {
    logError('Failed to get from DB', { key, error: e.message });
    // Try localStorage as fallback
    return secureStorage.getItem(key);
  }
};

const setToDB = async (key, value) => {
  try {
    if (!dbPromise) {
      return secureStorage.setItem(key, JSON.stringify(value));
    }
    const db = await dbPromise;
    await db.put(STORE_NAME, value, key);
    return true;
  } catch (e) {
    logError('Failed to write to DB', { key, error: e.message });
    // Try localStorage as fallback
    secureStorage.setItem(key, JSON.stringify(value));
    return false;
  }
};

const deleteFromDB = async (key) => {
  try {
    if (!dbPromise) {
      return secureStorage.removeItem(key);
    }
    const db = await dbPromise;
    await db.delete(STORE_NAME, key);
    return true;
  } catch (e) {
    logError('Failed to delete from DB', { key, error: e.message });
    // Try localStorage as fallback
    secureStorage.removeItem(key);
    return false;
  }
};

const clearDB = async () => {
  try {
    if (!dbPromise) {
      // Clear all token-related items from localStorage
      Object.values(TOKEN_KEYS).forEach(key => secureStorage.removeItem(key));
      return true;
    }
    const db = await dbPromise;
    await db.clear(STORE_NAME);
    return true;
  } catch (e) {
    logError('Failed to clear DB', e);
    // Try localStorage as fallback
    Object.values(TOKEN_KEYS).forEach(key => secureStorage.removeItem(key));
    return false;
  }
};

const getSessionKey = memoize(() => {
  try {
    return uuidv4();
  } catch (e) {
    logError('Failed to generate session key', e);
    return null;
  }
});

const getDeviceId = async () => {
  let deviceId = await getFromDB(TOKEN_KEYS.DEVICE);
  if (!deviceId) {
    deviceId = uuidv4();
    await setToDB(TOKEN_KEYS.DEVICE, deviceId);
  }
  return deviceId;
};

const encryptToken = async (token) => {
  try {
    // Use a fixed passphrase for token encryption
    const passphrase = 'token-encryption-key';
    return await encrypt(token, passphrase);
  } catch (e) {
    logError('Token encryption failed', e);
    // Fallback to simple encryption if advanced encryption fails
    return secureStorage.encrypt ? secureStorage.encrypt(token) : token;
  }
};

async function setToken(token, ttl = TTL) {
  try {
    // For backward compatibility, accept either a token string or an object
    const tokenValue = typeof token === 'string' ? token : token?.token || token?.accessToken || token;
    
    if (!tokenValue) {
      throw new Error('Invalid token provided');
    }
    
    const encrypted = await encryptToken(tokenValue);
    const payload = {
      value: encrypted,
      timestamp: Date.now(),
      ttl,
    };
    
    await setToDB(TOKEN_KEYS.ACCESS, payload);
    
    // If token is an object with refresh token, store that too
    if (typeof token === 'object' && token.refreshToken) {
      const encryptedRefresh = await encryptToken(token.refreshToken);
      const refreshPayload = {
        value: encryptedRefresh,
        timestamp: Date.now(),
        ttl: ttl * 2, // Refresh tokens typically last longer
      };
      await setToDB(TOKEN_KEYS.REFRESH, refreshPayload);
    }
    
    logInfo('Token set successfully');
    return true;
  } catch (err) {
    logError('Failed to set token', { error: err.message });
    return false;
  }
}

async function getToken(key = TOKEN_KEYS.ACCESS) {
  try {
    const entry = await getFromDB(key);
    if (!entry) return null;
    
    // Handle both object format and direct string format
    if (typeof entry === 'object' && entry.value) {
      if (Date.now() > entry.timestamp + entry.ttl) {
        await deleteFromDB(key);
        return null;
      }
      return await decrypt(entry.value, 'token-encryption-key');
    }
    
    // If it's a string, it might be from localStorage fallback
    if (typeof entry === 'string') {
      try {
        const parsed = JSON.parse(entry);
        if (parsed.value) {
          if (Date.now() > parsed.timestamp + parsed.ttl) {
            secureStorage.removeItem(key);
            return null;
          }
          return await decrypt(parsed.value, 'token-encryption-key');
        }
        return entry; // Direct token value
      } catch {
        return entry; // Direct token value
      }
    }
    
    return null;
  } catch (err) {
    logError('Failed to get token', { key, error: err.message });
    return null;
  }
}

async function validateToken(key = TOKEN_KEYS.ACCESS) {
  try {
    const token = await getToken(key);
    return !!token;
  } catch (err) {
    logError('Failed to validate token', { key, error: err.message });
    return false;
  }
}

async function clearTokens() {
  try {
    await clearDB();
    if (dbPromise) {
      const db = await dbPromise;
      await db.clear(SESSION_KEY_STORE);
    }
    logInfo('All tokens cleared');
    return true;
  } catch (err) {
    logError('Failed to clear tokens', err);
    return false;
  }
}

async function removeToken(key) {
  try {
    await deleteFromDB(key);
    logInfo('Token removed', { key });
    return true;
  } catch (err) {
    logError('Failed to remove token', { key, error: err.message });
    return false;
  }
}

async function listTokens() {
  try {
    if (!dbPromise) {
      // Limited support for localStorage
      return Object.values(TOKEN_KEYS).filter(key => secureStorage.getItem(key) !== null);
    }
    const db = await dbPromise;
    return await db.getAllKeys(STORE_NAME);
  } catch (err) {
    logError('Failed to list tokens', err);
    return [];
  }
}

async function setSessionKey(userId, sessionKey) {
  try {
    const hashed = await hashSHA256(sessionKey);
    if (!dbPromise) {
      return secureStorage.setItem(`${SESSION_KEY_STORE}_${userId}`, hashed);
    }
    const db = await dbPromise;
    await db.put(SESSION_KEY_STORE, hashed, userId);
    return true;
  } catch (err) {
    logError('Failed to set session key', { userId, error: err.message });
    return false;
  }
}

async function getSessionKeyStored(userId) {
  try {
    if (!dbPromise) {
      return secureStorage.getItem(`${SESSION_KEY_STORE}_${userId}`);
    }
    const db = await dbPromise;
    return await db.get(SESSION_KEY_STORE, userId);
  } catch (err) {
    logError('Failed to get session key', { userId, error: err.message });
    return null;
  }
}

async function removeSessionKey(userId) {
  try {
    if (!dbPromise) {
      return secureStorage.removeItem(`${SESSION_KEY_STORE}_${userId}`);
    }
    const db = await dbPromise;
    await db.delete(SESSION_KEY_STORE, userId);
    return true;
  } catch (err) {
    logError('Failed to remove session key', { userId, error: err.message });
    return false;
  }
}

function createSecureTokenId(prefix = 'token') {
  return `${prefix}_${uuidv4()}`;
}

async function exportTokenBundle() {
  try {
    if (!dbPromise) {
      // Limited support for localStorage
      return {
        tokens: Object.values(TOKEN_KEYS)
          .map(key => {
            const value = secureStorage.getItem(key);
            return value ? { key, value } : null;
          })
          .filter(Boolean),
        exportedAt: new Date().toISOString(),
      };
    }
    
    const db = await dbPromise;
    const tokens = await db.getAll(STORE_NAME);
    const sessionKeys = await db.getAll(SESSION_KEY_STORE);
    return {
      tokens,
      sessionKeys,
      exportedAt: new Date().toISOString(),
    };
  } catch (err) {
    logError('Failed to export token bundle', { error: err.message });
    return null;
  }
}

async function initTokenManager(userId) {
  try {
    const deviceId = await getDeviceId();
    const sessionKey = getSessionKey(userId);
    logInfo('Token Manager initialized', { userId, deviceId });
    emitTelemetry('token.initialized', {
      userId,
      deviceId,
      sessionKey,
    });
    return { deviceId, sessionKey };
  } catch (err) {
    logError('Failed to initialize Token Manager', { error: err.message });
    return null;
  }
}

async function emitTokenEvent(eventType, payload = {}) {
  try {
    const traceId = createSecureTokenId('trace');
    SecurityEventEmitter.emit(eventType, {
      traceId,
      timestamp: Date.now(),
      ...payload,
    });
    emitTelemetry('token.event', { eventType, ...payload });
    return true;
  } catch (err) {
    logError('Failed to emit token event', { eventType, error: err.message });
    return false;
  }
}

// ✅ FIXED EXPORTS
export {
  getToken,
  setToken,
  validateToken,
  clearTokens,
  removeToken,
  listTokens,
  setSessionKey,
  getSessionKeyStored as getSessionKey,
  removeSessionKey,
  createSecureTokenId,
  exportTokenBundle,
  initTokenManager,
  emitTokenEvent,
  TOKEN_KEYS
};
