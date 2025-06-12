// ✅ FILE: /frontend/src/services/auditLogService.js

/**
 * auditLogService.js
 * Provides frontend functions to fetch and manage audit log data from the backend.
 * This is a placeholder. Replace with actual API integration.
 */

import apiClient from "../api/apiClient";

export const fetchAuditLogs = async (filters = {}) => {
  try {
    const response = await apiClient.get("/api/audit/logs", { params: filters });
    return response.data;
  } catch (error) {
    console.error("Failed to fetch audit logs:", error);
    throw error;
  }
};

export const downloadAuditLogsCSV = async () => {
  try {
    const response = await apiClient.get("/api/audit/logs/export", {
      responseType: "blob",
    });

    const blob = new Blob([response.data], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "audit-logs.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error("CSV export failed:", error);
    throw error;
  }
};

// Create service object with all functions
const auditLogService = {
  fetchAuditLogs,
  downloadAuditLogsCSV
};

// Export default service object
export default auditLogService;
