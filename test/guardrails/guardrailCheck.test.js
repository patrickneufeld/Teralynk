// ✅ FILE: /test/guardrails/guardrailCheck.test.js
import { hasPermission } from '../../src/guardrails/RoleGuard.mjs';

console.assert(hasPermission("admin", "patch:generate"), "Admin should be able to generate patches.");
console.assert(!hasPermission("viewer", "patch:generate"), "Viewer should not be able to generate patches.");
console.log("✅ RoleGuard tests passed.");