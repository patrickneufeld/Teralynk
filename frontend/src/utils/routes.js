// File: /frontend/src/utils/routes.js

export const ROUTES = Object.freeze({
    HOME: '/',
    LOGIN: '/login',
    SIGNUP: '/signup',
    DASHBOARD: '/dashboard',
    PROFILE: '/profile',
    SETTINGS: '/settings',
    FILE_MANAGER: '/files',
    ADMIN: '/admin',
    LOGS: '/admin/logs',
    AI_INSIGHTS: '/insights',
  });
  
  export function isProtectedRoute(path) {
    return [
      ROUTES.DASHBOARD,
      ROUTES.PROFILE,
      ROUTES.SETTINGS,
      ROUTES.FILE_MANAGER,
      ROUTES.ADMIN,
      ROUTES.AI_INSIGHTS,
    ].includes(path);
  }
  
  export function isAdminRoute(path) {
    return path.startsWith(ROUTES.ADMIN);
  }
  