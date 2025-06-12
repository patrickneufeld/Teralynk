// ================================================
// ✅ FILE: /frontend/src/utils/security/secureStorage.js
// Secure Encrypted Storage with Device Fingerprinting (v2.2.4)
// ================================================

import { v4 as uuidv4 } from 'uuid';
import CryptoJS from 'crypto-js';
import { logError } from '@/utils/logging';

const ENCRYPTION_KEY = '🔐-secure-key';
const DEVICE_ID_KEY = 'device_fingerprint';

// Create a constructor function for SecureStorage
function SecureStorage() {
  // This allows it to be used with or without 'new'
  if (!(this instanceof SecureStorage)) {
    return new SecureStorage();
  }
  
  // Instance methods
  this.encrypt = function(value) {
    try {
      return CryptoJS.AES.encrypt(value, ENCRYPTION_KEY).toString();
    } catch (err) {
      logError('encrypt error', err);
      return value;
    }
  };
  
  this.decrypt = function(cipher) {
    try {
      const bytes = CryptoJS.AES.decrypt(cipher, ENCRYPTION_KEY);
      return bytes.toString(CryptoJS.enc.Utf8);
    } catch (err) {
      logError('decrypt error', err);
      return null;
    }
  };
  
  this.getItem = function(key) {
    try {
      const data = localStorage.getItem(key);
      return data ? this.decrypt(data) : null;
    } catch (err) {
      logError('getItem error', err);
      return null;
    }
  };
  
  this.setItem = function(key, value) {
    try {
      const encrypted = this.encrypt(value);
      localStorage.setItem(key, encrypted);
      return true;
    } catch (err) {
      logError('setItem error', err);
      return false;
    }
  };
  
  this.removeItem = function(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (err) {
      logError('removeItem error', err);
      return false;
    }
  };
  
  this.getDeviceId = function() {
    try {
      let id = localStorage.getItem(DEVICE_ID_KEY);
      if (!id) {
        id = uuidv4();
        localStorage.setItem(DEVICE_ID_KEY, id);
      }
      return id;
    } catch (err) {
      logError('getDeviceId error', err);
      return 'unknown-device';
    }
  };
}

// Create an instance
const secureStorage = new SecureStorage();

// Export individual functions
export const getItem = (key) => secureStorage.getItem(key);
export const setItem = (key, value) => secureStorage.setItem(key, value);
export const removeItem = (key) => secureStorage.removeItem(key);
export const getDeviceId = () => secureStorage.getDeviceId();
export const encrypt = (value) => secureStorage.encrypt(value);
export const decrypt = (value) => secureStorage.decrypt(value);

// Export the constructor
export { SecureStorage };

// Export the instance as both named and default export
export { secureStorage };
export default secureStorage;
