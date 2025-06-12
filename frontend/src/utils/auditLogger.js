// ✅ FILE: /frontend/src/utils/auditLogger.js

export const logAuditEvent = async (event, data) => {
  try {
    await fetch("/api/audit/log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        event,
        timestamp: new Date().toISOString(),
        data,
      }),
    });
  } catch (err) {
    console.error("❌ Audit log failed:", err);
  }
};

export function logSecurityEvent(eventType, details) {
  console.log(`[SECURITY EVENT] ${eventType}:`, details);
  // Optional: Push to telemetry service or audit queue here
}
