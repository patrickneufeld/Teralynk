// ✅ FILE: /backend/config/envConfig.js

export const ENV = {
    DB_URL: process.env.DATABASE_URL,
    NODE_ENV: process.env.NODE_ENV,
    DEVICE_SECRET: process.env.DEVICE_SECRET,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
    BEDROCK_API_KEY: process.env.BEDROCK_API_KEY,
  };
  
  export const SECURITY = {
    TRUST_HEADER: 'x-trusted-device',
    MAX_FAILED_ATTEMPTS: 5,
    LOCKOUT_TIME_MS: 60000,
  };
  
  export const MONITORING = {
    TELEMETRY_BATCH_SIZE: 10,
    ERROR_THRESHOLD: 5,
    AI_TIMEOUT_MS: 10000,
  };
  