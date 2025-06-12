// ✅ FILE: /frontend/src/utils/authUtils.js

import { generateSecureString, isValidTimestamp } from '@/constants/security';
import { SECURITY_EVENTS } from './security/eventEmitter';

// ==============================
// 🔐 Security Levels
// ==============================
export const SECURITY_LEVELS = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
};

// ==============================
// 🗝️ Storage Keys
// ==============================
export const STORAGE_KEYS = {
  SESSION: 'session.token',
  AUTH: 'auth.token',
  DEVICE_ID: 'device.id'
};

// ==============================
// ⚙️ Security Configuration
// ==============================
export const SECURITY_CONFIG = {
  fingerprintTTL: 3600, // in seconds
  sessionTimeout: 1800, // in seconds
  maxFailedAttempts: 5
};

// ==============================
// 🔧 Utility Functions
// ==============================

export function getDeviceFingerprint() {
  return generateSecureString(64);
}

export function getClientId() {
  return generateSecureString(32);
}

export function getDeviceId() {
  let id = localStorage.getItem(STORAGE_KEYS.DEVICE_ID);
  if (!id) {
    id = generateSecureString(32);
    localStorage.setItem(STORAGE_KEYS.DEVICE_ID, id);
  }
  return id;
}

export function getSessionId() {
  return sessionStorage.getItem(STORAGE_KEYS.SESSION);
}

export function getCurrentUser() {
  const token = sessionStorage.getItem(STORAGE_KEYS.AUTH);
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload?.username || null;
  } catch (err) {
    console.warn('Invalid token format:', err);
    return null;
  }
}

export function hasPermission(permissions, required) {
  return Array.isArray(permissions) && permissions.includes(required);
}

export function hasRole(userRoles, role) {
  return Array.isArray(userRoles) && userRoles.includes(role);
}

export function getPermissionsForRole(role) {
  const map = {
    admin: ['files:read', 'files:write', 'admin:dashboard'],
    user: ['files:read'],
    guest: []
  };
  return map[role] || [];
}

export function decodeToken(token) {
  try {
    const base64Payload = token.split('.')[1];
    return JSON.parse(atob(base64Payload));
  } catch (err) {
    console.warn('Failed to decode token:', err);
    return null;
  }
}

export function validateToken(token) {
  const decoded = decodeToken(token);
  return decoded && isValidTimestamp(decoded.exp);
}

export function calculateAuthLevel(user) {
  if (user?.roles?.includes('admin')) return SECURITY_LEVELS.CRITICAL;
  if (user?.roles?.includes('user')) return SECURITY_LEVELS.HIGH;
  return SECURITY_LEVELS.LOW;
}

export function getSecurityContext() {
  return {
    deviceId: getDeviceId(),
    sessionId: getSessionId(),
    username: getCurrentUser(),
    timestamp: Date.now()
  };
}

export function initializeSecurityContext() {
  const context = getSecurityContext();
  sessionStorage.setItem('security.context', JSON.stringify(context));
  return context;
}

export function updateSecurityContext(update) {
  const context = getSecurityContext();
  const newContext = { ...context, ...update };
  sessionStorage.setItem('security.context', JSON.stringify(newContext));
  return newContext;
}

export function validateSecurityContext() {
  const raw = sessionStorage.getItem('security.context');
  if (!raw) return false;
  try {
    const ctx = JSON.parse(raw);
    return !!(ctx.deviceId && ctx.sessionId && ctx.username);
  } catch (err) {
    console.warn('Malformed security context:', err);
    return false;
  }
}

export function validateSecurityState() {
  const token = sessionStorage.getItem(STORAGE_KEYS.AUTH);
  return !!validateToken(token);
}

// ==============================
// ✅ Final Export Group
// ==============================
export {
  SECURITY_EVENTS
};
