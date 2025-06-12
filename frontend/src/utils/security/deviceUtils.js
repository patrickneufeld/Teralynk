// ================================================
// ✅ FILE: /frontend/src/utils/security/deviceUtils.js
// Device fingerprint utilities for secure auth
// ================================================

import { v4 as uuidv4 } from 'uuid';

// Generate or return raw device ID
export function getRawDeviceId() {
  try {
    let id = localStorage.getItem('teralynk.deviceId');
    if (!id) {
      id = uuidv4();
      localStorage.setItem('teralynk.deviceId', id);
    }
    return id;
  } catch (err) {
    console.error('Failed to get raw device ID', err);
    return null;
  }
}
