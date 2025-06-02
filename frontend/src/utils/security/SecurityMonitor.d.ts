// File: SecurityMonitor.d.ts

export declare class SecurityMonitor {
  // ... class methods and properties
}

export declare const CHECK_TYPES: {
  JWT_EXPIRY: string;
  XSS_PROTECTION: string;
  CSP_VALIDATION: string;
  CORS_CONFIG: string;
  SESSION_VALIDITY: string;
  API_SECURITY: string;
  STORAGE_SECURITY: string;
  INPUT_VALIDATION: string;
  AUTH_STATE: string;
  NETWORK_SECURITY: string;
};

export declare const SEVERITY_LEVELS: {
  LOW: string;
  MEDIUM: string;
  HIGH: string;
  CRITICAL: string;
};

export type SecurityCheckResult = {
  passed: boolean;
  reason?: string;
  details?: Record<string, any>;
  timestamp?: number;
};

export type SecurityEvent = {
  type: string;
  check: string;
  reason: string;
  timestamp: number;
  traceId: string;
  severity: string;
  details?: Record<string, any>;
};

declare const securityMonitor: SecurityMonitor;
export default securityMonitor;
