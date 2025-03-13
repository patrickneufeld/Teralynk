// File: /Users/patrick/Projects/Teralynk/frontend/src/utils/auditLogger.js

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
  