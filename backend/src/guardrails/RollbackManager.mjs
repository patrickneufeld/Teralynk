// ✅ FILE: /backend/src/guardrails/RollbackManager.mjs
export function rollbackPatch(filePath, backupCode) {
  const fs = require("fs");
  fs.writeFileSync(filePath, backupCode, "utf-8");
  console.log("Rollback applied to", filePath);
}