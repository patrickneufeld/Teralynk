import React from "react";
import PropTypes from "prop-types";
import { useAuth } from "@/contexts";
import { hasPermission } from "@/utils/authUtils";
import { ErrorBoundary } from "@/utils/logging/ErrorBoundary";
import { Tooltip } from "@/components/ui/Tooltip";
import { logEvent } from "@/utils/logging/logging";
// Default import (current usage)
import auditLogService from "@/services/auditLogService";
auditLogService.fetchAuditLogs();


function AISystemAlertsPanel({ alerts = [], traceId = null, requiredPermission = null }) {
  const { user, permissions } = useAuth();

  const accessible = !requiredPermission || hasPermission(permissions, requiredPermission);

  if (!accessible) return null;

  if (alerts.length === 0) {
    return (
      <p className="text-sm text-gray-500 dark:text-gray-400 italic mt-2">
        No system alerts at this time.
      </p>
    );
  }

  const handleAlertClick = (alert) => {
    const eventData = {
      userId: user?.id,
      alertType: alert?.type,
      traceId,
      timestamp: new Date().toISOString(),
    };

    logEvent("ai_system_alert_clicked", eventData);

    auditLogService?.record?.({
      action: "clicked_system_alert",
      userId: user?.id,
      metadata: {
        alertType: alert?.type,
        severity: alert?.severity,
        traceId,
      },
    });
  };

  return (
    <ErrorBoundary>
      <section
        className="p-5 bg-red-50 dark:bg-red-900/10 rounded-lg shadow-sm"
        aria-label="AI System Alerts"
        role="region"
      >
        <h2 className="text-lg font-semibold text-red-700 dark:text-red-300 mb-4">
          ⚠️ System Alerts
        </h2>
        <ul className="space-y-3">
          {alerts.map((alert, idx) => (
            <li
              key={idx}
              tabIndex={0}
              role="listitem"
              onClick={() => handleAlertClick(alert)}
              onKeyDown={(e) => e.key === "Enter" && handleAlertClick(alert)}
              className="p-3 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md transition cursor-pointer"
              aria-label={`Alert: ${alert?.type || "System Alert"}`}
            >
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-bold text-red-700 dark:text-red-300">
                  {alert?.type || "Unknown Alert"}
                </h3>
                {alert?.severity && (
                  <Tooltip content={`Severity: ${alert.severity}`}>
                    <span className="text-xs text-red-600 dark:text-red-400">
                      {alert.severity.toUpperCase()}
                    </span>
                  </Tooltip>
                )}
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                {alert?.message || "No message provided."}
              </p>
            </li>
          ))}
        </ul>
      </section>
    </ErrorBoundary>
  );
}

AISystemAlertsPanel.propTypes = {
  alerts: PropTypes.arrayOf(
    PropTypes.shape({
      type: PropTypes.string,
      message: PropTypes.string,
      severity: PropTypes.string,
    })
  ),
  traceId: PropTypes.string,
  requiredPermission: PropTypes.string,
};

export default AISystemAlertsPanel;
