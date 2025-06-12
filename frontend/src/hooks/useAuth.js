// ✅ FILE: /frontend/src/hooks/useAuth.js

import { useAuth as useAuthContext } from "@/contexts";

/**
 * Hook: useAuth
 * 
 * A simple wrapper around the AuthContext hook.
 * Provides authenticated user state, login/logout methods, session info.
 *
 * @returns {{
 *   user: object|null,
 *   loggedIn: boolean,
 *   loading: boolean,
 *   error: Error|null,
 *   status: string,
 *   sessionExpiry: Date|null,
 *   login: (email: string, password: string, options?: object) => Promise<object>,
 *   signup: (email: string, password: string, attributes?: object) => Promise<object>,
 *   loginWithProvider: (provider: string, token: string) => Promise<object>,
 *   logout: () => Promise<void>,
 *   checkAuthStatus: () => Promise<boolean>,
 *   refreshSession: () => Promise<string>,
 *   updateUser: (userData: object) => void,
 *   updateSettings: (settings: object) => void,
 *   updatePermissions: (permissions: array) => void,
 *   clearError: () => void,
 *   getAccessToken: () => string|null,
 *   isAuthenticated: boolean,
 * }}
 */
const useAuth = () => {
  const context = useAuthContext();

  if (!context) {
    throw new Error('useAuth must be used within an <AuthProvider>');
  }

  return context;
};

export default useAuth;
