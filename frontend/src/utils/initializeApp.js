// File: /frontend/src/initializeApp.js

import { v4 as uuidv4 } from 'uuid';
import logger from "./utils/logging/logging.js";
import { getAwsSecrets } from "./services/aws/secrets.js";

// Client storage keys
const CLIENT_STORAGE_KEYS = {
  CLIENT_ID: 'teralynk_client_instance_id',
  SESSION_ID: 'teralynk_session_id',
  SESSION_START: 'teralynk_session_start',
  LAST_ACTIVITY: 'teralynk_last_activity'
};

/**
 * ✅ Helper function to validate UUID format
 */
const isValidUUID = (uuid) => {
  const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
  return regex.test(uuid);
};

/**
 * ✅ Initialize client tracking for session and client ID
 */
export const initializeClientTracking = () => {
  try {
    if (!localStorage.getItem(CLIENT_STORAGE_KEYS.CLIENT_ID)) {
      localStorage.setItem(CLIENT_STORAGE_KEYS.CLIENT_ID, uuidv4());
    } else {
      const clientId = localStorage.getItem(CLIENT_STORAGE_KEYS.CLIENT_ID);
      if (!isValidUUID(clientId)) throw new Error(`Invalid client ID: ${clientId}`);
    }

    if (!sessionStorage.getItem(CLIENT_STORAGE_KEYS.SESSION_ID)) {
      sessionStorage.setItem(CLIENT_STORAGE_KEYS.SESSION_ID, uuidv4());
    } else {
      const sessionId = sessionStorage.getItem(CLIENT_STORAGE_KEYS.SESSION_ID);
      if (!isValidUUID(sessionId)) throw new Error(`Invalid session ID: ${sessionId}`);
    }

    localStorage.setItem(CLIENT_STORAGE_KEYS.LAST_ACTIVITY, Date.now().toString());

    if (!localStorage.getItem(CLIENT_STORAGE_KEYS.SESSION_START)) {
      localStorage.setItem(CLIENT_STORAGE_KEYS.SESSION_START, Date.now().toString());
    }

    logger.debug("✅ Client tracking initialized", {
      clientId: localStorage.getItem(CLIENT_STORAGE_KEYS.CLIENT_ID),
      sessionId: sessionStorage.getItem(CLIENT_STORAGE_KEYS.SESSION_ID),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error("❌ Error initializing client tracking:", error);
  }
};

/**
 * ✅ Load AWS Secrets into sessionStorage from secure module
 */
export const loadAwsSecrets = () => {
  try {
    const secrets = getAwsSecrets();

    if (!secrets || typeof secrets !== 'object') {
      throw new Error("Secrets are missing or malformed");
    }

    // Store for global access across app
    sessionStorage.setItem('secrets', JSON.stringify(secrets));

    logger.debug("✅ AWS secrets loaded via secure secrets manager");
    return secrets;
  } catch (error) {
    logger.error("❌ Error loading AWS secrets:", error);
    throw error;
  }
};

/**
 * ✅ Entry point to initialize the Teralynk application
 */
export const initializeApp = () => {
  try {
    logger.debug("🚀 Initializing application...");

    initializeClientTracking();
    loadAwsSecrets();

    logger.debug("✅ Application initialized successfully");
  } catch (error) {
    logger.error("❌ Error initializing application:", error);
  }
};

export default initializeApp;
