// ✅ FILE: /frontend/src/utils/constants.js

// 🌐 API Configuration
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';
export const WS_HOST = import.meta.env.VITE_WS_HOST || 'localhost';
export const WS_PORT = import.meta.env.VITE_WS_PORT || '5173';
export const WS_PATH = import.meta.env.VITE_WS_PATH || '/ws';
export const FRONTEND_BASE_URL = import.meta.env.VITE_FRONTEND_BASE_URL || 'http://localhost:5173';

// 🔒 Authentication / Security Settings
export const AUTH_DOMAIN = import.meta.env.VITE_AUTH_DOMAIN || 'teralynk.auth.us-east-1.amazoncognito.com';
export const AWS_REGION = import.meta.env.VITE_AWS_REGION || 'us-east-1';
export const COGNITO_USER_POOL_ID = import.meta.env.VITE_COGNITO_USER_POOL_ID || '';
export const COGNITO_CLIENT_ID = import.meta.env.VITE_COGNITO_CLIENT_ID || '';
export const COGNITO_CLIENT_SECRET = import.meta.env.VITE_COGNITO_CLIENT_SECRET || '';

// 🛡️ Security and Storage Keys
export const LOCAL_STORAGE_KEYS = {
  ACCESS_TOKEN: 'accessToken',
  REFRESH_TOKEN: 'refreshToken',
  ACCESS_EXPIRY: 'accessToken_expires',
  CLIENT_ID: 'teralynk_client_instance_id',
  SESSION_ID: 'teralynk_session_id',
  SESSION_START: 'teralynk_session_start',
  LAST_ACTIVITY: 'teralynk_last_activity',
  ENCRYPTED_SECRETS: 'encrypted_secrets',
};

// 🔥 WebSocket Settings
export const WS_RECONNECT_DELAY = 3000; // 3 seconds
export const WS_MAX_RECONNECT_DELAY = 30000; // 30 seconds
export const WS_CONNECTION_TIMEOUT = 5000; // 5 seconds

// ⚙️ App Defaults
export const DEFAULT_PAGE_SIZE = 20;
export const DEFAULT_TIMEOUT = 10000; // 10 seconds for API requests
export const MAX_FILE_SIZE_MB = 20;

// 📊 Analytics / Monitoring
export const GA_TRACKING_ID = import.meta.env.VITE_GA_TRACKING_ID || '';
export const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN || '';

// 🤖 AI/ML
export const AI_MODEL_NAME = import.meta.env.VITE_AI_MODEL_NAME || 'teralynk-ai';

// 🎯 Other Constants
export const ENV_MODE = import.meta.env.VITE_MODE || 'development';
export const APP_VERSION = import.meta.env.VITE_APP_VERSION || '1.0.0';

export const IS_PRODUCTION = ENV_MODE === 'production';
export const IS_DEVELOPMENT = ENV_MODE === 'development';
