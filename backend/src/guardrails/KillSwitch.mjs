// ✅ FILE: /backend/src/guardrails/KillSwitch.mjs
export function isKillSwitchEnabled() {
  return process.env.AI_KILL_SWITCH === "true";
}