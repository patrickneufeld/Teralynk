// ✅ FILE: /frontend/src/constants/permissionSets.js

export const PERMISSION_SETS = {
  ADMIN: ["view_dashboard", "manage_users", "edit_settings"],
  USER: ["view_dashboard", "edit_profile"],
  GUEST: ["view_dashboard"]
};

export const SECURITY_POLICIES = {
  DEFAULT: {
    strictMode: true,
    maxLoginAttempts: 5,
    lockoutDuration: 15 * 60 * 1000,
    sessionTimeout: 30 * 60 * 1000,
    activityCheckInterval: 5 * 60 * 1000,
    warningThreshold: 20 * 60 * 1000
  }
};
