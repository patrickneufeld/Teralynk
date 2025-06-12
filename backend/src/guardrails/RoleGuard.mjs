// ✅ FILE: /backend/src/guardrails/RoleGuard.mjs
const ROLE_PERMISSIONS = {
  admin: ["patch:generate", "storage:manage", "security:audit"],
  editor: ["patch:generate", "storage:read"],
  viewer: ["storage:read"]
};

export function hasPermission(role, action) {
  return ROLE_PERMISSIONS[role]?.includes(action);
}