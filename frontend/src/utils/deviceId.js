// ================================================
// ✅ FILE: /frontend/src/utils/deviceId.js
// Device ID Management with Validation
// ================================================

import { v4 as uuidv4 } from 'uuid';
import { createLogger } from './logging';
import { hashSHA256 } from './encryption';

const logger = createLogger('DeviceID');

// Constants
const DEVICE_ID_CONFIG = {
  PREFIX: 'dev_',
  VERSION: 'v3_',
  MIN_LENGTH: 32,
  MAX_LENGTH: 128,
  STORAGE_KEY: 'device_id_v3',
  VALIDATION_INTERVAL: 24 * 60 * 60 * 1000, // 24 hours
};

// Error class for device ID operations
class DeviceIdError extends Error {
  constructor(message, code, details = {}) {
    super(message);
    this.name = 'DeviceIdError';
    this.code = code;
    this.details = details;
    this.timestamp = new Date().toISOString();
  }
}

/**
 * Generates a device fingerprint based on browser characteristics
 */
const generateDeviceFingerprint = async () => {
  try {
    const components = [
      navigator.userAgent,
      navigator.language,
      screen.colorDepth,
      screen.pixelDepth,
      screen.width,
      screen.height,
      new Date().getTimezoneOffset(),
      navigator.hardwareConcurrency,
      navigator.deviceMemory,
      navigator.platform
    ].filter(Boolean);

    return await hashSHA256(components.join('|'));
  } catch (error) {
    logger.error('Failed to generate device fingerprint', error);
    return null;
  }
};

/**
 * Validates a device ID format and integrity
 */
export const validateDeviceId = async (deviceId) => {
  try {
    if (!deviceId || typeof deviceId !== 'string') {
      return false;
    }

    // Check format
    if (!deviceId.startsWith(DEVICE_ID_CONFIG.PREFIX + DEVICE_ID_CONFIG.VERSION)) {
      return false;
    }

    // Check length
    if (deviceId.length < DEVICE_ID_CONFIG.MIN_LENGTH || 
        deviceId.length > DEVICE_ID_CONFIG.MAX_LENGTH) {
      return false;
    }

    // Extract components
    const [prefix, version, id, hash] = deviceId.split('_');
    if (!prefix || !version || !id || !hash) {
      return false;
    }

    // Validate hash
    const fingerprint = await generateDeviceFingerprint();
    if (!fingerprint) return false;

    const expectedHash = await hashSHA256(id + fingerprint);
    return hash === expectedHash;

  } catch (error) {
    logger.error('Device ID validation failed', error);
    return false;
  }
};

/**
 * Generates a new raw device ID
 */
export const generateRawDeviceId = async () => {
  try {
    const uuid = uuidv4();
    const fingerprint = await generateDeviceFingerprint();
    const hash = await hashSHA256(uuid + (fingerprint || ''));
    
    return `${DEVICE_ID_CONFIG.PREFIX}${DEVICE_ID_CONFIG.VERSION}${uuid}_${hash}`;
  } catch (error) {
    logger.error('Failed to generate device ID', error);
    throw new DeviceIdError('Failed to generate device ID', 'GENERATION_ERROR', error);
  }
};

/**
 * Gets or creates a device ID
 */
export const getRawDeviceId = async () => {
  try {
    let deviceId = localStorage.getItem(DEVICE_ID_CONFIG.STORAGE_KEY);
    
    if (deviceId && await validateDeviceId(deviceId)) {
      return deviceId;
    }

    // Generate new device ID if none exists or validation failed
    deviceId = await generateRawDeviceId();
    localStorage.setItem(DEVICE_ID_CONFIG.STORAGE_KEY, deviceId);
    
    return deviceId;
  } catch (error) {
    logger.error('Failed to get/create device ID', error);
    throw new DeviceIdError('Failed to get/create device ID', 'ACCESS_ERROR', error);
  }
};

/**
 * Refreshes the device ID hash
 */
export const refreshDeviceId = async (deviceId) => {
  try {
    if (!await validateDeviceId(deviceId)) {
      throw new DeviceIdError('Invalid device ID', 'INVALID_ID');
    }

    const [prefix, version, id] = deviceId.split('_');
    const fingerprint = await generateDeviceFingerprint();
    const hash = await hashSHA256(id + (fingerprint || ''));
    
    return `${prefix}_${version}_${id}_${hash}`;
  } catch (error) {
    logger.error('Failed to refresh device ID', error);
    throw new DeviceIdError('Failed to refresh device ID', 'REFRESH_ERROR', error);
  }
};

/**
 * Clears the stored device ID
 */
export const clearDeviceId = () => {
  try {
    localStorage.removeItem(DEVICE_ID_CONFIG.STORAGE_KEY);
  } catch (error) {
    logger.error('Failed to clear device ID', error);
    throw new DeviceIdError('Failed to clear device ID', 'CLEAR_ERROR', error);
  }
};

export default {
  getRawDeviceId,
  validateDeviceId,
  generateRawDeviceId,
  refreshDeviceId,
  clearDeviceId,
  DEVICE_ID_CONFIG
};
