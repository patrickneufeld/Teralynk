// File: /frontend/src/contexts/authHooks.js

import { useContext } from "react";
import AuthContext from "./AuthContext";

/**
 * useCurrentUser - Returns the authenticated user object.
 */
export const useCurrentUser = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useCurrentUser must be used within an AuthProvider");
  return context.user;
};

/**
 * useIsAuthenticated - Returns true if user is authenticated.
 */
export const useIsAuthenticated = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useIsAuthenticated must be used within an AuthProvider");
  return context.loggedIn;
};

/**
 * useHasPermission - Checks if user has a specific permission.
 */
export const useHasPermission = (permission) => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useHasPermission must be used within an AuthProvider");
  return context.permissions.includes(permission);
};

/**
 * useHasRole - Checks if user has a specific role.
 */
export const useHasRole = (role) => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useHasRole must be used within an AuthProvider");
  return context.user?.roles?.includes(role);
};

/**
 * useAuthStatus - Returns the current auth status.
 */
export const useAuthStatus = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuthStatus must be used within an AuthProvider");
  return context.status;
};
