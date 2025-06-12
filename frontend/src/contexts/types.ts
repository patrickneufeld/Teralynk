// types.ts
export interface SecurityConfig {
  sessionTimeout?: number;
  checkInterval?: number;
  maxRefreshAttempts?: number;
  mfaRequired?: boolean;
  deviceVerificationRequired?: boolean;
}

export interface AuthState {
  user: any | null;
  loggedIn: boolean;
  loading: boolean;
  error: any | null;
  status: string;
  sessionExpiry: number | null;
  authLevel: string;
  securityFlags: Record<string, boolean>;
  mfaRequired: boolean;
  deviceVerified: boolean;
  initialized: boolean;
}

export interface AuthContextValue extends AuthState {
  isAuthenticated: boolean;
  isError: boolean;
  errorDetails: {
    message: string;
    code: string;
    timestamp: number;
  } | null;
  login: (email: string, password: string, options?: any) => Promise<any>;
  refreshToken: () => Promise<void>;
  checkAuthStatus: () => Promise<boolean>;
  resetInactivityTimer: () => void;
  logout: (reason?: string) => Promise<void>;
  clearError: () => void;
  getSecurityState: () => any;
  getDeviceId: (options?: { canPersistSecurely?: boolean }) => Promise<string>;
}
